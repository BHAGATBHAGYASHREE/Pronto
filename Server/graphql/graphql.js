import { ApolloServer, gql } from 'apollo-server-express';
import mongoose from 'mongoose';
import OrderModel from '../models/order.model.js';
import UserModel from '../models/user.model.js';
import ProductModel from '../models/product.model.js'; // Assuming a Product model exists
import CartProductModel from '../models/cartproduct.model.js'; // Assuming a CartProduct model exists

// Define the GraphQL Schema
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
    productId: Product!
    product_details: ProductDetails!
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


// Define the Resolvers
const resolvers = {
  Query: {
    getUserOrders: async (_, { userId }) => {
      return await OrderModel.find({ userId }).populate('productId').populate('delivery_address');
    },
    getUser: async (_, { userId }) => {
      return await UserModel.findById(userId);
    },
    getCartItems: async (_, { userId }) => {
      return await CartProductModel.find({ userId });
    },
    getProduct: async (_, { productId }) => {
      return await ProductModel.findById(productId);
    },
    getAllProducts: async () => {
      return await ProductModel.find();
    }
  },
  Mutation: {
    createOrder: async (_, { userId, listItems, addressId }) => {
      const cartItems = await CartProductModel.find({ userId }).where('_id').in(listItems.map(item => item.productId));

      const totalAmt = cartItems.reduce((sum, item) => sum + (item.productId.price * item.quantity), 0);

      const order = new OrderModel({
        userId,
        orderId: `ORD-${new mongoose.Types.ObjectId()}`,
        productId: listItems.map(item => item.productId),
        payment_status: "CASH ON DELIVERY",
        delivery_address: addressId,
        subTotalAmt: totalAmt,
        totalAmt: totalAmt
      });

      await order.save();
      return order;
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers
});

export default server;
