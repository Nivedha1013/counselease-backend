const { DataTypes } = require("sequelize");
const sequelize = require("../models"); 

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define("User", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: true},
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { 
        type: DataTypes.ENUM("admin", "counsellor", "client"), 
        allowNull: false, 
        defaultValue: "client" 
    }
});

return User;
};
