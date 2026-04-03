/**
 * Express.js type extensions
 * Adds custom properties to Express Request interface
 */

declare namespace Express {
    interface Request {
        user?: {
            // Single-user system: only apiKeyId is tracked for API key authentication
            apiKeyId?: number;
            email?: string;
        };
    }
}

/**
 * Database result types
 */
interface DatabaseCountResult {
    total: number;
}

interface DatabaseUser {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    password_hash: string;
    is_verified: number;
    created_at: string;
    updated_at: string;
}

interface ScriptCountResult {
    count: number;
}

