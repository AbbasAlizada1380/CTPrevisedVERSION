


import express from "express";
import {
  getAllSellers,
  getActiveSellers,
  getSellerById,
  createSeller,
  updateSeller,
  deactivateSeller,
  deleteSeller,
} from "../../Controllers/Seller/SellerController.js"; // adjust path as needed

const SellerRoute = express.Router();

// GET /seller – all sellers (paginated)
SellerRoute.get("/", getAllSellers);

// GET /seller/active – only active sellers
SellerRoute.get("/active", getActiveSellers);

// GET /seller/:id – single seller
SellerRoute.get("/:id", getSellerById);

// POST /seller – create new seller
SellerRoute.post("/", createSeller);

// PUT /seller/:id – update seller
SellerRoute.put("/:id", updateSeller);

// PATCH /seller/:id/deactivate – soft delete (set isActive false)
SellerRoute.patch("/:id/deactivate", deactivateSeller);

// DELETE /seller/:id – hard delete (permanent)
SellerRoute.delete("/:id", deleteSeller);

export default SellerRoute;
