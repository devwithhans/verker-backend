const { errorType } = require('./constants');

module.exports = {
  errorHandler(errorName) {
    return errorType[errorName];
  },
};
