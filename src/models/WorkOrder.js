const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const WorkOrder = sequelize.define('WorkOrder', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customerId: { type: DataTypes.INTEGER, allowNull: false },
  assignedTechnicianId: { type: DataTypes.INTEGER },
  createdById: { type: DataTypes.INTEGER },
  serviceType: {
    type: DataTypes.ENUM(
      'General Pest Control', 'Rodent Control', 'Bed Bug Treatment',
      'Termite Inspection', 'Wasp/Hornet Removal', 'Ant Treatment',
      'Cockroach Treatment', 'Mosquito Control', 'Wildlife Removal', 'Other'
    ),
    allowNull: false,
  },
  description: { type: DataTypes.TEXT },
  scheduledDate: { type: DataTypes.DATEONLY, allowNull: false },
  scheduledTime: { type: DataTypes.STRING(10) },
  estimatedDuration: { type: DataTypes.INTEGER, defaultValue: 60, comment: 'minutes' },
  status: {
    type: DataTypes.ENUM('pending', 'scheduled', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
  priority: { type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'), defaultValue: 'normal' },
  notes: { type: DataTypes.TEXT },
  completedAt: { type: DataTypes.DATE },
  technicianNotes: { type: DataTypes.TEXT },
  serviceAddress: { type: DataTypes.STRING(255) },
}, {
  tableName: 'work_orders',
});

module.exports = WorkOrder;
