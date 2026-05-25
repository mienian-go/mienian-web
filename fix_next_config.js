const fs = require('fs');
const path = 'c:/Users/Seto Raffa Aditiya/.gemini/antigravity/playground/mienian-mobile/next.config.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'output: "export",',
  '...(process.env.CAPACITOR_BUILD ? { output: "export" } : {}),'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed next.config.ts');
