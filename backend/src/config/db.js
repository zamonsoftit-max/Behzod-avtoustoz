const mongoose = require('mongoose');
const env = require('./env');

/**
 * MongoDB ga ulanish. Ulanmasa jarayon to'xtaydi.
 */
async function connectDB() {
  mongoose.set('strictQuery', true);
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB ulandi: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error('❌ MongoDB ulanish xatosi:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
