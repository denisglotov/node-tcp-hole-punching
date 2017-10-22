const readline = require('readline');
const net = require('net');

const RETRY_PERIOD = 2000; // 2 sec
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let socketToS;
let tunnelEstablished = false;
let tunnelSocket = null;

// Parse the parameters.
if (process.argv.length < 4) {
  console.log(
    `Too few arguments. Use: node ${process.argv[1]} public-server-host port [my-name].`);
  process.exit(-1);
}
const addressOfS = process.argv[2];
const portOfS = parseInt(process.argv[3], 10);
const user = process.argv[4] || process.env.USER;

// Connect to the public server to get the other part address-port.
function connectToS() {
  console.log(`(${user}->S) connecting to S...`);

  socketToS = net.createConnection({ host: addressOfS, port: portOfS }, () => {
    console.log(
      `(${user}->S) connected to S via ${socketToS.localAddress}:${socketToS.localPort}.`);

    // Letting local address and port know to S so it can be can be sent to client B:
    socketToS.write(JSON.stringify({
      name: user,
      localAddress: socketToS.localAddress,
      localPort: socketToS.localPort,
    }));
  });

  socketToS.on('data', (data) => {
    console.log(`(${user}->S) response from S: ${data}.`);
    const dataChunks = data.toString().replace(/}{/g, '},,{').split(',,'); // tcp packets may combine
    dataChunks.forEach(chunk => chunk && onServerData(chunk));
  });

  socketToS.on('end', () => {
    console.log(`(${user}->S) connection closed.`);
  });

  socketToS.on('error', (err) => {
    console.log(`(${user}->S) connection closed with err: ${err.code}.`);
  });
}
connectToS();

// Handle data received from the public server.
function onServerData(data) {
  const connectionDetails = JSON.parse(data);
  if (connectionDetails.name === user) {
    // Own connection details, only used to display the connection to the
    // server in the console.
    console.log(
      `(${user}) ${socketToS.localAddress}:${socketToS.localPort}`,
      `===> (NAT of ${user})`,
      `${connectionDetails.remoteAddress}:${connectionDetails.remotePort}`,
      `===> (S) ${socketToS.remoteAddress}:${socketToS.remotePort}\n`);
  } else {
    console.log(
      `(${user}) time to listen on port used to connect to S (${socketToS.localPort})`);
    setTimeout(listen, 0, socketToS.localAddress, socketToS.localPort);

    // For linux you need to destroy socket and wait some time before
    // listerning on the same port.
    socketToS.destroy();

    // Try connecting to the peer directly.
    connectTo(connectionDetails.remoteAddress, connectionDetails.remotePort);
  }
}

// Connect to the discovered peer.
function connectTo(ip, port) {
  if (tunnelEstablished) return;

  console.log(`(${user}) connecting: ===> (peer) ${ip}:${port}.`);
  const c = net.createConnection({ host: ip, port }, () => {
    console.log(`(${user}) Connected to peer via ${ip}:${port}.`);
    tunnelEstablished = true;
  });

  c.on('data', (data) => {
    console.log(`(${user}) data from peer: ${data.toString()}.`);
  });

  c.on('end', () => {
    console.log(`(${user}) connection closed.`);
  });

  c.on('error', (err) => {
    console.log(`(${user}) connection closed with peer, err: ${err.code}. Retrying...`);
    setTimeout(connectTo, RETRY_PERIOD, ip, port);
  });
}

// Listern on the specified network and port.
function listen(ip, port) {
  const server = net.createServer((socket) => {
    tunnelSocket = socket;
    console.log(
      `(${user}) someone connected, it is: ${socket.remoteAddress}:${socket.remotePort}.`);
    socket.write(`Hello there NAT traversal man, you are connected to ${user}!`);
    tunnelEstablished = true;
    readStuffFromCommandLineAndSend();
  });

  server.listen(port, ip, (err) => {
    if (err) console.log(err);
    console.log(`(${user}) listening on ${ip}:${port}.`);
  }).on('error', (err) => {
    console.log(`(${user}) listening error ${err.message}.`);
    setTimeout(listen, RETRY_PERIOD, ip, port);
  });
}

function readStuffFromCommandLineAndSend() {
  if (!tunnelSocket) return;
  rl.question('Say something to peer: ', (stuff) => {
    tunnelSocket.write(stuff);
    readStuffFromCommandLineAndSend();
  });
}
