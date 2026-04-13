
const net = require('net');
const dns = require('dns');

const port = 3306;
const host = 'localhost';

console.log(`Testing TCP connection to ${host}:${port}...`);

dns.lookup(host, { all: true }, (err, addresses) => {
    if (err) console.error('DNS Lookup Error:', err);
    console.log('DNS Lookup results:', addresses);

    addresses.forEach((addr) => {
        const socket = new net.Socket();
        socket.setTimeout(2000);

        console.log(`Trying ${addr.address} (${addr.family})...`);

        socket.on('connect', () => {
            console.log(`✅ Success! Connected to ${addr.address}:${port}`);
            // Do NOT destroy immediately. Wait for data.
        });

        socket.on('data', (data) => {
            console.log(`📩 Received ${data.length} bytes from ${addr.address}`);
            console.log('   Hex header:', data.toString('hex').substring(0, 40));
            socket.destroy();
        });

        socket.on('timeout', () => {
            console.log(`❌ Timeout on ${addr.address}`);
            socket.destroy();
        });

        socket.on('error', (err) => {
            console.log(`❌ Error on ${addr.address}: ${err.message}`);
        });

        socket.connect(port, addr.address);
    });
});
