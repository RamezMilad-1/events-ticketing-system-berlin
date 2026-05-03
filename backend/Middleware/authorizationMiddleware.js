/**
 * Role-based authorization middleware.
 * Accepts a single role string or an array of roles.
 *
 *   router.get('/foo', authorize('System Admin'), handler)
 *   router.put('/bar', authorize(['Organizer', 'System Admin']), handler)
 */
module.exports = function authorizationMiddleware(roles) {
    const allowed = Array.isArray(roles) ? roles : [roles];

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        if (!allowed.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action',
            });
        }

        next();
    };
};
