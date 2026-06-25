async function test() {
  const searchRes = await fetch('https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=test&utf8=&format=json');
  console.log(searchRes.status);
}
test();
