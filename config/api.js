// config/api.js
const dotenv = require('dotenv');
dotenv.config();

const config = {
  removeBgApiKey: process.env.REMOVE_BG_API_KEY,
  removeBgApiUrl: process.env.REMOVE_BG_API_URL,
  arkApiKey: process.env.ARK_API_KEY,
  arkApiUrl: process.env.ARK_API_URL
}

module.exports = config;