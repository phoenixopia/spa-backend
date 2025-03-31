require('dotenv').config();
const { DATABASE_URL } = process.env;
const { URL } = require('url');

const dbUrl = new URL(DATABASE_URL);

module.exports = {
  development: {
    username: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.replace("/", ""),
    host: dbUrl.hostname,
    port: dbUrl.port,
    dialect: 'postgres',
  },
  test: {
    username: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.replace("/", ""),
    host: dbUrl.hostname,
    port: dbUrl.port,
    dialect: 'postgres',
  },
  production: {
    username: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.replace("/", ""),
    host: dbUrl.hostname,
    port: dbUrl.port,
    dialect: 'postgres',
  },
};





// require('dotenv').config();
// const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

// module.exports = {
//   development: {
//     username: DB_USER,
//     password: DB_PASSWORD,
//     database: DB_NAME,
//     host: DB_HOST,
//     dialect: 'postgres',
//   },
//   test: {
//     username: DB_USER,
//     password: DB_PASSWORD,
//     database: DB_NAME,
//     host: DB_HOST,
//     dialect: 'postgres',
//   },
//   production: {
//     username: DB_USER,
//     password: DB_PASSWORD,
//     database: DB_NAME,
//     host: DB_HOST,
//     dialect: 'postgres',
//   },
 
// };
