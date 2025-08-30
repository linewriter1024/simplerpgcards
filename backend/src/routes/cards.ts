import { Router } from 'express';
import { body, param, query } from 'express-validator';
import multer from 'multer';
import { CardController } from '../controllers/CardController';

const router = Router();
const cardController = new CardController();
const upload = multer({ storage: multer.memoryStorage() });

// Validation middleware
const cardValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('frontText').optional().isString(),
  body('backText').optional().isString(),
  body('tags').optional().isArray(),
  body('tags.*').optional().isString(),
];

const pdfValidation = [
  body('cardIds').isArray({ min: 1 }).withMessage('At least one card ID is required'),
  body('duplex').optional().isIn(['long', 'short']),
  body('titleSize').optional().isInt({ min: 8, max: 48 }),
  body('bodySize').optional().isInt({ min: 6, max: 36 }),
  body('marginMm').optional().isFloat({ min: 0, max: 20 }),
];

const uuidValidation = [
  param('id').isUUID().withMessage('Invalid card ID'),
];

// Routes
router.get('/cards', cardController.getAllCards.bind(cardController));
router.get('/cards/tags', cardController.getTags.bind(cardController));
router.get('/cards/:id', uuidValidation, cardController.getCardById.bind(cardController));
router.post('/cards', cardValidation, cardController.createCard.bind(cardController));
router.put('/cards/:id', [...uuidValidation, ...cardValidation], cardController.updateCard.bind(cardController));
router.delete('/cards/:id', uuidValidation, cardController.deleteCard.bind(cardController));
router.post('/cards/pdf', pdfValidation, cardController.generatePdf.bind(cardController));
router.post('/cards/import', upload.single('file'), cardController.importCards.bind(cardController));

export default router;
