const { sequelize, Blogs } = require("../models"); // Sequelize instance
const cloudinary= require('../utils/cloudinary');
const streamifier = require('streamifier');

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
            order: [['updatedAt', 'DESC']],
        }); 
        return res.status(200).json({ 
            success: true, 
            data: blogs,
            pagination: { total: blogCount, page: pageNumber, pageSize, totalPages,}
        });
    } catch (error) {
        console.error(error)
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
        console.error(error)
        await transaction.rollback(); // Rollback on error
        return res.status(500).json({success:false, message: "Error fetching a blog", error: error.message });
    }
};  

// Get blogs for a specific user
exports.getBlogsForUser = async (req, res) => {
    const userId = req.user.id || req.params.id;
    if (!userId) {
        return res.status(400).json({ message: 'Please provide a blog Id.' });
    }
    try {
        const { page, limit } = req.query;
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = parseInt(limit, 10) || 10;
        const blogCount = await Blogs.count();
        const totalPages = Math.ceil(blogCount / pageSize);

        const blogs = await Blogs.findAll({
            where: { userId },
            offset: (pageNumber - 1) * pageSize,
            limit: pageSize,
            order: [['updatedAt', 'DESC']],
        });
        return res.status(200).json({ 
            success: true, 
            data: blogs,
            pagination: { total: blogCount, page: pageNumber, pageSize, totalPages,}
        });
    } catch (error) {
        console.error(error)
        return res.status(500).json({ success:false, error: "Error fetching blogs", details: error.message });
    }
}; 


// create
exports.createBlog = async (req, res) => {
    const { title, content, status, image } = req.body;
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
  
    // Validate required fields
    if (!userId || !title || !content) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }
  
    const transaction = await sequelize.transaction();
  
    try {
      // Prevent duplicate blog by the same user
      const existingBlog = await Blogs.findOne({ where: { title, content, userId }, transaction });
      if (existingBlog) {
        await transaction.rollback();
        return res.status(409).json({ success: false, message: "A blog with this title and content already exists for this author." });
      }
  
      let imageURL = null;
  
      // Upload to Cloudinary if image exists
      if (imageBuffer) {
        const streamUpload = () => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "Spa Blogs",
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
  
      const publishedAt = status === "published" ? new Date() : null;
  
      // Create blog
      const blog = await Blogs.create(
        {
          ...req.body,
          userId,
          publishedAt,
          imageURL,
        },
        { transaction }
      );
  
      await transaction.commit();
  
      return res.status(201).json({ success: true, message: "Blog created successfully", data: blog });
  
    } catch (error) {
      console.error(error);
      await transaction.rollback();
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
    } catch (error) {
        await t.rollback();
        console.error(error);
        return res.status(500).json({ success: false, message: 'Failed to update a blog.', error: error.message });
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
        await blog.destroy({ transaction: t });
        await t.commit();
        return res.status(200).json({success:true, message: "Blog deleted successfully" });
    } catch (error) {
        await t.rollback();
        console.error(error)
        return res.status(500).json({ error: "Error deleting blog", details: error.message });
    }
};
