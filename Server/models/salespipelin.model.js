import mongoose from 'mongoose';

const salesPipelineSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    stage: {
        type: String,
        enum: ['Lead', 'Prospect', 'Negotiation', 'Closed'],
        default: 'Lead',
    },
    expectedCloseDate: {
        type: Date,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['Active', 'Won', 'Lost'],
        default: 'Active',
    },
}, {
    timestamps: true,
});

const SalesPipelineModel = mongoose.model('SalesPipeline', salesPipelineSchema);
export default SalesPipelineModel;
