const fs = require('fs');

console.log('Checking media_1790379368033.jpg...');
const b = fs.readFileSync('C:/Users/user/.gemini/antigravity-ide/brain/28007470-5821-42d9-b7aa-9ace014cfbbd/.user_uploaded/media_1790379368033.jpg');
console.log('Size:', b.length);
