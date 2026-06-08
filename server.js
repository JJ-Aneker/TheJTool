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
import { Router } from 'express';
import analyzeHandler from './api/analyze.js';
import buildDocxHandler from './api/build-docx.js';
import ganttHandler from './api/generate-gantt.js';
import exportGanttWithVBAHandler from './api/export-gantt-with-vba.js';
import convertGanttScriptHandler from './api/convert-gantt-script.js';
import executeSqlHandler from './api/execute-sql.js';
import updateUserRoleHandler from './api/update-user-role.js';
import bedrockHandler from './api/bedrock.js';
import verticalesHandlers from './api/verticales.js';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Servir archivos estáticos desde public/
app.use(express.static(join(__dirname, 'public')));

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
app.post('/api/generate-gantt', ganttHandler);
app.post('/api/export-gantt', exportGanttWithVBAHandler);
app.get('/api/gantt-converter-script', convertGanttScriptHandler);

// Admin routes
app.post('/api/admin/execute-sql', executeSqlHandler);
app.post('/api/admin/update-user-role', updateUserRoleHandler);

// AWS Bedrock API management routes (admin only)
// Unified endpoint: /api/bedrock?action=status|test|credentials|usage
app.get('/api/bedrock', verifyAdmin, bedrockHandler);
app.post('/api/bedrock', verifyAdmin, bedrockHandler);
app.put('/api/bedrock', verifyAdmin, bedrockHandler);

// Health check for Bedrock endpoint (for debugging)
app.get('/api/bedrock-health', (req, res) => {
  res.json({
    status: 'ok',
    env: {
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? '***' : 'NOT SET',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? '***' : 'NOT SET',
      AWS_REGION: process.env.AWS_REGION || 'NOT SET'
    }
  });
});

// Verticales management routes
app.get('/api/verticales', verticalesHandlers.getAllVerticals);
app.post('/api/verticales', verticalesHandlers.createVertical);
app.get('/api/verticales/:id', verticalesHandlers.getVerticalById);
app.put('/api/verticales/:id', verticalesHandlers.updateVertical);
app.delete('/api/verticales/:id', verticalesHandlers.deleteVertical);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api/analyze`);
  console.log(`📍 Build endpoint: http://localhost:${PORT}/api/build-docx`);
  console.log(`📍 Bedrock endpoint: http://localhost:${PORT}/api/bedrock?action=status|test|credentials|usage`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/bedrock-health`);
  console.log(`\n📋 Environment:`);
  console.log(`   AWS_REGION: ${process.env.AWS_REGION || 'NOT SET'}`);
  console.log(`   AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? '***' : 'NOT SET'}`);
});
