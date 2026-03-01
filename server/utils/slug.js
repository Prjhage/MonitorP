const crypto = require('crypto');

const generateSlug = () => {
    return crypto.randomBytes(8).toString('hex');
};

module.exports = { generateSlug };
