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
            allowNull: true,
            // unique: true,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        imageURL: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        publishedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM("Draft", "Published", "Archived"),
            allowNull: false,
            defaultValue: "Draft",
            validate: {
                isIn: [["Draft", "Published", "Archived"]],
            },
        },        
    },{
        timestamps: true,
    });
  
    Blog.associate = (models) => {
        Blog.belongsTo(models.Users, { foreignKey: 'userId', as: 'user' });
    };
  
    return Blog;
  };
  