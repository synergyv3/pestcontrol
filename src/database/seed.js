const bcrypt = require('bcryptjs');
const { User, Customer, WorkOrder, Invoice } = require('../models');

async function seedDatabase() {
  // Only seed if no users exist
  const userCount = await User.count();
  if (userCount > 0) return;

  console.log('🌱 Seeding database with initial data...');

  const passwordHash = await bcrypt.hash('Admin123!', 12);

  // Create default users
  const admin = await User.create({
    firstName: 'System', lastName: 'Admin',
    email: 'admin@pestcontrol.local',
    passwordHash,
    role: 'admin',
    phone: '905-555-0100',
  });

  const manager = await User.create({
    firstName: 'Sarah', lastName: 'Mitchell',
    email: 'manager@pestcontrol.local',
    passwordHash: await bcrypt.hash('Manager123!', 12),
    role: 'manager',
    phone: '905-555-0101',
  });

  const tech1 = await User.create({
    firstName: 'James', lastName: 'Kowalski',
    email: 'james@pestcontrol.local',
    passwordHash: await bcrypt.hash('Tech123!', 12),
    role: 'technician',
    phone: '905-555-0102',
  });

  const tech2 = await User.create({
    firstName: 'Maria', lastName: 'Santos',
    email: 'maria@pestcontrol.local',
    passwordHash: await bcrypt.hash('Tech123!', 12),
    role: 'technician',
    phone: '905-555-0103',
  });

  // Sample customers
  const customers = await Customer.bulkCreate([
    { firstName: 'Robert', lastName: 'Thompson', email: 'rthompson@email.com', phone: '905-555-1001', address: '142 Maple Ave', city: 'Mississauga', province: 'ON', postalCode: 'L5A 1B2', customerType: 'residential' },
    { firstName: 'Jennifer', lastName: 'Walsh', email: 'jwalsh@email.com', phone: '905-555-1002', address: '88 Birchwood Dr', city: 'Brampton', province: 'ON', postalCode: 'L6P 2C4', customerType: 'residential' },
    { firstName: 'David', lastName: 'Nguyen', email: 'dnguyen@email.com', phone: '905-555-1003', address: '301 King St W', city: 'Toronto', province: 'ON', postalCode: 'M5V 1J5', customerType: 'commercial', notes: 'Restaurant owner - monthly service contract' },
    { firstName: 'Patricia', lastName: 'Clarke', email: 'pclarke@email.com', phone: '905-555-1004', address: '57 Elm Crescent', city: 'Oakville', province: 'ON', postalCode: 'L6H 3K7', customerType: 'residential' },
    { firstName: 'Michael', lastName: 'Osei', email: 'mosei@email.com', phone: '905-555-1005', address: '1920 Dundas St E', city: 'Mississauga', province: 'ON', postalCode: 'L4X 2S5', customerType: 'commercial', notes: 'Warehouse facility' },
  ]);

  const today = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];
  const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

  // Sample work orders
  const workOrders = await WorkOrder.bulkCreate([
    { customerId: customers[0].id, assignedTechnicianId: tech1.id, createdById: manager.id, serviceType: 'General Pest Control', scheduledDate: fmt(addDays(today, 1)), scheduledTime: '09:00', status: 'scheduled', priority: 'normal', description: 'Quarterly general treatment - ants and spiders reported', serviceAddress: '142 Maple Ave, Mississauga, ON' },
    { customerId: customers[1].id, assignedTechnicianId: tech2.id, createdById: manager.id, serviceType: 'Rodent Control', scheduledDate: fmt(addDays(today, 1)), scheduledTime: '13:00', status: 'scheduled', priority: 'high', description: 'Mouse activity reported in kitchen and basement', serviceAddress: '88 Birchwood Dr, Brampton, ON' },
    { customerId: customers[2].id, assignedTechnicianId: tech1.id, createdById: manager.id, serviceType: 'Cockroach Treatment', scheduledDate: fmt(today), scheduledTime: '08:00', status: 'completed', priority: 'urgent', description: 'Commercial restaurant - cockroach infestation', completedAt: new Date(), technicianNotes: 'Applied gel bait treatment in all kitchen areas. Follow-up in 2 weeks.', serviceAddress: '301 King St W, Toronto, ON' },
    { customerId: customers[3].id, assignedTechnicianId: tech2.id, createdById: admin.id, serviceType: 'Wasp/Hornet Removal', scheduledDate: fmt(addDays(today, 2)), scheduledTime: '10:30', status: 'scheduled', priority: 'high', description: 'Large wasp nest under deck', serviceAddress: '57 Elm Crescent, Oakville, ON' },
    { customerId: customers[4].id, assignedTechnicianId: tech1.id, createdById: manager.id, serviceType: 'Rodent Control', scheduledDate: fmt(addDays(today, -3)), scheduledTime: '07:00', status: 'completed', priority: 'normal', description: 'Monthly rodent monitoring - warehouse', completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), technicianNotes: 'Checked all 12 bait stations. Station #7 had activity - refreshed. All others clear.', serviceAddress: '1920 Dundas St E, Mississauga, ON' },
  ]);

  // Sample invoices
  await Invoice.bulkCreate([
    { customerId: customers[2].id, workOrderId: workOrders[2].id, subtotal: 285.00, taxRate: 0.13, taxAmount: 37.05, total: 322.05, status: 'sent', dueDate: fmt(addDays(today, 14)), lineItems: JSON.stringify([{ description: 'Cockroach Treatment - Commercial', quantity: 1, rate: 285.00, amount: 285.00 }]) },
    { customerId: customers[4].id, workOrderId: workOrders[4].id, subtotal: 150.00, taxRate: 0.13, taxAmount: 19.50, total: 169.50, status: 'paid', dueDate: fmt(addDays(today, -1)), paidAt: new Date(), paymentMethod: 'Credit Card', lineItems: JSON.stringify([{ description: 'Monthly Rodent Monitoring', quantity: 1, rate: 150.00, amount: 150.00 }]) },
    { customerId: customers[0].id, subtotal: 120.00, taxRate: 0.13, taxAmount: 15.60, total: 135.60, status: 'draft', dueDate: fmt(addDays(today, 30)), lineItems: JSON.stringify([{ description: 'General Pest Control - Quarterly', quantity: 1, rate: 120.00, amount: 120.00 }]) },
  ]);

  console.log('✅ Database seeded successfully!');
  console.log('   Default admin: admin@pestcontrol.local / Admin123!');
  console.log('   Manager:       manager@pestcontrol.local / Manager123!');
  console.log('   Technician:    james@pestcontrol.local / Tech123!');
}

module.exports = { seedDatabase };
