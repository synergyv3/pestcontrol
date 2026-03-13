const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Invoice = sequelize.define('Invoice', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  invoiceNumber: { type: DataTypes.STRING(20), unique: true },
  customerId: { type: DataTypes.INTEGER, allowNull: false },
  workOrderId: { type: DataTypes.INTEGER },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  taxRate: { type: DataTypes.DECIMAL(5, 4), defaultValue: 0.13, comment: 'e.g. 0.13 = 13% HST' },
  taxAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled'),
    defaultValue: 'draft',
  },
  dueDate: { type: DataTypes.DATEONLY },
  paidAt: { type: DataTypes.DATE },
  paymentMethod: { type: DataTypes.STRING(50) },
  notes: { type: DataTypes.TEXT },
  lineItems: { type: DataTypes.TEXT, comment: 'JSON array of line items' },
}, {
  tableName: 'invoices',
});

Invoice.beforeCreate(async (invoice) => {
  if (!invoice.invoiceNumber) {
    const count = await Invoice.count();
    invoice.invoiceNumber = `INV-${String(count + 1001).padStart(5, '0')}`;
  }
  invoice.taxAmount = parseFloat((invoice.subtotal * invoice.taxRate).toFixed(2));
  invoice.total = parseFloat((parseFloat(invoice.subtotal) + invoice.taxAmount).toFixed(2));
});

module.exports = Invoice;
