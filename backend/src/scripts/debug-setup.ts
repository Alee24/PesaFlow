
const axios = require('axios');

async function testSetup() {
    console.log("Testing Setup Endpoint...");
    try {
        const response = await axios.post('http://localhost:3001/api/setup', {
            dbHost: 'localhost',
            dbPort: '3306',
            dbUser: 'root',
            dbPassword: '', // Assuming no password for local dev or update as needed
            dbName: 'pesaflow_test_install',
            mpesaKey: 'test_key',
            mpesaSecret: 'test_secret',
            mpesaPasskey: 'test_passkey',
            mpesaShortcode: '174379',
            mpesaEnv: 'sandbox',
            smtpHost: 'smtp.example.com',
            smtpPort: '587',
            smtpUser: 'user',
            smtpPassword: 'password',
            adminEmail: 'admin@test.com',
            adminPassword: 'password123'
        });
        console.log("Setup Success:", response.status, response.data);
    } catch (error) {
        if (error.response) {
            console.error("Setup Failed Status:", error.response.status);
            console.error("Setup Failed Data:", error.response.data);
        } else {
            console.error("Setup Error:", error.message);
        }
    }
}

testSetup();

export { };
