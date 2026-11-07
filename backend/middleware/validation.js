import { body, validationResult } from "express-validator";

// Employee validation - Updated to match model (removed salary and hireDate)
export const validateEmployee = [
  body("fullName")
    .notEmpty()
    .withMessage("نام مکمل ضروری است")
    .isLength({ min: 3, max: 100 })
    .withMessage("نام باید بین ۳ تا ۱۰۰ حرف باشد"),

  body("phone")
    .notEmpty()
    .withMessage("شماره تماس ضروری است")
    .matches(/^[0-9+\-\s]+$/)
    .withMessage("شماره تماس معتبر نیست"),

  body("position")
    .notEmpty()
    .withMessage("وظیفه ضروری است")
    .isLength({ min: 2, max: 100 })
    .withMessage("وظیفه باید بین ۲ تا ۱۰۰ حرف باشد"),

  // ✅ Salary and hireDate validations removed - they don't exist in the model

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    next();
  },
];

// Loan validation (no changes needed)
export const validateLoan = [
  body("employeeId")
    .notEmpty()
    .withMessage("آی دی کارمند ضروری است")
    .isInt()
    .withMessage("آی دی کارمند باید عدد باشد"),

  body("amount")
    .notEmpty()
    .withMessage("مقدار قرضه ضروری است")
    .isFloat({ min: 1 })
    .withMessage("مقدار قرضه باید بیشتر از ۰ باشد"),

  body("loanDate")
    .notEmpty()
    .withMessage("تاریخ قرضه ضروری است")
    .isDate()
    .withMessage("تاریخ معتبر نیست"),

  body("description")
    .optional()
    .isString()
    .withMessage("توضیحات باید متن باشد")
    .isLength({ max: 500 })
    .withMessage("توضیحات نمی‌تواند بیشتر از ۵۰۰ حرف باشد"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    next();
  },
];

// Payment validation (no changes needed)
export const validatePayment = [
  body("loanId")
    .notEmpty()
    .withMessage("آی دی قرضه ضروری است")
    .isInt()
    .withMessage("آی دی قرضه باید عدد باشد"),

  body("amount")
    .notEmpty()
    .withMessage("مقدار پرداخت ضروری است")
    .isFloat({ min: 0.01 })
    .withMessage("مقدار پرداخت باید بیشتر از ۰ باشد"),

  body("paymentDate")
    .notEmpty()
    .withMessage("تاریخ پرداخت ضروری است")
    .isDate()
    .withMessage("تاریخ معتبر نیست"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    next();
  },
];
