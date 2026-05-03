const jwt = require('jsonwebtoken');

const JWT_SECRET = () => process.env.JWT_SECRET || 'unsafe-dev-fallback';

function authenticationMiddleware(req, res, next) {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    jwt.verify(token, JWT_SECRET(), (error, decoded) => {
        if (error) {
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }
        req.user = decoded.user;
        next();
    });
}

// Permissive variant: attaches req.user when a valid token is present, otherwise continues anonymously.
function optionalAuthenticationMiddleware(req, res, next) {
    const token = req.cookies?.token;
    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, JWT_SECRET(), (error, decoded) => {
        if (error) {
            req.user = null;
            return next();
        }
        req.user = decoded.user;
        next();
    });
}

module.exports = authenticationMiddleware;
module.exports.optional = optionalAuthenticationMiddleware;
