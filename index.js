// index.js
const { ApolloServer } = require('apollo-server-express');
const express = require('express');
const { typeDefs } = require('./schema');
const { resolvers } = require('./resolvers');
const jwt = require('jsonwebtoken');

const app = express();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const token = req.headers.authorization || '';
    return { token };
  },
});

server.start().then(res => {
  server.applyMiddleware({ app });

  app.listen({ port: 4000 }, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  );
});
