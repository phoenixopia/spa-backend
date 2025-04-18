const { sequelize, Testimonials } = require("../models"); // Sequelize instance
const streamifier = require('streamifier');

// Get all testimonials with pagination
exports.getAllTestimonials = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = parseInt(limit, 10) || 10;
        const testimonialCount = await Testimonials.count();
        const totalPages = Math.ceil(testimonialCount / pageSize);

        const testimonials = await Testimonials.findAll({
            offset: (pageNumber - 1) * pageSize,
            limit: pageSize,
            order: [['updatedAt', 'DESC']],
        });
        return res.status(200).json({ 
            success: true, 
            data: testimonials,
            pagination: { total: testimonialCount, page: pageNumber, pageSize, totalPages,}
        });
    } catch (error) {
        console.error(error)
        return res.status(500).json({ success:false, meassge: "Error fetching testimonials", error: error.message });
    }
};

// Get a testimonial by ID
exports.getTestimonialById = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(404).json({ success: false, message: "Missing a testimonial id!" });
    }

    try {
        const testimonial = await Testimonials.findByPk(id,);
        if (!testimonial) {
            return res.status(404).json({ success: false, message: "Testimonial not found." });
        }
        return res.status(200).json({ success:true, data: testimonial });
    } catch (error) {
        await transaction.rollback();
        console.error(error)
        return res.status(500).json({success:false, message: "Error fetching a testimonial", error: error.message });
    }
};  

// Get testimonials for a specific user
exports.getUserTestimonials = async (req, res) => {
    const id = req.user.id || req.params.userId;
    if (!id) {
        return res.status(400).json({ message: 'Please provide a testimonial Id.' });
    }
    try {
        const { page, limit } = req.query;
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = parseInt(limit, 10) || 10;
        const testimonialCount = await Testimonials.count();
        const totalPages = Math.ceil(testimonialCount / pageSize);

        const testimonials = await Testimonials.findAll({
            where: { userId: id },
            offset: (pageNumber - 1) * pageSize,
            limit: pageSize,
            order: [['createdAt', 'ASC']], 
        }); // Sorting by createdAt in ascending order
        return res.status(200).json({ 
            success: true, 
            data: testimonials,
            pagination: { total: testimonialCount, page: pageNumber, pageSize, totalPages,}
        });
    } catch (error) {
        console.error(error)
        return res.status(500).json({ success:false, error: "Error fetching testimonials", details: error.message });
    }
}; 


// Create a new testimonial post with optional image upload
exports.createTestimonial = async (req, res) => {
    const { firstName, lastName, title, message, status, image } = req.body;
    const userId = req.user?.id || req.body.id;
  
    let imageBuffer = null;
  
    // Handle multipart file
    if (req.file && req.file.buffer) {
      imageBuffer = req.file.buffer;
  
    // Handle base64 image
    } else if (image && image.startsWith("data:image")) {
      try {
        const base64Data = image.split(";base64,").pop();
        imageBuffer = Buffer.from(base64Data, "base64");
      } catch (e) {
        return res.status(400).json({ success: false, message: "Invalid base64 image format." });
      }
  
    // Handle <Buffer ...>
    } else if (image && image.startsWith("<Buffer")) {
      try {
        const hex = image
          .replace("<Buffer ", "")
          .replace(">", "")
          .trim()
          .split(" ")
          .map((byte) => parseInt(byte, 16));
        imageBuffer = Buffer.from(hex);
      } catch (e) {
        return res.status(400).json({ success: false, message: "Invalid buffer image format." });
      }
    }
  
    // Basic validation
    if (!firstName || !lastName || !title || !message || !userId) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }
  
    const transaction = await sequelize.transaction();
  
    try {
      // Check for existing testimonial
      const existingTestimonial = await Testimonials.findOne({
        where: { title, message, userId },
        transaction,
      });
  
      if (existingTestimonial) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: "A testimonial with this title and content already exists for this author.",
        });
      }
  
      // Upload image if it exists
      let imageURL = null;
      if (imageBuffer) {
        const streamUpload = () => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "Spa Testimonials",
                width: 1200,
                crop: "scale",
              },
              (error, result) => {
                if (result) resolve(result);
                else reject(error);
              }
            );
            streamifier.createReadStream(imageBuffer).pipe(stream);
          });
        };
  
        const result = await streamUpload();
        imageURL = result.secure_url || null;
      }
  
      const publishedAt = status === "published" ? new Date() : null;
  
      const testimonial = await Testimonials.create(
        {
          firstName,
          lastName,
          title,
          message,
          status,
          userId,
          publishedAt,
          imageURL,
        },
        { transaction }
      );
  
      await transaction.commit();
  
      return res.status(201).json({
        success: true,
        message: "Testimonial created successfully.",
        data: testimonial,
      });
  
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Failed to create testimonial.",
        error: error.message,
      });
    }
};  
  


// // Create a new testimonial post with transaction support
// exports.createTestimonial = async (req, res) => {
//     const { firstName, lastName, title, message, status } = req.body;
//     const image = req.file;
//     const userId = req.user?.id || req.body.id;

//     if (!firstName || !lastName || !title || !message || !userId || !image) {
//         return res.status(400).json({ success: false, message: "Missing the required fields." });
//     }

//     const transaction = await sequelize.transaction();
//     try {
//         const existingTestimonial = await Testimonials.findOne({
//             where: { title, message, userId },
//             transaction,
//         });

//         if (existingTestimonial) {
//             await transaction.rollback();
//             return res.status(409).json({
//                 success: false,
//                 message: "A testimonial with this title and content already exists for this author",
//             });
//         }

//         const streamUpload = () => {
//             return new Promise((resolve, reject) => {
//                 const stream = cloudinary.uploader.upload_stream(
//                     {
//                         folder: "Spa Testimonials",
//                         width: 1200,
//                         crop: "scale",
//                     },
//                     (error, result) => {
//                         if (result) resolve(result);
//                         else reject(error);
//                     }
//                 );
//                 streamifier.createReadStream(image.buffer).pipe(stream);
//             });
//         };

//         const result = await streamUpload();
//         const publishedAt = (status === "published") ? new Date() : null;

//         const data = {
//             ...req.body,
//             userId,
//             publishedAt,
//             imageURL: result.secure_url || null,
//         };

//         const testimonial = await Testimonials.create(data, { transaction });
//         await transaction.commit();

//         return res.status(201).json({
//             success: true,
//             message: "Testimonial created successfully",
//             data: testimonial,
//         });

//     } catch (error) {
//         await transaction.rollback();
//         console.error(error);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to create testimonial",
//             error: error.message,
//         });
//     }
// };


// Update a testimonial post with transaction and row locking
exports.updateTestimonial = async (req, res) => {
    const { ...updates } = req.body;
    const id = req.params.id;
    if (!id) {
        return res.status(400).json({ success:false, message: 'Please provide a testimonial id.' });
    }
    const t = await sequelize.transaction();
    try {
        const testimonial = await Testimonials.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE});
        if (!testimonial) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Testimonial not found.' });
        }
        const [updatedCount, [updatedTestimonial]] = await Testimonials.update(updates, { where: { id }, returning: true, transaction: t,});
        if (updatedCount === 0) {
            await t.rollback();
            return res.status(304).json({ success: false, message: 'Testimonial has no update!' });
        }
        await t.commit();
        return res.status(200).json({ success: true, message: 'Updated successfully.', data: updatedTestimonial,});
    } catch (error) {
        await t.rollback();
        console.error(error);
        return res.status(500).json({ success: false, message: 'Failed to update a testimonial.', error: error.message });
    }
};
      

// Delete a testimonial post with transaction support
exports.deleteTestimonial = async (req, res) => {
    const id = req.params.id;
    if (!id) {
        return res.status(400).json({ success:false, message: 'Please provide a testimonial id.' });
    }
    const t = await sequelize.transaction();
    try {
        const testimonial = await Testimonials.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE});
        if (!testimonial) {
            await t.rollback();
            return res.status(404).json({ error: "Testimonial not found" });
        }
        await testimonial.destroy({ transaction: t });
        await t.commit();
        return res.status(200).json({success:true, message: "Testimonial deleted successfully" });
    } catch (error) {
        await t.rollback();
        console.error(error)
        return res.status(500).json({ error: "Error deleting testimonial", details: error.message });
    }
};
