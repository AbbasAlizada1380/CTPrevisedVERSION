import express from "express";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getAllEmployees, // 👈 Import the missing function
} from "../../../Controllers/debt/employeeController.js";
import {validateEmployee} from "../../../middleware/validation.js"

const router = express.Router();

// ✅ IMPORTANT: Put specific routes BEFORE dynamic routes
router.get("/all", getAllEmployees); // 👈 Add this line for /all endpoint

router.route("/").post(validateEmployee, createEmployee).get(getEmployees);

router
  .route("/:id")
  .get(getEmployeeById)
  .put(validateEmployee, updateEmployee)
  .delete(deleteEmployee);

export default router;
