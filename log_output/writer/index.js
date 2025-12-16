const fs = require('fs');
const path = require('path');
const { randomUUID } = require("crypto");

const FILE_PATH = '/shared/logs.txt';
const id = randomUUID();

// Ensure directory exists
const dir = path.dirname(FILE_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Write initial entry
fs.appendFileSync(FILE_PATH, `${new Date().toISOString()}: ${id}\n`);

// Write every 5 seconds
setInterval(() => {
  const line = `${new Date().toISOString()}: ${id}\n`;
  fs.appendFileSync(FILE_PATH, line);
  console.log(`Written: ${line.trim()}`);
}, 5000);

console.log(`Writer started, random string: ${id}`);

