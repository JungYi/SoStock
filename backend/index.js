const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connect
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Import routers
const inventoryRoutes = require('./routes/inventory');
const orderRoutes = require('./routes/order');
const receiptRoutes = require('./routes/receipt');
const metaRoutes = require('./routes/meta');

// Mount routers
app.use('/api/inventory', inventoryRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/receipt', receiptRoutes);
app.use('/api/meta', metaRoutes);

// Default Route
app.get('/', (req, res) => {
  res.send('API running');
});

// Run the server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));