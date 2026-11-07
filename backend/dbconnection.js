import { Sequelize } from "sequelize";

const sequelize = new Sequelize("gharbctp1.0.0", "root", "newapp", {
  host: "localhost",
  port: 3306,
  dialect: "mysql",
  logging: console.log, // Enable logging to see connection attempts
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  retry: {
    max: 3,
  },
});

// Test connection
try {
  await sequelize.authenticate();
  console.log("Database connection established successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

export default sequelize;


// import { Sequelize } from "sequelize";

// const sequelize = new Sequelize("hzcitycenter_ctpdb", "hzcitycenter_ctp_root", "VmU*XE8vG(EZLq.o", {
//   host: "localhost",
//   port: 3306,
//   dialect: "mysql",
//   logging: console.log,
//   pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
//   retry: { max: 3 },
// });

// async function testConnection() {
//   try {
//     await sequelize.authenticate();
//     console.log("Database connection established successfully.");
//   } catch (error) {
//     console.error("Unable to connect to the database:", error);
//   }
// }

// testConnection(); // تابع async را اجرا می‌کنیم

// export default sequelize;
