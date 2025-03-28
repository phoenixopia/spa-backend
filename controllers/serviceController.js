const { sequelize, Services, Bookings } = require('../models/index');


// Create a new spa service
exports.createServices = async (req, res) => {
    try {
        const { name, description, category, price, discount, duration, status } = req.body;
        // Check if service with the same name already exists
        const existingService = await Services.findOne({ where: { name } });
        if (existingService) {
            return res.status(400).json({ success: false, message: 'A service with this name already exists.' });
        }
        const Services = await Services.create({ name, description, category, price, discount, duration, status });
        return res.status(201).json({ success: true, message: 'Spa service created successfully.', data: Services });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'An error occurred while creating the service.', error: error.message });
    }
};

// Get all spa services
exports.getAllServicess = async (req, res) => {
    try {
        const Servicess = await Services.findAll({
            include: [
                {
                  model: Bookings,
                  as: 'booking',
                }
            ],
        });
        return res.status(200).json({ success: true, data: Servicess });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'An error occurred while retrieving services.', error: error.message });
    }
};

// Get a single spa service by ID
exports.getServicesById = async (req, res) => {
    try {
        const { id } = req.params;
        const service = await Services.findByPk(id, {
            include: [
                {
                  model: Bookings,
                  as: 'booking',
                }
            ],
        });
        if (!service) {
            return res.status(404).json({ success: false, message: 'Spa service not found.' });
        }
        return res.status(200).json({ success: true, data: service });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'An error occurred while retrieving the service.', error: error.message });
    }
};

// Update a spa service
exports.updateServices = async (req, res) => {
    const { ...updates } = req.body;
    const t = await sequelize.transaction();
    try {
      const id = req.params.id || req.user.id;
      if (!id) {
          return res.status(400).json({ message: 'Please provide a user Id.' });
      }
      const service = await Services.findOne({ where: { id }, transaction: t, lock: t.LOCK.UPDATE});
      if (!service) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Service not found.' });
      }
      const [updatedCount, [updatedService]] = await Services.update(updates, { where: { id }, returning: true, transaction: t,});
      if (updatedCount === 0) {
        await t.rollback();
        return res.status(304).json({ success: false, message: 'Service has no update!' });
      }
      await t.commit();
      return res.status(200).json({ success: true, message: 'Service updated successfully.', data: updatedService,});
    } catch (err) {
      await t.rollback();
      console.log(err);
      return res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// Delete a spa service
exports.deleteServices = async (req, res) => {
    const { id } = req.params;
    const t = await sequelize.transaction();
    try {
        // Lock the row to prevent simultaneous deletions
        const Services = await Services.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
        if (!Services) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Spa service not found.' });
        }
        await Services.destroy({ transaction: t });
        await t.commit();
        return res.status(200).json({ success: true, message: 'Spa service deleted successfully.' });
    } catch (error) {
        await t.rollback();
        return res.status(500).json({ success: false, message: 'An error occurred while deleting.', error: error.message });
    }
};

