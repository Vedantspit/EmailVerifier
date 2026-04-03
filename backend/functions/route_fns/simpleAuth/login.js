/**
 * Login handler using Passport.js authentication
 * Creates session for authenticated users
 */

const passport = require('../../middleware/passport');
const isValidEmail = require('../../utils/isValidEmail');

/**
 * Handle login with Passport authentication
 * Validates credentials and creates session
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function handleAuth(req, res, next) {
	try {
		const { email, password } = req.body;

		// Validate email format
		if (!email || !isValidEmail(email)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid email format',
			});
		}

		// Validate password length (8-32 characters)
		if (!password || typeof password !== 'string' || password.length < 8 || password.length > 32) {
			return res.status(400).json({
				success: false,
				message: 'Password must be between 8 and 32 characters',
			});
		}

		// Authenticate using Passport
		passport.authenticate('local', (error, user, info) => {
			// Handle authentication errors
			if (error) {
				console.error('Passport authentication error:', error);
				return res.status(500).json({
					success: false,
					message: 'Login failed due to server error',
				});
			}

			// Handle authentication failure
			if (!user) {
				return res.status(401).json({
					success: false,
					message: info?.message || 'Incorrect email or password. Please check your credentials and try again.',
				});
			}

			// Establish login session
			req.logIn(user, (loginError) => {
				if (loginError) {
					console.error('Session login error:', loginError);
					return res.status(500).json({
						success: false,
						message: 'Login failed due to server error',
					});
				}

				// Login successful
				return res.status(200).json({
					success: true,
					message: 'Login successful',
					data: {
						user: {
							email: user.email,
						},
					},
				});
			});
		})(req, res, next);
	} catch (error) {
		console.error('Login handler error:', error);
		return res.status(500).json({
			success: false,
			message: 'Login failed due to server error',
		});
	} finally {
		// Debug logging
	}
}

module.exports = {
	handleAuth,
};
