
import { Router } from 'express';
import { getProducts, createProduct, getProductById, updateProduct, deleteProduct } from '../controllers/product.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticateToken);
router.get('/', getProducts);
router.post('/', upload.single('image'), createProduct);
router.get('/:id', getProductById);
router.put('/:id', upload.single('image'), updateProduct);
router.delete('/:id', deleteProduct);

export default router;
