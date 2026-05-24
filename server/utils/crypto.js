const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.WEBHOOK_ENCRYPTION_KEY || '12345678901234567890123456789012'; // 32 chars length
const IV_LENGTH = 16;

const encrypt = (text) => {
    if (!text) return text;
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        return iv.toString('hex') + ':' + Buffer.concat([cipher.update(text), cipher.final()]).toString('hex');
    } catch (e) {
        console.error('Encryption failed:', e.message);
        return text;
    }
};

const decrypt = (text) => {
    if (!text || !text.includes(':')) return text;
    try {
        const [ivHex, encryptedHex] = text.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const encrypted = Buffer.from(encryptedHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString();
    } catch (e) {
        console.error('Decryption failed:', e.message);
        return text;
    }
};

module.exports = { encrypt, decrypt };
