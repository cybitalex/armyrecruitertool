const fs = require('fs');

// Read the MOS list
const mosData = fs.readFileSync('MOSList.txt', 'utf-8');
const lines = mosData.split('\n').slice(1); // Skip header

const mosList = [];
const mosMap = new Map();

lines.forEach(line => {
  const [code, name, rank] = line.split('\t');
  if (code && name && rank) {
    const entry = { code: code.trim(), name: name.trim(), rank: rank.trim() };
    mosList.push(entry);
    
    // Build a map for quick lookup
    if (!mosMap.has(code.trim())) {
      mosMap.set(code.trim(), []);
    }
    mosMap.get(code.trim()).push(entry);
  }
});

// Save as JSON
fs.writeFileSync('shared/mos-data.json', JSON.stringify({ mosList, count: mosList.length }, null, 2));
console.log(`✅ Converted ${mosList.length} MOS entries to JSON`);
