require('dotenv').config();
const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const contactsRouter = require('./routes/api/contacts');
const usersRouter = require('./routes/api/users');

const app = express();

const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short';

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());

app.use('/api/contacts', contactsRouter);
app.use('/api/users', usersRouter);

const publicPath = path.join(__dirname, 'public', 'avatars');
console.log('Serving static files from:', publicPath);
app.use('/avatars', express.static(publicPath));

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

const { DB_HOST } = process.env;

mongoose.connect(DB_HOST, { 
}).then(() => {
  console.log('Database connection successful');
}).catch(err => {
  console.error('Database connection error', err);
  process.exit(1);
});

module.exports = app;
