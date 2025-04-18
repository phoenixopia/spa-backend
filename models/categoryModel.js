const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
    const Category = sequelize.define('Categories',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    notEmpty: true,
                    len: [3, 100],
                },
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            imageURL: {
                type: DataTypes.STRING(500),
                allowNull: true
            },
            status: {
                type: DataTypes.ENUM('Created', 'Archived'),
                allowNull: false,
                defaultValue: 'Created',
                validate: {
                    notEmpty: { msg: 'Status cannot be empty' },
                }
            }
        },
        {
            timestamps: true,
        }
    );
    Category.associate = (models) => {
        Category.hasMany(models.Services, { foreignKey: 'categoryId', as: 'service' });
    };
    
    return Category;
};
