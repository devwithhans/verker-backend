const { Server } = require("socket.io");
let io;


module.exports = {
    init: server => {
        io = new Server(server);
        return io;
    },
    getIO: () => {
        console.log('hertil')
        if(!io) {
            throw new Error('NO_SOCKET_FOUND')
        }
        return io
    }
}