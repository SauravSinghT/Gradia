const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    try {
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            // Get token from header (Format: "Bearer <token>")
            token = req.headers.authorization.split(' ')[1];
            console.log('🔐 Token extracted:', token ? '✓' : '✗');

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('✅ Token verified for user:', decoded.id);

            // Get user from the token ID (exclude password)
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            next(); // Move to the next function
        } else {
            throw new Error('No token provided');
        }
    } catch (error) {
        console.error('❌ Auth Error:', error.message);
        res.status(401).json({ 
            message: 'Not authorized, token failed',
            error: error.message 
        });
    }
};

module.exports = { protect };