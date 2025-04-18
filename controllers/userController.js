const { Op } = require("sequelize");
const { sequelize, Users, Notifications } = require('../models/index');


// capitalize names
const capitalizeName = (name) => {
    return name.trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

// create a new user
exports.createUser = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    const t = await sequelize.transaction();
    try {
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields (firstName, lastName, email, password).',});
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address.',});
        }
        const existingUser = await Users.findOne({ where: { email: { [Op.iLike]: email }}, });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already in use.',});
        }
        // Capitalize first and last names before saving
        const formattedFirstName = capitalizeName(firstName);
        const formattedLastName = capitalizeName(lastName);
        const newUser = await Users.create(
            { firstName: formattedFirstName, lastName: formattedLastName, email, password, isConfirmed: true},  { transaction: t }
        );
        await t.commit();
        return res.status(201).json({ success: true, message: 'User created successfully.', data: newUser });
    } catch (error) {
        await t.rollback();
        console.error('Error creating user:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error.', error: error.message });
    }
};

//show a user
exports.show = async (req, res) => {
    try{
        const id = req.params?.id || req.user?.id;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Please provide a user Id.' });
        }
        const user = await Users.findByPk(id, {
          include: [
            { model: Notifications, as: 'notification'},
          ],
        });
        return res.status(200).json({success: true, data: user});
    }catch(error){
        console.error(error);
        return res.status(500).json({success: false, message:'Failed to show a user.', error:error.message});
    }
}


//show all users
exports.getAll = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;
    const userCount = await Users.count();
    const totalPages = Math.ceil(userCount / pageSize);
    const users = await Users.findAll({
      // where: {role: 'admin'},
      include: [
        { model: Notifications, as: 'notification'},
      ],
      offset: (pageNumber - 1) * pageSize,
      limit: pageSize,
      order: [['updatedAt', 'DESC']], 
    });
    return res.status(200).json({ 
      success: true, 
      data: users,
      pagination: { total: userCount, page: pageNumber, pageSize, totalPages,}
    });
  } catch (error) {
    console.error('error occurred', error);
    return res.status(500).json({ success: false,message: 'Failed to show all users.', error: error.message });
  }
};


// User profile update
exports.update = async (req, res, next) => {
  const { ...updates } = req.body;
  const id = req.params.id || req.user.id;
  if (!id) {
      return res.status(400).json({ message: 'Please provide a user Id.' });
  }
  if (req.user?.role === 'super-admin') {
    return res.status(400).json({ success: false, message: 'Can not edit the user with "admin" role.' });
  }
  const t = await sequelize.transaction();
  try {
    const user = await Users.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE});
    if (!user) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const [updatedCount, [updatedUser]] = await Users.update(updates, { where: { id }, returning: true, transaction: t,});
    if (updatedCount === 0) {
      await t.rollback();
      return res.status(304).json({ success: false, message: 'User has no update!' });
    }
    await t.commit();
    return res.status(200).json({ success: true, message: 'Updated successfully.', data: updatedUser,});
  } catch (error) {
    await t.rollback();
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};


// Delete user account
exports.deleteUser = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id = req.params.id || req.user.id;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Please provide a user Id.' });
    }
    if (req?.user?.role === 'super-admin') {
      return res.status(400).json({ success: false, message: 'Can not deleted the user with "admin" role.' });
    }
    const user = await Users.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'User not found or was deleted before.' });
    }
    await user.destroy({ transaction: t });
    if (req.user?.id && id === req.user.id) {
      res.clearCookie('token');
    }
    await t.commit();
    return res.status(204).json({success: true, message: 'User deleted successfully', });
  } catch (error) {
    await t.rollback();
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to delete a user.', error: error.message,});
  }
};
