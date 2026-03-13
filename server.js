require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./src/models');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/customers', require('./src/routes/customers'));
app.use('/api/work-orders', require('./src/routes/workOrders'));
app.use('/api/invoices', require('./src/routes/invoices'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/dashboard', require('./src/routes/dashboard'));

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Health check endpoint (useful for Azure)
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Sync DB and start server
sequelize.sync({ alter: false }).then(async () => {
  const { seedDatabase } = require('./src/database/seed');
  await seedDatabase();
  app.listen(PORT, () => {
    console.log(`✅ PestControl server running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch(err => {
  console.error('❌ Failed to sync database:', err);
  process.exit(1);
});
