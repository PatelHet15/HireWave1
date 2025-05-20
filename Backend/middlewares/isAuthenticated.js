import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
    try {
        // Check for token in Authorization header first (Bearer token)
        const authHeader = req.headers.authorization;
        let token = null;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else {
            // Fall back to cookie if no Authorization header
            token = req.cookies?.token;
        }

        if (!token) {
            return res.status(401).json({
                message: "User not authenticated",
                success: false,
            });
        }
        
        const decode = await jwt.verify(token, process.env.SECRET_KEY);
        if(!decode){
            return res.status(401).json({
                message: "Invalid token",
                success: false
            });
        }
        
        req.id = decode.userId;
        req.user = decode; // Add the full decoded token to req.user for role checks
        next();
    } catch (error) {
        console.log(error);
        return res.status(401).json({
            message: "Authentication failed",
            success: false
        });
    }
};

// Middleware to check if the user is a recruiter/admin
export const isAdmin = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'recruiter') {
            return res.status(403).json({
                message: "Recruiter access required",
                success: false
            });
        }
        next();
    } catch (error) {
        console.log(error);
        return res.status(403).json({
            message: "Access denied",
            success: false
        });
    }
};

export default isAuthenticated;