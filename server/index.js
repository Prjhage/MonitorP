require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const publicRoutes = require('./routes/public');
const heartbeatRoutes = require('./routes/heartbeat');
const pingRoutes = require('./routes/ping');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});
app.set('io', io);

// Connect to Database
connectDB();

// Middleware
const allowedOrigins = [
    'https://monitor-p.vercel.app',     // Production frontend
    process.env.FRONTEND_URL,           // Override via env var if needed
    'http://localhost:3000',            // Local dev
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (curl, Postman, mobile apps, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/apis', apiRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/heartbeats', heartbeatRoutes);
app.use('/ping', pingRoutes);

app.get('/', (req, res) => {
    res.send('MonitorP API Server is running...');
});

// Mock Endpoint for Testing
// Usage: Add http://localhost:5000/mock-health to your monitor
let mockStatus = 200;
app.get('/mock-health', (req, res) => {
    res.status(mockStatus).json({ status: mockStatus === 200 ? 'ok' : 'error' });
});

// Helper to toggle mock status: GET /toggle-mock
app.get('/toggle-mock', (req, res) => {
    mockStatus = mockStatus === 200 ? 500 : 200;
    res.send(`Mock status changed to ${mockStatus}`);
});

// Socket.io
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const { startMonitoring } = require('./engine/pinger');
const { startHeartbeatChecker } = require('./engine/heartbeatChecker');

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    // Start the monitoring engine
    startMonitoring(io);
    startHeartbeatChecker(io);
});


module.exports = { io };
