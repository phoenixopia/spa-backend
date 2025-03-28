const bcryptjs = require('bcryptjs');
const { sequelize, Users, Bookings, Services, Notifications } = require('../models/index');
const serviceData = [
  {
    name: 'Aromatherapy',
    description: 'A calming 60-minute aromatherapy session.',
    category: 'Massage',
    price: 60.00,
    discount: 8.00,
    duration: 60,
    status: 'inactive',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Facial Treatment',
    description: 'A deep cleansing facial treatment for glowing skin.',
    category: 'Skincare',
    price: 40.00,
    discount: 5.00,
    duration: 45,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

(async () => {
  try {
    // await sequelize.sync({ force: true }); // This will drop and recreate all tables on this db
    await Users.sync({ force: true, tableName: 'users' });
    const generateHashedPassword = async () => {
      return await bcryptjs.hash('Admin123.', 10);
    };
    const password = await generateHashedPassword();
    const userData = [{ 
        firstName: 'admin', lastName: 'admin', email: 'admin@gmail.com', password: password, phone: '+251919765445', 
        role: 'Admin', createdAt: new Date(), updatedAt: new Date(), }
    ];
    await Users.bulkCreate(userData);

    await Services.sync({ force: true });
    await Services.bulkCreate(serviceData);

    await Bookings.sync({ force: true });
    const existingUser = await Users.findOne();
    const existingService = await Services.findOne();
    if (!existingUser || !existingService) {
      throw new Error('Cannot seed bookings: No users or services found.');
    }
    const bookingData = [
      {
        userId: existingUser.id,
        serviceId: existingService.id,
        bookingDatetime: new Date('2025-04-01T10:00:00Z'),
        status: 'confirmed',
        notes: 'Client requested a deep tissue massage.',
        payment_status: 'paid',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: existingUser.id,
        serviceId: existingService.id,
        bookingDatetime: new Date('2025-04-02T14:30:00Z'),
        status: 'pending',
        notes: 'First-time customer. Prefers a relaxing session.',
        payment_status: 'unpaid',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    await Bookings.bulkCreate(bookingData);

    await Notifications.sync({ force: true });
    const existingBooking = await Bookings.findOne();
    if (!existingUser || !existingBooking) {
      throw new Error('Cannot seed notification: No users or booking found.');
    }
    const notificationData=[ {
      userId: existingUser.id,
      bookingId: existingBooking.id,
      message: "Your booking has been confirmed.",
      type: "Confirmation",
      status: "sent",
      createdAt: new Date(),
      updatedAt: new Date(),
    },]
    await Notifications.bulkCreate(notificationData);

    console.log('Seed data added successfully.');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await sequelize.close();
  }
})();
