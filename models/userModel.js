const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ROLES = ['Super Admin', 'Admin', 'Customer', 'Content Manager'];
const { v4: uuidv4 } = require('uuid');
// const { PhoneNumberUtil, PhoneNumberFormat } = require('google-libphonenumber');
// const phoneUtil = PhoneNumberUtil.getInstance();

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('Users', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
        }, 
        firstName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
            set(value) {
                if (value) {
                this.setDataValue('email', value.toLowerCase());
                }
            },
        },
        phoneNumber: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
              is: /^\+?[1-9]\d{1,14}$/ // E.164 format validation
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
              len: [8, 100],
            },
        },      
        role: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Customer',
            // validate: {
            //     isIn: [ROLES],
            // },
        },    
        confirmationCode: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: () => uuidv4().replace(/-/g, '').slice(0, 6),
        },
        isConfirmed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        resetCode: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        userType: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'User',
        },
    },{
        timestamps: true,
    });

    // Hash password before creating or updating the user
    const hashPassword = async (user) => {
        if (user.password) {
        try {
            const salt = await bcryptjs.genSalt(10);
            user.password = await bcryptjs.hash(user.password, salt);
        } catch (error) {
            throw new Error('Error hashing password.');
        }
        }
    };
    // Hash password before user is created
    User.beforeCreate(hashPassword);
    // Hash password before user is updated (if password is changed)
    User.beforeSave(async (user) => {
        if (user.changed('password')) {
            await hashPassword(user);
        }
    });     
    // Compare entered password with stored password
    User.prototype.comparePassword = async function (enteredPassword) {
        return await bcryptjs.compare(enteredPassword, this.password);
    };
    // Generate JWT token
    User.prototype.getJwtToken = function () {
        return jwt.sign(
            { id: this.id, firstName: this.firstName, lastName: this.lastName, email: this.email, role: this.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '6h' }
        );
    };
    User.associate = models => {
        // console.log('Associating model with:', Object.keys(models)); // Debug
        // User.hasMany(models.Bookings, { foreignKey: 'userId', as: 'booking' });
        User.hasMany(models.Notifications, { foreignKey: 'userId', as: 'notification' });
        User.hasMany(models.Blogs, { foreignKey: 'userId', as: 'blog' });
        User.hasMany(models.Testimonials, { foreignKey: 'userId', as: 'testimonal' });
    };

    return User;
}