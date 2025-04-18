require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { sequelize } = require('./models');
// const http = require('http');

// const socketIo = require('./socket');  // Import socket setup

const app = express();
// const server = http.createServer(app);

// // Initialize Socket.IO
// socketIo.initializeSocket(server);

const PORT = process.env.PORT || 4000;
sequelize
    .authenticate()
    .then(() => {
        console.log('Connected to the database');
        app.listen(PORT, () => {
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

// app.use(cors());
const allowedOrigins = ['http://localhost:3000', 'http://192.168.0.128:3000/', 'https://fana.spa.com',];
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,  // Enable credentials (cookies, authorization headers, etc.)
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'], // Customize headers as needed
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    // preflightContinue: false,  // Automatically send response for preflight request
};
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

app.get("/", (req, res) => {
    res.send("Welcome to `Spa Content Management Website Backend`!");
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
const categoryRoute = require('./routes/categoryRoute');
const bookingRoute = require('./routes/bookingRoute');
const notificationRoute = require('./routes/notificationRoute');
const blogRoutes = require('./routes/blogRoutes');
const testimonialRoute = require('./routes/testimonialRoute');
const reviewRoute = require('./routes/reviewRoute');

app.use('/api/auth', authRoute);
app.use('/api/user', userRoute);
app.use('/api/service', serviceRoute);
app.use('/api/category', categoryRoute)
app.use('/api/booking', bookingRoute);
app.use('/api/notification', notificationRoute);
app.use('/api/blog', blogRoutes);
app.use('/api/testimonial', testimonialRoute);
app.use('/api/review', reviewRoute);
