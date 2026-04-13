
import { Router } from 'express';
import { getProducts, createProduct, getProductById, updateProduct, deleteProduct, adjustStock, getStockMovements, getInventoryStats, importProducts } from '../controllers/product.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticateToken);
router.get('/', getProducts);
router.post('/', upload.single('image'), createProduct);
router.post('/import', upload.single('file'), importProducts);
router.get('/stats', getInventoryStats);
router.get('/stock-movements', getStockMovements);
router.get('/:id', getProductById);
router.put('/:id', upload.single('image'), updateProduct);
router.delete('/:id', deleteProduct);
router.post('/:id/adjust-stock', adjustStock);

export default router;
