const { DataTypes } = require("sequelize");
const config = require("../config/database");

const Availability = sequelize.define("Availability", {
    counsellorId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    startTime: {
        type: DataTypes.TIME,
        allowNull: false,
    },
    endTime: {
        type: DataTypes.TIME,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM("available", "busy"),
        defaultValue: "available",
    },
}, {
    timestamps: true,
});

module.exports = Availability;
