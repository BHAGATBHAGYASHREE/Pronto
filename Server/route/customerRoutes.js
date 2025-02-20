// routes/customerRouter.js
import { Router } from 'express';
import { addCustomer, moveToSalesPipeline, getAllCustomers } from '../controllers/customerController.js';

const customerRouter = Router();

// Add a new customer to the acquisition pipeline
customerRouter.post('/customer', addCustomer);

// Move customer to sales pipeline
customerRouter.post('/customer/:id/sales-pipeline', moveToSalesPipeline);

// Get all customers in the acquisition process
customerRouter.get('/customers', getAllCustomers);

export default customerRouter;
