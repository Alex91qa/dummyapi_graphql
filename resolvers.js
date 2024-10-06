const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const { ApolloError, AuthenticationError } = require('apollo-server-express');

const client = new MongoClient(process.env.MONGODB_URI);

const resolvers = {
  Query: {
    getUser: async (_, { id }, { token }) => {
      // Ваша существующая логика для getUser...
    },
  },
  Mutation: {
    createUser: async (_, { name, email, age, phoneNumber, address, role, referralCode }, { token }) => {
      // Ваша существующая логика для createUser...
    },
    updateUser: async (_, { id, name, email, age, phoneNumber, address, role, referralCode }, { token }) => {
      if (!token) {
        throw new AuthenticationError('No authorization token provided');
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        throw new AuthenticationError('Invalid or expired token');
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

      const updateFields = {};
      if (name) {
        if (name.length < 3) {
          throw new ApolloError('Invalid name: it must be at least 3 characters long', 'INVALID_NAME');
        }
        updateFields.name = name;
      }

      const emailPattern = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
      if (email) {
        if (!emailPattern.test(email)) {
          throw new ApolloError('Invalid email address', 'INVALID_EMAIL');
        }
        updateFields.email = email;
      }

      if (age) {
        if (age < 18 || age > 150) {
          throw new ApolloError('Invalid age: it must be between 18 and 150', 'INVALID_AGE');
        }
        updateFields.age = age;
      }

      const phoneNumberPattern = /^\+\d{1,3}\d{7,10}$/;
      if (phoneNumber) {
        if (!phoneNumberPattern.test(phoneNumber)) {
          throw new ApolloError('Invalid phone number', 'INVALID_PHONE');
        }
        updateFields.phoneNumber = phoneNumber;
      }

      if (address) {
        if (address.length < 10) {
          throw new ApolloError('Invalid address: it must be at least 10 characters long', 'INVALID_ADDRESS');
        }
        updateFields.address = address;
      }

      if (role) {
        if (!['user', 'moderator'].includes(role)) {
          throw new ApolloError('Invalid role: it must be either "user" or "moderator"', 'INVALID_ROLE');
        }
        updateFields.role = role;
      }

      if (referralCode) {
        if (referralCode.length !== 8) {
          throw new ApolloError('Invalid referral code: it must be exactly 8 characters', 'INVALID_REFERRAL_CODE');
        }
        updateFields.referralCode = referralCode;
      }

      // Проверяем наличие хотя бы одного поля для обновления
      if (Object.keys(updateFields).length === 0) {
        throw new ApolloError('At least one field is required for update', 'NO_FIELDS_PROVIDED');
      }

      const result = await usersCollection.updateOne(
        { _id: objectId },
        { $set: updateFields }
      );

      if (result.matchedCount === 0) {
        throw new ApolloError('User not found', 'USER_NOT_FOUND');
      }

      await client.close();

      return {
        id: objectId.toString(),
        ...updateFields,
        status: 'updated'
      };
    },
  },
};

module.exports = resolvers;
