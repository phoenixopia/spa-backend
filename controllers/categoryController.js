const { sequelize,Categories } = require('../models/index');
const { Op } = require('sequelize');
const streamifier = require('streamifier');


// create new
exports.createCategory = async (req, res) => {
    const { name, image } = req.body;
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
    if (!userId || !name) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }
  
    const transaction = await sequelize.transaction();
  
    try {
      // Prevent duplicate category by the same user
      const existingCategory = await Categories.findOne({ where: { name, userId }, transaction });
      if (existingCategory) {
        await transaction.rollback();
        return res.status(409).json({ success: false, message: "A category with this name already exists for this user." });
      }
  
      let imageURL = null;
  
      // Upload to Cloudinary if image exists
      if (imageBuffer) {
        const streamUpload = () => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "Spa Categories",
                width: 800,
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
  
      // Create category
      const category = await Categories.create(
        {
         ...req.body,
          userId,
          imageURL,
        },
        { transaction }
      );
  
      await transaction.commit();
  
      return res.status(201).json({ success: true, message: "Category created successfully", data: category });
  
    } catch (error) {
      console.error(error);
      await transaction.rollback();
      return res.status(500).json({ success: false, message: "Failed to create category", error: error.message });
    }
};  



// Get all
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Categories.findAll({
            where: {status: { [Op.notIn]: ["Archived"] }},
            order: [['updatedAt', 'DESC']],
        });
        return res.status(200).json({ success: true, data: categories });
    } catch (error) {
        console.error(error)
        return res.status(500).json({ success: false, message: 'An error occurred while retrieving categories.', error: error.message });
    }
};

// Get by id
exports.getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: "Please use an id" });
        }
        const category = await Categories.findByPk(id,);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found.' });
        }
        return res.status(200).json({ success: true, data: category });
    } catch (error) {
        console.error(error)
        return res.status(500).json({ success: false, message: 'An error occurred while retrieving the category.', error: error.message });
    }
};

// Update
exports.updateCategory = async (req, res) => {
    const { ...updates } = req.body;
    const id = req.params.id;
    if (!id) {
        return res.status(400).json({ message: 'Please provide a categoryId.' });
    }
    const t = await sequelize.transaction();
    try {
      const category = await Categories.findByPk(id , { transaction: t, lock: t.LOCK.UPDATE });
      if (!category) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Category not found.' });
      }
      const [updatedCount, [updatedCategory]] = await Categories.update(updates, { where: { id }, returning: true, transaction: t,});
      if (updatedCount === 0) {
        await t.rollback();
        return res.status(304).json({ success: false, message: `A category with id '${id}' has no update!` });
      }
      await t.commit();
      return res.status(200).json({ success: true, message: 'Category updated successfully.', data: updatedCategory,});
    } catch (err) {
      await t.rollback();
      console.err(err);
      return res.status(500).json({ success: false, message: 'Unable to update a category.', error: err.message });
    }
};

// Delete
exports.deleteCategory = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'Please provide a categoryId.' });
    }
    const t = await sequelize.transaction();
    try {
        // Lock the row to prevent simultaneous deletions
        const category = await Categories.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
        if (!category) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Category not found.' });
        }
        category.status = "Archived";
        await category.save();
        // await category.destroy({ transaction: t });
        await t.commit();
        return res.status(200).json({ success: true, message: 'Category deleted successfully.' });
    } catch (error) {
        await t.rollback();
        console.error(error)
        return res.status(500).json({ success: false, message: 'An error occurred while deleting a category.', error: error.message });
    }
};

