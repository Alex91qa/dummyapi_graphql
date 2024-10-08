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
    status: String
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
    
    deleteUser(id: ID!): User # Добавляем новый тип для удаления пользователя
  }
`;

module.exports = typeDefs;
