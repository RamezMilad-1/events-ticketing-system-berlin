const jwt = require("jsonwebtoken");
const secretKey = "123456"

// Required authentication middleware - fails if no token
function authenticationMiddleware(req, res, next) {
    const cookie = req.cookies;
    console.log('inside auth middleware')
    
    if (!cookie) {
        return res.status(401).json({ message: "No Cookie provided" });
    }
    const token = cookie.token;
    if (!token) {
        return res.status(405).json({ message: "No token provided" });
    }

    jwt.verify(token, secretKey, (error, decoded) => {
        if (error) {
            return res.status(403).json({ message: "Invalid token" });
        }

        req.user = decoded.user;
        next();
    });
}

// Optional authentication middleware - continues even without token
function optionalAuthenticationMiddleware(req, res, next) {
    const cookie = req.cookies;
    const token = cookie?.token;

    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, secretKey, (error, decoded) => {
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