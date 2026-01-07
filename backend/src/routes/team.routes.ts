import { Router } from 'express';
import { getTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember } from '../controllers/team.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireFeature, checkBranchLimit } from '../middlewares/subscription.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getTeamMembers);
router.post('/', requireFeature('team'), checkBranchLimit, createTeamMember); // Requires PRO + checks branch limit
router.put('/:id', updateTeamMember);
router.delete('/:id', deleteTeamMember);

export default router;
