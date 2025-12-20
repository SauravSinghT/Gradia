const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Add retry logic and timeout
        const options = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            retryWrites: true,
            w: 'majority',
        };

        await mongoose.connect(process.env.MONGO_URI, options);
        console.log('✅ MongoDB Connected Successfully');

        // Handle connection events
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB Disconnected');
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB Error:', err.message);
        });
    } catch (error) {
        console.error('❌ MongoDB Connection Failed:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;