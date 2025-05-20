import jwt from 'jsonwebtoken';
import { config } from 'dotenv';

config();

export const isAuthenticated = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.log('Authentication failed: No authorization header');
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        const token = authHeader.split(' ')[1];
        if (!token) {
            console.log('Authentication failed: Invalid authorization format');
            return res.status(401).json({ message: 'Authentication required' });
        }

        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            console.log('Auth successful, decoded token:', JSON.stringify(decoded));
            
            // Ensure userId is accessible via _id or id
            if (decoded.userId && !decoded._id && !decoded.id) {
                decoded._id = decoded.userId;
            }
            
            req.user = decoded;
            next();
        } catch (jwtError) {
            console.log('JWT verification failed:', jwtError.message);
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ message: 'Authentication failed' });
    }
};

export const isAdmin = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'recruiter') {
            return res.status(403).json({ message: 'Recruiter access required' });
        }
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Access denied' });
    }
};


