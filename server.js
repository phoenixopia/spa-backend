require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { sequelize } = require('./models');
const http = require('http');

const socketIo = require('./socket');  // Import socket setup

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
socketIo.initializeSocket(server);

const PORT = process.env.PORT || 4000;
sequelize
    .authenticate()
    .then(() => {
        console.log('Connected to the database');
        server.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('❌ Unable to connect to the database:', error);
    });

app.use(morgan('dev'));
app.use(bodyParser.json({ limit: "25mb" }));
app.use(bodyParser.urlencoded({ limit: "25mb", extended: true }));
app.use(cookieParser());
app.use(cors());

app.get("/", (req, res) => {
    res.send("Welcome to `Spa Content Management Website`!");
});
app.get("/api/connected-users", (req, res) => {
    res.json({ connectedUsers: Array.from(getConnectedUsers().entries()) });
});

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, 
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

const authRoute = require('./routes/authRoute');
const userRoute = require('./routes/userRoute');
const serviceRoute = require('./routes/serviceRoute');
const bookingRoute = require('./routes/bookingRoute');

app.use('/api/auth', authRoute);
app.use('/api/user', userRoute);
app.use('/api/service', serviceRoute);
app.use('/api/booking', bookingRoute);
