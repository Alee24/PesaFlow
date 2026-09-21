"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMobile = exports.pullTransactions = exports.createRatibaOrder = exports.initiateBusinessToPochi = exports.initiateB2B = exports.simulateC2bPayment = exports.registerC2bUrls = exports.requestReversal = exports.queryTransactionStatus = exports.getBalanceResult = exports.getLatestAccountBalance = exports.queryAccountBalance = exports.getApisOverview = void 0;
const safaricom_apis_service_1 = require("../services/safaricom-apis.service");
const formatDarajaError = (error, fallback) => {
    const raw = error.response?.data || error.message;
    const detailed = error.response?.data?.errorMessage || error.response?.data?.error || error.message || fallback;
    let message = detailed;
    let resolutionSteps = undefined;
    const lower = typeof detailed === 'string' ? detailed.toLowerCase() : '';
    if (lower.includes('invalid access token') || lower.includes('unauthorized')) {
        message = 'Safaricom Daraja rejected the API request with "Invalid Access Token". While your OAuth credentials generate an access token successfully, Safaricom requires that the app created on developer.safaricom.co.ke has specific permission grants for each API (e.g. Account Balance, PullTransactions, B2B, Reversal).';
        resolutionSteps = [
            'Confirm the Daraja Application in your Safaricom Developer Portal has the specific API product enabled (e.g. "Account Balance", "Pull Transactions", etc.).',
            'Verify that the Shortcode configured (4007897) is linked to this Daraja Consumer Key on the Safaricom portal.',
            'Ensure the Initiator Username and Initiator Password in Settings → M-Pesa match your live M-Pesa Web Portal operator credentials.',
            'For production accounts, ensure your Go-Live request on Daraja is approved by Safaricom.'
        ];
    }
    else if (lower.includes('initiator') || lower.includes('security credential') || lower.includes('2001')) {
        message = 'Initiator authorization failed on Safaricom: "The initiator information is invalid" (ResultCode 2001). Safaricom rejected the operator identity or the encrypted Security Credential for this shortcode.';
        resolutionSteps = [
            'For Sandbox: The Initiator Name must be "testapi" and the password is usually "Safaricom999!*!".',
            'For Production: The Initiator Name must be your exact Safaricom M-Pesa Business Web Portal Operator username (with API Operator or Business Administrator role).',
            'Pre-computed Security Credential (Recommended): Generate your Security Credential directly using Safaricom\'s portal tool at https://developer.safaricom.co.ke/test_credentials, then paste the generated string into Settings → M-Pesa → Security Credential. This eliminates certificate version mismatches.',
            'Custom Certificate: If using a custom production certificate from Safaricom, paste its PEM text into Settings → M-Pesa → Daraja Certificate.'
        ];
    }
    return { message, raw, resolutionSteps };
};
const getApisOverview = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user.merchantId || req.user.userId;
        const data = await (0, safaricom_apis_service_1.getSafaricomApisOverview)(userId);
        res.json(data);
    }
    catch (error) {
        console.error('getApisOverview Error:', error);
        res.status(500).json({ error: error.message || 'Failed to retrieve Safaricom APIs overview' });
    }
};
exports.getApisOverview = getApisOverview;
const queryAccountBalance = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user.merchantId || req.user.userId;
        const { remarks, identifierType } = req.body;
        const result = await (0, safaricom_apis_service_1.executeAccountBalanceQuery)(userId, remarks, identifierType);
        res.json(result);
    }
    catch (error) {
        console.error('queryAccountBalance Error:', error);
        const err = formatDarajaError(error, 'Failed to query account balance on Safaricom');
        res.status(500).json({ error: err.message, darajaResponse: err.raw, resolutionSteps: err.resolutionSteps });
    }
};
exports.queryAccountBalance = queryAccountBalance;
const getLatestAccountBalance = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user.merchantId || req.user.userId;
        const balance = await (0, safaricom_apis_service_1.getLatestBalance)(userId);
        res.json({ balance });
    }
    catch (error) {
        console.error('getLatestAccountBalance Error:', error);
        res.status(500).json({ error: error.message || 'Failed to retrieve saved balance' });
    }
};
exports.getLatestAccountBalance = getLatestAccountBalance;
const getBalanceResult = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user.merchantId || req.user.userId;
        const { conversationId } = req.params;
        if (!conversationId) {
            res.status(400).json({ error: 'ConversationID is required' });
            return;
        }
        const result = await (0, safaricom_apis_service_1.getBalanceQueryResult)(conversationId, userId);
        res.json(result);
    }
    catch (error) {
        console.error('getBalanceResult Error:', error);
        res.status(500).json({ error: error.message || 'Failed to check balance result' });
    }
};
exports.getBalanceResult = getBalanceResult;
const queryTransactionStatus = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user.merchantId || req.user.userId;
        const { transactionId, remarks } = req.body;
        if (!transactionId) {
            res.status(400).json({ error: 'M-Pesa Transaction ID (e.g. SAB1234567) is required' });
            return;
        }
        const result = await (0, safaricom_apis_service_1.executeTransactionStatusQuery)(userId, transactionId, remarks);
        res.json(result);
    }
    catch (error) {
        console.error('queryTransactionStatus Error:', error);
        const err = formatDarajaError(error, 'Failed to query transaction status on Daraja');
        res.status(500).json({ error: err.message, darajaResponse: err.raw, resolutionSteps: err.resolutionSteps });
    }
};
exports.queryTransactionStatus = queryTransactionStatus;
const requestReversal = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user.merchantId || req.user.userId;
        const { transactionId, amount, remarks } = req.body;
        if (!transactionId || !amount) {
            res.status(400).json({ error: 'Transaction ID and Amount are required for reversal' });
            return;
        }
        const result = await (0, safaricom_apis_service_1.executeTransactionReversal)(userId, {
            transactionId,
            amount: Number(amount),
            remarks
        });
        res.json(result);
    }
    catch (error) {
        console.error('requestReversal Error:', error);
        const err = formatDarajaError(error, 'Failed to initiate transaction reversal');
        res.status(500).json({ error: err.message, darajaResponse: err.raw, resolutionSteps: err.resolutionSteps });
    }
};
exports.requestReversal = requestReversal;
const registerC2bUrls = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user.merchantId || req.user.userId;
        const { confirmationUrl, validationUrl, responseType } = req.body;
        const result = await (0, safaricom_apis_service_1.executeC2bUrlRegistration)(userId, {
            confirmationUrl,
            validationUrl,
            responseType
        });
        res.json(result);
    }
    catch (error) {
        console.error('registerC2bUrls Error:', error);
        const err = formatDarajaError(error, 'Failed to register C2B URLs with Safaricom');
        res.status(500).json({ error: err.message, darajaResponse: err.raw, resolutionSteps: err.resolutionSteps });
    }
};
exports.registerC2bUrls = registerC2bUrls;
const simulateC2bPayment = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user.merchantId || req.user.userId;
        const { amount, phoneNumber, billRefNumber, commandId } = req.body;
        if (!amount || !phoneNumber) {
            res.status(400).json({ error: 'Amount and Phone Number are required' });
            return;
        }
        const result = await (0, safaricom_apis_service_1.executeC2bSimulation)(userId, {
            amount: Number(amount),
            phoneNumber,
            billRefNumber,
            commandId
        });
        res.json(result);
    }
    catch (error) {
        console.error('simulateC2bPayment Error:', error);
        const err = formatDarajaError(error, 'Failed to simulate C2B payment');
        res.status(500).json({ error: err.message, darajaResponse: err.raw, resolutionSteps: err.resolutionSteps });
    }
};
exports.simulateC2bPayment = simulateC2bPayment;
const initiateB2B = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user.merchantId || req.user.userId;
        const { amount, partyB, accountReference, remarks, commandId, receiverType } = req.body;
        if (!amount || !partyB || !accountReference) {
            res.status(400).json({ error: 'Amount, Destination (Party B), and Account Reference are required' });
            return;
        }
        const result = await (0, safaricom_apis_service_1.executeB2BPayment)(userId, {
            amount: Number(amount),
            partyB: String(partyB),
            accountReference,
            remarks,
            commandId,
            receiverType
        });
        res.json(result);
    }
    catch (error) {
        console.error('initiateB2B Error:', error);
        const err = formatDarajaError(error, 'Failed to process B2B transfer');
        res.status(500).json({ error: err.message, darajaResponse: err.raw, resolutionSteps: err.resolutionSteps });
    }
};
exports.initiateB2B = initiateB2B;
const initiateBusinessToPochi = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user.merchantId || req.user.userId;
        const { amount, phoneNumber, remarks } = req.body;
        if (!amount || !phoneNumber) {
            res.status(400).json({ error: 'Amount and Phone Number are required' });
            return;
        }
        const result = await (0, safaricom_apis_service_1.executeBusinessToPochi)(userId, {
            amount: Number(amount),
            phoneNumber,
            remarks
        });
        res.json(result);
    }
    catch (error) {
        console.error('initiateBusinessToPochi Error:', error);
        const err = formatDarajaError(error, 'Failed to send to Pochi la Biashara');
        res.status(500).json({ error: err.message, darajaResponse: err.raw, resolutionSteps: err.resolutionSteps });
    }
};
exports.initiateBusinessToPochi = initiateBusinessToPochi;
const createRatibaOrder = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user.merchantId || req.user.userId;
        const { standingOrderName, amount, phoneNumber, frequency, startDate, endDate, accountRef, desc } = req.body;
        if (!standingOrderName || !amount || !phoneNumber || !startDate || !endDate) {
            res.status(400).json({ error: 'Name, Amount, Phone Number, Start Date, and End Date are required' });
            return;
        }
        const result = await (0, safaricom_apis_service_1.executeRatibaStandingOrder)(userId, {
            standingOrderName,
            amount: Number(amount),
            phoneNumber,
            frequency,
            startDate,
            endDate,
            accountRef: accountRef || standingOrderName,
            desc
        });
        res.json(result);
    }
    catch (error) {
        console.error('createRatibaOrder Error:', error);
        const err = formatDarajaError(error, 'Failed to create M-Pesa Ratiba standing order');
        res.status(500).json({ error: err.message, darajaResponse: err.raw, resolutionSteps: err.resolutionSteps });
    }
};
exports.createRatibaOrder = createRatibaOrder;
const pullTransactions = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user.merchantId || req.user.userId;
        const { startDate, endDate, offset } = req.body;
        if (!startDate || !endDate) {
            res.status(400).json({ error: 'Start Date and End Date are required' });
            return;
        }
        const result = await (0, safaricom_apis_service_1.executePullTransactionsQuery)(userId, {
            startDate,
            endDate,
            offset
        });
        res.json(result);
    }
    catch (error) {
        console.error('pullTransactions Error:', error);
        const err = formatDarajaError(error, 'Failed to pull transactions from Safaricom');
        res.status(500).json({ error: err.message, darajaResponse: err.raw, resolutionSteps: err.resolutionSteps });
    }
};
exports.pullTransactions = pullTransactions;
const validateMobile = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = req.user.merchantId || req.user.userId;
        const { phoneNumber } = req.body;
        if (!phoneNumber) {
            res.status(400).json({ error: 'Phone Number is required' });
            return;
        }
        const result = await (0, safaricom_apis_service_1.executeMobileValidation)(userId, phoneNumber);
        res.json(result);
    }
    catch (error) {
        console.error('validateMobile Error:', error);
        const err = formatDarajaError(error, 'Failed to validate mobile number');
        res.status(500).json({ error: err.message, darajaResponse: err.raw, resolutionSteps: err.resolutionSteps });
    }
};
exports.validateMobile = validateMobile;
//# sourceMappingURL=safaricom-apis.controller.js.map