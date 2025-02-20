import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type ProductDetails {
    name: String
    image: [String]
  }

  type Order {
    userId: String
    orderId: String
    productId: String
    product_details: ProductDetails
    paymentId: String
    payment_status: String
    delivery_address: String
    subTotalAmt: Float
    totalAmt: Float
    invoice_receipt: String
    createdAt: String
    updatedAt: String
  }

  type OrderResponse {
    message: String
    error: Boolean
    success: Boolean
    data: [Order]
  }

  type Query {
    getOrderDetails(userId: String!): OrderResponse
  }

  type Mutation {
    cashOnDeliveryOrder(
      userId: String!
      list_items: [OrderItemInput!]!
      totalAmt: Float!
      addressId: String!
      subTotalAmt: Float!
    ): OrderResponse
    paymentOrder(
      userId: String!
      list_items: [OrderItemInput!]!
      totalAmt: Float!
      addressId: String!
      subTotalAmt: Float!
    ): String
  }

  input OrderItemInput {
    productId: String!
    quantity: Int!
  }
`;
