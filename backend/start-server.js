// Simple script to check if server can start
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('Environment check:');
console.log('MONGODB_URI:', process.env.MONGODB_URI || 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('PORT:', process.env.PORT || 3000);

// Try to start the server
require('./server/index.js');

