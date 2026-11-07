// routes/factorRouter.js
import express from 'express';
import {
  getAllFactors,
  getFactorById,
  getFactorsByDateRange,
  getFactorsBySeller
} from '../../Controllers/Finance/FactorController.js';

const FactorRouter = express.Router();

// GET all factors (with pagination)
FactorRouter.get('/', getAllFactors);

// GET factor by ID
FactorRouter.get('/:id', getFactorById);

// GET factors by date range (query params: from, to, sellerId optional)
FactorRouter.get('/range', getFactorsByDateRange);

// GET factors by seller ID
FactorRouter.get('/seller/:sellerId', getFactorsBySeller);

export default FactorRouter;