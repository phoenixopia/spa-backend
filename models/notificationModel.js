module.exports = (sequelize, DataTypes) => {
    const Notification = sequelize.define('Notifications',
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
                },
                validate: {
                    notNull: { msg: 'User ID is required' },
                }
            },
            bookingId: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false,
                references: {
                    model: 'Bookings',
                    key: 'id'
                },
                validate: {
                    notNull: { msg: 'Booking ID is required' },
                }
            },
            message: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: { msg: 'Message cannot be empty' }
                }
            },
            type: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'Confirmation', 
            },
            status: {
                type: DataTypes.ENUM('Pending','Sent', 'Read', 'Archived', 'Failed'),
                allowNull: false,
                defaultValue: 'Sent',
                validate: {
                    notEmpty: { msg: 'Status cannot be empty' },
                }
            },
            isRead: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
        },
        {
            timestamps: true,
        }
    );
    Notification.associate = (models) => {
        Notification.belongsTo(models.Users, { foreignKey: 'userId', as: 'user' });
        Notification.belongsTo(models.Bookings, { foreignKey: 'bookingId', as: 'booking' });
    };

    return Notification;
};
