require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes           = require('./routes/auth');
const apiRoutes            = require('./routes/api');
const publicRoutes         = require('./routes/public');
const heartbeatRoutes      = require('./routes/heartbeat');
const pingRoutes           = require('./routes/ping');
const sslRoutes            = require('./routes/ssl');

const tcpRoutes            = require('./routes/tcp');
const dnsRoutes            = require('./routes/dns');
const domainRoutes         = require('./routes/domains');
const alertChannelRoutes   = require('./routes/alertChannels');
const teamRoutes           = require('./routes/team');
const maintenanceRoutes    = require('./routes/maintenance');
const statusSubRoutes      = require('./routes/statusSubscribers');
const auditLogRoutes       = require('./routes/auditLog');
const notificationRoutes   = require('./routes/notifications');

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
    const log = `[HTTP] ${req.method} ${req.url} - ${new Date().toISOString()}\n`;
    console.log(log);
    require('fs').appendFileSync('request_debug.log', log);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/apis', apiRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/heartbeats', heartbeatRoutes);
app.use('/ping', pingRoutes);
app.use('/api/ssl', sslRoutes);

app.use('/api/tcp', tcpRoutes);
app.use('/api/dns', dnsRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/alert-channels', alertChannelRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/status-subscribers', statusSubRoutes);
app.use('/api/audit-log', auditLogRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/test-route', (req, res) => {
    res.json({ message: 'Routing is working' });
});

app.get('/', (req, res) => {
    res.send('PingForge API Server is running...');
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

const { startMonitoring }          = require('./engine/pinger');
const { startHeartbeatChecker }    = require('./engine/heartbeatChecker');
const { startSslEngine }           = require('./engine/sslEngine');

const { startTcpEngine }           = require('./engine/tcpEngine');
const { startDnsEngine }           = require('./engine/dnsEngine');
const { startDomainExpiryEngine }  = require('./engine/domainExpiryEngine');
const { startMaintenanceEngine }   = require('./engine/maintenanceEngine');

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    // Start the monitoring engines
    startMonitoring(io);
    startHeartbeatChecker(io);
    startSslEngine(io);

    startTcpEngine(io);
    startDnsEngine(io);
    startDomainExpiryEngine();
    startMaintenanceEngine();
});


module.exports = { io };
