import { Router } from 'express';
import { createDelivery, getDeliveriesForUser, updateDeliveryStatus } from '../controllers/delivery.controller.js';

const deliveryRouter = Router();

// Create a new delivery
deliveryRouter.post('/delivery', createDelivery);

// Get deliveries for a user
deliveryRouter.get('/delivery/:userId', getDeliveriesForUser);

// Update delivery status
deliveryRouter.put('/delivery/:id', updateDeliveryStatus);

export default deliveryRouter;
