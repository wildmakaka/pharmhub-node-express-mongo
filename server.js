const express = require('express');
const mongoose = require('mongoose');
const { EXPRESS_HOST, EXPRESS_PORT } = require('./config/express.js');
const { DB_URI } = require('./config/db.js');
const routes = require('./routes/');
const server = express();

server.use('/', routes);

server.listen(EXPRESS_PORT, EXPRESS_HOST, () => {
  console.log('Express listening on port ', EXPRESS_PORT);
});

mongoose
  .connect(
    DB_URI,
    { useNewUrlParser: true }
  )
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));
