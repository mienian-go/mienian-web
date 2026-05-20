const fs = require('fs');
const path = require('path');
const file1 = path.join('c:\\', 'Users', 'Seto Raffa Aditiya', '.gemini', 'antigravity', 'playground', 'mienian-mobile', 'src', 'components', 'NearbyKangDoMieMap.tsx');
let content1 = fs.readFileSync(file1, 'utf8');

content1 = content1.replace('return diff <= 15000; // 15 seconds buffer', 'return diff <= 45000; // 45 seconds buffer');
content1 = content1.replace('getDistanceKm(loc.lat, loc.lng, k.lat, k.lng) <= 10.0 // 10km detection radius', 'getDistanceKm(loc.lat, loc.lng, k.lat, k.lng) <= 1.0 // 1km detection radius');
content1 = content1.replace('radius={10000}', 'radius={1000}');

fs.writeFileSync(file1, content1);

const file2 = path.join('c:\\', 'Users', 'Seto Raffa Aditiya', '.gemini', 'antigravity', 'playground', 'mienian-mobile', 'src', 'app', 'mienian-go', 'page.tsx');
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace('return diff <= 10000; // 10 seconds buffer', 'return diff <= 45000; // 45 seconds buffer');

fs.writeFileSync(file2, content2);
console.log("Success");
