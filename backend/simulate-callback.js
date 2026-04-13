
const axios = require('axios');

const payload = {
    Body: {
        stkCallback: {
            MerchantRequestID: "921e-49f3-8cc8-8846063deedf2585",
            CheckoutRequestID: "ws_CO_09012026073726279724454757",
            ResultCode: 0,
            ResultDesc: "The service request is processed successfully.",
            CallbackMetadata: {
                Item: [
                    { Name: "Amount", Value: 1.00 },
                    { Name: "MpesaReceiptNumber", Value: "TEST123456" },
                    { Name: "TransactionDate", Value: 20240109073000 },
                    { Name: "PhoneNumber", Value: 254724454757 }
                ]
            }
        }
    }
};

async function run() {
    try {
        console.log('Sending Simulated Callback...');
        const res = await axios.post('http://localhost:3001/api/mpesa/callback', payload);
        console.log('Response:', res.data);
    } catch (e) {
        console.error('Error:', e.message);
        if (e.response) console.error('Data:', e.response.data);
    }
}

run();
