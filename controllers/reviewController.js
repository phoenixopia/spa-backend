const { sequelize, Services, Reviews } = require('../models/index');


// Create new
exports.createReview = async (req, res) => {
    try {
        const { email, rating, } = req.body;
        if(!email || !rating){
            return res.status(400).json({ success: false, message: 'Missing the required field.'});
        }
        const existingData = await Reviews.findOne({ where: { email , rating} });
        if (existingData) {
            return res.status(400).json({ success: false, message: `A review already exists.`});
        }
        const review = await Reviews.create(req.body);
        return res.status(201).json({ success: true, message: 'Category created successfully.', data: review });
    } catch (error) {
        console.error(error)
        return res.status(500).json({ success: false, message: 'An error occurred while creating the review.', error: error.message });
    }
};

// Get all
exports.getAllReview = async (req, res) => {
    try {
        const reviews = await Reviews.findAll();
        return res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        console.error(error)
        return res.status(500).json({ success: false, message: 'An error occurred while retrieving reviews.', error: error.message });
    }
};

// Get by id
exports.getReviewById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: "Please use an id" });
        }
        const review = await Reviews.findByPk(id,);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found.' });
        }
        return res.status(200).json({ success: true, data: review });
    } catch (error) {
        console.error(error)
        return res.status(500).json({ success: false, message: 'An error occurred while retrieving the review.', error: error.message });
    }
};

// Update
exports.updateReview = async (req, res) => {
    const { ...updates } = req.body;
    const id = req.params.id;
    if (!id) {
        return res.status(400).json({ message: 'Please provide id.' });
    }
    const t = await sequelize.transaction();
    try {
      const review = await Reviews.findByPk(id , { transaction: t, lock: t.LOCK.UPDATE });
      if (!review) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Review not found.' });
      }
      const [updatedCount, [updatedData]] = await Reviews.update(updates, { where: { id }, returning: true, transaction: t,});
      if (updatedCount === 0) {
        await t.rollback();
        return res.status(304).json({ success: false, message: `A Review with id '${id}' has no update!` });
      }
      await t.commit();
      return res.status(200).json({ success: true, message: 'Category updated successfully.', data: updatedData,});
    } catch (err) {
      await t.rollback();
      console.err(err);
      return res.status(500).json({ success: false, message: 'Unable to update a review.', error: err.message });
    }
};

// Delete
exports.deleteReview = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'Please provide id.' });
    }
    const t = await sequelize.transaction();
    try {
        // Lock the row to prevent simultaneous deletions
        const review = await Reviews.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
        if (!review) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Review not found.' });
        }
        await Reviews.destroy({ transaction: t });
        await t.commit();
        return res.status(200).json({ success: true, message: 'Review deleted successfully.' });
    } catch (error) {
        await t.rollback();
        console.error(error)
        return res.status(500).json({ success: false, message: 'An error occurred while deleting a review.', error: error.message });
    }
};

