const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const { Customer, WorkOrder, Invoice, User } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

// GET /api/customers
router.get('/', async (req, res) => {
  try {
    const { search, type, page = 1, limit = 20 } = req.query;
    const where = { isActive: true };

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } },
      ];
    }
    if (type) where.customerType = type;

    const { count, rows } = await Customer.findAndCountAll({
      where,
      order: [['lastName', 'ASC'], ['firstName', 'ASC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({ customers: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id, {
      include: [
        { model: WorkOrder, as: 'workOrders', include: [{ model: User, as: 'technician', attributes: ['id', 'firstName', 'lastName'] }], order: [['scheduledDate', 'DESC']], limit: 10 },
        { model: Invoice, as: 'invoices', order: [['createdAt', 'DESC']], limit: 10 },
      ],
    });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/customers
router.post('/', requireRole('admin', 'manager'), [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('email').optional({ nullable: true }).isEmail(),
  body('phone').optional({ nullable: true }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'A customer with this email already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/customers/:id
router.put('/:id', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    await customer.update(req.body);
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/customers/:id (soft delete)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    await customer.update({ isActive: false });
    res.json({ message: 'Customer deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
