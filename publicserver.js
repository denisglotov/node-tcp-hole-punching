// based on http://www.bford.info/pub/net/p2pnat/index.html

let socketA = null;
let socketB = null;

const detailsA = {
  name: 'A',
  localAddress: null,
  localPort: null,
  remoteAddress: null,
  remotePort: null,
};

const detailsB = {
  name: 'B',
  localAddress: null,
  localPort: null,
  remoteAddress: null,
  remotePort: null,
};


// assuming A will connect first:
const server = require('net').createServer((socket) => {
  if (!socketA) {
    aConnects(socket);
  } else {
    bConnects(socket);
  }
});

server.listen(9999, (err) => {
  if (err) console.log(err);
  console.log('server listening on', `${server.address().address}:${server.address().port}`);
});


function aConnects(socket) {
  socketA = socket;
  console.log('> (A) assuming A is connecting');
  console.log('> (A) remote address and port are:', socket.remoteAddress, socket.remotePort);
  console.log('> (A) storing this for when B connects');

  detailsA.remoteAddress = socket.remoteAddress;
  detailsA.remotePort = socket.remotePort;

  socket.on('data', (data) => {
    console.log('> (A) incomming data from A:', data.toString());
    const localDataA = JSON.parse(data.toString());
    if (!localDataA.name || localDataA.name !== 'A') {
      console.log('> (A) this is not the local data of A');
    }
    console.log('> (A) storing this for when B connects');
    console.log('');
    detailsA.localAddress = localDataA.localAddress;
    detailsA.localPort = localDataA.localPort;
    console.log('> (A) sending remote details back to A');
    socket.write(JSON.stringify(detailsA));

    console.log(
      '> (A)', `${detailsA.localAddress}:${detailsA.localPort}`,
      '===> (NAT of A)', `${detailsA.remoteAddress}:${detailsA.remotePort}`,
      '===> (S)', `${socket.localAddress}:${socket.localPort}`);
  });

  socket.on('end', () => {
    console.log('> (A) connection closed.');
    socketA = null;
  });

  socket.on('error', (err) => {
    console.log('> (A) connection closed with err (', err, ').');
    socketA = null;
  });
}

function bConnects(socket) {
  socketB = socket;

  console.log('> (B) assuming B is connecting');
  console.log('> (B) remote address and port are:', socket.remoteAddress, socket.remotePort);
  console.log('> (B) storing this');
  detailsB.remoteAddress = socket.remoteAddress;
  detailsB.remotePort = socket.remotePort;

  socket.on('data', (data) => {
    console.log('> (B) incomming data from B:', data.toString());
    const localDataB = JSON.parse(data.toString());
    if (!localDataB.name || localDataB.name !== 'B') {
      console.log('> (B) this is not the local data of B');
    }
    console.log('> (B) storing this');
    console.log('');
    detailsB.localAddress = localDataB.localAddress;
    detailsB.localPort = localDataB.localPort;
    console.log('> (B) sending remote details back to B');
    socket.write(JSON.stringify(detailsB));

    console.log(
      '> (B)', `${detailsB.localAddress}:${detailsB.localPort}`,
      '===> (NAT of B)', `${detailsB.remoteAddress}:${detailsB.remotePort}`,
      '===> (S)', `${socket.localAddress}:${socket.localPort}`);

    console.log('> (S->A) sending B\'s details:', detailsB);
    socketA.write(JSON.stringify(detailsB));

    console.log('> (S->B) sending A\'s details:', detailsA);
    socketB.write(JSON.stringify(detailsA));

    console.log('');
  });

  socket.on('end', () => {
    console.log('> (B) connection closed.');
    socketB = null;
  });

  socket.on('error', (err) => {
    console.log('> (B) connection closed with err (', err, ').');
    socketB = null;
  });
}
