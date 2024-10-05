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
      // Извлечение заголовка Authorization
      const authHeader = req.headers.authorization || '';
      
      // Проверка на наличие токена и его префикса
      if (!authHeader.startsWith('Bearer ')) {
        throw new Error('No authorization token provided');
      }
      
      const token = authHeader.split(' ')[1]; // Убираем префикс Bearer
      try {
        // Верификация JWT токена
        const user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        return { user };
      } catch (err) {
        console.log('Ошибка верификации токена:', err);
        throw new Error('Invalid/Expired token');
      }
    },
    cache: "bounded", // Защита от атак
  });

  await server.start();
  server.applyMiddleware({ app });

  // Запуск Express сервера
  app.listen({ port: process.env.PORT || 4000 }, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  );
};

startServer();
