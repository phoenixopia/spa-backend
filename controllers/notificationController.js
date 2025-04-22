const { Op } = require('sequelize');
const { sequelize, Users, Notifications } = require('../models/index');


// Get all notifications
exports.getAllNotifications = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = parseInt(limit, 10) || 10;
        const notificationCount = await Notifications.count();
        const totalPages = Math.ceil(notificationCount / pageSize);
        const notifications = await Notifications.findAll({
            where: {status: { [Op.notIn]: ["Archived", "Failed"] }},
            offset: (pageNumber - 1) * pageSize,
            limit: pageSize,
            order: [['createdAt', 'DESC']]
        }); 
        if (notifications.length === 0) {
            return res.status(404).json({ success: false, message: 'No notifications found.'});
        }
        return res.status(200).json({ 
            success: true, 
            data: notifications,
            pagination: { total: notificationCount, page: pageNumber, pageSize, totalPages,}
        });
    } catch (error) {
      console.error(error)
      return res.status(500).json({ success: false, message: "Error retrieving notifications", error: error.message });
    }
};


// Get a specific notification by ID
exports.getNotificationById = async (req, res) => {
    try {
        const { id } = req.params.id;
        if (!id) {
            return res.status(400).json({success:false, message: 'Please provide an Id.' });
        }
        const notification = await Notifications.findByPk(req.params.notificationId);
        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }
        return res.status(200).json({ success: true, data: notification });
    } catch (error) {
      console.error(error)
      return res.status(500).json({ success: false, message: "Error retrieving notification", error: error.message });
    }
};


// Get notifications for a specific user
exports.getNotificationForUser = async (req, res) => {
    try {
      const userId = req.params.id || req.user.id;
      if (!userId) {
          return res.status(400).json({success:false, message: 'Please provide an Id.' });
      }
      const { page, limit } = req.query;
      const pageNumber = parseInt(page, 10) || 1;
      const pageSize = parseInt(limit, 10) || 10;
      const notificationCount = await Notifications.count();
      const totalPages = Math.ceil(notificationCount / pageSize);
      const notifications = await Notifications.findAll({
        where: { userId, status: { [Op.notIn]: ["Archived", "Failed"] }},
        offset: (pageNumber - 1) * pageSize,
        limit: pageSize,
        order: [['createdAt', 'DESC']],
      }); 
      if (notifications.length === 0) {
          return res.status(404).json({ success: false, message: 'No bookings found for this phone number.'});
      }
      return res.status(200).json({ 
          success: true, 
          data: notifications,
          pagination: { total: notificationCount, page: pageNumber, pageSize, totalPages,}
      });
    } catch (error) {
        console.error(error)
        return res.status(500).json({ success: false, message: 'Error fetching notifications.', error: error.message });
    }
};


// Create Notification function
exports.createBookingNotificationForAdmin = async (booking, type, status, transaction, serviceData) => {
    try {
      const message = `A new booking '${serviceData.name}' has been created  with status '${booking.status}'`;
      const admins = await Users.findAll({ where: { role: 'admin' }, transaction });
      if (!admins || admins.length === 0) {
          console.warn("No admin users found. Skipping notification creation.");
          return;
      }
      const notifications = admins.map(admin => ({
          userId: admin.id,
          bookingId: booking.id,
          message,
          type,
          status,
      }));

      await Notifications.bulkCreate(notifications, {transaction});
      console.log(`Notifications sent for admin(s): ${admins.length}.`);
    } catch (error) {
        console.error("Error creating notification:", error);
        throw new Error('Error creating notification.');
    }
};


// Update a notification with validation, locking, and transaction handling
exports.updateNotificationStatus = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { status } = req.body;
    const id = req.params.id;
    const type = "Updated";
    const message = `A notfication '${id}' status has been updated to status '${status}'`;
    if (!id || !message || !type || !status) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
    }
    const notification = await Notifications.findByPk(id, {
      lock: t.LOCK.UPDATE,
      transaction: t
    });
    if (!notification) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    const updatedNotification = await notification.update(
      { message, type, status }, { transaction: t }
    );
    await t.commit();
    return res.status(200).json({ success: true, message: "Notification updated successfully", data: updatedNotification });
  } catch (error) {
    await t.rollback();
    console.error(error)
    return res.status(500).json({ success: false, message: "Error updating notification", error: error.message });
  }
};


// Delete a notification with transaction handling
exports.deleteNotification = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    if (!req.params.id) {
        return res.status(400).json({ success: false, message: 'Missing the required field(s).' });
    }
    const notification = await Notifications.findByPk(req.params.id, {
      lock: sequelize.Transaction.LOCK.UPDATE, // Lock row for update
      transaction: t
    });
    if (!notification) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    const status = "Archived";
    await notification.update(
      { status }, { transaction: t }
    );
    // await notification.destroy({ transaction: t });
    await t.commit();
    return res.status(200).json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    await t.rollback();
    console.error(error)
    return res.status(500).json({ success: false, message: "Error deleting notification", error: error.message });
  }
};
