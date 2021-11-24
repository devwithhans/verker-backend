let io;

module.exports = {
    init: httpServer => {
        io = require('socket.io')(httpServer);
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