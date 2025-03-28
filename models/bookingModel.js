module.exports = (sequelize, DataTypes) => {
    const Booking = sequelize.define('Bookings',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false,
                primaryKey: true,
            },
            userId: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            serviceId: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false,
                references: {
                    model: 'Services',
                    key: 'id'
                }
            },
            bookingDatetime: {
                type: DataTypes.DATE,
                allowNull: false,
                validate: {
                    isDate: true,
                },
            },
            status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'pending',
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            payment_status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'unpaid',
            },
            payment_method: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'Cash',
            }
        },
        {
            timestamps: true,
        }
    );
    Booking.associate = (models) => {
        Booking.belongsTo(models.Users, { foreignKey: 'userId', as: 'user' });
        Booking.belongsTo(models.Services, { foreignKey: 'serviceId', as: 'service' });
        Booking.hasMany(models.Notifications, { foreignKey: 'bookingId', as: 'notification' });
    };
    return Booking;
};
