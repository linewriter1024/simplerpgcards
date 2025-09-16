import { Router } from 'express';
import multer from 'multer';
import { StatBlockController } from '../controllers/StatBlockController';

const router = Router();
const statblockController = new StatBlockController();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/statblocks - Get all statblocks with optional filters
router.get('/statblocks', (req, res) => statblockController.getAllStatBlocks(req, res));

// DELETE /api/statblocks/bulk - Delete multiple statblocks (must come before /:id route)
router.delete('/statblocks/bulk', (req, res) => statblockController.deleteMultipleStatBlocks(req, res));

// GET /api/statblocks/:id - Get statblock by ID
router.get('/statblocks/:id', (req, res) => statblockController.getStatBlockById(req, res));

// POST /api/statblocks - Create new statblock
router.post('/statblocks', (req, res) => statblockController.createStatBlock(req, res));

// PUT /api/statblocks/:id - Update statblock
router.put('/statblocks/:id', (req, res) => statblockController.updateStatBlock(req, res));

// DELETE /api/statblocks/:id - Delete statblock
router.delete('/statblocks/:id', (req, res) => statblockController.deleteStatBlock(req, res));

// Image routes
router.post('/statblocks/:id/image', upload.single('file'), (req, res) => statblockController.uploadImage(req, res));
router.post('/statblocks/:id/image/url', (req, res) => statblockController.setImageFromUrl(req, res));
router.post('/statblocks/:id/image/base64', (req, res) => statblockController.setImageFromBase64(req, res));
router.get('/statblocks/:id/image', (req, res) => statblockController.getImage(req, res));
router.delete('/statblocks/:id/image', (req, res) => statblockController.deleteImage(req, res));

export default router;
