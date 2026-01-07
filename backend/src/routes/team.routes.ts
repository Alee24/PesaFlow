
import { Router } from 'express';
import { getTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember, verifyPIN } from '../controllers/team.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getTeamMembers);
router.post('/', createTeamMember);
router.put('/:id', updateTeamMember);
router.delete('/:id', deleteTeamMember);
router.post('/verify-pin', verifyPIN);

export default router;
