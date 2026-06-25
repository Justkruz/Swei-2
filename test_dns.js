import dns from 'dns';
dns.lookup('huggingface.co', (err, address, family) => {
  console.log('huggingface.co address: %j family: IPv%s', address, family);
  if (err) console.error(err);
});
dns.lookup('api.huggingface.co', (err, address, family) => {
  console.log('api.huggingface.co address: %j family: IPv%s', address, family);
  if (err) console.error(err);
});
