/**
 * Logout handler
 * Destroys session and logs user out
 */

/**
 * Handle logout
 * Destroys Passport session and clears session store
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function handleLogout(req, res) {
	try {
		// Logout from passport (removes user from session)
		req.logout((logoutError) => {
			if (logoutError) {
				console.error('Logout error:', logoutError);
				return res.status(500).json({
					success: false,
					message: 'Logout failed due to server error',
				});
			}

			// Destroy session completely
			req.session.destroy((destroyError) => {
				if (destroyError) {
					console.error('Session destroy error:', destroyError);
					return res.status(500).json({
						success: false,
						message: 'Logout failed due to server error',
					});
				}

				// Clear session cookie
				res.clearCookie('connect.sid');

				// Logout successful
				return res.status(200).json({
					success: true,
					message: 'Logout successful',
				});
			});
		});
	} catch (error) {
		console.error('Logout handler error:', error);
		return res.status(500).json({
			success: false,
			message: 'Logout failed due to server error',
		});
	} finally {
		// Debug logging
	}
}

module.exports = {
	handleLogout,
};
