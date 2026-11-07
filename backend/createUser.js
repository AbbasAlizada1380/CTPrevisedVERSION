import readline from "readline";
import bcrypt from "bcryptjs";
import sequelize from "./dbconnection.js";
import User from "./Models/user.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query) => {
  return new Promise((resolve) => rl.question(query, resolve));
};

const createUser = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully.");

    const fullname = await askQuestion("Full name: ");
    const email = await askQuestion("Email: ");
    const password = await askQuestion("Password: ");
    const role = await askQuestion("Role (admin/reception): ");

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullname,
      email,
      password: hashedPassword,
      role: role || "user",
      isActive: true,
    });

    console.log("\n✅ User created successfully!");
    console.log(`👤 Name: ${user.fullname}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🧩 Role: ${user.role}`);
  } catch (error) {
    console.error("❌ Error creating user:", error.message);
  } finally {
    rl.close();
    await sequelize.close();
  }
};

createUser();
