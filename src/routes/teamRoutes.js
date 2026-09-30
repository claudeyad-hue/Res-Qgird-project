import { Router } from 'express';
import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  updateTeamStatus,
  deleteTeam,
} from '../controllers/teamController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import env from '../config/env.js';

const router = Router();

function requireTeamAuth(req, res, next) {
  if (process.env.REQUIRE_AUTH_FOR_TEAMS === 'true' || env.isProduction) {
    return protect(req, res, () => {
      authorize('admin', 'operator', 'responder')(req, res, next);
    });
  }

  if (req.headers.authorization) {
    return protect(req, res, () => {
      authorize('admin', 'operator', 'responder')(req, res, next);
    });
  }

  next();
}

router.get('/', getTeams);
router.get('/:id', getTeamById);
router.post('/', requireTeamAuth, createTeam);
router.put('/:id', requireTeamAuth, updateTeam);
router.patch('/:id/status', requireTeamAuth, updateTeamStatus);
router.patch('/:id', requireTeamAuth, updateTeamStatus);
router.delete('/:id', protect, authorize('admin', 'operator'), deleteTeam);

export default router;
