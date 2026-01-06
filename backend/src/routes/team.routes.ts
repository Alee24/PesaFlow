import express from 'express';
import { getTeamMembers, createTeamMember, deleteTeamMember } from '../controllers/team.controller';
import { authenticateToken, requireActive } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(authenticateToken);
router.use(requireActive);

router.get('/', getTeamMembers);
router.post('/', createTeamMember);
router.delete('/:id', deleteTeamMember);

export default router;
