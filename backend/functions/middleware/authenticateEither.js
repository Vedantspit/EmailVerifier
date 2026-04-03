/**
 * Dual Authentication Middleware
 * Accepts EITHER session-based authentication OR API key authentication
 * Used for endpoints that should be accessible by both web users and API consumers
 */

const { authenticateApiKey } = require('./authenticateApiKey');
const { isAuthenticated } = require('./authenticate');


/**
 * @typedef {Object} AuthenticatedUser
 * @property {number} id - User ID
 * @property {number} userId - User ID (duplicate for compatibility)
 * @property {number} [apiKeyId] - API Key ID (only present for API key auth)
 * @property {string} [email] - User email (only present for session auth)
 */


/**
 * Middleware that accepts either session-based auth OR API key auth
 * Tries API key authentication first (if Authorization header present)
 * Falls back to session authentication if no API key provided
 *
 * @param {import('express').Request & { user?: AuthenticatedUser }} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 * @returns {Promise<void | import('express').Response>}
 */
async function authenticateEither(req, res, next) {
	try {
		// Check if Authorization header with Bearer token is present
		const authHeader = req.headers['authorization'];
		const hasApiKey = authHeader && authHeader.startsWith('Bearer ');

		if (hasApiKey) {
			// Try API key authentication
			return authenticateApiKey(req, res, next);
		}

		// Fall back to session authentication
		return isAuthenticated(req, res, next);

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error('Dual authentication middleware error:', errorMessage);

		return res.status(500).json({
			success: false,
			message: 'Authentication check failed due to server error',
		});

	} finally {
		console.debug('Dual authentication check completed');
	}
}


module.exports = {
	authenticateEither,
};
