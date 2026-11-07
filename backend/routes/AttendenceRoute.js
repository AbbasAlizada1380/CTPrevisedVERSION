import express from "express";
import {
  createAttendance,
  getAttendances,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
  getAttendancesByDateRange,
} from "../Controllers/AttendenceController.js";

const AttendenceRoute = express.Router();

AttendenceRoute.post("/", createAttendance);
AttendenceRoute.get("/date-range", getAttendancesByDateRange);
AttendenceRoute.get("/", getAttendances);
AttendenceRoute.get("/:id", getAttendanceById);
AttendenceRoute.put("/:id", updateAttendance);
AttendenceRoute.delete("/:id", deleteAttendance);

export default AttendenceRoute;
