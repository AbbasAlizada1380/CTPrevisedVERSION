import express from 'express';
import {
  generateCompleteReport,
} from '../Controllers/reportController.js';

const ReportRoute = express.Router();
// Report routes
ReportRoute.get('/', generateCompleteReport);

export default ReportRoute;