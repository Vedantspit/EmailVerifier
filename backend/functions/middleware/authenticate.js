/**
 * Authentication middleware for protecting routes
 * Checks if user is authenticated via Passport session
 */

/**
 * Middleware to check if user is authenticated
 * Returns 401 if not authenticated, otherwise allows request to proceed
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function isAuthenticated(req, res, next) {
	try {
		// Check if user is authenticated via passport session
		if (req.isAuthenticated()) {
			// User is authenticated, proceed to next middleware
			return next();
		}

		// User is not authenticated, return 401
		return res.status(401).json({
			success: false,
			message: 'Authentication required. Please log in to access this resource.',
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error('Authentication middleware error:', errorMessage);
		return res.status(500).json({
			success: false,
			message: 'Authentication check failed due to server error',
		});
	} finally {
		console.debug('Authentication check completed');
	}
}

module.exports = {
	isAuthenticated,
};
