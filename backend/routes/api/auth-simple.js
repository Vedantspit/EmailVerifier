/**
 * Authentication routes with session management
 * Single admin user with credentials in .env file
 * Uses Passport.js for session-based authentication
 */

const express = require('express');
const router = express.Router();

// Import auth handlers and middleware
const { handleAuth } = require('../../functions/route_fns/simpleAuth/login');
const { handleLogout } = require('../../functions/route_fns/simpleAuth/logout');
const { isAuthenticated } = require('../../functions/middleware/authenticate');

/**
 * POST /api/auth/login
 * Login with email and password
 * Creates session on successful authentication
 */
router.post('/login', handleAuth);

/**
 * POST /api/auth/logout
 * Logout and destroy session
 * Protected route - requires authentication
 */
router.post('/logout', isAuthenticated, handleLogout);

/**
 * GET /api/auth/me
 * Get current authenticated user
 * Protected route - requires authentication
 */
router.get('/me', isAuthenticated, (req, res) => {
	try {
		res.status(200).json({
			success: true,
			data: {
				user: {
					email: req.user.email,
				},
			},
		});
	} catch (error) {
		console.error('Get current user error:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to get user information',
		});
	}
});

/**
 * GET /api/auth/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
	try {
		res.status(200).json({
			success: true,
			message: 'Auth service is healthy',
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error('Health check error:', error);
		res.status(500).json({
			success: false,
			message: 'Health check failed',
		});
	}
});

module.exports = router;
