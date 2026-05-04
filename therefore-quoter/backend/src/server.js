require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Simple JSON file-based database
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'quotes.json');

class SimpleDB {
  constructor(filePath) {
    this.filePath = filePath;
    this.nextId = 1;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
        this.quotes = data.quotes || [];
        this.nextId = (data.nextId || 1);
      } else {
        this.quotes = [];
      }
    } catch (err) {
      console.error('Error loading database:', err);
      this.quotes = [];
    }
  }

  save() {
    fs.writeFileSync(this.filePath, JSON.stringify({
      quotes: this.quotes,
      nextId: this.nextId
    }, null, 2), 'utf-8');
  }

  getAll() {
    return this.quotes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  getById(id) {
    return this.quotes.find(q => q.id === parseInt(id));
  }

  insert(data) {
    const quote = {
      id: this.nextId++,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.quotes.push(quote);
    this.save();
    return quote;
  }

  update(id, data) {
    const idx = this.quotes.findIndex(q => q.id === parseInt(id));
    if (idx === -1) return null;
    this.quotes[idx] = { ...this.quotes[idx], ...data, updated_at: new Date().toISOString() };
    this.save();
    return this.quotes[idx];
  }

  delete(id) {
    const idx = this.quotes.findIndex(q => q.id === parseInt(id));
    if (idx === -1) return false;
    this.quotes.splice(idx, 1);
    this.save();
    return true;
  }
}

const db = new SimpleDB(dbPath);
console.log('✓ Database initialized');

// Routes
app.use('/api/upload', require('./routes/upload')(db));
app.use('/api/analyze', require('./routes/analyze')(db));
app.use('/api/generate', require('./routes/generate')(db));
app.use('/api/quotes', require('./routes/quotes')(db));
app.use('/api/knowledge', require('./routes/knowledge')(db));
app.use('/api/category-xml', require('./routes/category-xml')(db));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Therefore Quoter API running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = { db };
