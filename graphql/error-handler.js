const { errorType } = require('./constants')

module.exports = getErrorCode = errorName => {
  return errorType[errorName]
}

