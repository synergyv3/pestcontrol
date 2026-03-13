const express = require('express');
const router = express.Router();
const { Invoice, Customer, WorkOrder } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.use(requireRole('admin', 'manager'));

// GET /api/invoices
router.get('/', async (req, res) => {
  try {
    const { status, customerId, page = 1, limit = 25 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const { count, rows } = await Invoice.findAndCountAll({
      where,
      include: [{ model: Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({ invoices: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/invoices/:id
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: WorkOrder, as: 'workOrder' },
      ],
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/invoices
router.post('/', async (req, res) => {
  try {
    const { subtotal, taxRate = 0.13, lineItems, ...rest } = req.body;
    const taxAmount = parseFloat((subtotal * taxRate).toFixed(2));
    const total = parseFloat((parseFloat(subtotal) + taxAmount).toFixed(2));

    const invoice = await Invoice.create({
      ...rest, subtotal, taxRate, taxAmount, total,
      lineItems: JSON.stringify(lineItems || []),
    });
    res.status(201).json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/invoices/:id
router.put('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (['paid', 'cancelled'].includes(invoice.status) && req.user.role !== 'admin') {
      return res.status(400).json({ error: 'Cannot edit a paid or cancelled invoice' });
    }

    const { subtotal, taxRate } = req.body;
    if (subtotal !== undefined) {
      const rate = taxRate || invoice.taxRate;
      req.body.taxAmount = parseFloat((subtotal * rate).toFixed(2));
      req.body.total = parseFloat((parseFloat(subtotal) + req.body.taxAmount).toFixed(2));
    }

    await invoice.update(req.body);
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/invoices/:id/mark-paid
router.post('/:id/mark-paid', async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    await invoice.update({ status: 'paid', paidAt: new Date(), paymentMethod: req.body.paymentMethod || 'Cash' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
