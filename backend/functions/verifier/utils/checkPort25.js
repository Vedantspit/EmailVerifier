const net = require('net');

/**
 * Tests a single host for port 25 connectivity
 *
 * @param {string} hostname - The hostname to test
 * @param {number} timeout - Connection timeout in milliseconds
 * @returns {Promise<Object>} Test result with success status, response time, and banner
 */
function testSingleHost(hostname, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const socket = new net.Socket();

        let smtpBanner = '';
        let connected = false;


        // Set timeout
        socket.setTimeout(timeout);


        // Connection successful
        socket.on('connect', () => {
            connected = true;
            // Wait for SMTP banner (220 response)
        });


        // Data received (SMTP banner)
        socket.on('data', (data) => {
            smtpBanner = data.toString().trim();

            // Check if we received a valid SMTP banner (should start with 220)
            if (smtpBanner.startsWith('220')) {
                socket.destroy(); // Clean disconnect
                resolve({
                    success: true,
                    responseTime: Date.now() - startTime,
                    banner: smtpBanner
                });
            } else {
                // Received data but not a valid SMTP banner
                socket.destroy();
                reject(new Error(`Invalid SMTP banner received: ${smtpBanner}`));
            }
        });


        // Timeout
        socket.on('timeout', () => {
            socket.destroy();
            reject(new Error('Connection timeout'));
        });


        // Error handling
        socket.on('error', (err) => {
            socket.destroy();
            reject(err);
        });


        // Socket closed without receiving data
        socket.on('close', () => {
            if (connected && !smtpBanner) {
                // Connected but didn't receive banner within timeout
                reject(new Error('Connection closed without receiving SMTP banner'));
            }
        });


        // Initiate connection
        try {
            socket.connect(25, hostname);
        } catch (err) {
            reject(err);
        }
    });
}


/**
 * Classifies port 25 connection errors
 *
 * @param {Error} error - The error object from connection attempt
 * @returns {Object} Classified error with blocked status and reason
 */
function classifyPort25Error(error) {
    const errorCode = error.code;
    const errorMessage = error.message;


    // Port 25 is blocked by ISP/Firewall
    if (errorCode === 'ECONNREFUSED') {
        return {
            blocked: true,
            reason: 'Connection refused - Port 25 likely blocked by firewall/ISP',
            severity: 'high',
            errorCode: errorCode
        };
    }


    // Connection timeout (possibly blocked or server issue)
    if (errorCode === 'ETIMEDOUT' || errorMessage.includes('timeout')) {
        return {
            blocked: true,
            reason: 'Connection timeout - Port 25 may be blocked or server unavailable',
            severity: 'medium',
            errorCode: errorCode || 'TIMEOUT'
        };
    }


    // Network/Host unreachable
    if (errorCode === 'ENETUNREACH' || errorCode === 'EHOSTUNREACH') {
        return {
            blocked: true,
            reason: 'Network unreachable - Check network configuration',
            severity: 'high',
            errorCode: errorCode
        };
    }


    // DNS resolution failed
    if (errorCode === 'ENOTFOUND') {
        return {
            blocked: false,
            reason: 'DNS resolution failed - Server hostname not found',
            severity: 'low',
            errorCode: errorCode
        };
    }


    // Address already in use (shouldn't block verification, just retry)
    if (errorCode === 'EADDRINUSE') {
        return {
            blocked: false,
            reason: 'Address in use - Temporary issue, retry recommended',
            severity: 'low',
            errorCode: errorCode
        };
    }


    // Generic error
    return {
        blocked: 'unknown',
        reason: errorMessage || 'Unknown error',
        severity: 'medium',
        errorCode: errorCode || 'UNKNOWN'
    };
}


/**
 * Checks if outbound port 25 (SMTP) is accessible
 * Tests multiple popular MX servers to determine connectivity
 *
 * @returns {Promise<Object>} Connectivity test result
 * @example
 * const result = await checkPort25Connectivity();
 * if (result.port25Open) {
 *     console.log('Port 25 is accessible!');
 * } else {
 *     console.error('Port 25 is blocked:', result.recommendation);
 * }
 */
async function checkPort25Connectivity() {
    const testTargets = [
        { host: 'mxshield.brandnav.io', priority: 1, provider: 'BrandNav' },
        { host: 'gmail-smtp-in.l.google.com', priority: 2, provider: 'Google' },
        { host: 'mx-biz.mail.am0.yahoodns.net', priority: 3, provider: 'Yahoo' },
        { host: 'mail.protection.outlook.com', priority: 4, provider: 'Microsoft' },
        { host: 'mx1.zoho.com', priority: 5, provider: 'Zoho' }
    ];

    const attemptedHosts = [];
    const errors = [];
    const startTime = Date.now();


    // Test each target sequentially (stop on first success)
    for (const target of testTargets) {
        attemptedHosts.push(target.host);

        try {
            const result = await testSingleHost(target.host, 5000);

            // Success! Port 25 is open
            return {
                success: true,
                port25Open: true,
                canVerifyEmails: true,
                testedHost: target.host,
                provider: target.provider,
                attemptedHosts: attemptedHosts,
                responseTime: result.responseTime,
                totalTime: Date.now() - startTime,
                smtpBanner: result.banner,
                error: null,
                errors: [],
                recommendation: null,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            // Classify the error
            const classified = classifyPort25Error(error);

            errors.push({
                host: target.host,
                provider: target.provider,
                error: classified.errorCode,
                reason: classified.reason,
                severity: classified.severity,
                blocked: classified.blocked
            });

            // Continue to next host
            continue;
        }
    }


    // All hosts failed - port 25 is likely blocked
    const allBlocked = errors.every(e => e.blocked === true);
    const someUnknown = errors.some(e => e.blocked === 'unknown');

    return {
        success: true,
        port25Open: false,
        canVerifyEmails: false,
        testedHost: null,
        provider: null,
        attemptedHosts: attemptedHosts,
        responseTime: null,
        totalTime: Date.now() - startTime,
        smtpBanner: null,
        error: 'All connection attempts failed',
        errors: errors,
        recommendation: allBlocked
            ? 'Port 25 is blocked by your network/ISP. Consider using a VPS or cloud server with port 25 access for email verification.'
            : someUnknown
            ? 'Unable to determine port 25 status. Some hosts returned unexpected errors. Check your network configuration.'
            : 'DNS or network issues detected. Verify your internet connection and DNS settings.',
        timestamp: new Date().toISOString()
    };
}


module.exports = {
    checkPort25Connectivity,
    testSingleHost,
    classifyPort25Error
};
