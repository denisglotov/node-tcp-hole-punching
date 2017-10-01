const net = require('net');

// Slots to store the connected peer data.
const slot = [null, null];

// Parse the parameters.
const port = process.argv.length > 2 ? parseInt(process.argv[2], 10) : 3000;

// Handle incomming connection with a free slot.
const server = net.createServer((socket) => {
  if (slot[0] == null) {
    onConnect(socket, 0);
  } else if (slot[1] == null) {
    onConnect(socket, 1, 0);
  } else {
    console.log('Slots A and B are busy, please wait a little...');
  }
});

server.listen(port, (err) => {
  if (err) console.log(err);
  console.log(`Server listening on ${server.address().address}:${server.address().port}.`);
});

// Handle the peer connection.
function onConnect(socket, freeIdx, peerIdx) {
  console.log(
    `[${freeIdx}] incomming connection from ${socket.remoteAddress}:${socket.remotePort}.`);
  slot[freeIdx] = {
    index: freeIdx,
    data: { remoteAddress: socket.remoteAddress, remotePort: socket.remotePort },
    socket };

  socket.on('data', (data) => {
    console.log(`[${freeIdx}] incomming data: ${data.toString()}.`);
    const localData = JSON.parse(data.toString());
    slot[freeIdx].data.name = localData.name;
    slot[freeIdx].data.localAddress = localData.localAddress;
    slot[freeIdx].data.localPort = localData.localPort;

    console.log(
      `[${freeIdx}] (${localData.name}) ${localData.localAddress}:${localData.localPort}`,
      `===> (NAT of ${localData.name}) ${socket.remoteAddress}:${socket.remotePort}`,
      `===> (Server) ${socket.localAddress}:${socket.localPort}`);

    const ownData = JSON.stringify(slot[freeIdx].data);
    console.log(`[${freeIdx}] sending own's: ${ownData}.`);
    socket.write(ownData);

    // If we have another peer already connected, send this data to him and
    // his data to this peer.
    if (peerIdx !== undefined) {
      const peerData = JSON.stringify(slot[peerIdx].data);
      console.log(`[${freeIdx}] sending peer's: ${ownData}.`);
      slot[peerIdx].socket.write(ownData);

      console.log(`[${freeIdx}] sending peer's: ${peerData}.`);
      slot[freeIdx].socket.write(peerData);
    }

    console.log('');
  });

  socket.on('end', () => {
    console.log(`[${freeIdx}] connection closed.`);
    slot[freeIdx] = null;
  });

  socket.on('error', (err) => {
    console.log(`[${freeIdx}] connection closed with error ${err.message}.`);
    slot[freeIdx] = null;
  });
}
