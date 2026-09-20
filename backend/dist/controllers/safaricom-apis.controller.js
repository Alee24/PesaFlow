"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMobile = exports.pullTransactions = exports.createRatibaOrder = exports.initiateBusinessToPochi = exports.initiateB2B = exports.simulateC2bPayment = exports.registerC2bUrls = exports.requestReversal = exports.queryTransactionStatus = exports.queryAccountBalance = exports.getApisOverview = void 0;
const safaricom_apis_service_1 = require("../services/safaricom-apis.service");
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
        const { remarks } = req.body;
        const result = await (0, safaricom_apis_service_1.executeAccountBalanceQuery)(userId, remarks);
        res.json(result);
    }
    catch (error) {
        console.error('queryAccountBalance Error:', error);
        const detailed = error.response?.data?.errorMessage || error.message;
        res.status(500).json({ error: detailed || 'Failed to query account balance on Safaricom' });
    }
};
exports.queryAccountBalance = queryAccountBalance;
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
        const detailed = error.response?.data?.errorMessage || error.message;
        res.status(500).json({ error: detailed || 'Failed to query transaction status on Daraja' });
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
        const detailed = error.response?.data?.errorMessage || error.message;
        res.status(500).json({ error: detailed || 'Failed to initiate transaction reversal' });
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
        const detailed = error.response?.data?.errorMessage || error.message;
        res.status(500).json({ error: detailed || 'Failed to register C2B URLs with Safaricom' });
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
        const detailed = error.response?.data?.errorMessage || error.message;
        res.status(500).json({ error: detailed || 'Failed to simulate C2B payment' });
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
        const detailed = error.response?.data?.errorMessage || error.message;
        res.status(500).json({ error: detailed || 'Failed to process B2B transfer' });
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
        const detailed = error.response?.data?.errorMessage || error.message;
        res.status(500).json({ error: detailed || 'Failed to send to Pochi la Biashara' });
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
        const detailed = error.response?.data?.errorMessage || error.message;
        res.status(500).json({ error: detailed || 'Failed to create M-Pesa Ratiba standing order' });
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
        const detailed = error.response?.data?.errorMessage || error.message;
        res.status(500).json({ error: detailed || 'Failed to pull transactions from Safaricom' });
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
        res.status(500).json({ error: error.message || 'Failed to validate mobile number' });
    }
};
exports.validateMobile = validateMobile;
//# sourceMappingURL=safaricom-apis.controller.js.map