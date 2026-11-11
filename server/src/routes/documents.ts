import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import db, { getUploadsDir } from '../database';
import { DocumentRow, ItemRow } from '../types';
import { logActivity } from '../services/activityService';

const router = Router();
const uploadsDir = getUploadsDir();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// POST /api/v1/documents/upload/:itemId
router.post('/upload/:itemId', upload.single('file'), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;
    const item = db.prepare('SELECT id, name FROM items WHERE id = ?').get(itemId) as ItemRow | undefined;
    if (!item) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(404).json({ success: false, error: 'Item not found' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    const docId = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO documents (id, item_id, filename, original_name, mime_type, size_bytes, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      docId,
      itemId,
      req.file.filename,
      req.file.originalname,
      req.file.mimetype,
      req.file.size,
      now
    );

    logActivity(String(itemId), 'document_uploaded', { docId, filename: req.file.originalname }, 'user');

    const created = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId) as DocumentRow;
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    next(err);
  }
});

// GET /api/v1/documents/download/:id
router.get('/download/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as DocumentRow | undefined;
    if (!doc) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    const filePath = path.join(uploadsDir, doc.filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: 'File not found on disk' });
      return;
    }

    res.download(filePath, doc.original_name);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/documents/:id
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as DocumentRow | undefined;
    if (!doc) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    const filePath = path.join(uploadsDir, doc.filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn('Failed to delete physical file:', err);
      }
    }

    db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
    logActivity(doc.item_id, 'document_deleted', { docId: doc.id, filename: doc.original_name }, 'user');

    res.json({ success: true, data: { id: req.params.id, deleted: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
