"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("../controllers/product.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
router.get('/', product_controller_1.getProducts);
router.post('/', upload_middleware_1.upload.single('image'), product_controller_1.createProduct);
router.post('/import', upload_middleware_1.upload.single('file'), product_controller_1.importProducts);
router.get('/stats', product_controller_1.getInventoryStats);
router.get('/stock-movements', product_controller_1.getStockMovements);
router.get('/:id', product_controller_1.getProductById);
router.put('/:id', upload_middleware_1.upload.single('image'), product_controller_1.updateProduct);
router.delete('/:id', product_controller_1.deleteProduct);
router.post('/:id/adjust-stock', product_controller_1.adjustStock);
exports.default = router;
//# sourceMappingURL=product.routes.js.map
