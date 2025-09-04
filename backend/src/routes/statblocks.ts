import { Router } from 'express';
import { StatBlockController } from '../controllers/StatBlockController';

const router = Router();
const statblockController = new StatBlockController();

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

export default router;
