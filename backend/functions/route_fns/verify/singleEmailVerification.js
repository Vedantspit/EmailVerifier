/**
 * Single email verification route functions
 * Handles ONLY single email verification submission
 *
 * For status checking, see verificationStatus.js
 * For results retrieval, see verificationResults.js
 */

const { v4: uuidv4 } = require('uuid');
const queue = require('../../staging/queue');
const { createVerificationRequest, updateVerificationStatus } = require('./verificationDB');
const isValidEmail = require('../../utils/isValidEmail');


/**
 * Verify a single email address
 * Creates a verification request and adds it to the queue
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<import('express').Response | void>}
 */
async function verifySingleEmail(req, res) {
	try {
		const { email } = req.body;

		// Validate input
		if (!email || typeof email !== 'string') {
			return res.status(400).json({
				success: false,
				message: 'Email address is required',
			});
		}

		// RFC 5322 compliant email validation
		if (!isValidEmail(email)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid email address format',
			});
		}

		// Generate verification request ID
		const verification_request_id = `single-${uuidv4()}`;

		// Create verification request in database (single-user system)
		const createResult = await createVerificationRequest({
			verification_request_id,
			request_type: 'single',
			emails: [email],
		});

		if (!createResult.success) {
			return res.status(500).json({
				success: false,
				message: 'Failed to create verification request',
			});
		}

		// Add to verification queue
		const queueResult = await queue.add({
			request_id: verification_request_id,
			emails: [email],
			response_url: '', // Empty for single email - we'll poll for results
		});

		if (!queueResult.success) {
			return res.status(500).json({
				success: false,
				message: 'Failed to add request to verification queue',
			});
		}

		// Update status to processing
		await updateVerificationStatus(verification_request_id, 'processing');

		// Return success response
		return res.json({
			success: true,
			message: 'Email verification started',
			data: {
				verification_request_id,
				email,
				status: 'processing',
			},
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error('Single email verification error:', errorMessage);

		return res.status(500).json({
			success: false,
			message: 'Internal server error occurred',
		});
	} finally {
		console.debug('Single email verification request completed');
	}
}


// Export functions
module.exports = {
	verifySingleEmail,
};
