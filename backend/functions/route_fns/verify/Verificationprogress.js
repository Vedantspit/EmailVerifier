/**
 * Verification Progress Polling Endpoint
 *
 * GET /api/verify/progress/:verification_request_id
 *
 * Allows frontend/browser to poll for real-time verification progress.
 * Works for both webhook-based and polling-based clients.
 *
 * Response shape:
 * {
 *   success: true,
 *   data: {
 *     verification_request_id: string,
 *     status: 'queued' | 'processing' | 'completed' | 'failed',
 *     total_emails: number,
 *     completed_emails: number,         // emails with done=true (SMTP processed)
 *     progress_percent: number,         // 0-100
 *     webhook_sent: boolean,            // true if response_url was hit successfully
 *     webhook_attempts: number,
 *     all_done: boolean,                // true when every email is processed AND (no webhook needed OR webhook sent)
 *     greylist_found: boolean,
 *     blacklist_found: boolean,
 *     results: VerificationObj[] | null // only populated when status === 'completed'
 *   }
 * }
 */

const controller = require('../../verifier/controller'); // adjust path to your controller singleton

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Derive how many emails are "done" from the stored results array.
 * Each result object coming out of the SMTP layer has a `done` field on
 * the smtp report, but by the time results are saved to the DB they are
 * already fully processed — so any result row counts as done.
 *
 * For in-flight requests (status = 'processing') we read completed_emails
 * directly from the DB row which the controller keeps updated.
 *
 * @param {{status: string, total_emails: number, completed_emails: number, results: any}} statusRow
 * @returns {number}
 */
function deriveDoneCount(statusRow) {
	if (!statusRow) return 0;

	// When completed, results array length == total done
	if (statusRow.status === 'completed' && Array.isArray(statusRow.results)) {
		return statusRow.results.length;
	}

	// For processing/queued, use the counter the controller writes
	return statusRow.completed_emails || 0;
}

/**
 * Calculate progress percentage, clamped 0-100.
 * @param {number} done
 * @param {number} total
 * @returns {number}
 */
function calcPercent(done, total) {
	if (!total || total <= 0) return 0;
	return Math.min(100, Math.round((done / total) * 100));
}

/**
 * Determine if the whole pipeline is finished from the caller's perspective.
 *
 * "all_done" means:
 *   - Every email has been SMTP-verified (status === 'completed')
 *   - AND either:
 *       a) No webhook URL was set (polling client) → just completed is enough
 *       b) Webhook URL was set → webhook_sent must also be true
 *
 * Note: webhook_sent stays false when no response_url is provided (controller
 * sets it to true only after a successful POST, but skips when URL is empty).
 * We detect "no webhook needed" by checking webhook_attempts === 0 AND
 * webhook_sent === true (controller marks it sent with 0 attempts when skipped).
 *
 * @param {{status: string, webhook_sent: boolean, webhook_attempts: number}} statusRow
 * @returns {boolean}
 */
function isAllDone(statusRow) {
	if (!statusRow || statusRow.status !== 'completed') return false;

	// Controller sets webhook_sent=true, webhook_attempts=0 when no URL provided
	const noWebhookNeeded = statusRow.webhook_sent === true && statusRow.webhook_attempts === 0;

	// Webhook was required and successfully delivered
	const webhookDelivered = statusRow.webhook_sent === true && statusRow.webhook_attempts > 0;

	return noWebhookNeeded || webhookDelivered;
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

/**
 * GET /api/verify/progress/:verification_request_id
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getVerificationProgress(req, res) {
	try {
		const { verification_request_id } = req.params;

		// Basic input guard
		if (!verification_request_id || typeof verification_request_id !== 'string') {
			return res.status(400).json({
				success: false,
				message: 'verification_request_id is required',
			});
		}

		// Sanitise — only allow expected characters to prevent SQL injection
		// IDs are uuidv4 with optional "api-" prefix
		if (!/^[a-zA-Z0-9_-]+$/.test(verification_request_id)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid verification_request_id format',
			});
		}

		// Pull status from controller's local SQLite (controller0Results table)
		const statusRow = await controller.getRequestStatus(verification_request_id);

		if (!statusRow) {
			return res.status(404).json({
				success: false,
				message: 'Verification request not found',
			});
		}

		// Derive progress metrics
		const doneCount = deriveDoneCount(statusRow);
		const totalCount = statusRow.total_emails || 0;
		const progressPercent = calcPercent(doneCount, totalCount);
		const allDone = isAllDone(statusRow);

		// Build response — only include results payload when fully completed
		// to avoid sending huge partial arrays mid-flight
		/** @type {any} */
		const responseData = {
			verification_request_id,
			status: statusRow.status,
			total_emails: totalCount,
			completed_emails: doneCount,
			progress_percent: progressPercent,
			webhook_sent: statusRow.webhook_sent,
			webhook_attempts: statusRow.webhook_attempts,
			all_done: allDone,
			greylist_found: statusRow.greylist_found,
			blacklist_found: statusRow.blacklist_found,
			created_at: statusRow.created_at,
			updated_at: statusRow.updated_at,
			completed_at: statusRow.completed_at || null,
		};

		// Only attach results array once everything is done
		// Keeps polling responses lightweight during processing
		if (statusRow.status === 'completed' && Array.isArray(statusRow.results)) {
			responseData.results = statusRow.results;
		} else {
			responseData.results = null;
		}
		console.log('called polling brandnav ', responseData);

		return res.status(200).json({
			success: true,
			data: responseData,
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error('getVerificationProgress() error:', errorMessage);

		return res.status(500).json({
			success: false,
			message: 'Internal server error',
		});
	}
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
	getVerificationProgress,
};
