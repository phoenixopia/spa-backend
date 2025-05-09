module.exports = (sequelize, DataTypes) => {
    const Booking = sequelize.define('Bookings',
        {
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
            phoneNumber: {
                type: DataTypes.STRING,
                // unique: true,
                allowNull: false,
                validate: {
                  is: /^\+?[1-9]\d{1,14}$/ // E.164 format validation
                }
            },
            email: {
                type: DataTypes.STRING,
                allowNull: true,
                validate: {
                    isEmail: true,
                },
                set(value) {
                    if (value) {
                    this.setDataValue('email', value.toLowerCase());
                    }
                },
            },
            dateTime: {
                type: DataTypes.DATE,
                allowNull: false,
                validate: {
                  isDate: true,
                },
            },
            status: {
                type: DataTypes.ENUM("Pending", "Approved", "Rejected"),
                allowNull: false,
                defaultValue: "Pending",
                validate: {
                    isIn: [["Pending", "Approved", "Rejected"]],
                },
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            payment_status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'Unpaid',
            },
            payment_method: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'Cash',
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
        },
        {
            timestamps: true,
        }
    );
    Booking.associate = (models) => {
        // Booking.belongsTo(models.Users, { foreignKey: 'userId', as: 'user' });
        Booking.belongsTo(models.Services, { foreignKey: 'serviceId', as: 'service' });
        Booking.hasOne(models.Notifications, { foreignKey: "bookingId", as: 'notification', onDelete: "CASCADE" });
    };
    return Booking;
};
