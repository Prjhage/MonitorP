/**
 * SSL Certificate Checker
 * Uses Node's built-in `tls` module — no extra npm packages needed.
 * Connects to port 443 and pulls the peer certificate.
 */

const tls = require('tls');

/**
 * Check the SSL certificate for a given hostname.
 * @param {string} domain - e.g. "google.com" (no protocol, no path)
 * @returns {Promise<Object>} cert info or error
 */
const checkSslCert = (domain) => {
    return new Promise((resolve) => {
        const options = {
            host: domain,
            port: 443,
            servername: domain,       // SNI support
            rejectUnauthorized: true, // this validates the full chain
            timeout: 10000,
        };

        const socket = tls.connect(options, () => {
            try {
                const cert = socket.getPeerCertificate(true);

                if (!cert || !cert.subject) {
                    socket.destroy();
                    return resolve({ error: 'No certificate returned by server' });
                }

                const validFrom = new Date(cert.valid_from);
                const validTo   = new Date(cert.valid_to);
                const now       = new Date();
                const msPerDay  = 1000 * 60 * 60 * 24;
                const daysRemaining = Math.floor((validTo - now) / msPerDay);

                // Extract issuer fields
                const issuer    = cert.issuer?.CN  || cert.issuer?.O || 'Unknown';
                const issuerOrg = cert.issuer?.O   || cert.issuer?.CN || 'Unknown';

                // Chain validity: socket.authorized is true only when the full chain is trusted
                const isChainValid = socket.authorized === true;

                socket.destroy();
                resolve({
                    issuer,
                    issuerOrg,
                    validFrom,
                    validTo,
                    daysRemaining,
                    isChainValid,
                    error: null,
                });
            } catch (err) {
                socket.destroy();
                resolve({ error: err.message });
            }
        });

        socket.on('error', (err) => {
            // rejectUnauthorized=true will cause an error for invalid chains
            // Capture the reason so we can still surface useful info
            resolve({ error: err.message });
        });

        socket.setTimeout(10000, () => {
            socket.destroy();
            resolve({ error: 'Connection timed out' });
        });
    });
};

module.exports = { checkSslCert };
