import express from 'express';
import pool from '../config/database.js';
import { sendAssetNotificationEmail } from '../services/emailService.js';
import prisma from '../prismaClient.js';
import multer from 'multer';
import { uploadUserAssetDocument, isR2Configured } from '../services/r2Storage.js';
import fs from 'fs/promises';
import path from 'path';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB for asset documents
  },
});

// Add asset
router.post('/add', requireAuth, async (req, res) => {
  try {
    const { name, category, estimated_value, description, currency } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Asset name is required'
      });
    }

    // Use userId from middleware (already looked up)
    const userId = req.auth.userId;

    // Validate estimated_value if provided
    let estimatedValue = null;
    if (estimated_value) {
      const numValue = parseFloat(estimated_value);
      if (isNaN(numValue) || numValue < 0) {
        return res.status(400).json({
          success: false,
          message: 'Estimated value must be a positive number'
        });
      }
      estimatedValue = numValue;
    }

    const result = await pool.query(
      `INSERT INTO assets (user_id, name, category, estimated_value, description, currency)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, name, category, estimated_value, description, currency, created_at, updated_at`,
      [userId, name.trim(), category || 'other', estimatedValue, description?.trim() || null, currency || 'USD']
    );

    const asset = result.rows[0];

    // Send email notifications to all recipients with email addresses
    try {
      // Get creator name
      const userResult = await pool.query(
        'SELECT username, email FROM users WHERE id = $1',
        [userId]
      );
      const creatorName = userResult.rows[0]?.username || 'the will creator';

      // Get all recipients with email addresses
      const recipientsResult = await pool.query(
        'SELECT email, full_name FROM recipients WHERE user_id = $1 AND email IS NOT NULL AND email != \'\'',
        [userId]
      );

      // Send notifications to all recipients
      const emailPromises = recipientsResult.rows.map(recipient =>
        sendAssetNotificationEmail(
          recipient.email,
          recipient.full_name,
          asset.name,
          asset.estimated_value,
          asset.description,
          creatorName
        )
      );

      const emailResults = await Promise.allSettled(emailPromises);
      const sentCount = emailResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
      
      if (sentCount > 0) {
        console.log(`✅ Sent ${sentCount} asset notification email(s)`);
      }
    } catch (emailError) {
      console.error('Error sending asset notification emails:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Asset added successfully',
      data: asset
    });
  } catch (error) {
    console.error('Error adding asset:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding asset',
      error: error.message
    });
  }
});

// Get all assets for a user
router.get('/user/:userId', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const assets = await prisma.assets.findMany({
      where: { user_id: Number(userId) },
      orderBy: { created_at: 'desc' },
    });

    const allocations = await prisma.asset_allocations.findMany({
      where: { assets: { user_id: Number(userId) } },
      select: {
        asset_id: true,
        recipient_id: true,
        allocation_percentage: true,
      },
    });

    const allocationsByAssetId = new Map();
    for (const a of allocations) {
      const key = a.asset_id;
      const list = allocationsByAssetId.get(key) || [];
      list.push({
        recipient_id: a.recipient_id,
        allocation_percentage: a.allocation_percentage,
      });
      allocationsByAssetId.set(key, list);
    }

    const data = assets.map((asset) => ({
      ...asset,
      allocations: allocationsByAssetId.get(asset.id) || [],
    }));

    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assets',
      error: error.message
    });
  }
});

// Replace all allocations for an asset (equal distribution handled by caller)
router.post('/:assetId/allocations', requireAuth, async (req, res) => {
  try {
    const assetId = Number(req.params.assetId);
    const userId = Number(req.auth.userId);
    const allocations = Array.isArray(req.body.allocations) ? req.body.allocations : [];

    const asset = await prisma.assets.findFirst({
      where: { id: assetId, user_id: userId },
      select: { id: true },
    });
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    for (const a of allocations) {
      if (!a || typeof a.recipient_id !== 'number') {
        return res.status(400).json({ success: false, message: 'Invalid allocations payload' });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.asset_allocations.deleteMany({ where: { asset_id: assetId } });
      if (allocations.length > 0) {
        await tx.asset_allocations.createMany({
          data: allocations.map((a) => ({
            asset_id: assetId,
            recipient_id: a.recipient_id,
            allocation_percentage: a.allocation_percentage,
            notes: a.notes ?? null,
          })),
        });
      }
    });

    return res.json({ success: true, message: 'Allocations saved' });
  } catch (error) {
    console.error('Error saving allocations:', error);
    return res.status(500).json({ success: false, message: 'Failed to save allocations' });
  }
});

// Upload an asset document and store URL on the asset row
router.post('/upload-document', requireAuth, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No document provided' });
    }
    const assetId = Number(req.body.asset_id);
    if (!Number.isFinite(assetId) || assetId <= 0) {
      return res.status(400).json({ success: false, message: 'asset_id is required' });
    }

    const userId = Number(req.auth.userId);
    const asset = await prisma.assets.findFirst({ where: { id: assetId, user_id: userId }, select: { id: true } });
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    let url;
    if (isR2Configured()) {
      const r2 = await uploadUserAssetDocument(req.file.buffer, userId, assetId, {
        originalName: req.file.originalname,
        contentType: req.file.mimetype,
      });
      url = r2.url;
    } else {
      const ext = path.extname(req.file.originalname || '').replace(/^\./, '') || 'bin';
      const fileName = `asset-${assetId}-${Date.now()}.${ext}`;
      const relPath = path.posix.join('assets', String(userId), String(assetId), fileName);
      const diskDir = path.join(process.cwd(), 'uploads', 'assets', String(userId), String(assetId));
      await fs.mkdir(diskDir, { recursive: true });
      const diskPath = path.join(diskDir, fileName);
      await fs.writeFile(diskPath, req.file.buffer);
      url = `${req.protocol}://${req.get('host')}/uploads/${relPath}`;
    }

    const updated = await prisma.assets.update({
      where: { id: assetId },
      data: { documents_url: url },
      select: { id: true, documents_url: true },
    });

    return res.json({ success: true, message: 'Document uploaded', data: updated });
  } catch (error) {
    console.error('Error uploading asset document:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload document' });
  }
});

// Remove asset document URL (file deletion optional; only unlinks for now)
router.delete('/:assetId/document', requireAuth, async (req, res) => {
  try {
    const assetId = Number(req.params.assetId);
    const userId = Number(req.auth.userId);
    const asset = await prisma.assets.findFirst({ where: { id: assetId, user_id: userId }, select: { id: true } });
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

    await prisma.assets.update({ where: { id: assetId }, data: { documents_url: null } });
    return res.json({ success: true, message: 'Document removed' });
  } catch (error) {
    console.error('Error removing asset document:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete document' });
  }
});

// Legacy alias route kept for frontend compatibility; token identity is authoritative.
router.get('/user-email/:userEmail', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const assets = await prisma.assets.findMany({
      where: { user_id: Number(userId) },
      orderBy: { created_at: 'desc' },
    });

    const allocations = await prisma.asset_allocations.findMany({
      where: { assets: { user_id: Number(userId) } },
      select: {
        asset_id: true,
        recipient_id: true,
        allocation_percentage: true,
      },
    });

    const allocationsByAssetId = new Map();
    for (const a of allocations) {
      const key = a.asset_id;
      const list = allocationsByAssetId.get(key) || [];
      list.push({
        recipient_id: a.recipient_id,
        allocation_percentage: a.allocation_percentage,
      });
      allocationsByAssetId.set(key, list);
    }

    const data = assets.map((asset) => ({
      ...asset,
      allocations: allocationsByAssetId.get(asset.id) || [],
    }));

    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching assets' });
  }
});

// Get asset by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, user_id, name, category, estimated_value, description, currency, documents_url, created_at, updated_at
       FROM assets 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (!req.auth.is_admin && Number(result.rows[0].user_id) !== Number(req.auth.userId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching asset',
      error: error.message
    });
  }
});

// Delete asset
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM assets WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.auth.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found or access denied'
      });
    }

    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting asset',
      error: error.message
    });
  }
});

export default router;
