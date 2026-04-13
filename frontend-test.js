
const axios = require('axios');

async function main() {
    const API_URL = 'http://localhost:3001/api';
    const TEST_USER = {
        email: 'mettoalex@gmail.com',
        password: 'Digital2025'
    };

    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, TEST_USER);
        const { token, user } = loginRes.data;
        console.log(`Login successful! User: ${user.name} (${user.id})`);

        const headers = { Authorization: `Bearer ${token}` };

        console.log('\n2. Fetching Sales Stats...');
        const statsRes = await axios.get(`${API_URL}/sales/stats`, { headers });
        console.log('Stats Response:', statsRes.data);

        console.log('\n3. Fetching Recent Sales...');
        const salesRes = await axios.get(`${API_URL}/sales`, { headers });
        console.log(`Sales Response: Found ${salesRes.data.length} sales`);
        if (salesRes.data.length > 0) {
            console.log('First Sale:', salesRes.data[0]);
        }

    } catch (error) {
        console.error('Test Failed:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

main();
