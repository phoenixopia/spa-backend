const { sequelize, Blogs } = require("../models"); // Sequelize instance


// Get all blogs with pagination
exports.getAllBlogs = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = parseInt(limit, 10) || 10;
        const blogCount = await Blogs.count();
        const totalPages = Math.ceil(blogCount / pageSize);

        const blogs = await Blogs.findAll({
            offset: (pageNumber - 1) * pageSize,
            limit: pageSize,
            order: [['createdAt', 'ASC']], 
        }); // Sorting by createdAt in ascending order
        return res.status(200).json({ 
            success: true, 
            data: blogs,
            pagination: { total: blogCount, page: pageNumber, pageSize, totalPages,}
        });
    } catch (error) {
        return res.status(500).json({ success:false, message: "Error fetching blogs", error: error.message });
    }
};

// Get a blog by ID
exports.getBlogById = async (req, res) => {
    const { id } = req.params;
    if (!id) {
      return res.status(404).json({ success: false, message: "Missing a blog id!" });
    }
    try {
      const blog = await Blogs.findByPk(id,);
      if (!blog) {
        return res.status(404).json({ success: false, message: "Blog not found." });
      }
      return res.status(200).json({ success:true, data: blog });
    } catch (error) {
      await transaction.rollback(); // Rollback on error
      return res.status(500).json({success:false, message: "Error fetching a blog", error: error.message });
    }
};  

// Get blogs for a specific user
exports.getUserBlogs = async (req, res) => {
    const id = req.user.id || req.params.userId;
    if (!id) {
        return res.status(400).json({ message: 'Please provide a blog Id.' });
    }
    try {
        const { page, limit } = req.query;
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = parseInt(limit, 10) || 10;
        const blogCount = await Blogs.count();
        const totalPages = Math.ceil(blogCount / pageSize);

        const blogs = await Blogs.findAll({
            where: { userId: id },
            offset: (pageNumber - 1) * pageSize,
            limit: pageSize,
            order: [['createdAt', 'ASC']], 
        }); // Sorting by createdAt in ascending order
        return res.status(200).json({ 
            success: true, 
            data: blogs,
            pagination: { total: blogCount, page: pageNumber, pageSize, totalPages,}
        });
    } catch (error) {
        return res.status(500).json({ success:false, error: "Error fetching blogs", details: error.message });
    }
}; 

//Create a new blog post with transaction support
exports.createBlog = async (req, res) => {
    const { title, content, tags, status } = req.body;
    const userId = req.user.id;
    if (!title || !content || !userId) {
        return res.status(400).json({success: false, message: "Missing the equired fields." });
    }
    const transaction = await sequelize.transaction(); 
    try {
        const existingBlog = await Blogs.findOne({ where: { title, content, userId }, transaction });
        if (existingBlog) {
            await transaction.rollback();
            return res.status(409).json({success: false, message: "A blog with this title and content already exists for this author" });
        }
        const publishedAt = (status === "published") ? new Date() : null;
        const blog = await Blogs.create(
            { title, content, tags, status, userId, publishedAt}, 
            { transaction }
        );
        await transaction.commit();
        return res.status(201).json({ success: true, message: "Blog created successfully", data: blog });

    } catch (error) {
        await transaction.rollback(); // Rollback transaction on error
        return res.status(500).json({ success: false, message: "Failed to create blog", error: error.message });
    }
};

// Update a blog post with transaction and row locking
exports.updateBlog = async (req, res) => {
    const { ...updates } = req.body;
    const id = req.params.id;
    if (!id) {
        return res.status(400).json({ success:false, message: 'Please provide a blog id.' });
    }
    const t = await sequelize.transaction();
    try {
        const blog = await Blogs.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE});
        if (!blog) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Blog not found.' });
        }
        const [updatedCount, [updatedBlog]] = await Blogs.update(updates, { where: { id }, returning: true, transaction: t,});
        if (updatedCount === 0) {
            await t.rollback();
            return res.status(304).json({ success: false, message: 'Blog has no update!' });
        }
        await t.commit();
        return res.status(200).json({ success: true, message: 'Updated successfully.', data: updatedBlog,});
    } catch (err) {
        await t.rollback();
        console.log(err);
        return res.status(500).json({ success: false, message: 'Failed to update a blog.', error: err.message });
    }
};
      

// Delete a blog post with transaction support
exports.deleteBlog = async (req, res) => {
    const id = req.params.id;
    if (!id) {
        return res.status(400).json({ success:false, message: 'Please provide a blog id.' });
    }
    const t = await sequelize.transaction();
    try {
        const blog = await Blogs.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE});
        if (!blog) {
            await t.rollback();
            return res.status(404).json({ error: "Blog not found" });
        }
        await blog.destroy({ transaction });
        await t.commit();
        return res.status(200).json({success:true, message: "Blog deleted successfully" });
    } catch (error) {
        await t.rollback();
        return res.status(500).json({ error: "Error deleting blog", details: error.message });
    }
};
