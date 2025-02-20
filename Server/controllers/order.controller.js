import Stripe from "../config/stripe.js";
import CartProductModel from "../models/cartproduct.model.js";
import OrderModel from "../models/order.model.js";
import UserModel from "../models/user.model.js";
import mongoose from "mongoose";

// Cash On Delivery Order Controller
export async function CashOnDeliveryOrderController(request, response) {
    try {
        const userId = request.userId; // auth middleware 
        const { list_items, totalAmt, addressId, subTotalAmt } = request.body;

        // Prepare order payload
        const payload = list_items.map(el => ({
            userId: userId,
            orderId: `ORD-${new mongoose.Types.ObjectId()}`,
            productId: el.productId._id,
            product_details: {
                name: el.productId.name,
                image: el.productId.image,
            },
            paymentId: "",
            payment_status: "CASH ON DELIVERY",
            delivery_address: addressId,
            subTotalAmt: subTotalAmt,
            totalAmt: totalAmt,
        }));

        // Insert order into database
        const generatedOrder = await OrderModel.insertMany(payload);

        // Remove items from the cart
        await CartProductModel.deleteMany({ userId: userId });
        await UserModel.updateOne({ _id: userId }, { shopping_cart: [] });

        // Return success response
        return response.json({
            message: "Order successfully placed",
            error: false,
            success: true,
            data: generatedOrder,
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}

// Price calculation with discount function
export const priceWithDiscount = (price, dis = 1) => {
    const discountAmount = Math.ceil((Number(price) * Number(dis)) / 100);
    const actualPrice = Number(price) - discountAmount;
    return actualPrice;
}

// Payment Controller for Stripe
export async function paymentController(request, response) {
    try {
        const userId = request.userId; // auth middleware 
        const { list_items, totalAmt, addressId, subTotalAmt } = request.body;

        const user = await UserModel.findById(userId);

        // Prepare Stripe line items
        const lineItems = list_items.map(item => ({
            price_data: {
                currency: 'inr',
                product_data: {
                    name: item.productId.name,
                    images: item.productId.image,
                    metadata: {
                        productId: item.productId._id,
                    },
                },
                unit_amount: priceWithDiscount(item.productId.price, item.productId.discount) * 100,
            },
            adjustable_quantity: {
                enabled: true,
                minimum: 1,
            },
            quantity: item.quantity,
        }));

        // Parameters for creating Stripe session
        const params = {
            submit_type: 'pay',
            mode: 'payment',
            payment_method_types: ['card'],
            customer_email: user.email,
            metadata: {
                userId: userId,
                addressId: addressId,
            },
            line_items: lineItems,
            success_url: `${process.env.FRONTEND_URL}/success`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`,
        };

        // Create Stripe checkout session
        const session = await Stripe.checkout.sessions.create(params);

        return response.status(200).json(session);

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}

// Helper function to get order product items
const getOrderProductItems = async ({
    lineItems,
    userId,
    addressId,
    paymentId,
    payment_status,
}) => {
    const productList = [];

    if (lineItems?.data?.length) {
        for (const item of lineItems.data) {
            const product = await Stripe.products.retrieve(item.price.product);

            const payload = {
                userId: userId,
                orderId: `ORD-${new mongoose.Types.ObjectId()}`,
                productId: product.metadata.productId,
                product_details: {
                    name: product.name,
                    image: product.images,
                },
                paymentId: paymentId,
                payment_status: payment_status,
                delivery_address: addressId,
                subTotalAmt: Number(item.amount_total / 100),
                totalAmt: Number(item.amount_total / 100),
            };

            productList.push(payload);
        }
    }

    return productList;
}

// Stripe Webhook for Checkout Session Completed
export async function webhookStripe(request, response) {
    const event = request.body;
    const endPointSecret = process.env.STRIPE_ENPOINT_WEBHOOK_SECRET_KEY;

    console.log("Received event:", event);

    try {
        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                const lineItems = await Stripe.checkout.sessions.listLineItems(session.id);
                const userId = session.metadata.userId;
                const orderProduct = await getOrderProductItems({
                    lineItems: lineItems,
                    userId: userId,
                    addressId: session.metadata.addressId,
                    paymentId: session.payment_intent,
                    payment_status: session.payment_status,
                });

                // Insert the order into the database
                const order = await OrderModel.insertMany(orderProduct);
                console.log('Order processed:', order);

                // Clear cart items after successful order
                if (order && order[0]) {
                    await UserModel.findByIdAndUpdate(userId, { shopping_cart: [] });
                    await CartProductModel.deleteMany({ userId: userId });
                }
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
                break;
        }

        // Return success response to Stripe
        response.json({ received: true });

    } catch (error) {
        console.error('Webhook processing error:', error);
        response.status(500).json({ received: false });
    }
}

// Get Order Details Controller
export async function getOrderDetailsController(request, response) {
    try {
        const userId = request.userId; // auth middleware

        // Fetch user orders and sort them by creation date
        const orderList = await OrderModel.find({ userId: userId })
            .sort({ createdAt: -1 })
            .populate('delivery_address');

        return response.json({
            message: "Order list retrieved successfully",
            data: orderList,
            error: false,
            success: true,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}
