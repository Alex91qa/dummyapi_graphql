const { ApolloServer, AuthenticationError } = require('apollo-server-express');
const express = require('express');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Подгрузка переменных окружения из .env файла

const startServer = async () => {
  const app = express();

  // Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      // Логирование всех заголовков запроса для отладки
      console.log('Request Headers:', req.headers);

      const authHeader = req.headers.authorization || '';

      // Логирование заголовка Authorization
      console.log('Authorization Header:', authHeader);

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('Токен отсутствует или некорректен');
        throw new AuthenticationError('No authorization token provided');
      }
      
      const token = authHeader.split(' ')[1];
      try {
        // Использование секретного ключа из переменной окружения или резервного значения
        const secretKey = process.env.JWT_SECRET || '3n3sU4L7n29hS/DmNLmV8W+KyTwNRq5xXrJzT8xKXHg=';
        const user = jwt.verify(token, secretKey);

        // Логирование данных пользователя
        console.log('Пользователь верифицирован:', user);
        return { user };
      } catch (err) {
        console.error('Ошибка верификации токена:', err);
        throw new AuthenticationError('Invalid/Expired token');
      }
    },
    cache: 'bounded', // Защита от атак
  });

  await server.start();
  server.applyMiddleware({ app });

  // Запуск Express сервера
  const PORT = process.env.PORT || 4000;
  app.listen({ port: PORT }, () =>
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`)
  );
};

startServer();
