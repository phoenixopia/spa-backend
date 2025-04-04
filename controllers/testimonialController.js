const { sequelize, Testimonials, Blogs } = require("../models"); // Sequelize instance


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
            order: [['createdAt', 'ASC']], 
        }); // Sorting by createdAt in ascending order
        return res.status(200).json({ 
            success: true, 
            data: testimonials,
            pagination: { total: testimonialCount, page: pageNumber, pageSize, totalPages,}
        });
    } catch (error) {
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
      await transaction.rollback(); // Rollback on error
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
        return res.status(500).json({ success:false, error: "Error fetching testimonials", details: error.message });
    }
}; 

//Create a new testimonial post with transaction support
exports.createTestimonial = async (req, res) => {
    const { title, content, tags, status } = req.body;
    const userId = req.user.id;
    if (!feedback || !rating || !userId) {
        return res.status(400).json({success: false, message: "Missing the equired fields." });
    }
    const transaction = await sequelize.transaction(); 
    try {
        const existingTestimonial = await Testimonials.findOne({ where: { title, content, userId }, transaction });
        if (existingTestimonial) {
            await transaction.rollback();
            return res.status(409).json({success: false, message: "A testimonial with this title and content already exists for this author" });
        }
        const publishedAt = (status === "published") ? new Date() : null;
        const testimonial = await Testimonials.create(
            { title, content, tags, status, userId, publishedAt}, 
            { transaction }
        );
        await transaction.commit();
        return res.status(201).json({ success: true, message: "Testimonial created successfully", data: testimonial });

    } catch (error) {
        await transaction.rollback(); // Rollback transaction on error
        return res.status(500).json({ success: false, message: "Failed to create testimonial", error: error.message });
    }
};

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
    } catch (err) {
        await t.rollback();
        console.log(err);
        return res.status(500).json({ success: false, message: 'Failed to update a testimonial.', error: err.message });
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
        await testimonial.destroy({ transaction });
        await t.commit();
        return res.status(200).json({success:true, message: "Testimonial deleted successfully" });
    } catch (error) {
        await t.rollback();
        return res.status(500).json({ error: "Error deleting testimonial", details: error.message });
    }
};
