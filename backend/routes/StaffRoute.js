import express from "express";
import {
  createStaff,
  getStaffs,
  getStaffById,
  updateStaff,
  deleteStaff,
} from "../Controllers/staffController.js";

const StaffRoute = express.Router();

// CREATE
StaffRoute.post("/", createStaff);

// READ (all with pagination)
StaffRoute.get("/", getStaffs);

// READ (single)
StaffRoute.get("/:id", getStaffById);

// UPDATE
StaffRoute.put("/:id", updateStaff);

// DELETE
StaffRoute.delete("/:id", deleteStaff);

export default StaffRoute;
