

module.exports = function authorizationMiddleware(roles) {
    return (req, res, next) => {
        console.log('req:', req.user)
        
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized - please log in" });
        }
        
        const userRole = req.user.role;
        console.log("userRole: ", userRole);
        console.log("roles: ", roles);
        
        if (!roles.includes(userRole))
            return res.status(403).json({ message: "unauthorized access" });
        
        next();
    };
}
