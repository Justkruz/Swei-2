const fs = require('fs');

const reasoning = fs.readFileSync('reasoning_batch_1.json', 'utf8');
const tools = fs.readFileSync('tools_batch_1.json', 'utf8');

const output = `Part 1: Reasoning JSON (reasoning_batch_1.json)

${reasoning}

Part 2: Tools JSON (tools_batch_1.json)

${tools}
`;

fs.writeFileSync('reasoning_tools_batch.txt', output);
console.log('Combined files into reasoning_tools_batch.txt');
