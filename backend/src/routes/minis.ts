import { Router } from "express";
import multer from "multer";
import { MiniController } from "../controllers/MiniController";

const router = Router();
const miniController = new MiniController();
const upload = multer({ storage: multer.memoryStorage() });

// ===== MINI ROUTES =====

// GET /api/minis - Get all minis with optional filters
router.get("/minis", (req, res) => miniController.getAllMinis(req, res));

// GET /api/minis/tags - Get all unique tags
router.get("/minis/tags", (req, res) => miniController.getTags(req, res));

// DELETE /api/minis/bulk - Delete multiple minis (must come before /:id route)
router.delete("/minis/bulk", (req, res) =>
  miniController.deleteMultipleMinis(req, res),
);

// GET /api/minis/:id - Get mini by ID
router.get("/minis/:id", (req, res) => miniController.getMiniById(req, res));

// POST /api/minis - Create new mini with image upload
router.post("/minis", upload.single("image"), (req, res) =>
  miniController.createMini(req, res),
);

// POST /api/minis/base64 - Create new mini from base64 image data
router.post("/minis/base64", (req, res) =>
  miniController.createMiniFromBase64(req, res),
);

// PUT /api/minis/:id - Update mini
router.put("/minis/:id", (req, res) => miniController.updateMini(req, res));

// DELETE /api/minis/:id - Delete mini
router.delete("/minis/:id", (req, res) => miniController.deleteMini(req, res));

// ===== MINI IMAGE ROUTES =====

// GET /api/minis/:id/image - Get front image
router.get("/minis/:id/image", (req, res) =>
  miniController.getFrontImage(req, res),
);

// POST /api/minis/:id/image - Upload front image
router.post("/minis/:id/image", upload.single("file"), (req, res) =>
  miniController.uploadFrontImage(req, res),
);

// POST /api/minis/:id/image/base64 - Set front image from base64
router.post("/minis/:id/image/base64", (req, res) =>
  miniController.setFrontImageFromBase64(req, res),
);

// GET /api/minis/:id/back-image - Get back image
router.get("/minis/:id/back-image", (req, res) =>
  miniController.getBackImage(req, res),
);

// POST /api/minis/:id/back-image - Upload back image
router.post("/minis/:id/back-image", upload.single("file"), (req, res) =>
  miniController.uploadBackImage(req, res),
);

// POST /api/minis/:id/back-image/base64 - Set back image from base64
router.post("/minis/:id/back-image/base64", (req, res) =>
  miniController.setBackImageFromBase64(req, res),
);

// DELETE /api/minis/:id/back-image - Delete back image
router.delete("/minis/:id/back-image", (req, res) =>
  miniController.deleteBackImage(req, res),
);

// POST /api/minis/:id/swap-images - Swap front and back images
router.post("/minis/:id/swap-images", (req, res) =>
  miniController.swapImages(req, res),
);

// ===== SHEET ROUTES =====

// GET /api/mini-sheets - Get all sheets
router.get("/mini-sheets", (req, res) => miniController.getAllSheets(req, res));

// POST /api/mini-sheets/pdf - Generate PDF from provided data (must come before /:id routes)
router.post("/mini-sheets/pdf", (req, res) =>
  miniController.generateSheetPdfFromData(req, res),
);

// GET /api/mini-sheets/:id - Get sheet by ID
router.get("/mini-sheets/:id", (req, res) =>
  miniController.getSheetById(req, res),
);

// GET /api/mini-sheets/:id/pdf - Generate PDF for a sheet
router.get("/mini-sheets/:id/pdf", (req, res) =>
  miniController.generateSheetPdf(req, res),
);

// POST /api/mini-sheets - Create new sheet
router.post("/mini-sheets", (req, res) => miniController.createSheet(req, res));

// PUT /api/mini-sheets/:id - Update sheet
router.put("/mini-sheets/:id", (req, res) =>
  miniController.updateSheet(req, res),
);

// DELETE /api/mini-sheets/:id - Delete sheet
router.delete("/mini-sheets/:id", (req, res) =>
  miniController.deleteSheet(req, res),
);

export default router;
