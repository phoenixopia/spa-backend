'use strict';

const pg = require('pg');
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const db = {};

let sequelize;
if (process.env.DATABASE_URL) {
// if (config.use_env_variable) {
  // sequelize = new Sequelize(process.env[config.use_env_variable], {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    ...config, 
    logging: false, // Disable logging globally for all queries
    dialect: 'postgres',
    protocol: 'postgres',
    dialectModule: require('pg'),
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Adjust based on your SSL configuration
      },
    },
  });
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, {
    ...config, 
    logging: false, // Disable logging globally for all queries
    dialect: 'postgres',
    protocol: 'postgres',
    dialectModule: require('pg'),
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Adjust based on your SSL configuration
      },
    },
  });
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
