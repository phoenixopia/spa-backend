const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
    const SpaService = sequelize.define('Services',
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
            categoryId: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false,
                references: {
                    model: 'Categories',
                    key: 'id'
                }
            },
            price: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                validate: {
                    isDecimal: true,
                    min: 0,
                },
            },
            discount: {
                type: DataTypes.DECIMAL(5, 2),
                allowNull: true,
                validate: {
                    min: 0,
                    max: 100,
                },
            },
            duration: {
                type: DataTypes.INTEGER, // Duration in minutes
                allowNull: false,
                defaultValue: 30,
                validate: {
                    min: 1,
                },
            },
            status: {
                type: DataTypes.ENUM('Active', 'Inactive'),
                allowNull: false,
                defaultValue: 'Active',
            },
            imageURL: {
                type: DataTypes.STRING(500),
                allowNull: true
            },
        },
        {
            timestamps: true,
        }
    );
    SpaService.associate = (models) => {
        SpaService.hasMany(models.Bookings, { foreignKey: 'serviceId', as: 'booking', onDelete: 'CASCADE', hooks: true });
        SpaService.belongsTo(models.Categories, { foreignKey: 'categoryId', as: 'category' });
    };
    
    return SpaService;
};
