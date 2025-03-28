// const { Notification } = require("../models"); // Assuming your Sequelize model is Notification
// const { Op } = require('sequelize');
// const sequelize = require('sequelize');

// // Get all notifications
// exports.getAllNotifications = async (req, res) => {
//   try {
//     const notifications = await Notification.findAll();
//     return res.status(200).json({ success: true, data: notifications });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: "Error retrieving notifications", error: error.message });
//   }
// };

// // Get a specific notification by ID
// exports.getNotificationById = async (req, res) => {
//   try {
//     const notification = await Notification.findByPk(req.params.notification_id);
//     if (!notification) {
//       return res.status(404).json({ success: false, message: "Notification not found" });
//     }
//     return res.status(200).json({ success: true, data: notification });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: "Error retrieving notification", error: error.message });
//   }
// };

// // Create a new notification with validation and transaction
// exports.createNotification = async (req, res) => {
//   const t = await sequelize.transaction();

//   try {
//     const { user_id, booking_id, message, type, status } = req.body;

//     // Validate required fields
//     if (!user_id || !booking_id || !message || !type || !status) {
//       await t.rollback();
//       return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
//     }

//     // Check if the notification already exists (optional check)
//     const existingNotification = await Notification.findOne({
//       where: { user_id, booking_id, type },
//       transaction: t
//     });

//     if (existingNotification) {
//       await t.rollback();
//       return res.status(400).json({ success: false, message: "Notification already exists for this booking." });
//     }

//     const newNotification = await Notification.create({
//       user_id,
//       booking_id,
//       message,
//       type,
//       status
//     }, { transaction: t });

//     await t.commit();
//     return res.status(201).json({ success: true, message: "Notification created successfully", data: newNotification });
//   } catch (error) {
//     await t.rollback();
//     return res.status(500).json({ success: false, message: "Error creating notification", error: error.message });
//   }
// };

// // Update a notification with validation, locking, and transaction handling
// exports.updateNotification = async (req, res) => {
//   const t = await sequelize.transaction();

//   try {
//     const { notification_id } = req.params;
//     const { message, type, status } = req.body;

//     // Validate required fields
//     if (!message || !type || !status) {
//       await t.rollback();
//       return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
//     }

//     // Locking update to prevent race conditions using Sequelize's `FOR UPDATE`
//     const notification = await Notification.findByPk(notification_id, {
//       lock: sequelize.Transaction.LOCK.UPDATE, // Lock row for update
//       transaction: t
//     });

//     if (!notification) {
//       await t.rollback();
//       return res.status(404).json({ success: false, message: "Notification not found" });
//     }

//     // Update the notification
//     const updatedNotification = await notification.update(
//       { message, type, status },
//       { transaction: t }
//     );

//     await t.commit();
//     return res.status(200).json({ success: true, message: "Notification updated successfully", data: updatedNotification });
//   } catch (error) {
//     await t.rollback();
//     return res.status(500).json({ success: false, message: "Error updating notification", error: error.message });
//   }
// };

// // Delete a notification with transaction handling
// exports.deleteNotification = async (req, res) => {
//   const t = await sequelize.transaction();

//   try {
//     const { notification_id } = req.params;

//     // Lock the notification during delete operation to prevent accidental deletion
//     const notification = await Notification.findByPk(notification_id, {
//       lock: sequelize.Transaction.LOCK.UPDATE, // Lock row for update
//       transaction: t
//     });

//     if (!notification) {
//       await t.rollback();
//       return res.status(404).json({ success: false, message: "Notification not found" });
//     }

//     // Proceed with deletion
//     await notification.destroy({ transaction: t });

//     await t.commit();
//     return res.status(200).json({ success: true, message: "Notification deleted successfully" });
//   } catch (error) {
//     await t.rollback();
//     return res.status(500).json({ success: false, message: "Error deleting notification", error: error.message });
//   }
// };
