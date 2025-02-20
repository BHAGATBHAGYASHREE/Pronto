import mongoose from "mongoose";
import OrderModel from "../models/order.model";
import CartProductModel from "../models/cartproduct.model";
import UserModel from "../models/user.model";
import { pricewithDiscount } from "../controllers/paymentController";
import Stripe from "../config/stripe.js";

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
};

export const resolvers = {
  Query: {
    async getOrderDetails(_, { userId }) {
      try {
        const orderList = await OrderModel.find({ userId: userId })
          .sort({ createdAt: -1 })
          .populate('delivery_address');
        
        return {
          message: "Order list fetched successfully",
          data: orderList,
          error: false,
          success: true,
        };
      } catch (error) {
        return {
          message: error.message || error,
          error: true,
          success: false,
          data: [],
        };
      }
    },
  },
  
  Mutation: {
    async cashOnDeliveryOrder(_, { userId, list_items, totalAmt, addressId, subTotalAmt }) {
      try {
        const payload = list_items.map(el => ({
          userId: userId,
          orderId: `ORD-${new mongoose.Types.ObjectId()}`,
          productId: el.productId,
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

        const generatedOrder = await OrderModel.insertMany(payload);
        
        await CartProductModel.deleteMany({ userId: userId });
        await UserModel.updateOne({ _id: userId }, { shopping_cart: [] });

        return {
          message: "Order placed successfully",
          error: false,
          success: true,
          data: generatedOrder,
        };
      } catch (error) {
        return {
          message: error.message || error,
          error: true,
          success: false,
          data: [],
        };
      }
    },
    
    async paymentOrder(_, { userId, list_items, totalAmt, addressId, subTotalAmt }) {
      try {
        const user = await UserModel.findById(userId);
        
        const line_items = list_items.map(item => ({
          price_data: {
            currency: 'inr',
            product_data: {
              name: item.productId.name,
              images: item.productId.image,
              metadata: {
                productId: item.productId,
              },
            },
            unit_amount: pricewithDiscount(item.productId.price, item.productId.discount) * 100,
          },
          adjustable_quantity: { enabled: true, minimum: 1 },
          quantity: item.quantity,
        }));

        const params = {
          submit_type: 'pay',
          mode: 'payment',
          payment_method_types: ['card'],
          customer_email: user.email,
          metadata: {
            userId: userId,
            addressId: addressId,
          },
          line_items,
          success_url: `${process.env.FRONTEND_URL}/success`,
          cancel_url: `${process.env.FRONTEND_URL}/cancel`,
        };

        const session = await Stripe.checkout.sessions.create(params);
        return session.id;
      } catch (error) {
        throw new Error(error.message || error);
      }
    },
  },
};
