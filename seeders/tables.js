const bcryptjs = require('bcryptjs');
const { sequelize, Users, Bookings, Services, Notifications, Categories, Blogs, Testimonials, Reviews } = require('../models/index');
const image = "https://drive.google.com/uc?id=1pMGXklJAHoz9YkE1udmLOLCofJhh9SPW";

(async () => {
  try {
    // await sequelize.sync({ force: true }); // This will drop and recreate all tables on this db
    await Users.sync({ force: true });
    const generateHashedPassword = async () => {
      return await bcryptjs.hash('Admin123.', 10);
    };
    const password = await generateHashedPassword();
    const userData = [
      { 
        firstName: 'admin', lastName: 'admin', email: 'admin@gmail.com', password: password, phone: '+251919765445', 
        isConfirmed: true, role: 'super-admin', createdAt: new Date(), updatedAt: new Date(), 
      },
      { 
        firstName: 'user', lastName: 'user', email: 'user@gmail.com', password: password, phone: '+251919765445', 
        isConfirmed: true, role: 'user', createdAt: new Date(), updatedAt: new Date(), 
      },
      { 
        firstName: 'test', lastName: 'test', email: 'test@gmail.com', password: password, phone: '+251919765445', 
        isConfirmed: true, role: 'user', createdAt: new Date(), updatedAt: new Date(), 
      },
    ];
    await Users.bulkCreate(userData);

    await Categories.sync({ force: true });
    const categoryData = [
      {
        name: "Facial Treatment",
        description: "Our membership management software provides full automation of membership renewals and payments.",
        imageURL: image,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Massage Therapy",
        description: "Our membership management software provides full automation of membership renewals and payments.",
        imageURL: image,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Hair Treatment",
        description: "Our membership management software provides full automation of membership renewals and payments.",
        imageURL: image,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Super Mama",
        description: "Our membership management software provides full automation of membership renewals and payments.",
        imageURL: image,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
    await Categories.bulkCreate(categoryData);

    await Services.sync({ force: true });
    const existingCategory = await Categories.findOne();
    if (!existingCategory) {
      throw new Error('Cannot seed service data: No category found.');
    }
    const serviceData = [
      {
        name: 'Hydrating Facial',
        description: 'A deeply moisturizing facial to restore skin hydration.',
        categoryId: existingCategory.id,
        price: 50.00,
        discount: 5.00,
        duration: 60,
        imageURL: image,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Anti-Aging Facial',
        description: 'A rejuvenating facial designed to reduce fine lines and wrinkles.',
        categoryId: existingCategory.id,
        price: 75.00,
        discount: 10.00,
        duration: 75,
        imageURL: image,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Chemical Peel',
        description: 'A deep exfoliation treatment to improve skin tone and texture.',
        categoryId: existingCategory.id,
        price: 85.00,
        discount: 10.00,
        duration: 45,
        imageURL: image,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Microdermabrasion',
        description: 'A non-invasive treatment that removes dead skin cells for a smooth complexion.',
        categoryId: existingCategory.id,
        price: 90.00,
        discount: 12.00,
        duration: 60,
        imageURL: image,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Acne Treatment',
        description: 'A specialized facial to help treat and prevent acne breakouts.',
        categoryId: existingCategory.id,
        price: 65.00,
        discount: 7.00,
        duration: 50,
        imageURL: image,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Brightening Facial',
        description: 'A facial treatment designed to even out skin tone and enhance radiance.',
        categoryId: existingCategory.id,
        price: 70.00,
        discount: 8.00,
        duration: 55,
        imageURL: image,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    await Services.bulkCreate(serviceData);

    await Bookings.sync({ force: true });
    const existingUser = await Users.findOne();
    const existingService = await Services.findOne();
    if (!existingUser || !existingService) {
      throw new Error('Cannot seed bookings: No users or services found.');
    }
    const bookingData = [
      {
        serviceId: existingService.id,
        firstName: 'Jon',
        lastName: 'Doe',
        phoneNumber: '+251987654321',
        dateTime: new Date('2025-05-01T10:00:00Z'),
        notes: 'Client requested a deep tissue massage.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        serviceId: existingService.id,
        firstName: 'Phoenix',
        lastName: 'Opia',
        phoneNumber: '+251987654321',
        dateTime: new Date('2025-06-02T14:30:00Z'),
        status: 'Approved',
        notes: 'First-time customer. Prefers a relaxing session.',
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
      message: "Your booking has been created.",
      type: "Creation",
      createdAt: new Date(),
      updatedAt: new Date(),
    },]
    await Notifications.bulkCreate(notificationData);

    await Blogs.sync({ force: true });
    const blogData = [
      {
        userId: existingUser.id,
        title: "The Future of AI in Web Development",
        slug: "future-ai-web-development",
        content: "Artificial Intelligence is revolutionizing web development. Artificial Intelligence is revolutionizing web development",
        imageURL: image,
        status: "Published",
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: existingUser.id,
        title: "The Benefits of Aromatherapy for Stress Relief",
        slug: "benefits-of-aromatherapy",
        content: "Aromatherapy is a powerful tool for reducing stress and enhancing relaxation. Learn how essential oils can improve your well-being.",
        imageURL: image,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: existingUser.id,
        title: "5 Skincare Routines for a Healthy Glow",
        slug: "skincare-routines-healthy-glow",
        content: "Discover five essential skincare routines that will help you maintain a radiant and youthful appearance.",
        imageURL: "https://drive.google.com/uc?id=1pMGXklJAHoz9YkE1udmLOLCofJhh9SPW",
        status: "Published",
        publishedAt: new Date('2025-03-15T11:30:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: existingUser.id,
        title: "How to Choose the Right Massage for Your Needs",
        slug: "choose-right-massage",
        content: "Different types of massages provide different benefits. Find out which massage suits your body’s needs best.",
        imageURL: image,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: existingUser.id,
        title: "The Science Behind Anti-Aging Facials",
        slug: "science-of-anti-aging-facials",
        content: "Learn about the latest skincare treatments that slow down the aging process and keep your skin looking fresh.",
        imageURL: image,
        createdAt: new Date(),
        updatedAt: new Date(),
      },    
    ]
    await Blogs.bulkCreate(blogData);

    await Testimonials.sync({ force: true });
    const testimonialData = [
      {
        userId: existingUser.id,
        firstName: "John",
        lastName: "Doe",
        title: "CEO, Tech Innovations",
        message: "This platform has significantly improved our workflow. Highly recommended!",
        imageURL: image,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: existingUser.id,
        firstName: "Jane",
        lastName: "Smith",
        title: "Marketing Director, Creative Agency",
        message: "An amazing service with excellent customer support!",
        imageURL: image,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: existingUser.id,
        firstName: "Test",
        lastName: "One",
        title: "CEO, Tech Innovations",
        message: "This platform has significantly improved our workflow. Highly recommended!",
        imageURL: image,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: existingUser.id,
        firstName: "Test",
        lastName: "Two",
        title: "CEO, Tech Innovations",
        message: "This platform has significantly improved our workflow. Highly recommended!",
        imageURL: image,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: existingUser.id,
        firstName: "Test",
        lastName: "Three",
        title: "CEO, Tech Innovations",
        message: "This platform has significantly improved our workflow. Highly recommended!",
        imageURL: image,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: existingUser.id,
        firstName: "Test",
        lastName: "Four",
        title: "CEO, Tech Innovations",
        message: "This platform has significantly improved our workflow. Highly recommended!",
        imageURL: image,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
    await Testimonials.bulkCreate(testimonialData);

    await Reviews.sync({ force: true });
    const reviewData=[{rating: 5, email: 'admin@gmail.com'}]
    await Reviews.bulkCreate(reviewData);

    console.log('Seed data added successfully.');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await sequelize.close();
  }
})();
