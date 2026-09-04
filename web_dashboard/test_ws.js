const WebSocket = require('ws');
const token = '104b427a0c8a3b9ae5f3110e91d3ce99317ffaaa97c3925d5a55a9f93a72bcc2';

const ws = new WebSocket(`wss://api.manhquansolar.io.vn/ws?token=${token}`);

ws.on('open', function open() {
  console.log('Connected');
  
  // Try subscribing without devices list
  ws.send(JSON.stringify({
    topic: 'subscribe',
    payload: {
      devices: [] // or omit completely, we'll see
    }
  }));
});

ws.on('message', function message(data) {
  console.log('Received:', data.toString());
});

ws.on('error', console.error);

setTimeout(() => {
    ws.close();
}, 5000);
