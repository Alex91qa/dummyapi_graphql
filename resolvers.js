const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const { ApolloError, AuthenticationError } = require('apollo-server-express');

const client = new MongoClient(process.env.MONGODB_URI);

const resolvers = {
  Query: {
    getUser: async (_, { id }, { user }) => {
      // Проверка на наличие пользователя в контексте
      if (!user) {
        throw new AuthenticationError('No authorization token provided');
      }

      await client.connect();
      const db = client.db(process.env.DB_NAME);
      const usersCollection = db.collection('users');

      let objectId;
      try {
        objectId = new ObjectId(id);
      } catch (e) {
        throw new ApolloError('Invalid User ID format', 'INVALID_ID');
      }

      const foundUser = await usersCollection.findOne({ _id: objectId });

      if (!foundUser) {
        throw new ApolloError('User not found', 'USER_NOT_FOUND');
      }

      await client.close();

      return {
        id: foundUser._id.toString(),
        name: foundUser.name,
        email: foundUser.email,
        age: foundUser.age,
        phoneNumber: foundUser.phoneNumber,
        address: foundUser.address,
        role: foundUser.role,
        referralCode: foundUser.referralCode,
        createdAt: foundUser.createdAt,
        createdBy: foundUser.createdBy,
      };
    },
  },
  Mutation: {
    createUser: async (_, { name, email, age, phoneNumber, address, role, referralCode }, { user }) => {
      // Проверка на наличие пользователя в контексте
      if (!user) {
        throw new AuthenticationError('No authorization token provided');
      }

      await client.connect();
      const db = client.db(process.env.DB_NAME);
      const usersCollection = db.collection('users');

      // Валидация данных
      if (!name || name.length < 3) {
        throw new ApolloError('Invalid name: it must be at least 3 characters long', 'INVALID_NAME');
      }

      const emailPattern = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
      if (!emailPattern.test(email)) {
        throw new ApolloError('Invalid email address', 'INVALID_EMAIL');
      }

      if (age < 18 || age > 150) {
        throw new ApolloError('Invalid age: it must be between 18 and 150', 'INVALID_AGE');
      }

      const phoneNumberPattern = /^\+\d{1,3}\d{7,10}$/;
      if (!phoneNumberPattern.test(phoneNumber)) {
        throw new ApolloError('Invalid phone number', 'INVALID_PHONE');
      }

      if (address.length < 10) {
        throw new ApolloError('Invalid address: it must be at least 10 characters long', 'INVALID_ADDRESS');
      }

      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        throw new ApolloError('User with this email already exists', 'USER_EXISTS');
      }

      const result = await usersCollection.insertOne({
        name,
        email,
        age,
        phoneNumber,
        address,
        role: role || 'user',
        referralCode: referralCode || null,
        createdAt: new Date(),
        createdBy: user.userId, // Используем user.userId
      });

      await client.close();

      return {
        id: result.insertedId.toString(),
        name,
        email,
        age,
        phoneNumber,
        address,
        role: role || 'user',
        referralCode: referralCode || null,
      };
    },
  },
};

module.exports = resolvers;
