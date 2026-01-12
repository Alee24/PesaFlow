import { generateMasterLicense } from './src/utils/master-license';
import fs from 'fs';
const key = generateMasterLicense('KK Dynamic Enterprise Solutions LTD');
fs.writeFileSync('CLEAN_KEY.txt', key, 'utf8');
console.log('Key written to CLEAN_KEY.txt');
