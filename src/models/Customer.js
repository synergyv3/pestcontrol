const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Customer = sequelize.define('Customer', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  firstName: { type: DataTypes.STRING(100), allowNull: false },
  lastName: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(255), validate: { isEmail: true } },
  phone: { type: DataTypes.STRING(20) },
  address: { type: DataTypes.STRING(255) },
  city: { type: DataTypes.STRING(100) },
  province: { type: DataTypes.STRING(100) },
  postalCode: { type: DataTypes.STRING(20) },
  customerType: { type: DataTypes.ENUM('residential', 'commercial'), defaultValue: 'residential' },
  notes: { type: DataTypes.TEXT },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  balance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
}, {
  tableName: 'customers',
});

module.exports = Customer;
