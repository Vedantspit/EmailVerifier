/**
 * Database cleanup utilities for maintenance operations
 *
 * DEPRECATED: This module is no longer used in single-user system.
 * In the single-user system, there are no users table or auth_tokens table.
 * All cleanup functionality has been removed.
 *
 * This file is kept for backward compatibility but all functions return
 * no-op results indicating nothing needs to be cleaned.
 */


/**
 * No-op cleanup function (users table no longer exists)
 * @deprecated Single-user system does not have users table
 * @returns {Promise<{success: boolean, deletedUsers: number, deletedTokens: number, message: string, error?: string}>}
 */
async function cleanupUnverifiedUsers() {
	try {
		console.log('✅ No cleanup needed - single-user system has no users table');
		return {
			success: true,
			deletedUsers: 0,
			deletedTokens: 0,
			message: 'No cleanup needed - single-user system'
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error('Cleanup error:', errorMessage);
		return {
			success: false,
			deletedUsers: 0,
			deletedTokens: 0,
			error: errorMessage,
			message: 'Cleanup failed'
		};
	} finally {
		console.debug('Cleanup process completed');
	}
}


/**
 * No-op cleanup function (auth_tokens table no longer exists)
 * @deprecated Single-user system does not have auth_tokens table
 * @returns {Promise<{success: boolean, deletedTokens: number, message: string, error?: string}>}
 */
async function cleanupExpiredTokens() {
	try {
		console.log('✅ No cleanup needed - single-user system has no auth_tokens table');
		return {
			success: true,
			deletedTokens: 0,
			message: 'No cleanup needed - single-user system'
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error('Cleanup error:', errorMessage);
		return {
			success: false,
			deletedTokens: 0,
			error: errorMessage,
			message: 'Cleanup failed'
		};
	} finally {
		console.debug('Cleanup process completed');
	}
}


/**
 * No-op comprehensive cleanup (no tables to clean)
 * @deprecated Single-user system does not require cleanup
 * @returns {Promise<{success: boolean, results: Object | null, totalDeleted: number, message: string, error?: string}>}
 */
async function runDatabaseCleanup() {
	try {
		console.log('✅ No cleanup needed - single-user system');
		return {
			success: true,
			results: {
				unverifiedUsers: { success: true, deletedUsers: 0, deletedTokens: 0, message: 'No cleanup needed' },
				expiredTokens: { success: true, deletedTokens: 0, message: 'No cleanup needed' }
			},
			totalDeleted: 0,
			message: 'No cleanup needed - single-user system'
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error('Cleanup error:', errorMessage);
		return {
			success: false,
			results: null,
			totalDeleted: 0,
			error: errorMessage,
			message: 'Cleanup failed'
		};
	} finally {
		console.debug('Cleanup process completed');
	}
}


// Export all cleanup utility functions (now no-ops)
module.exports = {
	cleanupUnverifiedUsers,
	cleanupExpiredTokens,
	runDatabaseCleanup
};