const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

// GET /api/users - admins & managers see all, technicians see only technicians
router.get('/', async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'technician') where.role = 'technician';
    const users = await User.findAll({ where, order: [['lastName', 'ASC'], ['firstName', 'ASC']] });
    res.json(users.map(u => u.toJSON()));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/technicians - quick list for dropdowns
router.get('/technicians', async (req, res) => {
  try {
    const technicians = await User.findAll({
      where: { role: 'technician', isActive: true },
      attributes: ['id', 'firstName', 'lastName', 'phone'],
      order: [['firstName', 'ASC']],
    });
    res.json(technicians);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users - admin only
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ ...rest, passwordHash });
    res.status(201).json(user.toJSON());
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  try {
    const targetUser = await User.findByPk(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // Only admins can edit other users; users can edit themselves (limited fields)
    if (req.user.role !== 'admin' && req.user.id !== targetUser.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { password, role, ...rest } = req.body;
    const updates = { ...rest };

    // Only admins can change roles
    if (role && req.user.role === 'admin') updates.role = role;

    if (password) {
      if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
      updates.passwordHash = await bcrypt.hash(password, 12);
    }

    await targetUser.update(updates);
    res.json(targetUser.toJSON());
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/users/:id - admin only (soft delete)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.update({ isActive: false });
    res.json({ message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
