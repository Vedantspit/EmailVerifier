# Email Verifier API Reference

**Base URL:** `http://localhost:5000` (or your deployed URL)

---

## Authentication

All API endpoints require an API key sent in the Authorization header:

```http
Authorization: Bearer brndnv_sk_[your-32-char-key]
```

**How to get an API key:**
1. Log in to your dashboard at the base URL
2. Navigate to Settings → API Keys
3. Click "Create Token" and give it a name
4. Copy your API key immediately - **it will only be shown once**
5. Store it securely in environment variables, never in code or frontend

---

## Endpoints

### 1. Submit Verification Request
**POST** `/api/verifier/v1/verify`

**Auth:** API Key required

**Payload:**
```json
{
  "emails": ["email1@example.com", "email2@example.com"],
  "responseUrl": "https://your-webhook.com/callback"
}
```
- `emails`: Array of email addresses (1-10,000 emails) - **required**
- `responseUrl`: Webhook URL for automatic results notification - **optional**

**Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Verification request accepted",
  "verificationRequestId": "abc-123-def-456",
  "status": "pending",
  "totalEmails": 2
}
```

**Errors:**
- `400` - Invalid payload (missing emails, exceeds 10,000 limit, invalid format)
- `401` - Invalid/expired API key

**Important:** Save the `verificationRequestId` from the response to check status and retrieve results.

---

### 2. Check Verification Status
**GET** `/api/verifier/verification/:verification_request_id/status`

**Auth:** API Key required

**Response (200 - Processing):**
```json
{
  "success": true,
  "status": "processing",
  "verificationRequestId": "abc-123-def-456",
  "requestType": "api",
  "progress": {
    "totalEmails": 100,
    "processedEmails": 45,
    "percentComplete": 45
  },
  "createdAt": 1234567890,
  "updatedAt": 1234567891
}
```

**Response (200 - Completed):**
```json
{
  "success": true,
  "status": "completed",
  "verificationRequestId": "abc-123-def-456",
  "requestType": "api",
  "progress": {
    "totalEmails": 100,
    "processedEmails": 100,
    "percentComplete": 100
  },
  "statistics": {
    "total": 100,
    "valid": 85,
    "invalid": 10,
    "catch_all": 3,
    "unverifiable": 2
  },
  "completedAt": 1234567900
}
```

**Status Values:**
- `pending` - Queued for processing
- `processing` - Currently verifying emails
- `completed` - Verification finished
- `failed` - Encountered error

**Errors:**
- `401` - Invalid/expired API key
- `404` - Verification request not found

---

### 3. Get Verification Results
**GET** `/api/verifier/verification/:verification_request_id/results?page=1&per_page=20`

**Auth:** API Key required

**Query Params:**
- `page` (optional, default: 1)
- `per_page` (optional, default: 20, max: 100)

**Response (200 - Still Processing):**
Returns same format as status endpoint while processing.

**Response (200 - Completed):**
```json
{
  "success": true,
  "status": "completed",
  "verificationRequestId": "abc-123-def-456",
  "results": [
    {
      "email": "user@example.com",
      "status": "valid",
      "reason": "This is a valid email address!"
    },
    {
      "email": "invalid@fake.com",
      "status": "invalid",
      "reason": "This email doesn't have an associated SMTP server."
    },
    {
      "email": "info@company.com",
      "status": "catch-all",
      "reason": "Provided email SMTP has Catch-All enabled."
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "totalResults": 100,
    "totalPages": 5
  },
  "statistics": {
    "total": 100,
    "valid": 85,
    "invalid": 10,
    "catch_all": 3,
    "unverifiable": 2
  }
}
```

**Errors:**
- `401` - Invalid/expired API key
- `404` - Verification request not found

---

### 4. Check Port 25 Connectivity
**GET** `/api/verifier/port25-check`

**Auth:** Session OR API Key

**Description:**
Checks if outbound SMTP port 25 is accessible from your server/network. This is essential for email verification as port 25 is required to connect to mail servers. This endpoint helps diagnose connectivity issues and verify email verification capability.

**Response (200 - Port Open):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "port25Open": true,
    "canVerifyEmails": true,
    "testedHost": "mxshield.brandnav.io",
    "provider": "BrandNav",
    "attemptedHosts": ["mxshield.brandnav.io"],
    "responseTime": 234,
    "totalTime": 456,
    "smtpBanner": "220 mxshield.brandnav.io ESMTP",
    "error": null,
    "errors": [],
    "recommendation": null,
    "timestamp": "2025-11-07T10:30:00.000Z"
  }
}
```

**Response (200 - Port Blocked):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "port25Open": false,
    "canVerifyEmails": false,
    "testedHost": null,
    "provider": null,
    "attemptedHosts": [
      "mxshield.brandnav.io",
      "gmail-smtp-in.l.google.com",
      "mx-biz.mail.am0.yahoodns.net",
      "mail.protection.outlook.com",
      "mx1.zoho.com"
    ],
    "responseTime": null,
    "totalTime": 25234,
    "smtpBanner": null,
    "error": "All connection attempts failed",
    "errors": [
      {
        "host": "mxshield.brandnav.io",
        "provider": "BrandNav",
        "error": "ECONNREFUSED",
        "reason": "Connection refused - Port 25 likely blocked by firewall/ISP",
        "severity": "high",
        "blocked": true
      }
    ],
    "recommendation": "Port 25 is blocked by your network/ISP. Consider using a VPS or cloud server with port 25 access for email verification.",
    "timestamp": "2025-11-07T10:30:00.000Z"
  }
}
```

**Use Cases:**
- Pre-flight check before submitting email verifications
- Diagnostic tool to troubleshoot verification issues
- Network connectivity validation
- Monitoring email verification capability

**curl Examples:**
```bash
# With session authentication (after login)
curl -X GET http://localhost:5000/api/verifier/port25-check \
  -H "Cookie: connect.sid=your-session-cookie"

# With API key authentication
curl -X GET http://localhost:5000/api/verifier/port25-check \
  -H "Authorization: Bearer brndnv_sk_yourkey"
```

**Errors:**
- `401` - Unauthorized (not authenticated)
- `500` - Internal Server Error (check failed unexpectedly)

**Important Notes:**
- Port 25 is frequently blocked by residential ISPs and some cloud providers
- The check tests multiple reliable SMTP servers (BrandNav, Google, Yahoo, Microsoft, Zoho)
- Check stops on first successful connection (fastest when port is open)
- Maximum test duration: ~25 seconds if all servers fail
- Typical success response time: < 5 seconds

---

## Email Verification Statuses

- **valid** - Email is deliverable and can receive mail. Passes all SMTP checks, has valid MX records, and is not disposable.
- **invalid** - Email doesn't exist or can't receive mail. Reasons include: no SMTP server, full inbox, not deliverable, or disposable email.
- **catch-all** - Domain accepts all emails, so specific address cannot be verified. The domain has catch-all enabled.
- **unverifiable** - Email verification could not be completed due to SMTP being disabled or other errors.

---

## Result Fields Explained

Each verified email result object contains:

- **email** - The email address that was verified
- **status** - Verification result: `valid`, `invalid`, `catch-all`, or `unverifiable`
- **reason** - Human-readable explanation for the status

Additional fields available in the full verification object (if returned):

- **reachable** - `yes`, `no`, or `unknown`
- **smtp** - Object with: `host_exists`, `full_inbox`, `catch_all`, `deliverable`, `disabled`
- **disposable** - Boolean indicating if it's a temporary/disposable email service
- **role_account** - Boolean indicating if it's a role-based address (info@, admin@, support@)
- **free** - Boolean indicating if it's a free email provider (Gmail, Yahoo, Outlook)
- **has_mx_records** - Boolean indicating if domain has mail exchange records
- **mx** - Array of MX records with Host and Pref (preference)
- **gravatar** - Gravatar information if available
- **suggestion** - Suggested correction for misspelled domains

---

## Getting Results: Two Options

### Option 1: Webhook (Recommended)

Provide a `responseUrl` when submitting verification. Results will be automatically POST to your webhook when complete.

**Webhook Features:**
- Automatic retry with exponential backoff (5 attempts)
- Results saved even if webhook fails
- Can still poll as backup
- Reduces API calls and server load

**Webhook Payload Format:**
Same as the results endpoint response (see endpoint #3 above).

### Option 2: Polling

If no webhook provided, poll the results endpoint every **5-10 seconds** until `status` is `completed`.

**Best Practice:** Use webhooks for automatic delivery, implement polling as fallback.

---

## Rate Limits & Timing

**Request Limits:**
- Minimum: 1 email per request
- Maximum: 10,000 emails per request
- For lists over 10,000: Split into multiple requests

**Verification Time Estimates:**
- Single email: 1-5 seconds
- Small batch (1-100): 10-30 seconds
- Large batch (1,000): 1-5 minutes
- Maximum batch (10,000): 5-10 minutes

**API Key Expiration:** As configured during creation (default: 90 days)

---

## Example Workflow

```bash
# 1. Submit verification request
curl -X POST http://localhost:5000/api/verifier/v1/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer brndnv_sk_yourkey" \
  -d '{
    "emails": ["test@example.com", "user@domain.com"],
    "responseUrl": "https://your-webhook.com/callback"
  }'

# Response:
# {
#   "success": true,
#   "verificationRequestId": "abc-123-def-456",
#   "status": "pending",
#   "totalEmails": 2
# }

# 2. Check status (poll every 5-10 seconds)
curl -X GET http://localhost:5000/api/verifier/verification/abc-123-def-456/status \
  -H "Authorization: Bearer brndnv_sk_yourkey"

# Response (processing):
# {
#   "success": true,
#   "status": "processing",
#   "progress": {
#     "totalEmails": 2,
#     "processedEmails": 1,
#     "percentComplete": 50
#   }
# }

# 3. Get results (when status is "completed")
curl -X GET http://localhost:5000/api/verifier/verification/abc-123-def-456/results \
  -H "Authorization: Bearer brndnv_sk_yourkey"

# Response:
# {
#   "success": true,
#   "status": "completed",
#   "results": [
#     {
#       "email": "test@example.com",
#       "status": "valid",
#       "score": 95
#     }
#   ]
# }

# 4. Get results with pagination (for large batches)
curl -X GET "http://localhost:5000/api/verifier/verification/abc-123-def-456/results?page=2&per_page=50" \
  -H "Authorization: Bearer brndnv_sk_yourkey"
```

---

## Error Handling

**HTTP Status Codes:**
- `200` - Success
- `202` - Accepted (async processing started)
- `400` - Bad Request (invalid payload, validation failed)
- `401` - Unauthorized (invalid/missing/expired API key)
- `404` - Not Found (verification request doesn't exist)
- `500` - Internal Server Error

**Common Errors:**
- Empty emails array
- Invalid email format
- Too many emails (over 10,000)
- Invalid or missing API key in Authorization header
- Expired or revoked API key
- Invalid webhook URL format

**Error Response Format:**
```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

---

## Best Practices

✅ **Save verification_request_id** from every submit request

✅ **Use webhooks** for automatic result delivery instead of constant polling

✅ **Implement polling fallback** in case webhook endpoint is down

✅ **Batch large lists** into chunks of 1,000-5,000 emails for better tracking

✅ **Secure API keys** in environment variables, never in code or frontend

✅ **Handle errors gracefully** with user-friendly messages and retry logic

✅ **Poll every 5-10 seconds** - not more frequently to avoid unnecessary load

✅ **Use pagination** for large result sets (per_page max: 100)

---

## FAQ

**Q: What if my webhook is down?**
Results are always saved. Retrieve via polling anytime using the verification_request_id.

**Q: Can I check old verifications?**
Yes, results are stored permanently. Use the verification_request_id anytime.

**Q: Do results get cached?**
No, real-time checks are performed every time for accurate results.

**Q: What's the difference between catch-all and valid?**
Valid means the specific mailbox exists. Catch-all means the domain accepts everything, so we can't verify if the specific address exists.

**Q: Why do some verifications take longer?**
Greylisting, slow mail servers, network issues, or large batch sizes can add delays.

**Q: Can I verify the same email multiple times?**
Yes, each request performs a fresh verification - no caching.

---

## Quick Testing with Postman

Import the Postman collection for instant testing:

**Location:** `documentations/BrandNavEmailVerifier-postman-collection.json`

**Features:**
- Pre-configured endpoints with examples
- Automatic verification_request_id capture
- Variable management for base_url and api_key
- Response examples for all scenarios

**Setup:**
1. Import the JSON file into Postman
2. Update collection variables: `base_url` and `api_key`
3. Start testing immediately

---

## Support

For API key requests, technical support, or troubleshooting, contact your system administrator.

**Debugging Tips:**
- Check error messages in API responses
- Verify API key format starts with `brndnv_sk_`
- Ensure Authorization header format: `Bearer your_key`
- Use Postman collection for quick testing
- Review verification status endpoint for processing issues
