const sequelize = require('../database/connection');
const User = require('./User');
const Customer = require('./Customer');
const WorkOrder = require('./WorkOrder');
const Invoice = require('./Invoice');

// Associations
Customer.hasMany(WorkOrder, { foreignKey: 'customerId', as: 'workOrders' });
WorkOrder.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Customer.hasMany(Invoice, { foreignKey: 'customerId', as: 'invoices' });
Invoice.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

WorkOrder.hasOne(Invoice, { foreignKey: 'workOrderId', as: 'invoice' });
Invoice.belongsTo(WorkOrder, { foreignKey: 'workOrderId', as: 'workOrder' });

User.hasMany(WorkOrder, { foreignKey: 'assignedTechnicianId', as: 'assignedJobs' });
WorkOrder.belongsTo(User, { foreignKey: 'assignedTechnicianId', as: 'technician' });

User.hasMany(WorkOrder, { foreignKey: 'createdById', as: 'createdJobs' });
WorkOrder.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

module.exports = { sequelize, User, Customer, WorkOrder, Invoice };
