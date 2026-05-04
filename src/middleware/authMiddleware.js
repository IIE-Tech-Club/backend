// middleware/authMiddleware.js

/**
 * Middleware to handle Firebase UID-based authentication.
 * It decodes the Firebase ID Token from the Authorization header.
 * 
 * NOTE: For production, use firebase-admin to verify the token:
 * const decodedToken = await admin.auth().verifyIdToken(idToken);
 */
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            // Simple decode (unverified) for development if service account is not configured
            // In a real production app, you MUST use firebase-admin.verifyIdToken(token)
            const payload = token.split('.')[1];
            if (!payload) {
                // If it's not a JWT, treat it as a raw UID (for development flexibility)
                req.user = { uid: token };
                return next();
            }

            const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
            req.user = {
                uid: decoded.user_id || decoded.sub || decoded.uid,
                email: decoded.email,
                name: decoded.name
            };
            
            next();
        } catch (error) {
            console.error('Auth Middleware Error:', error);
            res.status(401).json({ message: 'Not authorized, token invalid' });
        }
    } else {
        // Fallback to custom header if provided (useful for debugging)
        const uid = req.headers['x-uid'];
        if (uid) {
            req.user = { uid };
            return next();
        }
        
        res.status(401).json({ message: 'Not authorized, no identity token provided' });
    }
};

module.exports = { protect };
