const express = require('express');
const { admin } = require('./src/config/firebase');
const productRoutes = require('./src/routes/product.routes');
require('dotenv').config();

const app = express();
app.use(express.json());

// రూట్స్ (Routes)
app.use('/api/products', productRoutes);

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`AV Silks Server running on port ${PORT}`);
});

