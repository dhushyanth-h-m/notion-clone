"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const models_1 = require("./models");
const auth_1 = __importDefault(require("./routes/auth"));
const blocks_1 = __importDefault(require("./routes/blocks"));
const workspaces_1 = __importDefault(require("./routes/workspaces"));
dotenv_1.default.config();
// Initialize Express app
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: '*', // Allow all origins during development
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(body_parser_1.default.json());
// Initialize database
console.log('Attempting to initialize database...');
(async () => {
    try {
        await (0, models_1.initDb)();
        console.log('Database initialized successfully');
    }
    catch (err) {
        console.error('Failed to initialize database:', err);
    }
})();
// Routes
app.use('/auth', auth_1.default);
app.use('/api/blocks', blocks_1.default);
app.use('/api/workspaces', workspaces_1.default);
app.get('/', (req, res) => {
    res.send("Backend is running");
});
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
