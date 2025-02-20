import axios from 'axios'; // Import axios to make the HTTP request
import DeliveryModel from '../models/deilvery.model.js';
import OrderModel from "../models/order.model.js";
import { Client } from '@googlemaps/google-maps-services-js';
import mongoose from 'mongoose';

const googleMapsClient = new Client({});

export const createDelivery = async (req, res) => {
    try {
        const { orderId, deliveryAddress, estimatedDeliveryTime, deliveryCost, additionalField } = req.body;

        // Convert orderId (string) to ObjectId without validation check
        const orderObjectId =  new mongoose.Types.ObjectId(orderId);

        // Check if the order exists in the database
        const order = await OrderModel.findById(orderObjectId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Assuming Google Maps API is being used to calculate the optimized route
        const route = await googleMapsClient.directions({
            origin: order.address,  // Assuming order has a saved address
            destination: deliveryAddress,
            travelMode: 'DRIVING',
        });

        const optimizedRoute = route.data.routes[0].legs[0].steps.map(step => step.end_location);

        // Create a new delivery record
        const newDelivery = await DeliveryModel.create({
            orderId: orderObjectId,
            deliveryAddress,
            estimatedDeliveryTime,
            deliveryCost,
            optimizedRoute,
            additionalField,
        });

        res.status(201).json(newDelivery);
    } catch (error) {
        console.error('Error in createDelivery:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getDeliveriesForUser = async (req, res) => {
    try {
        const { orderId } = req.params;
        const deliveries = await DeliveryModel.find({ orderId: orderId }).populate("user", "name email");
        res.status(200).json(deliveries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateDeliveryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { deliveryStatus, actualDeliveryTime } = req.body;

        const updatedDelivery = await DeliveryModel.findByIdAndUpdate(
            id,
            { deliveryStatus, actualDeliveryTime },
            { new: true }
        );

        if (!updatedDelivery) {
            return res.status(404).json({ message: "Delivery not found" });
        }

        res.status(200).json(updatedDelivery);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
