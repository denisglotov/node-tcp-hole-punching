// based on http://www.bford.info/pub/net/p2pnat/index.html

const readline = require('readline');
const net = require('net');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const addressOfS = 'x.x.x.x'; // replace this with the IP of the server running publicserver.js
const portOfS = 9999;

let socketToS;
let tunnelEstablished = false;

function connectToS() {
  console.log('> (A->S) connecting to S');

  socketToS = net.createConnection({ host: addressOfS, port: portOfS }, () => {
    console.log('> (A->S) connected to S via', socketToS.localAddress, socketToS.localPort);

    // letting local address and port know to S so it can be can be sent to client B:
    socketToS.write(JSON.stringify({
      name: 'A',
      localAddress: socketToS.localAddress,
      localPort: socketToS.localPort,
    }));
  });

  socketToS.on('data', (data) => {
    console.log('> (A->S) response from S:', data.toString());

    const connectionDetails = JSON.parse(data.toString());
    if (connectionDetails.name === 'A') {
      // own connection details, only used to display the connection to the
      // server in console:
      console.log('');
      console.log(
        '> (A)', `${socketToS.localAddress}:${socketToS.localPort}`, '===> (NAT of A)',
        `${connectionDetails.remoteAddress}:${connectionDetails.remotePort}`,
        '===> (S)', `${socketToS.remoteAddress}:${socketToS.remotePort}`);
      console.log('');
    }

    if (connectionDetails.name === 'B') {
      console.log(
        `> (A) time to listen on port used to connect to S (${socketToS.localPort})`);
      listen(socketToS.localAddress, socketToS.localPort);

      // try connecting to B directly:
      connectTo(connectionDetails.remoteAddress, connectionDetails.remotePort);
    }
  });

  socketToS.on('end', () => {
    console.log('> (A->S) connection closed.');
  });

  socketToS.on('error', (err) => {
    console.log('> (A->S) connection closed with err:', err.code);
  });
}

connectToS();


function connectTo(ip, port) {
  if (tunnelEstablished) return;

  console.log('> (A->B) connecting to B: ===> (B)', `${ip}:${port}`);
  const c = net.createConnection({ host: ip, port }, () => {
    console.log('> (A->B) Connected to B via', `${ip}:${port}`);
    tunnelEstablished = true;
  });

  c.on('data', (data) => {
    console.log('> (A->B) data from B:', data.toString());
  });

  c.on('end', () => {
    console.log('> (A->B) connection closed.');
  });

  c.on('error', (err) => {
    console.log('> (A->B) connection closed with err:', err.code);
    setTimeout(() => {
      connectTo(ip, port);
    }, 500);
  });
}

let tunnelSocket = null;

function listen(ip, port) {
  const server = net.createServer((socket) => {
    tunnelSocket = socket;

    console.log('> (A) someone connected, it is:', socket.remoteAddress, socket.remotePort);

    socket.write('Hello there NAT traversal man, you are connected to A!');
    tunnelEstablished = true;

    readStuffFromCommandLineAndSendToB();
  });

  server.listen(port, ip, (err) => {
    if (err) console.log(err);
    console.log('> (A) listening on ', `${ip}:${port}`);
  });
}

function readStuffFromCommandLineAndSendToB() {
  if (!tunnelSocket) return;

  rl.question('Say something to B:', (stuff) => {
    tunnelSocket.write(stuff);
    readStuffFromCommandLineAndSendToB();
  });
}
