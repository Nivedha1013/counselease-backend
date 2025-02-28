const { DataTypes } = require("sequelize");
const { sequelize } = require("../models"); // ✅ Correct way to import Sequelize instance

module.exports = (sequelize, DataTypes) => { 
const session = sequelize.define("session", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    clientId: { type: DataTypes.UUID, allowNull: false },
    counsellorId: { type: DataTypes.UUID, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    startTime: { type: DataTypes.TIME, allowNull: false },
    endTime: { type: DataTypes.TIME, allowNull: false },
    status: { 
        type: DataTypes.ENUM("scheduled", "completed", "cancelled"), 
        allowNull: false, 
        defaultValue: "scheduled" 
    }
});

return session;
};