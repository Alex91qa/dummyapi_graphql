const express = require('express');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Загружаем protobuf
const PROTO_PATH = path.join(__dirname, 'user.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const userProto = grpc.loadPackageDefinition(packageDefinition).user_service;

// Имплементация метода CreateUser
function createUser(call, callback) {
  const userId = Math.floor(Math.random() * 1000).toString();
  callback(null, {
    id: userId,
    name: call.request.name,
    email: call.request.email,
    age: call.request.age,
    phoneNumber: call.request.phoneNumber,
    address: call.request.address,
    role: call.request.role || 'user',
    status: 'created',
  });
}

// Создаем и запускаем gRPC сервер
function startGrpcServer() {
  const server = new grpc.Server();
  server.addService(userProto.UserService.service, { createUser });
  const address = '0.0.0.0:50051';
  server.bindAsync(address, grpc.ServerCredentials.createInsecure(), () => {
    console.log(`gRPC server running at ${address}`);
    server.start();
  });
}

// Запуск gRPC сервера
startGrpcServer();

// Запуск Express сервера для health-check
const app = express();
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

app.listen(3000, () => {
  console.log('Health check endpoint listening on port 3000');
});
