const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');

// Определение схемы GraphQL
const typeDefs = gql`
  type Query {
    hello: String
  }
`;

// Определение резолверов
const resolvers = {
  Query: {
    hello: () => 'Hello world!',
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  persistedQueries: {
    cache: "bounded" // Ограниченное кэширование для безопасности
  }
});

// Создание приложения Express
const app = express();
server.start().then(res => {
  server.applyMiddleware({ app });

  // Запуск сервера
  app.listen({ port: process.env.PORT || 4000 }, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  );
});
