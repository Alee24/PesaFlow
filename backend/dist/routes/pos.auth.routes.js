"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pos_auth_controller_1 = require("../controllers/pos.auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.get('/staff', auth_middleware_1.authenticateToken, auth_middleware_1.requireActive, pos_auth_controller_1.getStaffList);
router.post('/verify-pin', pos_auth_controller_1.verifyPin);
exports.default = router;
//# sourceMappingURL=pos.auth.routes.js.map