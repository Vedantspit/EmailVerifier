const net = require('net');
const {
    checkPort25Connectivity,
    testSingleHost,
    classifyPort25Error
} = require('../functions/verifier/utils/checkPort25');


// Mock net module
jest.mock('net');


describe('checkPort25 - Port 25 Connectivity Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });


    describe('classifyPort25Error', () => {

        test('should classify ECONNREFUSED as blocked', () => {
            const error = new Error('Connection refused');
            error.code = 'ECONNREFUSED';

            const result = classifyPort25Error(error);

            expect(result.blocked).toBe(true);
            expect(result.severity).toBe('high');
            expect(result.errorCode).toBe('ECONNREFUSED');
            expect(result.reason).toContain('Connection refused');
        });


        test('should classify ETIMEDOUT as blocked', () => {
            const error = new Error('Connection timeout');
            error.code = 'ETIMEDOUT';

            const result = classifyPort25Error(error);

            expect(result.blocked).toBe(true);
            expect(result.severity).toBe('medium');
            expect(result.errorCode).toBe('ETIMEDOUT');
        });


        test('should classify timeout message as blocked', () => {
            const error = new Error('Connection timeout');

            const result = classifyPort25Error(error);

            expect(result.blocked).toBe(true);
            expect(result.errorCode).toBe('TIMEOUT');
        });


        test('should classify ENETUNREACH as blocked', () => {
            const error = new Error('Network unreachable');
            error.code = 'ENETUNREACH';

            const result = classifyPort25Error(error);

            expect(result.blocked).toBe(true);
            expect(result.severity).toBe('high');
        });


        test('should classify ENOTFOUND as not blocked (DNS issue)', () => {
            const error = new Error('DNS lookup failed');
            error.code = 'ENOTFOUND';

            const result = classifyPort25Error(error);

            expect(result.blocked).toBe(false);
            expect(result.reason).toContain('DNS resolution failed');
        });


        test('should classify EADDRINUSE as not blocked', () => {
            const error = new Error('Address in use');
            error.code = 'EADDRINUSE';

            const result = classifyPort25Error(error);

            expect(result.blocked).toBe(false);
            expect(result.severity).toBe('low');
        });


        test('should classify unknown errors', () => {
            const error = new Error('Some random error');
            error.code = 'ESOMEERROR';

            const result = classifyPort25Error(error);

            expect(result.blocked).toBe('unknown');
            expect(result.severity).toBe('medium');
        });

    });


    describe('testSingleHost', () => {

        test('should resolve when receiving valid SMTP banner', async () => {
            const mockSocket = {
                setTimeout: jest.fn(),
                connect: jest.fn(),
                destroy: jest.fn(),
                on: jest.fn()
            };

            net.Socket.mockImplementation(() => mockSocket);

            // Simulate successful connection
            mockSocket.on.mockImplementation((event, callback) => {
                if (event === 'connect') {
                    setTimeout(() => callback(), 10);
                } else if (event === 'data') {
                    setTimeout(() => callback(Buffer.from('220 mx.google.com ESMTP ready\r\n')), 20);
                }
            });

            const result = await testSingleHost('gmail-smtp-in.l.google.com', 5000);

            expect(result.success).toBe(true);
            expect(result.banner).toContain('220');
            expect(result.responseTime).toBeGreaterThanOrEqual(0);
            expect(mockSocket.destroy).toHaveBeenCalled();
        });


        test('should reject on connection timeout', async () => {
            const mockSocket = {
                setTimeout: jest.fn(),
                connect: jest.fn(),
                destroy: jest.fn(),
                on: jest.fn()
            };

            net.Socket.mockImplementation(() => mockSocket);

            // Simulate timeout
            mockSocket.on.mockImplementation((event, callback) => {
                if (event === 'timeout') {
                    setTimeout(() => callback(), 10);
                }
            });

            await expect(testSingleHost('test.example.com', 5000))
                .rejects
                .toThrow('Connection timeout');

            expect(mockSocket.destroy).toHaveBeenCalled();
        });


        test('should reject on connection error', async () => {
            const mockSocket = {
                setTimeout: jest.fn(),
                connect: jest.fn(),
                destroy: jest.fn(),
                on: jest.fn()
            };

            net.Socket.mockImplementation(() => mockSocket);

            // Simulate error
            const testError = new Error('Connection refused');
            testError.code = 'ECONNREFUSED';

            mockSocket.on.mockImplementation((event, callback) => {
                if (event === 'error') {
                    setTimeout(() => callback(testError), 10);
                }
            });

            await expect(testSingleHost('test.example.com', 5000))
                .rejects
                .toThrow('Connection refused');
        });


        test('should reject if invalid SMTP banner received', async () => {
            const mockSocket = {
                setTimeout: jest.fn(),
                connect: jest.fn(),
                destroy: jest.fn(),
                on: jest.fn()
            };

            net.Socket.mockImplementation(() => mockSocket);

            // Simulate receiving invalid banner
            mockSocket.on.mockImplementation((event, callback) => {
                if (event === 'connect') {
                    setTimeout(() => callback(), 10);
                } else if (event === 'data') {
                    setTimeout(() => callback(Buffer.from('500 Error\r\n')), 20);
                }
            });

            await expect(testSingleHost('test.example.com', 5000))
                .rejects
                .toThrow('Invalid SMTP banner');
        });

    });


    describe('checkPort25Connectivity', () => {

        test('should return success when first host connects', async () => {
            const mockSocket = {
                setTimeout: jest.fn(),
                connect: jest.fn(),
                destroy: jest.fn(),
                on: jest.fn()
            };

            net.Socket.mockImplementation(() => mockSocket);

            // Simulate successful connection
            mockSocket.on.mockImplementation((event, callback) => {
                if (event === 'connect') {
                    setTimeout(() => callback(), 10);
                } else if (event === 'data') {
                    setTimeout(() => callback(Buffer.from('220 mxshield.brandnavshield.com ESMTP\r\n')), 20);
                }
            });

            const result = await checkPort25Connectivity();

            expect(result.success).toBe(true);
            expect(result.port25Open).toBe(true);
            expect(result.canVerifyEmails).toBe(true);
            expect(result.testedHost).toBe('mxshield.brandnav.io');
            expect(result.provider).toBe('BrandNav');
            expect(result.attemptedHosts).toHaveLength(1);
            expect(result.smtpBanner).toContain('220');
            expect(result.error).toBeNull();
        });


        test('should try multiple hosts and succeed on fallback', async () => {
            let attemptCount = 0;
            net.Socket.mockImplementation(() => {
                const currentAttempt = attemptCount;
                attemptCount++;

                const socket = {
                    setTimeout: jest.fn(),
                    connect: jest.fn(),
                    destroy: jest.fn(),
                    on: jest.fn()
                };

                // First attempt fails, second succeeds
                socket.on.mockImplementation((event, callback) => {
                    if (currentAttempt === 0) {
                        // First host fails
                        if (event === 'error') {
                            const error = new Error('Connection refused');
                            error.code = 'ECONNREFUSED';
                            setTimeout(() => callback(error), 10);
                        }
                    } else {
                        // Second host succeeds
                        if (event === 'connect') {
                            setTimeout(() => callback(), 10);
                        } else if (event === 'data') {
                            setTimeout(() => callback(Buffer.from('220 gmail-smtp-in.l.google.com ESMTP\r\n')), 20);
                        }
                    }
                });

                return socket;
            });

            const result = await checkPort25Connectivity();

            expect(result.success).toBe(true);
            expect(result.port25Open).toBe(true);
            expect(result.testedHost).toBe('gmail-smtp-in.l.google.com');
            expect(result.provider).toBe('Google');
            expect(result.attemptedHosts).toHaveLength(2);
        });


        test('should return blocked status when all hosts fail with ECONNREFUSED', async () => {
            const mockSocket = {
                setTimeout: jest.fn(),
                connect: jest.fn(),
                destroy: jest.fn(),
                on: jest.fn()
            };

            net.Socket.mockImplementation(() => mockSocket);

            // All connections fail
            mockSocket.on.mockImplementation((event, callback) => {
                if (event === 'error') {
                    const error = new Error('Connection refused');
                    error.code = 'ECONNREFUSED';
                    setTimeout(() => callback(error), 10);
                }
            });

            const result = await checkPort25Connectivity();

            expect(result.success).toBe(true);
            expect(result.port25Open).toBe(false);
            expect(result.canVerifyEmails).toBe(false);
            expect(result.testedHost).toBeNull();
            expect(result.attemptedHosts).toHaveLength(5);
            expect(result.errors).toHaveLength(5);
            expect(result.recommendation).toContain('Port 25 is blocked');
            expect(result.errors[0].blocked).toBe(true);
        });


        test('should handle DNS failures appropriately', async () => {
            const mockSocket = {
                setTimeout: jest.fn(),
                connect: jest.fn(),
                destroy: jest.fn(),
                on: jest.fn()
            };

            net.Socket.mockImplementation(() => mockSocket);

            // All connections fail with DNS error
            mockSocket.on.mockImplementation((event, callback) => {
                if (event === 'error') {
                    const error = new Error('DNS lookup failed');
                    error.code = 'ENOTFOUND';
                    setTimeout(() => callback(error), 10);
                }
            });

            const result = await checkPort25Connectivity();

            expect(result.success).toBe(true);
            expect(result.port25Open).toBe(false);
            expect(result.recommendation).toContain('DNS or network issues');
            expect(result.errors[0].blocked).toBe(false);
        });


        test('should include timestamp in result', async () => {
            const mockSocket = {
                setTimeout: jest.fn(),
                connect: jest.fn(),
                destroy: jest.fn(),
                on: jest.fn()
            };

            net.Socket.mockImplementation(() => mockSocket);

            // Simulate successful connection
            mockSocket.on.mockImplementation((event, callback) => {
                if (event === 'connect') {
                    setTimeout(() => callback(), 10);
                } else if (event === 'data') {
                    setTimeout(() => callback(Buffer.from('220 ESMTP ready\r\n')), 20);
                }
            });

            const result = await checkPort25Connectivity();

            expect(result.timestamp).toBeDefined();
            expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
        });


        test('should track total time for all attempts', async () => {
            const mockSocket = {
                setTimeout: jest.fn(),
                connect: jest.fn(),
                destroy: jest.fn(),
                on: jest.fn()
            };

            net.Socket.mockImplementation(() => mockSocket);

            mockSocket.on.mockImplementation((event, callback) => {
                if (event === 'error') {
                    const error = new Error('Timeout');
                    setTimeout(() => callback(error), 100);
                }
            });

            const result = await checkPort25Connectivity();

            expect(result.totalTime).toBeGreaterThan(0);
        });

    });

});
