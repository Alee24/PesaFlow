
import fs from 'fs';
import path from 'path';

const envPath = path.join(__dirname, '.env');

const settings = {
    MPESA_ENV: 'sandbox',
    MPESA_SHORTCODE: '174379',
    MPESA_PASSKEY: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
    MPESA_CALLBACK_URL: 'https://mpesaconnect.co.ke/api/mpesa/callback'
};

try {
    let envContent = '';
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }

    let params = envContent.split('\n');

    Object.entries(settings).forEach(([key, value]) => {
        const index = params.findIndex(line => line.startsWith(`${key}=`));
        if (index !== -1) {
            params[index] = `${key}=${value}`;
        } else {
            params.push(`${key}=${value}`);
        }
    });

    // Clean up empty lines
    const finalContent = params.filter(line => line.trim() !== '').join('\n');
    fs.writeFileSync(envPath, finalContent + '\n');
    console.log('Successfully updated .env with M-Pesa Sandbox settings.');

} catch (error) {
    console.error('Error updating .env:', error);
}
