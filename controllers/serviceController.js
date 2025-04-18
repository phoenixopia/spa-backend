const { sequelize, Services,Categories, Bookings } = require('../models/index');
const { cloudinary } = require('../utils/cloudinary');
const streamifier = require('streamifier');

const isDecimal = (value) => {
    return !isNaN(value) && /^\d+(\.\d{1,2})?$/.test(value);
};


// Create a new spa service
exports.createService = async (req, res) => {
    const { name, categoryId, price, duration, discount, image } = req.body;
    const userId = req.user?.id || req.body.id;
  
    let imageBuffer = null;
  
    // 1. Handle uploaded file (e.g., from multipart/form-data)
    if (req.file && req.file.buffer) {
      imageBuffer = req.file.buffer;
  
    // 2. Handle base64 image string (e.g., from JSON body)
    } else if (image && image.startsWith('data:image')) {
      try {
        const base64Data = image.split(';base64,').pop();
        imageBuffer = Buffer.from(base64Data, 'base64');
      } catch (e) {
        return res.status(400).json({ success: false, message: "Invalid base64 image format." });
      }
  
    // 3. Handle stringified Buffer like "<Buffer ...>"
    } else if (image && image.startsWith('<Buffer')) {
      try {
        const hex = image
          .replace('<Buffer ', '')
          .replace('>', '')
          .trim()
          .split(' ')
          .map((byte) => parseInt(byte, 16));
        imageBuffer = Buffer.from(hex);
      } catch (e) {
        return res.status(400).json({ success: false, message: "Invalid buffer image format." });
      }
    }

    const errors = [];

    if (!name?.trim()) errors.push("Name is required.");
    if (!categoryId) errors.push("Category ID is required.");
    if (!price) errors.push("Price is required.");
    if (!userId) errors.push("User ID is required.");

    if (name?.trim().length < 3) errors.push("Name must be at least 3 characters long.");

    if (price && !isDecimal(price)) errors.push("Price must be a valid decimal number.");
    if (discount && !isDecimal(discount)) errors.push("Discount must be a valid decimal number.");

    if (duration != null && (isNaN(duration) || Number(duration) < 1)) {
    errors.push("Duration must be a positive number.");
    }

    if (errors.length > 0) {
    return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors,
    });
    }
  
    const transaction = await sequelize.transaction();
  
    try {
      // Prevent duplicate service
      const existingService = await Services.findOne({
        where: { name, categoryId, price },
        transaction
      });
  
      if (existingService) {
        await transaction.rollback();
        return res.status(409).json({ success: false, message: `A service with name '${name}' already exists.` });
      }
  
      let imageURL = null;
  
      // Upload to Cloudinary if imageBuffer is available
      if (imageBuffer) {
        const streamUpload = () => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "Spa Services",
                width: 1200,
                crop: "scale",
                resource_type: "image",
              },
              (error, result) => {
                if (result) {
                  resolve(result);
                } else {
                  reject(error);
                }
              }
            );
            streamifier.createReadStream(imageBuffer).pipe(stream);
          });
        };
  
        const result = await streamUpload();
        imageURL = result.secure_url;
      }

      // Create service
      const service = await Services.create(
        {
            ...req.body,
            userId,
            imageURL,
        },
        { transaction }
      );
  
      await transaction.commit();
  
      return res.status(201).json({
        success: true,
        message: 'Spa service created successfully.',
        data: service,
      });
  
    } catch (error) {
      console.error(error);
      await transaction.rollback();
      return res.status(500).json({
        success: false,
        message: 'An error occurred while creating the service.',
        error: error.message,
      });
    }
};
  


// Get all bookings with related data
exports.getAllServices = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = parseInt(limit, 10) || 10;
        const dataCount = await Services.count();
        const totalPages = Math.ceil(dataCount / pageSize);
        const services = await Services.findAll({
            include: [
                {
                    model: Categories,
                    as: 'category',
                },
                {
                  model: Bookings,
                  as: 'booking',
                }
            ],
            offset: (pageNumber - 1) * pageSize,
            limit: pageSize,
            order: [['updatedAt', 'DESC']],
        }); 
        if (services.length === 0) {
            return res.status(404).json({ success: false, message: 'No service found.'});
        }
        return res.status(200).json({ 
            success: true, 
            data: services,
            pagination: { total: dataCount, page: pageNumber, pageSize, totalPages,}
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching services.', error: error.message });
    }
};

// Get a single spa service by ID
exports.getServiceById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: "Please use an id" });
        }
        const service = await Services.findByPk(id, {
            include: [
                {
                    model: Categories,
                    as: 'category',
                },
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
        console.error(error);
        return res.status(500).json({ success: false, message: 'An error occurred while retrieving the service.', error: error.message });
    }
};


// Get by categoryId
exports.getServiceForCategory = async (req, res) => {
        if (!req.params.id) {
            return res.status(400).json({ message: 'Please provide a a categoryId.' });
        }
        try {
            const { page, limit } = req.query;
            const pageNumber = parseInt(page, 10) || 1;
            const pageSize = parseInt(limit, 10) || 10;
            const serviceCount = await Services.count();
            const totalPages = Math.ceil(serviceCount / pageSize);
    
            const services = await Services.findAll({
                where: { categoryId: req.params.id },
                include: [
                    {
                        model: Categories,
                        as: 'category',
                    },
                    {
                      model: Bookings,
                      as: 'booking',
                    }
                ],
                offset: (pageNumber - 1) * pageSize,
                limit: pageSize,
                order: [['createdAt', 'ASC']], 
            }); // Sorting by createdAt in ascending order
            return res.status(200).json({ 
                success: true, 
                data: services,
                pagination: { total: serviceCount, page: pageNumber, pageSize, totalPages,}
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success:false, error: "Error fetching blogs", details: error.message });
        }
}; 


// Update a spa service
exports.updateService = async (req, res) => {
    const { ...updates } = req.body;
    const id = req.params.id;
    if (!id) {
        return res.status(400).json({ message: 'Please provide a service Id.' });
    }
    const t = await sequelize.transaction();
    try {
      const service = await Services.findByPk(id , { transaction: t, lock: t.LOCK.UPDATE });
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
exports.deleteService = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'Please provide a service Id.' });
    }
    const t = await sequelize.transaction();
    try {
        // Lock the row to prevent simultaneous deletions
        const service = await Services.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
        if (!service) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Spa service not found.' });
        }
        await service.destroy({ transaction: t });
        await t.commit();
        return res.status(200).json({ success: true, message: 'Spa service deleted successfully.' });
    } catch (error) {
        await t.rollback();
        console.error(error);
        return res.status(500).json({ success: false, message: 'An error occurred while deleting.', error: error.message });
    }
};

