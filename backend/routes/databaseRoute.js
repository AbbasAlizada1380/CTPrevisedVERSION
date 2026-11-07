import express from 'express';
import { exportDatabase, importDatabase } from '../controllers/databaseController.js';
// import { authenticate, isAdmin } from '../middleware/auth.js'; // optional

const databaseRoute = express.Router();

// Export – GET request triggers download
databaseRoute.get('/export',  exportDatabase);

// Import – POST request with multipart/form-data
databaseRoute.post('/import',  importDatabase);

export default databaseRoute;