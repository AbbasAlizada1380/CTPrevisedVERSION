import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../Models/user.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const frontUrl = process.env.FRONT_URL;
import dotenv from "dotenv";
dotenv.config();
// ✅ Register new user
export const registerUser = async (req, res) => {
  try {
    const { fullname, email, password, role } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullname,
      email,
      password: hashedPassword,
      role: role || "user",
      isActive: true,
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) return res.status(404).json({ message: "User not found." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials." });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "fullname", "email", "role", "isActive", "createdAt"],
    });
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get single user
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: ["id", "fullname", "email", "role", "isActive"],
    });

    if (!user) return res.status(404).json({ message: "User not found." });
    res.json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullname, email, password, newPassword, currentPassword } =
      req.body;

    // Find user by ID
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found." });

    // Check if current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect." });
    }

    // Prepare updated data
    const updateData = {
      fullname: fullname || user.fullname,
      email: email || user.email,
    };

    // If new password provided, hash it
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // Update user
    await user.update(updateData);

    res.json({
      message: "User updated successfully.",
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Soft delete (deactivate user)
export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found." });

    await user.update({ isActive: false });
    res.json({ message: "User deactivated successfully." });
  } catch (err) {
    console.error("Error deactivating user:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Reactivate user
export const reactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found." });

    await user.update({ isActive: true });
    res.json({ message: "User reactivated successfully." });
  } catch (err) {
    console.error("Error reactivating user:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Change password
export const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Old password is incorrect." });

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedNewPassword });

    res.json({ message: "Password changed successfully." });
  } catch (err) {
    console.error("Error changing password:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    console.log(token);

    const user = await User.findOne({
      where: {
        resetToken: token,
        // resetExpires: { [Op.gt]: Date.now() },
      },
    });
    if (!user)
      return res.status(400).json({ message: "لینک نامعتبر یا منقضی است" });

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = null;
    user.resetExpires = null;
    await user.save();

    res.json({ message: "رمز عبور با موفقیت تغییر یافت" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطا در تغییر رمز عبور" });
  }
};

// controllers/authController.js

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user)
      return res.status(404).json({ message: "کاربری با این ایمیل یافت نشد" });

    // Generate token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetExpires = Date.now() + 3600000; // 1 hour

    user.resetToken = resetToken;
    user.resetExpires = resetExpires;
    await user.save();

    // Use FRONT_URL from .env
    const resetLink = `${process.env.FRONT_URL}/reset-password/${resetToken}`;

    // Check for credentials
    if (!process.env.EMAIL || !process.env.EMAIL_PASSWORD) {
      console.error("❌ Missing email credentials in .env file");
      return res.status(500).json({ message: "Email credentials not set" });
    }

    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: user.email,
      subject: "بازیابی رمز عبور",
      html: `<p>برای تنظیم رمز عبور جدید <a href="${resetLink}">اینجا کلیک کنید</a>.</p>`,
    });

    res.json({ message: "لینک بازیابی به ایمیل شما ارسال شد." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطا در ارسال لینک بازیابی" });
  }
};
