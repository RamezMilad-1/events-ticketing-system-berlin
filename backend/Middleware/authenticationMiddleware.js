const jwt = require('jsonwebtoken');

const JWT_SECRET = () => {
    const secret = process.env.JWT_SECRET;
    if (secret) return secret;
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET must be set in production');
    }
    return 'unsafe-dev-fallback';
};

// Prefer Authorization: Bearer <token> (works across origins on Render, where the
// frontend and backend live on different *.onrender.com subdomains and browsers
// often refuse to send third-party cookies). Fall back to the cookie so existing
// sessions and first-party deployments keep working.
function extractToken(req) {
    const header = req.headers?.authorization || req.headers?.Authorization;
    if (header && /^Bearer\s+/i.test(header)) {
        return header.replace(/^Bearer\s+/i, '').trim();
    }
    return req.cookies?.token || null;
}

function authenticationMiddleware(req, res, next) {
    const token = extractToken(req);

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
    const token = extractToken(req);
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
