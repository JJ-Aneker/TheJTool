# TheJTool & Therefore Agents - Startup Guide

Complete guide to set up and run both projects in local development environment.

## Project Structure

```
C:\GitHub\
├── TheJTool/                          # Main frontend + quoter backend
│   ├── .env                          # Frontend Supabase config (git ignored)
│   ├── .env.example                  # Frontend template
│   ├── app.js                        # Express frontend server
│   ├── index.html                    # Frontend UI
│   └── therefore-quoter/
│       └── backend/                  # Document processing microservice
│           ├── .env                  # Copy from ../.env or create new
│           ├── src/server.js         # Entry point
│           ├── package.json
│           └── README.md             # Detailed backend docs
│
└── therefore-agents-api/             # Standalone API for Claude agents
    ├── .env                          # Agent API config (git ignored)
    ├── .env.example                  # Config template
    ├── src/app.js                    # Entry point
    ├── src/routes/agents.js          # Agent endpoints
    ├── package.json
    └── README.md                     # Detailed API docs
```

## Quick Start (All-in-One)

### 1. Configure Environment

**For TheJTool frontend:**
```bash
cd C:\GitHub\TheJTool
cp .env.example .env
```

Edit `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-key-here
```

**For Quoter Backend (optional):**
```bash
cd C:\GitHub\TheJTool\therefore-quoter\backend
# Copy parent .env or create new one with ANTHROPIC_API_KEY
```

**For Agents API:**
```bash
cd C:\GitHub\therefore-agents-api
cp .env.example .env
```

Edit `.env`:
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
PORT=3000
```

### 2. Install Dependencies

```bash
# TheJTool frontend
cd C:\GitHub\TheJTool
npm install

# Quoter backend
cd C:\GitHub\TheJTool\therefore-quoter\backend
npm install

# Agents API
cd C:\GitHub\therefore-agents-api
npm install
```

All dependencies are already installed in development environment.

### 3. Start Services

Open 3 terminals:

**Terminal 1 - Frontend (port 5173):**
```bash
cd C:\GitHub\TheJTool
npm run dev
```

**Terminal 2 - Quoter Backend (port 3001):**
```bash
cd C:\GitHub\TheJTool\therefore-quoter\backend
npm start
```

**Terminal 3 - Agents API (port 3000):**
```bash
cd C:\GitHub\therefore-agents-api
npm start
```

## Port Reference

| Service | Port | URL |
|---------|------|-----|
| TheJTool Frontend | 5173 | http://localhost:5173 |
| Quoter Backend | 3001 | http://localhost:3001 |
| Agents API | 3000 | http://localhost:3000 |

## Health Checks

```bash
# Agents API
curl http://localhost:3000/health
# Response: { "status": "ok", "message": "Therefore Agents API funcionando" }

# Agents API Debug
curl http://localhost:3000/debug
# Shows API key status

# Quoter Backend
curl http://localhost:3001/health (if implemented)
```

## Environment Variables Reference

### TheJTool Frontend (.env)
| Variable | Required | Description |
|----------|----------|-------------|
| VITE_SUPABASE_URL | Yes | Supabase project URL |
| VITE_SUPABASE_ANON_KEY | Yes | Supabase anonymous key |

### Quoter Backend (.env)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| ANTHROPIC_API_KEY | Yes | - | Claude API key |
| PORT | No | 3001 | Server port |

### Agents API (.env)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| ANTHROPIC_API_KEY | Yes | - | Claude API key |
| PORT | No | 3000 | Server port |
| SUPABASE_* | No | - | Optional database config |

## Common Issues

### "EADDRINUSE" Port Already in Use
Kill the process using that port:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Missing Dependencies
```bash
npm install
```

### .env File Not Found
Copy from `.env.example`:
```bash
cp .env.example .env
```

### ANTHROPIC_API_KEY Not Recognized
- Check `.env` exists in the correct directory
- Verify `dotenv` is loaded: `require('dotenv').config();`
- Restart the server after changing `.env`

## Development Notes

- **Frontend**: Uses Vite for fast development
- **Quoter Backend**: Node + Express, handles document processing
- **Agents API**: Lightweight Express API for Claude integration
- All services use `.env` for configuration (git-ignored)
- See individual `README.md` files for detailed API documentation

## Next Steps

1. Approve applications in production/staging
2. Configure Therefore™ API credentials (if using Therefore integration)
3. Set up Supabase database (if using database features)
4. Test API endpoints using provided curl examples

---

For detailed information on each service, see:
- [Quoter Backend README](./TheJTool/therefore-quoter/backend/README.md)
- [Agents API README](./therefore-agents-api/README.md)
