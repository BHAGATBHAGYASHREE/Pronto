import mongoose from 'mongoose';

const customerAcquisitionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    source: {
        type: String,
        required: true,
    },
    salesPipeline: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalesPipeline', // Reference to SalesPipeline
    }
}, {
    timestamps: true,
});

const CustomerAcquisitionModel = mongoose.model('CustomerAcquisition', customerAcquisitionSchema);
export default CustomerAcquisitionModel;
