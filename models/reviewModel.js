const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
    const Review = sequelize.define('Reviews',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false,
                primaryKey: true,
            },
            rating: {
                type: DataTypes.INTEGER,
                allowNull: false,
                validate: {
                  notEmpty: true,
                  isIn: [[1, 2, 3, 4, 5]],
                },
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
            subject: {
                type: DataTypes.STRING(500),
                allowNull: true
            },
            message: {
                type: DataTypes.TEXT,
                allowNull: true
            },
        },
        {
            timestamps: true,
        }
    );
    
    return Review;
};
