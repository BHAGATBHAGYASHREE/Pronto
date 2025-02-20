import express from 'express';
import mongoose from 'mongoose';
import { ApolloServer, gql } from 'apollo-server-express';
import dotenv from 'dotenv';
import OrderModel from '../models/order.model.js';
import ProductModel from '../models/product.model.js';
import UserModel from '../models/user.model.js';
import CartProductModel from '../models/cartproduct.model.js'; // Assuming CartProduct model exists

dotenv.config();

const app = express();

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pronto';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch((error) => console.log('Error connecting to MongoDB:', error));

// GraphQL Schema
const typeDefs = gql`
    type Product {
        _id: ID!
        name: String!
        image: [String]
        price: Float
        discount: Int
    }

    type Order {
        _id: ID!
        userId: String!
        orderId: String!
        productId: [Product]!
        product_details: [ProductDetails]!
        paymentId: String
        payment_status: String!
        delivery_address: Address!
        subTotalAmt: Float!
        totalAmt: Float!
        createdAt: String!
    }

    type User {
        _id: ID!
        name: String!
        email: String!
        shopping_cart: [CartProduct]
    }

    type CartProduct {
        productId: Product!
        quantity: Int!
    }

    type Address {
        _id: ID!
        street: String
        city: String
        country: String
    }

    type ProductDetails {
        name: String!
        image: [String]
    }

    type Query {
        getUserOrders(userId: ID!): [Order]
        getUser(userId: ID!): User
        getCartItems(userId: ID!): [CartProduct]
        getProduct(productId: ID!): Product
        getAllProducts: [Product]
    }

    type Mutation {
        createOrder(userId: ID!, listItems: [CartProductInput]!, addressId: ID!): Order
    }

    input CartProductInput {
        productId: ID!
        quantity: Int!
    }
`;

// GraphQL Resolvers
const resolvers = {
    Query: {
        getUserOrders: async (_, { userId }) => {
            // Get all orders for a specific user, populate product and address details
            return await OrderModel.find({ userId }).populate('productId').populate('delivery_address');
        },
        getUser: async (_, { userId }) => {
            // Get user details
            return await UserModel.findById(userId);
        },
        getCartItems: async (_, { userId }) => {
            // Get all items in user's shopping cart
            return await CartProductModel.find({ userId });
        },
        getProduct: async (_, { productId }) => {
            // Get details of a specific product
            return await ProductModel.findById(productId);
        },
        getAllProducts: async () => {
            // Get all products
            return await ProductModel.find();
        }
    },
    Mutation: {
        createOrder: async (_, { userId, listItems, addressId }) => {
            // Fetch the cart items for the user
            const cartItems = await CartProductModel.find({ userId }).where('_id').in(listItems.map(item => item.productId));

            // Calculate total amount
            const totalAmt = cartItems.reduce((sum, item) => sum + (item.productId.price * item.quantity), 0);

            // Create a new order
            const order = new OrderModel({
                userId,
                orderId: `ORD-${new mongoose.Types.ObjectId()}`,
                productId: listItems.map(item => item.productId),
                payment_status: "CASH ON DELIVERY", // Can be adjusted based on payment methods
                delivery_address: addressId,
                subTotalAmt: totalAmt,
                totalAmt: totalAmt,
            });

            await order.save();

            // Return the created order
            return order;
        }
    }
};

// Apollo Server setup
const server = new ApolloServer({
    typeDefs,
    resolvers
});

// Apply Apollo Server middleware
server.start().then(() => {
    server.applyMiddleware({ app });

    // Start Express server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}/graphql`);
    });
});
