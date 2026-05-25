const fs = require('fs');
const path = 'c:/Users/Seto Raffa Aditiya/.gemini/antigravity/playground/mienian-mobile/src/components/ConditionalLayout.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldLine = 'const hideLayout = isAdminPage || isKangDoMiePage;';
const newLine = 'const hideLayout = isAdminPage || isKangDoMiePage || pathname.startsWith("/mienian-go") || pathname.startsWith("/payment") || pathname.startsWith("/akun");';

content = content.replace(oldLine, newLine);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed ConditionalLayout.tsx');
