import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar .env desde la raíz del proyecto
dotenv.config({ path: join(__dirname, '.env') });

import { createClient } from '@supabase/supabase-js';
import analyzeHandler from './api/analyze.js';
import buildDocxHandler from './api/build-docx.js';
import executeSqlHandler from './api/execute-sql.js';
import updateUserRoleHandler from './api/update-user-role.js';
import anthropicStatusHandler from './api/anthropic-status.js';
import anthropicUsageHandler from './api/anthropic-usage.js';
import anthropicApiKeyHandler from './api/anthropic-apikey.js';
import anthropicTestHandler from './api/anthropic-test.js';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Admin authentication middleware
async function verifyAdmin(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// EFDT API routes
app.post('/api/analyze', analyzeHandler);
app.post('/api/build-docx', buildDocxHandler);

// Admin routes
app.post('/api/admin/execute-sql', executeSqlHandler);
app.post('/api/admin/update-user-role', updateUserRoleHandler);

// Anthropic API management routes (admin only)
app.get('/api/admin/anthropic/status', verifyAdmin, anthropicStatusHandler);
app.get('/api/admin/anthropic/usage', verifyAdmin, anthropicUsageHandler);
app.get('/api/admin/anthropic/usage/history', verifyAdmin, anthropicUsageHandler);
app.put('/api/admin/anthropic/apikey', verifyAdmin, anthropicApiKeyHandler);
app.post('/api/admin/anthropic/test', verifyAdmin, anthropicTestHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api/analyze`);
  console.log(`📍 Build endpoint: http://localhost:${PORT}/api/build-docx`);
});
