const { sequelize, Services,Categories, Bookings } = require('../models/index');
const { cloudinary } = require('../utils/cloudinary');
const streamifier = require('streamifier');

const isDecimal = (value) => {
    return !isNaN(value) && /^\d+(\.\d{1,2})?$/.test(value);
};

// Create a new spa service
exports.createService = async (req, res) => {
    try {
        const { name, categoryId, price, duration, discount } = req.body;
        const file = req.file;
        const userId = req.user?.id || req.body.id;

        if (!name || !categoryId || !price || !file || !userId) {
            return res.status(400).json({ success: false, message: 'Missing the required fields.' });
        }

        if (name.length < 3) {
            return res.status(400).json({ error: "Name must be at least 3 characters." });
        }

        if (!isDecimal(price)) {
            return res.status(400).json({ error: "Price must be a valid decimal number." });
        }

        if (discount && !isDecimal(discount)) {
            return res.status(400).json({ error: "Discount must be a valid decimal number." });
        }

        if (duration && (isNaN(duration) || duration < 1)) {
            return res.status(400).json({ error: "Duration must be a positive number." });
        }

        const existingService = await Services.findOne({ where: { name, categoryId, price } });
        if (existingService) {
            return res.status(400).json({ success: false, message: `A service with name '${name}' already exists.` });
        }

        // Upload to Cloudinary using buffer
        const streamUpload = () => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream({
                    folder: "Spa Services",
                    width: 1200,
                    crop: "scale"
                }, (error, result) => {
                    if (result) resolve(result);
                    else reject(error);
                });

                streamifier.createReadStream(file.buffer).pipe(stream);
            });
        };

        const result = await streamUpload();

        const data = {
            ...req.body,
            userId,
            imageURL: result.secure_url || null,
        };

        const service = await Services.create(data);
        return res.status(201).json({ success: true, message: 'Spa service created successfully.', data: service });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'An error occurred while creating the service.', error: error.message });
    }
};


// const isDecimal = (value) => {
//     return !isNaN(value) && /^\d+(\.\d{1,2})?$/.test(value);
// };

// // Create a new spa service
// exports.createService = async (req, res) => {
//     try {
//         const { name, categoryId, price, duration, discount } = req.body;
//         const {file} = req;
//         const userId = req.user?.id || req.body.id;
//         if(!name || !categoryId || !price || !file || !userId){
//             return res.status(400).json({ success: false, message: 'Missing the required fields.'});
//         }
//         if (!name || name.length < 3) {
//             return res.status(400).json({ error: "Name must be at least 3 characters." });
//         }
//         if (!categoryId) {
//             return res.status(400).json({ error: "Category ID is required." });
//         }
//         if (!price || !isDecimal(price)) {
//             return res.status(400).json({ error: "Price must be a valid decimal number." });
//         }
//         if (discount && !isDecimal(discount)) {
//             return res.status(400).json({ error: "Discount must be a valid decimal number." });
//         }

//         if (duration && (isNaN(duration) || duration < 1)) {
//             return res.status(400).json({ error: "Duration must be a positive number." });
//         }
//         const existingService = await Services.findOne({ where: { name, categoryId, price } });
//         if (existingService) {
//             return res.status(400).json({ success: false, message: `A service with name '${name}' already exists.`});
//         }
//         const result = await cloudinary.uploader.upload(req.file?.path, {
//                 folder: "Blogs",
//                 width: 1200,
//                 crop: "scale"
//         });
//         const data = {
//             ...req.body, 
//             userId, 
//             imageURL: result.secure_url || null,
//         }
//         const service = await Services.create(data);
//         return res.status(201).json({ success: true, message: 'Spa service created successfully.', data: service });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ success: false, message: 'An error occurred while creating the service.', error: error.message });
//     }
// };



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

