# Therefore Quoter Backend

Node.js/Express.js API for the Therefore™ Quoter module. Handles document processing, DOCX/PDF conversion, and AI-powered analysis using Claude.

## Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn

### Setup

1. **Navigate to backend directory:**
   ```bash
   cd therefore-quoter/backend
   ```

2. **Copy environment variables:**
   ```bash
   cp ../../.env .env
   ```
   Or create one with:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-your-api-key-here
   PORT=3001
   NODE_ENV=development
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the server:**
   ```bash
   npm run dev
   # or
   npm start
   ```

Server will run on `http://localhost:3001` (or configured PORT)

## Available Routes

See `src/` directory for implemented routes and middleware.

### File Processing
- Supports: `.docx`, `.pdf`, and other formats
- Uses `mammoth` for DOCX parsing
- Uses `pdf-parse` for PDF extraction
- Generates DOCX output with Claude analysis

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| ANTHROPIC_API_KEY | Yes | - | Anthropic API key |
| PORT | No | 3001 | Server port |
| NODE_ENV | No | development | Environment (development/production) |

## Dependencies

- `express` - Web framework
- `@anthropic-ai/sdk` - Claude API client
- `multer` - File upload handling
- `mammoth` - DOCX parsing
- `pdf-parse` - PDF extraction
- `docx` - DOCX generation
- `cors` - Cross-origin requests
- `dotenv` - Environment variables

## Development

Runs with `node` directly (no watch mode configured).

To add watch mode:
```bash
npm install -D nodemon
```

Then update scripts in package.json:
```json
"dev": "nodemon src/server.js"
```

## Notes

- Ensure parent directory has `.env` with `ANTHROPIC_API_KEY`
- File uploads are handled via multipart/form-data
- Check `src/server.js` for main entry point
