require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
// const fs = require('fs');
// const https = require('https');
const http = require('http');
// const path = require('path');

const {
  graphqlHTTP,
} = require('express-graphql');

const { errorHandler } = require('./graphql/error-handler');

const resolver = require('./graphql/api/index');
const schema = require('./graphql/api/schema');

const auth = require('./middleware/auth');
const { router, getFileStream } = require('./routes/filemanagement-route');

const mdbUser = process.env.MONGODB_USER_NAME;
const mdbPw = process.env.MONGODB_PASSWORD;

const app = express();
// const sslServer = https.createServer({
//   key: fs.readFileSync(path.join(__dirname, 'ssl', 'client-key.pem')),
//   cert: fs.readFileSync(path.join(__dirname, 'ssl', 'client-cert.pem')),
// }, app);
const server = http.createServer(app);

// const io = new Server(server);

// Here we define that the request body is an json object
app.use(bodyParser.json());

// Here we set a default header for all posts
app.post((res, req, next) => {
  res.setHeader('Content-Type', 'application/json', 'Authorization');
  next();
});

app.use('/', auth);

app.use('/file', router);

app.get('/images/:key(*)', (req, res) => {
  const { key } = req.params;

  const readStream = getFileStream(key);

  readStream.pipe(res);
});

app.use('/graphql', graphqlHTTP({
  schema,
  rootValue: resolver,
  graphiql: true,
  customFormatErrorFn: (err) => {
    const error = errorHandler(err.message);
    console.log(err);
    return ({
      message: error.message,
      extensions: {
        errorName: err.message,
        statusCode: error.statusCode,
        customCode: error.customCode,
      },
    });
  },
}));

app.use((err, req, res) => {
//   const status = err.statusCode || 500;
//   const { message } = err;

  res.status(999).json({
    message: err.message,
    statusCode: err.statusCode,
    customCode: err.customCode,
  });
});

// Connecing to database and serving:
mongoose.connect(`mongodb+srv://${mdbUser}:${mdbPw}@verker.dewet.mongodb.net/verker?retryWrites=true&w=majority`)
  . then(() => {
    server.listen(8080, () => {
      console.log('connected!!!!🔥');
    });
  }).catch((err) => {
    console.log(err);
  });
