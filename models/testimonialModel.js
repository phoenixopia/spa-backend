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
        feedback: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        rating: {
            type: DataTypes.INTEGER, // Example: 1-5 stars
            allowNull: false,
            defaultValue: 1,
            validate: { min: 1, max: 5 },
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
  