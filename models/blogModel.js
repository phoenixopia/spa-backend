module.exports = (sequelize, DataTypes) => {
    const Blog = sequelize.define("Blogs", {
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
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            // unique: true,
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        imageUrl: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM("draft", "published", "archived"),
            allowNull: false,
            defaultValue: "draft",
        },
        publishedAt: {
            type: DataTypes.DATE,
        },
    },{
        timestamps: true,
    });
  
    Blog.associate = (models) => {
        Blog.belongsTo(models.Users, { foreignKey: 'userId', as: 'user' });
        // Blog.belongsTo(models.Users, { foreignKey: "authorId", as: "author" });
    };
  
    return Blog;
  };
  