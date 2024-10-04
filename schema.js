// schema.js
const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Query {
    hello: String
  }

  type Mutation {
    createUser(
      name: String!,
      email: String!,
      age: Int!,
      phoneNumber: String!,
      address: String!,
      role: String,
      referralCode: String
    ): User
  }

  type User {
    id: ID!
    name: String!
    email: String!
    age: Int!
    phoneNumber: String!
    address: String!
    role: String
    referralCode: String
    status: String
  }
`;

module.exports = typeDefs;
