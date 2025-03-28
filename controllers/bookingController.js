const { Users, Bookings, Services, Notifications } = require('../models/index');


// Get all bookings with related data
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Bookings.findAll({
            include: [
                { model: Notifications, as: 'notification',},
                { model: Users, as: 'user',},
                { model: Services, as: 'service',},
            ]
        });
        return res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching bookings.', error: error.message });
    }
};

// Get a single booking by ID
exports.getBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Bookings.findByPk(id, {
            include: [
                { model: Users, as: 'user' },
                { model: Services, as: 'service' },
            ]
        });
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }
        return res.status(200).json({ success: true, data: booking });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching booking.', error: error.message });
    }
};

// Create a new booking with validation, duplication check & transaction
exports.createBooking = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { userId, serviceId, booking_time, payment_method } = req.body;
        if (!userId || !serviceId || !booking_time ) {
            return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
        }
        const existingBooking = await Bookings.findOne({
            where: { userId, serviceId, booking_time, },
            transaction,
        });
        if (existingBooking) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'A booking already exists for this customer at the same time.' });
        }
        const newBooking = await Bookings.create({
            userId, serviceId, booking_time, payment_method,
        }, { transaction });

        await transaction.commit();
        return res.status(201).json({ success: true, message: 'Booking created successfully.', data: newBooking });
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ success: false, message: 'Error creating booking.', error: error.message });
    }
};

// Update a spa service
exports.updateBooking = async (req, res) => {
    const { ...updates } = req.body;
    const t = await sequelize.transaction();
    try {
      const id = req.params.id || req.user.id;
      if (!id) {
          return res.status(400).json({ message: 'Please provide an Id.' });
      }
      const booking = await Bookings.findOne({ where: { id }, transaction: t, lock: t.LOCK.UPDATE});
      if (!booking) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Booking not found.' });
      }
      const [updatedCount, [updatedBooking]] = await Bookings.update(updates, { where: { id }, returning: true, transaction: t,});
      if (updatedCount === 0) {
        await t.rollback();
        return res.status(304).json({ success: false, message: 'Booking has no update!' });
      }
      await t.commit();
      return res.status(200).json({ success: true, message: 'Booking updated successfully.', data: updatedBooking,});
    } catch (err) {
      await t.rollback();
      console.log(err);
      return res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// Delete a booking with transaction
exports.deleteBooking = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const booking = await Bookings.findByPk(id, { transaction, lock: t.LOCK.UPDATE });
        if (!booking) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        await booking.destroy({ transaction });
        await transaction.commit();
        return res.status(200).json({ success: true, message: 'Booking deleted successfully.' });
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ success: false, message: 'Error deleting booking.', error: error.message });
    }
};