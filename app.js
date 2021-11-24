require('dotenv').config();

const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const {
    graphqlHTTP
} = require('express-graphql');

const errorHandler = require('./graphql/error-handler');

const userGraphqlSchema = require('./graphql/userApi/user-schema');
const userGraphqlResolver = require('./graphql/userApi/user-resolvers');
const verkerGraphqlSchema = require('./graphql/verkerApi/verker-schema');
const verkerGraphqlResolver = require('./graphql/verkerApi/verker-resolvers');

const auth = require('./middleware/auth');
const filemanagement = require('./routes/filemanagement-route');

const mdbUser = process.env.MONGODB_USER_NAME;
const mdbPw = process.env.MONGODB_PASSWORD;

const app = express();

const server = new ApolloServer({verkerGraphqlSchema, verkerGraphqlResolver});

server.applyMiddleware({app});


// Here we define that the request body is an json object
app.use(bodyParser.json());

// Here we set a default header for all posts
app.post((res, req, next) => {
    res.setHeader('Content-Type', 'application/json', 'Authorization');
    next();
});



app.use("/", auth);


app.use("/file", filemanagement);



app.use('/graphql/user', graphqlHTTP({
    schema: userGraphqlSchema,
    rootValue: userGraphqlResolver,
    graphiql: true
}));

app.use('/graphql/verker', graphqlHTTP({
    schema: verkerGraphqlSchema,
    rootValue: verkerGraphqlResolver,
    graphiql: true,
    customFormatErrorFn: (err) => {
        console.log(err);
        const error = errorHandler(err.message)
        return ({
            message: error.message,
            extensions: {
                statusCode: error.statusCode,
                customCode: error.customCode,
            }
        })
    }
}));

app.use((err, req, res, next) => {
    const status = error.statusCode || 500;
    const message = error.message;

    res.status(999).json({
        message: error.message,
        statusCode: error.statusCode,
        customCode: error.customCode,
    });
})

// Connecing to database and serving:
mongoose.connect(`mongodb+srv://${mdbUser}:${mdbPw}@verker.dewet.mongodb.net/verker?retryWrites=true&w=majority`).
then(result => {
    app.listen(8080);
}).catch(err => {
    console.log(err);
});