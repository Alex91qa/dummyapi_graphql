const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    age: Int!
    phoneNumber: String!
    address: String!
    role: String!
    referralCode: String
    createdAt: String
    createdBy: String
    status: String  # Добавляем поле status
  }

  type Query {
    getUser(id: ID!): User
  }

  type Mutation {
    createUser(
      name: String!
      email: String!
      age: Int!
      phoneNumber: String!
      address: String!
      role: String
      referralCode: String
    ): User
    
    updateUser(
      id: ID!
      name: String
      email: String
      age: Int
      phoneNumber: String
      address: String
      role: String
      referralCode: String
    ): User
  }
`;

module.exports = typeDefs;
