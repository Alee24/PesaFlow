
import 'dotenv/config';

console.log("Current Directory:", process.cwd());
console.log("DATABASE_URL defined?", !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL;
    // Mask password
    const masked = url.replace(/:[^:@]+@/, ':****@');
    console.log("DATABASE_URL:", masked);
} else {
    console.log("No DATABASE_URL found.");
}
