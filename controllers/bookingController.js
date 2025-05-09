const { sequelize, Users, Bookings, Services, Notifications } = require('../models/index');
const { notifyAdmins } = require('../socket');
const { sendSMS } = require('../utils/sms');
const { createBookingNotificationForAdmin } = require('./notificationController');
const { Op } = require('sequelize');
const moment = require('moment'); // Or use native Date if you prefer


// Create a new booking
exports.createBooking = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { firstName, lastName, phoneNumber, dateTime, serviceId } = req.body;
        if (!firstName || !lastName || !phoneNumber || !serviceId || !dateTime) {
            return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
        }
        const existingBooking = await Bookings.findOne({
            where: { firstName, lastName, phoneNumber, dateTime, serviceId },
            transaction,
        });
        if (existingBooking) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'A booking already exists for this customer at the same time.' });
        }
        const newBooking = await Bookings.create(req.body, {
             transaction 
        });

        const serviceData = await Services.findOne({
            where: { id: serviceId },
            attributes: ["name"]
        });

        // // Send notification to admins about the new booking
        // const bookingData = {
        //     message: `A new booking has been created: ${newBooking.id}`,
        //     booking: newBooking,
        // };
        // await notifyAdmins('newBooking', bookingData);  // Send notification to admins
        
        await createBookingNotificationForAdmin(newBooking, "Creation", "Sent", transaction, serviceData)
        await transaction.commit();
        return res.status(201).json({ success: true, message: 'Booking created successfully.', data: newBooking });
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ success: false, message: 'Error creating booking.', error: error.message });
    }
};

// Update booking
exports.updateBooking = async (req, res) => {
    const { ...updates } = req.body;
    const transaction = await sequelize.transaction();
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).json({success:false, message: 'Please provide an Id.' });
        }
        const booking = await Bookings.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
        if (!booking) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }
        const [updatedCount, [updatedBooking]] = await Bookings.update(updates, {
            where: { id }, returning: true, transaction,
        });
        if (updatedCount === 0) {
            await transaction.rollback();
            return res.status(304).json({ success: false, message: 'Booking has no update!' });
        }
        // await notifyUserOnBookingUpdate(updatedBooking, "Confirmed");
        const formattedDateTime = new Date(updatedBooking.dateTime).toLocaleString('en-US', {
            weekday: 'long', 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric', 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        });
        const message = `Your appointment at Fana Spa is ${updatedBooking.status} for ${formattedDateTime}. Please arrive a few minutes early to enjoy a seamless experience.`;
        // if(updatedBooking.status === updates.status){
        //     await sendSMS(booking.firstName, booking.lastName, booking.phoneNumber, message);
        // }
        
        await transaction.commit();
        return res.status(200).json({ success: true, message: 'Booking updated successfully.', data: updatedBooking });
    } catch (err) {
        await transaction.rollback();
        console.error(err);
        return res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};


// Get all bookings with related data
exports.getAllBookings = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = parseInt(limit, 10) || 10;
        const bookingCount = await Bookings.count();
        const totalPages = Math.ceil(bookingCount / pageSize);
        const bookings = await Bookings.findAll({
            include: [{ model: Services, as: 'service',}],
            where: {status: { [Op.notIn]: ["Rejected"] }},
            offset: (pageNumber - 1) * pageSize,
            limit: pageSize,
            order: [['updatedAt', 'DESC']],
        }); 
        if (bookings.length === 0) {
            return res.status(404).json({ success: false, message: 'No bookings found.'});
        }
        return res.status(200).json({ 
            success: true, 
            data: bookings,
            pagination: { total: bookingCount, page: pageNumber, pageSize, totalPages,}
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching bookings.', error: error.message });
    }
};


// Get todays bookings with related data
exports.getTodayBookings = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = parseInt(limit, 10) || 10;
        const startOfDay = moment().startOf('day').toDate();
        const endOfDay = moment().endOf('day').toDate();
        const bookingCount = await Bookings.count({
            where: {
                createdAt: { [Op.between]: [startOfDay, endOfDay],},
                where: {status: { [Op.notIn]: ["Rejected"] }},
            },
        });
        const totalPages = Math.ceil(bookingCount / pageSize);

        const bookings = await Bookings.findAll({
            where: {
                createdAt: { [Op.between]: [startOfDay, endOfDay],},
            },
            include: [{ model: Services, as: 'service',}],
            offset: (pageNumber - 1) * pageSize,
            limit: pageSize,
            order: [['updatedAt', 'DESC']],
        }); 
        // if (bookings.length === 0) {
        //     return res.status(404).json({ success: false, message: 'No bookings found.'});
        // }
        return res.status(200).json({ 
            success: true, 
            data: bookings,
            pagination: { total: bookingCount, page: pageNumber, pageSize, totalPages,}
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching bookings.', error: error.message });
    }
};

// Get a single booking by ID
exports.getBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({success:false, message: 'Please provide an Id.' });
        }
        const booking = await Bookings.findByPk(id, {
            include: [
                { model: Services, as: 'service' },
            ]
        });
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }
        return res.status(200).json({ success: true, data: booking });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching booking.', error: error.message });
    }
};

// Get bookings by phone number
exports.getBookingsByPhone = async (req, res) => {
    try {
        const { phone } = req.query;
        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required.' });
        }
        const { page, limit } = req.query;
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = parseInt(limit, 10) || 10;
        const bookingCount = await Bookings.count();
        const totalPages = Math.ceil(bookingCount / pageSize);
        const bookings = await Bookings.findAll({
            where: { phone },
            include: [{ model: Services, as: 'service' }],
            where: {status: { [Op.notIn]: ["Rejected"] }},
            offset: (pageNumber - 1) * pageSize,
            limit: pageSize,
            order: [['updatedAt', 'DESC']],
        }); 
        if (bookings.length === 0) {
            return res.status(404).json({ success: false, message: 'No bookings found for this phone number.'});
        }
        return res.status(200).json({ 
            success: true, 
            data: bookings,
            pagination: { total: bookingCount, page: pageNumber, pageSize, totalPages,}
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching bookings.', error: error.message });
    }
};


// Delete a booking with transaction
exports.deleteBooking = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const booking = await Bookings.findByPk(id, { transaction, lock: t.LOCK.UPDATE });
        if (!booking) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }
        await booking.destroy({ transaction: t });
        // Send notification to admin about the booking deleted
        await Notifications.create({
            userId: booking.userId,
            message: `Booking ${booking.id} has been deleted.$ by user ${booking.userId}.`,
            bookingId: booking.id,
            type: `${booking.status}`,
        }, { transaction: t });
        await transaction.commit();
        return res.status(200).json({ success: true, message: 'Booking deleted successfully.' });
    } catch (error) {
        await t.rollback();
        return res.status(500).json({ success: false, message: 'Error deleting booking.', error: error.message });
    }
};


// // Create a new booking with validation, duplication check & transaction
// exports.createBooking = async (req, res) => {
//     const transaction = await sequelize.transaction();
//     try {
//         const { userId, serviceId, datetime, payment_method, status, notes } = req.body;
//         if (!userId || !serviceId || !datetime ) {
//             return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
//         }
//         const existingBooking = await Bookings.findOne({
//             where: { userId, serviceId, datetime, status, notes},
//             transaction,
//         });
//         if (existingBooking) {
//             await transaction.rollback();
//             return res.status(400).json({ success: false, message: 'A booking already exists for this customer at the same time.' });
//         }
//         const newBooking = await Bookings.create(req.body, { transaction });

//         await transaction.commit();
//         // Emit event to notify admin about the new booking
//         // io.emit('newBooking', {
//         //     message: `A new booking has been ${newBooking.status}created.`,
//         //     booking: newBooking
//         // });
//         getIO().emit('newBooking', {
//             message: 'A new booking has been created!',
//             booking: newBooking
//         });
//         return res.status(201).json({ success: true, message: 'Booking created successfully.', data: newBooking });
//     } catch (error) {
//         await transaction.rollback();
//         return res.status(500).json({ success: false, message: 'Error creating booking.', error: error.message });
//     }
// };

// // update booking
// exports.updateBooking = async (req, res) => {
//     const { ...updates } = req.body;
//     const t = await sequelize.transaction();
//     try {
//         const id = req.params.id || req.user.id;
//         if (!id) {
//             return res.status(400).json({ message: 'Please provide an Id.' });
//         }
//         const booking = await Bookings.findByPk(id , {transaction: t, lock: t.LOCK.UPDATE});
//         if (!booking) {
//             await t.rollback();
//             return res.status(404).json({ success: false, message: 'Booking not found.' });
//         }
//         const [updatedCount, [updatedBooking]] = await Bookings.update(updates, { where: { id }, returning: true, transaction: t,});
//         if (updatedCount === 0) {
//             await t.rollback();
//             return res.status(304).json({ success: false, message: 'Booking has no update!' });
//         }
//         await t.commit();
//         // Send real-time notification to the user
//         const userSocketId = getConnectedUsers().get(updatedBooking.userId);
//         console.log("\n\n🔗 Found user socket:", userSocketId);
//         if (userSocketId) {
//             getIO().to(userSocketId).emit('bookingStatusUpdate', {
//                 message: `Your booking has been ${updatedBooking.status}!`,
//                 booking: updatedBooking
//             });
//         }
//         return res.status(200).json({ success: true, message: 'Booking updated successfully.', data: updatedBooking,});
//     } catch (err) {
//         await t.rollback();
//         console.log(err);
//         return res.status(500).json({ success: false, message: 'Server Error', error: err.message });
//     }
// };




// // Update a booking status (confirm or cancel)
// exports.updateBooking = async (req, res) => {
//     const { status } = req.body;  // status could be 'confirmed' or 'canceled'
//     const t = await sequelize.transaction();
//     try {
//         const id = req.params.id;
//         if (!id) {
//             return res.status(400).json({ message: 'Please provide an Id.' });
//         }
//         const booking = await Bookings.findOne({ where: { id }, transaction: t, lock: t.LOCK.UPDATE });
//         if (!booking) {
//             await t.rollback();
//             return res.status(404).json({ success: false, message: 'Booking not found.' });
//         }
//         const [updatedCount, [updatedBooking]] = await Bookings.update(
//             { status },
//             { where: { id }, returning: true, transaction: t }
//         );
//         if (updatedCount === 0) {
//             await t.rollback();
//             return res.status(304).json({ success: false, message: 'No changes made to the booking.' });
//         }
//         await t.commit();
//         // Emit event to notify the user about the booking update
//         io.emit(`bookingUpdated-${booking.userId}`, {
//             message: `Your booking has been ${updatedBooking.status}.`,
//             booking: updatedBooking
//         });
//         return res.status(200).json({ success: true, message: `Successfully booking ${updatedBooking.status}.`, data: updatedBooking,});
//     } catch (err) {
//         await t.rollback();
//         return res.status(500).json({ success: false, message: 'Server Error', error: err.message });
//     }
// };