const fs = require('fs');
const path = 'c:/Users/Seto Raffa Aditiya/.gemini/antigravity/playground/mienian-mobile/src/app/layout.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add ConditionalLayout import if it doesn't exist
if (!content.includes('ConditionalLayout')) {
    content = content.replace('import { GoCartProvider } from "@/context/GoCartContext";', 'import { GoCartProvider } from "@/context/GoCartContext";\nimport { ConditionalLayout } from "@/components/ConditionalLayout";');
}

// Replace <main> with <ConditionalLayout>
content = content.replace('<main className="min-h-screen">{children}</main>', '<ConditionalLayout>{children}</ConditionalLayout>');

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed layout.tsx');
