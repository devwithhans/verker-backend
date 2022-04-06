exports.errorName = {
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  EMAIL_NOT_FOUND: 'EMAIL_NOT_FOUND',
  PASSWORD_IS_INCORRECT: 'PASSWORD_IS_INCORRECT',
  NO_JWT: 'NO_JWT',
  NOT_VERKER: 'NOT_VERKER',
  USER_DOES_NOT_EXIST: 'USER_DOES_NOT_EXIST',
  NO_PROJECTS: 'NO_PROJECTS',
  NEED_OWNER_ACCOUNT: 'NEED_OWNER_ACCOUNT',
  UNABLE_TO_SAVE_OUTREACH: 'UNABLE_TO_SAVE_OUTREACH',
  ALREADT_OUTREACHED: 'ALREADT_OUTREACHED',
  NO_SOCKET_FOUND: 'NO_SOCKET_FOUND',
  NO_MESSAGES: 'NO_MESSAGES',
}

exports.errorType = {
  USER_ALREADY_EXISTS: {
    message: 'User is already exists.',
    statusCode: 403,
    customCode: 1001
  },
  EMAIL_NOT_FOUND: {
    message: 'The email address does not exist',
    statusCode: 500,
    customCode: 1002
  },
  PASSWORD_IS_INCORRECT: {
    message: 'The password is incorrect',
    statusCode: 500,
    customCode: 1003
  },
  NOT_VERKER: {
    message: 'The JWT does not give verker acces as required',
    statusCode: 500,
    customCode: 1004
  },
  USER_DOES_NOT_EXIST: {
    message: 'The query dit not return a valid user',
    statusCode: 500,
    customCode: 1005
  },
  NEED_OWNER_ACCOUNT: {
    message: 'You need owner account',
    statusCode: 500,
    customCode: 1006
  },
  NO_JWT: {
    message: 'The token is not valid',
    statusCode: 500,
    customCode: 1106
  },
  NO_PROJECTS: {
    message: 'There was no results',
    statusCode: 500,
    customCode: 2101
  },
  UNABLE_TO_SAVE_OUTREACH: {
    message: 'We could not save the outreach to the database',
    statusCode: 500,
    customCode: 2102
  },
  ALREADT_OUTREACHED: {
    message: 'You can only make one outreach for each project',
    statusCode: 500,
    customCode: 2102
  },
  NO_SOCKET_FOUND: {
    message: 'No socket was found',
    statusCode: 500,
    customCode: 2104
  },
  NO_MESSAGES: {
    message: 'No messages was found',
    statusCode: 500,
    customCode: 2105
  },

}