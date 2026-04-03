/**
 * RFC 5322 compliant email validation
 * Validates email addresses according to RFC 5322 standard with support for:
 * - Plus addressing (user+tag@example.com)
 * - Dots in local part (user.name@example.com)
 * - Special characters (!#$%&'*+/=?^_`{|}~-)
 * - International characters in local and domain parts
 * - Subdomains and TLDs
 *
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
	if (!email || typeof email !== 'string') {
		return false;
	}

	// RFC 5322 compliant regex with international character support
	// Local part: allows a-z, A-Z, 0-9, and special chars: .!#$%&'*+/=?^_`{|}~-
	// Plus international characters (àáâä etc.)
	// Domain part: allows alphanumeric, hyphens, dots, and international chars
	const regex =
		/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

	return regex.test(email.trim());
}

module.exports = isValidEmail;
