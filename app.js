require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const {
    graphqlHTTP
} = require('express-graphql');
const http = require('http');

const errorHandler = require('./graphql/error-handler');

const userGraphqlSchema = require('./graphql/userApi/user-schema');
const userGraphqlResolver = require('./graphql/userApi/user-resolvers');
const verkerGraphqlSchema = require('./graphql/verkerApi/verker-schema');
const verkerGraphqlResolver = require('./graphql/verkerApi/verker-resolvers');

const auth = require('./middleware/auth');
const {router, getFileStream } = require('./routes/filemanagement-route');

const mdbUser = process.env.MONGODB_USER_NAME;
const mdbPw = process.env.MONGODB_PASSWORD;

const app = express();
const server = http.createServer(app);
const {
    Server
} = require("socket.io");
const { CostExplorer } = require('aws-sdk');
const io = require("./socket").init(server);


// const io = new Server(server);


// Here we define that the request body is an json object
app.use(bodyParser.json());

// Here we set a default header for all posts
app.post((res, req, next) => {
    res.setHeader('Content-Type', 'application/json', 'Authorization');
    next();
});


app.use("/", auth);


app.use("/file", router);

app.get("/images/:key(*)", (req, res, next) => {

    const key = req.params.key;

    const readStream = getFileStream(key);

    readStream.pipe(res);
    console.log('WE GET THIS NOW')

});


app.use('/graphql/user', graphqlHTTP({
    schema: userGraphqlSchema,
    rootValue: userGraphqlResolver,
    graphiql: true,
    customFormatErrorFn: (err) => {
        console.log(err);
        const error = errorHandler(err.message)
        return ({
            message: error.message ,
            extensions: {
                statusCode: error.statusCode,
                customCode: error.customCode,
            }
        })
    }
}));

app.use('/graphql/verker', graphqlHTTP({
    schema: verkerGraphqlSchema,
    rootValue: verkerGraphqlResolver,
    graphiql: true,
    customFormatErrorFn: (err) => {
        console.log(err);
        const error = errorHandler(err.message)
        return ({
            message: error.message ,
            extensions: {
                statusCode: error.statusCode,
                customCode: error.customCode,
            }
        })
    }
}));


app.use((err, req, res, next) => {
    console.log(error.message);
    const status = error.statusCode || 500;
    const message = error.message;

    res.status(999).json({
        message: error.message,
        statusCode: error.statusCode,
        customCode: error.customCode,
    });
})


io.on('connection', (socket) => {
    console.log('user connected')

    //Get the chatID of the user and join in a room of the same chatID
    userID = socket.handshake.query.userID
    socket.join(userID)

    socket.on('disconnect', () => {
        socket.leave(userID)
    });

    socket.on('send_message', message => {
        receiverChatID = message.receiverChatID
        senderChatID = message.senderChatID
        content = message.content

        //Send message to only that particular room
        socket.in(receiverChatID).emit('receive_message', {
            'content': content,
            'senderChatID': senderChatID,
            'receiverChatID':receiverChatID,
        })
    })
});




// Connecing to database and serving:
mongoose.connect(`mongodb+srv://${mdbUser}:${mdbPw}@verker.dewet.mongodb.net/verker?retryWrites=true&w=majority`).
then(result => {
    server.listen(8080, () => {

        console.log('connected!!!!🔥')
    });

}).catch(err => {
    console.log(err);
});