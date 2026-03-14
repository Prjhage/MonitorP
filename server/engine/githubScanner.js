const axios = require('axios');
const ApiKey = require('../models/ApiKey');

/**
 * Scans GitHub for potential exposure of an API key.
 * This searches for the key preview or a combination of identifiers.
 * NOTE: GitHub Search API has strict rate limits.
 * Authenticated: 30 requests per minute
 * Unauthenticated: 10 requests per minute
 */
const scanGitHub = async (apiKeyId) => {
    try {
        const key = await ApiKey.findById(apiKeyId);
        if (!key || !key.githubScanningEnabled) return;

        console.log(`[GitHub Scanner] Starting scan for: ${key.serviceName} (${key.keyPreview})`);

        // Update status to UNKNOWN while scanning
        key.githubExposureStatus = 'UNKNOWN';
        await key.save();

        // Search Query Strategy:
        // We can't search for full keys easily (and shouldn't store them).
        // We use the "keyPreview" which common patterns might include.
        // e.g. "sk_live_1234...5678" -> search for "sk_live_1234"
        let searchString = key.keyPreview;
        if (searchString.includes('...')) {
            searchString = searchString.split('...')[0];
        } else if (searchString.length > 8) {
            // If no ellipses, take the first 8 characters
            searchString = searchString.substring(0, 8);
        }
        
        const githubToken = process.env.GITHUB_TOKEN;
        const headers = githubToken ? { 'Authorization': `token ${githubToken}` } : {};

        try {
            // Github Code Search API: GET https://api.github.com/search/code?q={query}
            const response = await axios.get('https://api.github.com/search/code', {
                params: {
                    q: `"${searchString}"`
                },
                headers: {
                    ...headers,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            const totalCount = response.data.total_count;
            console.log(`[GitHub Scanner] Found ${totalCount} matches for "${searchString}"`);

            if (totalCount > 0) {
                key.githubExposureStatus = 'EXPOSED';
            } else {
                key.githubExposureStatus = 'SAFE';
            }
            
            await key.save();
            return { success: true, status: key.githubExposureStatus, totalCount };

        } catch (apiError) {
            const status = apiError.response?.status;
            const errorMsg = apiError.response?.data?.message || apiError.message;
            console.error(`[GitHub Scanner] API Error (${status}):`, errorMsg);
            
            key.githubExposureStatus = 'UNKNOWN';
            await key.save();

            let friendlyError = 'GitHub API Error';
            if (status === 403 && errorMsg.includes('rate limit')) {
                friendlyError = 'GitHub API rate limit exceeded. Please add a GITHUB_TOKEN to .env for higher limits.';
            } else if (status === 401 || status === 403) {
                friendlyError = 'GitHub API Access Denied. Check your GITHUB_TOKEN.';
            } else if (status === 422) {
                friendlyError = 'Invalid search query. Key preview might be too short for GitHub search.';
            }

            return { success: false, error: friendlyError, details: errorMsg };
        }

    } catch (error) {
        console.error('[GitHub Scanner] Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Background worker to scan all keys that have scanning enabled
 */
const runFullSecurityScan = async () => {
    console.log('[GitHub Scanner] Running full periodic scan...');
    try {
        const keysToScan = await ApiKey.find({ githubScanningEnabled: true });
        for (const key of keysToScan) {
            await scanGitHub(key._id);
            // Wait 2-3 seconds between scans to avoid hitting rate limits too fast
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        console.log('[GitHub Scanner] Full scan completed.');
    } catch (error) {
        console.error('[GitHub Scanner] Background scan error:', error);
    }
};

module.exports = { scanGitHub, runFullSecurityScan };
