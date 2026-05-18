"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const scheduler_service_1 = require("./services/scheduler.service");
const wallet_routes_1 = __importDefault(require("./routes/wallet.routes"));
const team_routes_1 = __importDefault(require("./routes/team.routes"));
const PORT = parseInt(process.env.PORT || '3001');
const HOST = process.env.HOST || '0.0.0.0';
app_1.default.use('/api/wallet', wallet_routes_1.default);
app_1.default.use('/api/team', team_routes_1.default);
(0, scheduler_service_1.scheduleDailySalesSummary)();
const server = app_1.default.listen(PORT, HOST, () => {
    console.log(`Server running on port ${PORT} at host ${HOST}`);
});
server.on('error', (err) => {
    console.error('Server failed to start:', err);
});
//# sourceMappingURL=server.js.map