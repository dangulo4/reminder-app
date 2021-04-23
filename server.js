const express = require('express');
const connectDB = require('./config/db');
// initialize app with express
const app = express();

// connect DB
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));
// test request end point
app.get('/', (req, res) => res.send('API is running'));

// Define routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/contacts', require('./routes/api/contacts'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));

// create variable to hold port environment
const PORT = process.env.PORT || 5000;

// start the api server
app.listen(PORT, () => {
  console.log(`🌎 ==> API Server is now listening on PORT ${PORT}!`);
});
