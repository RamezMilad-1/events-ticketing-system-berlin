/**
 * Centralized Express error handler.
 * Translates common Mongoose errors into clean JSON responses.
 */
module.exports = function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    // Mongoose validation
    if (err.name === 'ValidationError') {
        const details = Object.values(err.errors || {}).map((e) => e.message);
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: details,
        });
    }

    // Bad ObjectId
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: `Invalid ${err.path || 'id'}: ${err.value}`,
        });
    }

    // Duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        return res.status(409).json({
            success: false,
            message: `Duplicate value for ${field}`,
        });
    }

    // JWT
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    console.error('[error]', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
    });
};
