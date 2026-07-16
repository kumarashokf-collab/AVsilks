const express = require('express');
const cors = require('cors'); // కొత్త లైన్
const app = express();
app.use(cors()); // కొత్త లైన్
app.use(express.json());
// మిగతా కోడ్...
