import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase, seedDatabase } from './database';
import { startExpiryChecker } from './services/itemService';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Route imports
import itemsRouter from './routes/items';
import categoriesRouter from './routes/categories';
import documentsRouter from './routes/documents';
import dashboardRouter from './routes/dashboard';
import alertsRouter from './routes/alerts';
import activityRouter from './routes/activity';
import importExportRouter from './routes/importExport';
import tagsRouter from './routes/tags';
import searchRouter from './routes/search';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Global Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize DB schema & demo data
initializeDatabase();
seedDatabase();

// Start background expiry checker
startExpiryChecker();

// Health Check
app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Vigil Intelligence API',
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/v1/items', itemsRouter);
app.use('/api/v1/categories', categoriesRouter);
app.use('/api/v1/documents', documentsRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/alerts', alertsRouter);
app.use('/api/v1/activity', activityRouter);
app.use('/api/v1/import-export', importExportRouter);
app.use('/api/v1/tags', tagsRouter);
app.use('/api/v1/search', searchRouter);

// 404 & Error Handler
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`🛡️  Vigil Server running on http://localhost:${PORT}`);
  console.log(`API base: http://localhost:${PORT}/api/v1`);
  console.log(`========================================\n`);
});

export default app;
