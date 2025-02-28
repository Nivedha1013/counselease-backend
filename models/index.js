"use strict";

const fs = require("fs");
const path = require("path");
const { Sequelize } = require("sequelize");
const process = require("process");

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.json")[env];

const db = {};

// ✅ Initialize Sequelize
const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  dialectOptions: config.dialectOptions || {},
  logging: false, // Disable logging in production
});

// ✅ Import models
const User = require("./user")(sequelize, Sequelize);
const Session = require("./session")(sequelize, Sequelize);
const Availability = require("./Availability")(sequelize, Sequelize);

// ✅ Store models in the `db` object
db.User = User;
db.Session = Session;
db.Availability = Availability;

// ✅ Define relationships
User.hasMany(Session, { foreignKey: "clientId", as: "sessions" });
User.hasMany(Availability, { foreignKey: "counsellorId", as: "availabilities" });

Session.belongsTo(User, { foreignKey: "clientId", as: "client" });
Session.belongsTo(User, { foreignKey: "counsellorId", as: "counsellor" });

Availability.belongsTo(User, { foreignKey: "counsellorId", as: "counsellor" });

// ✅ Add Sequelize instance to `db` object
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
