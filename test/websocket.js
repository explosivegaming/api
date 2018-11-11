const WebSocket = require('ws');
 
const ws = new WebSocket('http://localhost:3003/s1/discordEmit/feed?key=EBF3gZejQ8uUyQxS');
 
ws.on('open',() => {
    console.log('Connected');
});
 
ws.on('close',(code,reason) => {
    console.log(`Disconnected - ${code}: ${reason}`);
});

ws.on('message',data => {
    console.log('RAW')
    console.log(data);
    console.log('STRING')
    console.log(data.toString());
    console.log('JSON')
    try {console.log(JSON.parse(data))} catch (err) {}
});