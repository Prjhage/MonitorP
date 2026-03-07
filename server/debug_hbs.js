require('dotenv').config();
const mongoose = require('mongoose');
const Heartbeat = require('./models/Heartbeat');

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        const hbs = await Heartbeat.find({ isActive: true });
        console.log('--- HEARTBEAT LIST ---');
        hbs.forEach(hb => {
            console.log(`Name: ${hb.name}`);
            console.log(`ID: ${hb._id}`);
            console.log(`Slug: ${hb.slug}`);
            console.log(`User: ${hb.userId}`);
            console.log(`isPaused: ${hb.isPaused}`);
            console.log('----------------------');
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

debug();
