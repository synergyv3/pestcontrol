const { Sequelize } = require('sequelize');
const path = require('path');

// In production (Azure), store DB in /home/data for persistence
// In development, store locally
const dbPath = process.env.NODE_ENV === 'production'
  ? '/home/data/pestcontrol.db'
  : path.join(__dirname, '../../pestcontrol.db');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: false,
  },
});

module.exports = sequelize;
