import CustomerAcquisitionModel from '../models/customeracquisition.model.js';
import SalesPipelineModel from '../models/salespipelin.model.js';

// Add a new customer to the acquisition pipeline
export const addCustomer = async (req, res) => {
    try {
        const { name, email, phone, source } = req.body;

        const newCustomer = new CustomerAcquisitionModel({
            name,
            email,
            phone,
            source,
        });

        await newCustomer.save();

        res.status(201).json({ message: 'Customer added successfully', customer: newCustomer });
    } catch (error) {
        res.status(500).json({ message: 'Error adding customer', error: error.message });
    }
};

// Move customer to sales pipeline
export const moveToSalesPipeline = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, expectedCloseDate } = req.body;

        const customer = await CustomerAcquisitionModel.findById(id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Create a new pipeline entry
        const newPipeline = new SalesPipelineModel({
            customer: customer._id,
            amount,
            expectedCloseDate,
        });

        await newPipeline.save();

        // Link pipeline to the customer
        customer.salesPipeline = newPipeline._id;
        await customer.save();

        res.status(200).json({ message: 'Customer moved to sales pipeline', pipeline: newPipeline });
    } catch (error) {
        res.status(500).json({ message: 'Error moving customer to pipeline', error: error.message });
    }
};

// Get all customers in the acquisition process
export const getAllCustomers = async (req, res) => {
    try {
        const customers = await CustomerAcquisitionModel.find().populate('salesPipeline');
        res.status(200).json(customers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching customers', error: error.message });
    }
};
