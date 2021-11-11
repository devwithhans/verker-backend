require('dotenv').config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const {
    graphqlHTTP
} = require('express-graphql');



const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const auth = require('./middleware/auth');
const filemanagement = require('./routes/filemanagement-route');
const { AppSync } = require('aws-sdk');

const mdbUser = process.env.MONGODB_USER_NAME;
const mdbPw = process.env.MONGODB_PASSWORD;



const app = express();





// Here we define that the request body is an json object
app.use(bodyParser.json());

// Here we set a default header for all posts
app.post((res, req, next) => {
    res.setHeader('Content-Type', 'application/json', 'Authorization');
    next();
});






app.use("/", auth);


app.use("/file", filemanagement);



//These are the routes to all the business logic
app.use('/graphql', graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true
}));

// This middleware is reached if we got a issue, and is responding with a statuscode and a message
app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    // const data  = error.data;

    res.status(status).json({
        message: message,
        // data: data,
    });
})

// Connecing to database and serving:
mongoose.connect(`mongodb+srv://${mdbUser}:${mdbPw}@verker.dewet.mongodb.net/verker?retryWrites=true&w=majority`).
then(result => {
    app.listen(8080);
}).catch(err => {
    console.log(err);
});