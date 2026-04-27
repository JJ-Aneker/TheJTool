# Testing Guide - Therefore Agents Local Setup

Step-by-step guide to test both backends in local development.

## Prerequisites

- Both `.env` files configured with API keys
- Node.js installed
- Dependencies installed (`npm install` in each directory)

## Quick Test (Automated)

### Option 1: Start All Services
```powershell
cd C:\GitHub
.\start-all.ps1
```

Opens both services in separate terminal windows.

### Option 2: Test Running Services
```powershell
cd C:\GitHub
.\test-local-setup.ps1
```

Verifies both backends are healthy and responding.

---

## Manual Testing (Step-by-Step)

### Step 1: Configure Environment

**For Agents API:**
```bash
cd C:\GitHub\therefore-agents-api
cat .env.example
# Verify .env has:
# - ANTHROPIC_API_KEY=sk-ant-xxxxx
# - PORT=3000 (or desired port)
```

**For Quoter Backend:**
```bash
cd C:\GitHub\TheJTool\therefore-quoter\backend
# Should inherit ANTHROPIC_API_KEY from parent .env
# or create local .env with PORT=3001
```

### Step 2: Start Services (In Separate Terminals)

**Terminal 1 - Agents API:**
```bash
cd C:\GitHub\therefore-agents-api
npm start
# Expected: "Servidor corriendo en http://localhost:3000"
```

**Terminal 2 - Quoter Backend:**
```bash
cd C:\GitHub\TheJTool\therefore-quoter\backend
npm start
# Expected: Server starts on port 3001
```

### Step 3: Test Agents API (Port 3000)

**Health Check:**
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Therefore Agents API funcionando"
}
```

**Debug Endpoint (API Key Status):**
```bash
curl http://localhost:3000/debug
```

Expected response:
```json
{
  "hasKey": true,
  "keyStart": "sk-ant-api0"  // First 10 chars of key
}
```

**List Agent Routes:**
```bash
curl http://localhost:3000/api/agents
# Returns available agent endpoints
```

### Step 4: Test Quoter Backend (Port 3001)

**Health Check (if implemented):**
```bash
curl http://localhost:3001/health
```

**Test Document Processing:**
```bash
# Upload a DOCX file
curl -X POST http://localhost:3001/process \
  -F "file=@document.docx"
```

(Replace with actual implementation endpoints)

### Step 5: Integration Test

**Test Communication Between Services:**

1. **From Frontend**, call Agents API:
   ```javascript
   fetch('http://localhost:3000/api/agents/validator', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       messages: [{ role: 'user', content: 'Test message' }]
     })
   })
   ```

2. **Check Response:**
   - Should receive Claude's response
   - No CORS errors
   - API key working

---

## Troubleshooting

### Problem: "Port Already in Use"

**Solution 1: Kill Process**
```powershell
# Find process using port 3000
Get-NetTCPConnection -LocalPort 3000

# Kill by PID
Stop-Process -Id <PID> -Force
```

**Solution 2: Use Different Port**
```bash
PORT=3002 npm start
# Update your API calls to use 3002
```

### Problem: "ENOTFOUND localhost"

Check that services are actually running:
```bash
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

### Problem: "Cannot find module..."

Install dependencies:
```bash
npm install

# Or completely rebuild
rm -r node_modules
npm install
```

### Problem: ".env not loaded"

Verify file exists and is in correct directory:
```bash
# Agents API
ls C:\GitHub\therefore-agents-api\.env

# Quoter Backend
ls C:\GitHub\TheJTool\therefore-quoter\backend\.env
```

Check that `dotenv` is loaded in code:
```javascript
require('dotenv').config(); // Must be first line
```

### Problem: "ANTHROPIC_API_KEY missing"

1. Check `.env` file:
   ```bash
   cat .env | grep ANTHROPIC
   ```

2. Verify it's the correct key from https://console.anthropic.com

3. Restart the service after adding the key

### Problem: CORS Error in Browser

Check that CORS is enabled in Express:
```javascript
const cors = require('cors');
app.use(cors()); // Allow all origins in development
```

---

## Expected API Responses

### Agents API - Health (200 OK)
```json
{
  "status": "ok",
  "message": "Therefore Agents API funcionando"
}
```

### Agents API - Debug (200 OK)
```json
{
  "hasKey": true,
  "keyStart": "sk-ant-api0"
}
```

### Agent Validator (200 OK)
```json
{
  "reply": "Claude's validation response here..."
}
```

### Errors

**400 Bad Request:**
```json
{
  "error": "Invalid request format"
}
```

**500 Server Error:**
```json
{
  "error": "Detailed error message"
}
```

---

## Performance Checks

### Response Time
```bash
# Time the request
time curl http://localhost:3000/health
```

Should be < 100ms for health checks.

### Load Test (Basic)
```bash
# Test with 10 concurrent requests
for i in {1..10}; do
  curl http://localhost:3000/health &
done
wait
```

### Memory Usage
Check Node process memory:
```powershell
Get-Process | Where-Object { $_.ProcessName -like "*node*" } | Select-Object ProcessName, WorkingSet
```

Should be < 100MB for idle server.

---

## Frontend Integration

Once backends are running, you can test from the frontend:

### Update API Base URL
In frontend code, set API endpoints:
```javascript
const API_AGENTS = 'http://localhost:3000/api/agents';
const API_QUOTER = 'http://localhost:3001';
```

### Test from Browser Console
```javascript
// Test Agents API
fetch('http://localhost:3000/health')
  .then(r => r.json())
  .then(data => console.log(data));

// Should log: { status: 'ok', message: '...' }
```

---

## CI/CD Testing

For automated testing, see:
- `.github/workflows/` for GitHub Actions
- Test commands in `package.json` scripts

Run tests:
```bash
npm test
```

---

## Logs and Debugging

### Enable Debug Mode
```bash
DEBUG=* npm start
# Shows detailed logs
```

### Monitor Logs Live
```bash
# In new terminal, tail logs
tail -f npm-debug.log
```

### Check Server Startup
Look for these messages:
```
Servidor corriendo en http://localhost:3000  ✓ Agents API
Servidor corriendo en http://localhost:3001  ✓ Quoter Backend
```

---

## Next Steps

✅ Health checks passing → Services are healthy
✅ API endpoints responding → Ready for integration
✅ No CORS errors → Frontend can call API
✅ API key working → Claude integration active

Once all tests pass:
1. Test with actual Therefore data
2. Configure Therefore API credentials (if needed)
3. Test full document processing workflow
4. Load test with production-like data
