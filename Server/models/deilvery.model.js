import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema({
    deliveryId: {
        type: String,
        required: true,
        unique: true,
    },
    orderId: {
        type: String,
        required: true,
        ref: "OrderModel",
    },
    deliveryAgentId: {
        type: String,
        required: true,
    },
    deliveryStatus: {
        type: String,
        enum: ["Pending", "In Progress", "Delivered", "Cancelled"],
        default: "Pending",
    },
    deliveryAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AddressModel",
        required: true,
    },
    totalAmt: {
        type: Number,
        required: true,
    },
}, {
    timestamps: true,
});

const DeliveryModel = mongoose.model("DeliveryModel", deliverySchema);
export default DeliveryModel;
