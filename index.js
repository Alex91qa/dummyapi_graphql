// index.js
const { ApolloServer } = require('apollo-server-express');
const express = require('express');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const jwt = require('jsonwebtoken');

const startServer = async () => {
  const app = express();

  // Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      // Извлечение токена из заголовков
      const token = req.headers.authorization || '';
      try {
        // Верификация JWT токена, если необходимо
        const user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        return { user };
      } catch (err) {
        console.log('Не удалось верифицировать токен:', err);
        return { user: null };
      }
    },
    cache: "bounded", // Рекомендация Apollo для защиты от атак
  });

  await server.start();
  server.applyMiddleware({ app });

  // Запуск Express сервера
  app.listen({ port: process.env.PORT || 4000 }, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  );
};

startServer();
