const express = require('express');
const router = express.Router();
const { Op, fn, col, literal } = require('sequelize');
const { WorkOrder, Customer, Invoice, User } = require('../models');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [
      totalCustomers, activeCustomers, todayJobs, pendingJobs,
      completedThisMonth, revenueThisMonth, overdueInvoices, totalTechnicians,
      recentWorkOrders, upcomingJobs,
    ] = await Promise.all([
      Customer.count(),
      Customer.count({ where: { isActive: true } }),
      WorkOrder.count({ where: { scheduledDate: today, status: { [Op.not]: 'cancelled' } } }),
      WorkOrder.count({ where: { status: ['pending', 'scheduled'] } }),
      WorkOrder.count({ where: { status: 'completed', scheduledDate: { [Op.gte]: startOfMonth } } }),
      Invoice.sum('total', { where: { status: 'paid', updatedAt: { [Op.gte]: new Date(startOfMonth) } } }),
      Invoice.count({ where: { status: 'overdue' } }),
      User.count({ where: { role: 'technician', isActive: true } }),
      WorkOrder.findAll({
        where: { status: 'completed' },
        include: [{ model: Customer, as: 'customer', attributes: ['firstName', 'lastName'] }],
        order: [['updatedAt', 'DESC']],
        limit: 5,
      }),
      WorkOrder.findAll({
        where: { scheduledDate: { [Op.gte]: today }, status: { [Op.in]: ['pending', 'scheduled'] } },
        include: [
          { model: Customer, as: 'customer', attributes: ['firstName', 'lastName', 'address', 'city'] },
          { model: User, as: 'technician', attributes: ['firstName', 'lastName'] },
        ],
        order: [['scheduledDate', 'ASC'], ['scheduledTime', 'ASC']],
        limit: 10,
      }),
    ]);

    res.json({
      stats: {
        totalCustomers, activeCustomers,
        todayJobs, pendingJobs,
        completedThisMonth,
        revenueThisMonth: revenueThisMonth || 0,
        overdueInvoices,
        totalTechnicians,
      },
      recentWorkOrders,
      upcomingJobs,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
