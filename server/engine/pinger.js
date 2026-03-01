const axios = require('axios');
const http = require('http');
const https = require('https');
const API = require('../models/API');
const PingLog = require('../models/PingLog');
const Incident = require('../models/Incident');
const User = require('../models/User');
const cron = require('node-cron');
const REGIONS = require('../config/regions');
const { sendAlertEmail, sendRecoveryEmail } = require('../utils/mailer');

// Reuse connections to skip DNS/TCP/TLS handshake overhead on repeated pings
const axiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive: true, maxSockets: 100 }),
    httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 100 }),
});

// -------------------------------------------------------------------
// Assertion Evaluator
// -------------------------------------------------------------------
const evaluateAssertions = (assertions, statusCode, responseTime, responseBody) => {
    if (!assertions || assertions.length === 0) return { passed: true, results: [] };

    const results = [];
    let allPassed = true;

    for (const assertion of assertions) {
        let actual = '';
        let passed = false;

        try {
            if (assertion.type === 'status_code') {
                actual = String(statusCode);
                const expected = Number(assertion.value);
                if (assertion.operator === 'eq') passed = statusCode === expected;
                else if (assertion.operator === 'lt') passed = statusCode < expected;
                else if (assertion.operator === 'gt') passed = statusCode > expected;
            }

            else if (assertion.type === 'response_time') {
                actual = String(responseTime) + 'ms';
                const threshold = Number(assertion.value);
                if (assertion.operator === 'lt') passed = responseTime < threshold;
                else if (assertion.operator === 'gt') passed = responseTime > threshold;
                else if (assertion.operator === 'eq') passed = responseTime === threshold;
            }

            else if (assertion.type === 'body_contains') {
                const bodyStr = typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody);
                actual = bodyStr.substring(0, 80);
                if (assertion.operator === 'contains') passed = bodyStr.includes(assertion.value);
                else if (assertion.operator === 'not_contains') passed = !bodyStr.includes(assertion.value);
            }

            else if (assertion.type === 'body_json_path') {
                // Simple dot-notation path resolver: e.g. "data.status"
                const bodyObj = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
                const parts = (assertion.jsonPath || assertion.value).split('.');
                let resolved = bodyObj;
                for (const part of parts) {
                    resolved = resolved?.[part];
                }
                actual = String(resolved);
                if (assertion.operator === 'eq') passed = actual === assertion.value;
                else if (assertion.operator === 'contains') passed = actual.includes(assertion.value);
                else if (assertion.operator === 'not_contains') passed = !actual.includes(assertion.value);
            }
        } catch {
            passed = false;
            actual = 'Error evaluating';
        }

        const label = `${assertion.type.replace(/_/g, ' ')} ${assertion.operator} ${assertion.value}`;
        results.push({ name: label, passed, actual });
        if (!passed) allPassed = false;
    }

    return { passed: allPassed, results };
};

// -------------------------------------------------------------------
// Core HTTP Ping
// -------------------------------------------------------------------
const pingAPI = async (api) => {
    const startHrTime = process.hrtime();

    try {
        // Build headers
        const headersObj = {};
        if (api.headers && api.headers.length > 0) {
            for (const h of api.headers) {
                if (h.key) headersObj[h.key] = h.value;
            }
        }

        // Build query params
        const paramsObj = {};
        if (api.queryParams && api.queryParams.length > 0) {
            for (const p of api.queryParams) {
                if (p.key) paramsObj[p.key] = p.value;
            }
        }

        // Build body
        let requestData = undefined;
        if (api.body && api.body.trim() && ['POST', 'PUT', 'PATCH'].includes(api.method)) {
            try { requestData = JSON.parse(api.body); } catch { requestData = api.body; }
            if (!headersObj['Content-Type'] && !headersObj['content-type']) {
                headersObj['Content-Type'] = 'application/json';
            }
        }

        const response = await axiosInstance({
            method: api.method || 'GET',
            url: api.url,
            timeout: api.timeout || 10000,
            validateStatus: () => true,
            headers: headersObj,
            params: paramsObj,
            data: requestData,
        });

        const elapsedHrTime = process.hrtime(startHrTime);
        const responseTime = Math.round(elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6);
        const statusCode = response.status;
        const responseBody = response.data;

        // Check expected status
        let status = 'UP';
        let reason = null;

        if (statusCode !== (api.expectedStatus || 200)) {
            status = 'DOWN';
            reason = `Expected ${api.expectedStatus || 200} but got ${statusCode}`;
        }

        // Evaluate assertions
        const { passed: assertionsPassed, results: assertionResults } = evaluateAssertions(
            api.assertions,
            statusCode,
            responseTime,
            responseBody
        );

        if (!assertionsPassed && status === 'UP') {
            status = 'DEGRADED';
            const failed = assertionResults.filter(r => !r.passed).map(r => r.name).join(', ');
            reason = `Assertion failed: ${failed}`;
        }

        return { status, responseTime, statusCode, reason, assertionResults };

    } catch (error) {
        const elapsedHrTime = process.hrtime(startHrTime);
        const responseTime = Math.round(elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6);
        let reason = error.message;
        if (error.code === 'ECONNABORTED') reason = 'Connection Timed Out';
        if (error.code === 'ECONNREFUSED') reason = 'Connection Refused';
        return { status: 'DOWN', responseTime, statusCode: null, reason, assertionResults: [] };
    }
};

// -------------------------------------------------------------------
// Process a single ping (one region)
// -------------------------------------------------------------------
// Write all region logs in one bulk insert (much faster than 5 separate creates)
const saveRegionalLogs = async (api, baseResult) => {
    const docs = REGIONS.map(region => ({
        apiId: api._id,
        status: baseResult.status,
        statusCode: baseResult.statusCode,
        responseTime: baseResult.responseTime + region.latencyOffset,
        reason: baseResult.reason,
        assertionResults: baseResult.assertionResults,
        region: region.id,
    }));
    await PingLog.insertMany(docs, { ordered: false });
};

// -------------------------------------------------------------------
// Main process: ping + incidents + socket update
// -------------------------------------------------------------------
const processPing = async (api, io) => {
    // Run the real HTTP ping once — measure only the network call
    const result = await pingAPI(api);

    // Fire-and-forget: bulk insert 5 region logs + save API status in parallel
    const oldStatus = api.status;
    api.status = result.status;
    api.lastChecked = new Date();

    await Promise.all([
        saveRegionalLogs(api, result),
        api.save(),
    ]);

    // Handle incident transitions — only fetch User when actually needed
    if (result.status === 'DOWN' && oldStatus !== 'DOWN') {
        const incident = await Incident.create({
            apiId: api._id,
            userId: api.userId,
            reason: result.reason,
            status: 'OPEN'
        });
        const user = await User.findById(api.userId);
        if (user) await sendAlertEmail(user, api, incident);

    } else if (result.status === 'UP' && oldStatus === 'DOWN') {
        const incident = await Incident.findOne({ apiId: api._id, status: 'OPEN' });
        if (incident) {
            incident.status = 'RESOLVED';
            incident.endTime = new Date();
            incident.duration = Math.round((incident.endTime - incident.startTime) / 60000);
            await incident.save();
            const user = await User.findById(api.userId);
            if (user) await sendRecoveryEmail(user, api, incident);
        }
    }

    // Live update via Socket.IO
    if (io) {
        io.emit('api-update', {
            apiId: api._id,
            status: result.status,
            responseTime: result.responseTime,
            lastChecked: api.lastChecked,
        });
    }
};

// -------------------------------------------------------------------
// Cron scheduler
// -------------------------------------------------------------------
const startMonitoring = (io) => {
    cron.schedule('* * * * *', async () => {
        console.log('Running monitoring cron job...');
        const apis = await API.find({ isActive: true });

        // Stagger pings (100ms apart) to avoid network spikes that inflate latency
        apis.forEach((api, index) => {
            setTimeout(() => {
                processPing(api, io);
            }, index * 100);
        });
    });
};

module.exports = { startMonitoring };
