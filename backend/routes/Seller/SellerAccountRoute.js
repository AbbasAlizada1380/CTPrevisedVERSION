import express from 'express';
import {
  createSellerAccount,
  getAllSellerAccounts as getSellerAccounts,  // alias to match route name
  getSellerAccountById,
  updateSellerAccount,
  deleteSellerAccount,
  getSellersWithUnpaidFactors, // alias to match route
  // The following functions are not yet exported in your controller – implement them or comment routes
  // getSellerSellsFromTotal,
  // getSellerSellsDateRange,
  // getSellerSellsByType,
} from '../../Controllers/Seller/SellerAccountController.js';

const SellerAccountRoute = express.Router();

// ----- Specific routes (must come before generic /:id or /:sellerId routes) -----

// 1. Get all sellers with unpaid debt (no sellerId param)
SellerAccountRoute.get('/debt', getSellersWithUnpaidFactors);

// 2. Get seller sells by date range (two query params: from, to)
//    TODO: Implement getSellerSellsDateRange in controller, then uncomment
// SellerAccountRoute.get('/seller/:sellerId/date_range', getSellerSellsDateRange);

// 3. Get seller sells filtered by type: all, paid, unpaid
//    TODO: Implement getSellerSellsByType in controller, then uncomment
// SellerAccountRoute.get('/seller/:sellerId/:type', getSellerSellsByType);

// 4. Get all sells (incomes) for a seller (from its total factors list)
//    TODO: Implement getSellerSellsFromTotal in controller, then uncomment
// SellerAccountRoute.get('/seller/:sellerId', getSellerSellsFromTotal);

// ----- Standard CRUD routes (with /:id that must come after specific ones) -----

// Get all seller accounts (with pagination & optional sellerId filter)
SellerAccountRoute.get('/', getSellerAccounts);

// Get a single seller account by its own ID (not sellerId)
SellerAccountRoute.get('/:id', getSellerAccountById);

// Create new seller account
SellerAccountRoute.post('/create', createSellerAccount);

// Update seller account by its ID
SellerAccountRoute.put('/:id', updateSellerAccount);

// Delete seller account by its ID
SellerAccountRoute.delete('/:id', deleteSellerAccount);

export default SellerAccountRoute;