require('dotenv').config();
const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser')
const { sequelize } = require('./models/index');

app.use(express.json());

const PORT = 4000 || process.env.DB_PORT;
const authRoute = require('./routes/authRoute');
const userRoute = require('./routes/userRoute');
const serviceRoute = require('./routes/serviceRoute');
// const serviceRoute = require('./routes/');

sequelize
    .authenticate()
    .then(() => {
        console.log('Connected to the database');
        app.listen(PORT, () => {
            console.log(`Server is running on port http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Unable to connect to the database:', error);
    });

app.use(morgan('dev'));
app.use(bodyParser.json({ limit: "25mb" }));
app.use(bodyParser.urlencoded({
    limit: "25mb", extended: true
}));
app.use(cookieParser());
app.use(cors());

app.get("/", (req, res) => {
    res.send("Welcome to `Consultancy Website`!");
});

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

app.use('/api/auth', authRoute);
app.use('/api/user', userRoute);
app.use('/api/service', serviceRoute);
