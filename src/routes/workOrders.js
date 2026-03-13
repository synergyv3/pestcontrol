const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { WorkOrder, Customer, User, Invoice } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

// GET /api/work-orders
router.get('/', async (req, res) => {
  try {
    const { status, technicianId, date, startDate, endDate, customerId, page = 1, limit = 25 } = req.query;
    const where = {};

    // Technicians only see their own work orders
    if (req.user.role === 'technician') {
      where.assignedTechnicianId = req.user.id;
    } else {
      if (technicianId) where.assignedTechnicianId = technicianId;
      if (customerId) where.customerId = customerId;
    }

    if (status) where.status = status;
    if (date) where.scheduledDate = date;
    if (startDate && endDate) where.scheduledDate = { [Op.between]: [startDate, endDate] };

    const { count, rows } = await WorkOrder.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'phone', 'address', 'city'] },
        { model: User, as: 'technician', attributes: ['id', 'firstName', 'lastName', 'phone'] },
      ],
      order: [['scheduledDate', 'ASC'], ['scheduledTime', 'ASC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({ workOrders: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/work-orders/schedule?startDate=&endDate=
router.get('/schedule', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = { scheduledDate: { [Op.between]: [startDate, endDate] } };
    if (req.user.role === 'technician') where.assignedTechnicianId = req.user.id;

    const workOrders = await WorkOrder.findAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'address', 'city', 'phone'] },
        { model: User, as: 'technician', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['scheduledDate', 'ASC'], ['scheduledTime', 'ASC']],
    });
    res.json(workOrders);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/work-orders/:id
router.get('/:id', async (req, res) => {
  try {
    const workOrder = await WorkOrder.findByPk(req.params.id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'technician', attributes: ['id', 'firstName', 'lastName', 'phone', 'email'] },
        { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName'] },
        { model: Invoice, as: 'invoice' },
      ],
    });
    if (!workOrder) return res.status(404).json({ error: 'Work order not found' });

    // Technician can only see their own
    if (req.user.role === 'technician' && workOrder.assignedTechnicianId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(workOrder);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/work-orders
router.post('/', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const workOrder = await WorkOrder.create({ ...req.body, createdById: req.user.id });
    const populated = await WorkOrder.findByPk(workOrder.id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'technician', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/work-orders/:id
router.put('/:id', async (req, res) => {
  try {
    const workOrder = await WorkOrder.findByPk(req.params.id);
    if (!workOrder) return res.status(404).json({ error: 'Work order not found' });

    // Technicians can only update their own jobs and limited fields
    if (req.user.role === 'technician') {
      if (workOrder.assignedTechnicianId !== req.user.id) return res.status(403).json({ error: 'Access denied' });
      const { status, technicianNotes, completedAt } = req.body;
      await workOrder.update({ status, technicianNotes, completedAt });
    } else {
      if (req.body.status === 'completed' && !workOrder.completedAt) {
        req.body.completedAt = new Date();
      }
      await workOrder.update(req.body);
    }
    res.json(workOrder);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/work-orders/:id
router.delete('/:id', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const workOrder = await WorkOrder.findByPk(req.params.id);
    if (!workOrder) return res.status(404).json({ error: 'Work order not found' });
    await workOrder.update({ status: 'cancelled' });
    res.json({ message: 'Work order cancelled' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
