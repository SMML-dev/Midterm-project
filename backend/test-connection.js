// Simple test script to verify backend setup
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roots-and-wings';

console.log('Testing backend setup...\n');
console.log('MONGODB_URI:', MONGODB_URI);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET ✓' : 'NOT SET ✗');
console.log('PORT:', process.env.PORT || 3000);
console.log('\nTesting MongoDB connection...');

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✓ MongoDB connection successful!');
  console.log('\nBackend is ready to start!');
  console.log('Run: npm start');
  process.exit(0);
})
.catch((error) => {
  console.error('✗ MongoDB connection failed:', error.message);
  console.log('\nPlease check:');
  console.log('1. MongoDB is running');
  console.log('2. MONGODB_URI in .env is correct');
  console.log('3. For MongoDB Atlas, ensure your IP is whitelisted');
  process.exit(1);
});

