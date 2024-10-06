const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const { ApolloError, AuthenticationError } = require('apollo-server-express');

const client = new MongoClient(process.env.MONGODB_URI);

const resolvers = {
  Query: {
    getUser: async (_, { id }, { token }) => {
      console.log("Received request for user ID:", id);
    
      // Проверка на наличие токена
      if (!token) {
        throw new AuthenticationError('No authorization token provided');
      }
    
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded Token:", decoded);
      } catch (error) {
        throw new AuthenticationError('Invalid or expired token');
      }
    
      await client.connect();
      console.log("Connected to MongoDB");
      const db = client.db(process.env.DB_NAME);
      const usersCollection = db.collection('users');
    
      let objectId;
      try {
        objectId = new ObjectId(id);
      } catch (e) {
        throw new ApolloError('Invalid User ID format', 'INVALID_ID');
      }
    
      try {
        const user = await usersCollection.findOne({ _id: objectId });
        console.log("Fetched User:", user);
    
        // Проверяем, существует ли пользователь
        if (!user) {
          console.warn(`User not found for ID: ${objectId}`);
          throw new ApolloError('User not found', 'USER_NOT_FOUND');
        }
    
        // Убедимся, что поле id возвращается корректно
        return {
          id: user._id.toString(), // Преобразуем _id в строку
          ...user, // Остальные поля
        };
      } catch (error) {
        console.error('Error fetching user:', error);
        throw new ApolloError('Failed to fetch user', 'FETCH_USER_FAILED');
      } finally {
        await client.close();
      }
    },
  },
  Mutation: {
    createUser: async (_, { name, email, age, phoneNumber, address, role, referralCode }, { token }) => {
      console.log("Received data for creating user:", {
        name, email, age, phoneNumber, address, role, referralCode
      });
    
      // Проверка на наличие токена
      if (!token) {
        throw new AuthenticationError('No authorization token provided');
      }
    
      // Декодирование токена
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        throw new AuthenticationError('Invalid or expired token');
      }
    
      await client.connect();
      const db = client.db(process.env.DB_NAME);
      const usersCollection = db.collection('users');
    
      // Проверка на уникальность электронной почты
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        throw new ApolloError('Email already exists', 'EMAIL_ALREADY_EXISTS');
      }
    
      const newUser = {
        name,
        email,
        age,
        phoneNumber,
        address,
        role: role || 'user', // Значение по умолчанию
        referralCode,
        createdAt: new Date().toISOString(),
        createdBy: decoded.userId, // ID создателя
      };
    
      try {
        // Валидация данных
        if (name.length < 3) {
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
    
        if (role && !['user', 'moderator'].includes(role)) {
          throw new ApolloError('Invalid role: it must be either "user" or "moderator"', 'INVALID_ROLE');
        }
    
        if (referralCode && referralCode.length !== 8) {
          throw new ApolloError('Invalid referral code: it must be exactly 8 characters', 'INVALID_REFERRAL_CODE');
        }
    
        const result = await usersCollection.insertOne(newUser);
        return {
          id: result.insertedId.toString(),
          ...newUser,
          status: 'created',
        };
      } catch (error) {
        console.error('Error creating user:', error);
        throw new ApolloError('Failed to create user', 'CREATE_USER_FAILED');
      } finally {
        await client.close();
      }
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

    deleteUser: async (_, { id }, { token }) => {
      console.log("Received request to delete user ID:", id);

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

      try {
        const result = await usersCollection.deleteOne({ _id: objectId });

        if (result.deletedCount === 0) {
          throw new ApolloError('User not found', 'USER_NOT_FOUND');
        }

        return {
          id: objectId.toString(),
          status: 'deleted',
        };
      } catch (error) {
        console.error('Error deleting user:', error);
        throw new ApolloError('Failed to delete user', 'DELETE_USER_FAILED');
      } finally {
        await client.close();
      }
    },
  },
};

module.exports = resolvers;
