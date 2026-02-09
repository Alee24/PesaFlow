"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const team_controller_1 = require("../controllers/team.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const subscription_middleware_1 = require("../middlewares/subscription.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
router.get('/', team_controller_1.getTeamMembers);
router.post('/', (0, subscription_middleware_1.requireFeature)('team'), subscription_middleware_1.checkBranchLimit, team_controller_1.createTeamMember);
router.put('/:id', team_controller_1.updateTeamMember);
router.delete('/:id', team_controller_1.deleteTeamMember);
exports.default = router;
//# sourceMappingURL=team.routes.js.map