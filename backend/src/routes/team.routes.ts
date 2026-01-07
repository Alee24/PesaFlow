import { Router } from 'express';
import { getTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember } from '../controllers/team.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getTeamMembers);
router.post('/', createTeamMember);
router.put('/:id', updateTeamMember);
router.delete('/:id', deleteTeamMember);

export default router;
