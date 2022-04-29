// import userMutations from './user/mutations';
// import userQueries from './user/queries';

const userQueries = require('./user/queries');
const userMutations = require('./user/mutations');
const verkerQueries = require('./verker/queries');
const verkerMutations = require('./verker/mutations');

module.exports = {
  ...userQueries,
  ...userMutations,
  ...verkerQueries,
  ...verkerMutations,
};
