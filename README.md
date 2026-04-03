# Email Verifier

## ⚠️ Important Network Requirement

**This application requires outbound port 25 (SMTP) access to function properly.** Port 25 is essential for connecting to mail servers and verifying email addresses.

### Port 25 Availability

- **Most residential ISPs block port 25** to prevent spam (some exceptions exist, like Airtel FTTH in India)
- **Many cloud providers block port 25 by default** but can enable it upon request
- **VPS and dedicated servers** typically have port 25 open

### How to Get Port 25 Access

If your port 25 is blocked:

1. **Contact your server/cloud provider** (AWS, DigitalOcean, Hetzner, etc.)
2. **Request outbound port 25 access** for hosting your SMTP server
3. **Explain your use case**: "I need to host my own SMTP server for email verification"
4. Most providers will enable it within 24-48 hours

**Need to check if port 25 is accessible?** The dashboard includes a built-in port 25 connectivity checker that will notify you if port 25 is blocked.

---

## What This Project Does

Email Verifier is a comprehensive email validation service that checks the deliverability and validity of email addresses. The system verifies emails and returns one of four statuses: valid, invalid, catch-all, or unverifiable, along with detailed reasons for each result.

## Features

- Single email verification through the dashboard
- Bulk email verification via CSV upload (up to 100,000 emails)
- Automatic email column detection in CSV files
- Real-time verification progress tracking
- Detailed verification results with status breakdown
- Download verification results as CSV
- Complete verification history with filtering options
- API access for programmatic verification
- Create API keys with custom names and optional expiry dates
- List all active API keys with last used timestamps
- Copy API keys to clipboard
- Revoke API keys instantly
- View and redownload results from past verifications
- Webhook support for API verifications

## Verification Statuses

- **Valid** - Email exists and can receive mail
- **Invalid** - Email does not exist or cannot receive mail
- **Catch-All** - Domain accepts all emails, cannot verify specific address
- **Unverifiable** - Verification could not be completed

## How to Start

Follow these steps to get the application running:

### Step 1: Clone the repository

```bash
git clone https://github.com/BrandNav-io/BrandNavEmailVerifier2.0.git
cd BrandNavEmailVerifier2.0
```

### Step 2: Configure environment variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
```

Add the following required variables:

```env
MX_DOMAIN=yourdomain.com
EM_DOMAIN=yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_secure_password
```

### Step 3: Install dependencies

Install dependencies for both frontend and backend:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to project root
cd ..
```

### Step 4: Start with Docker Compose

From the project root directory, start the application:

```bash
docker compose up
```

To run in detached mode (background):

```bash
docker compose up -d
```

The application will be available at `http://localhost:5000`

### Step 5: Access the application

Open your browser and navigate to:

```
http://localhost:5000
```

Log in using the `ADMIN_EMAIL` and `ADMIN_PASSWORD` you configured in Step 2.

### Stopping the application

To stop the Docker containers:

```bash
docker compose down
```

To view logs:

```bash
docker compose logs -f
```

## Requirements

- Docker and Docker Compose installed
- Outbound access to port 25 for SMTP verification
- Node.js 20 or higher if running without Docker

## Data Persistence

The application uses bind mounts to persist data on your host machine in the `.data` directory:
- `.data/db` - SQLite database files containing all verification results and history
- `.data/csv` - Uploaded CSV files
- `.data/logs` - Application logs

Your data is stored directly on your host machine and remains safe across container restarts.

## Documentation

### API Access & Programmatic Verification

Want to verify emails programmatically using API keys? We provide comprehensive API documentation to help you integrate email verification directly into your applications.

📦 **[Postman Collection](./documentations/BrandNavEmailVerifier-postman-collection.json)** - Import this file into Postman to quickly test the API endpoints

**How to use the Postman Collection:**
1. Download the `BrandNavEmailVerifier-postman-collection.json` file from the documentations folder
2. Open Postman and click **Import** in the top left
3. Drag and drop the JSON file or click **Upload Files** and select it
4. Once imported, go to the collection variables and update:
   - `base_url` - Your server URL (default: `http://localhost:5000`)
   - `api_key` - Your API key from the dashboard (create one in Settings → API Keys)
5. Start testing! First, run the **Submit Email Verification** request. The `verification_request_id` from the response will be automatically saved as a collection variable
6. Then use the **Get Verification Status** or **Get Verification Results** requests, which will automatically use the saved `verification_request_id`
7. The collection includes examples for submitting verifications, checking status, getting results, and viewing history

📖 **[API Reference Documentation](./documentations/API_REFERENCE.md)**

This guide covers:
- API key authentication and management
- Making verification requests with the REST API
- Webhook delivery with automatic retries
- Polling for results as a fallback
- Pagination for large result sets
- Complete field descriptions and result interpretation
- Error handling and best practices
- Code examples with cURL
- FAQ and troubleshooting

### System Architecture

For developers who want to understand how the system works internally, contribute to the project, or deploy and customize the application, we provide detailed system architecture documentation.

📖 **[System Architecture Documentation](./documentations/system-architecture.md)**

This documentation will cover:
- High-level system architecture and components
- Database schema and relationships
- Worker queue and job processing system
- SMTP verification flow and techniques
- Catch-all detection and caching mechanisms
- Anti-greylisting retry logic
- Frontend and backend technology stack
- Docker deployment architecture
- Security considerations and best practices
