module.exports = (sequelize, DataTypes) => {
    const Testimonial = sequelize.define("Testimonials", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
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
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        imageURL: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
    },{
        timestamps: true,
    });
        Testimonial.associate = (models) => {
            Testimonial.belongsTo(models.Users, { foreignKey: 'userId', as: 'user' });
            // Testimonial.belongsTo(models.Users, { foreignKey: "authorId", as: "author" });
        };
  
        return Testimonial;
  };
  