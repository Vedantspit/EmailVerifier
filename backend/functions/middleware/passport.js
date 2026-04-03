/**
 * Passport.js configuration for single-user authentication
 * Uses LocalStrategy with credentials from environment variables
 */

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const { ADMIN_EMAIL, ADMIN_PASSWORD } = require('../../data/env');

/**
 * Configure Passport LocalStrategy
 * Validates email and password against environment variables
 */
passport.use(
	new LocalStrategy(
		{
			usernameField: 'email',
			passwordField: 'password',
		},
		async (email, password, done) => {
			try {
				// Validate email matches admin email
				if (email !== ADMIN_EMAIL) {
					return done(null, false, { message: 'Incorrect email or password. Please check your credentials and try again.' });
				}

				// Validate password matches admin password
				if (password !== ADMIN_PASSWORD) {
					return done(null, false, { message: 'Incorrect email or password. Please check your credentials and try again.' });
				}

				// Authentication successful - return user object
				const user = {
					email: ADMIN_EMAIL,
				};

				return done(null, user);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				console.error('Passport authentication error:', errorMessage);
				return done(error);
			} finally {
				console.debug('Passport authentication process completed');
			}
		}
	)
);

/**
 * Serialize user to session
 * Stores minimal user data in session
 */
passport.serializeUser((user, done) => {
	try {
		// Store only email in session
		done(null, user.email);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error('Session serialization error:', errorMessage);
		done(error);
	} finally {
		console.debug('User serialized to session');
	}
});

/**
 * Deserialize user from session
 * Reconstructs user object from session data
 */
passport.deserializeUser((email, done) => {
	try {
		// Reconstruct user object
		const user = {
			email: email,
		};
		done(null, user);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error('Session deserialization error:', errorMessage);
		done(error);
	} finally {
		console.debug('User deserialized from session');
	}
});

module.exports = passport;
