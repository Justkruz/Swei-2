const keys = Object.keys(process.env).filter(k => k.includes('API') || k.includes('KEY') || k.includes('TOKEN') || k.includes('SEARCH') || k.includes('HUGGING') || k.includes('BRAVE'));
console.log(JSON.stringify(keys));
