/* eslint no-underscore-dangle: ["error", { "allow": ["_id", "_doc"] }] */
require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { connect } = require('getstream');

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

const serverClient = connect(apiKey, apiSecret);

const UserModel = require('../../../models/user-model');
const ProjectModel = require('../../../models/project-model');
const OutreachModel = require('../../../models/outreach-model');
const CompanyModel = require('../../../models/company-model');

const {
  errorName,
} = require('../../constants');

const jwtHt = process.env.JWT_TOKEN;

module.exports = {

  async getUser(res, req) {
    console.log('getUser');

    if (!req.isUser && !req.isVerker) {
      const error = new Error(errorName.NOT_VERKER);
      throw error;
    }

    const user = await UserModel.findById(req.userId);

    if (!user) {
      const error = new Error(errorName.USER_DOES_NOT_EXIST);
      throw error;
    }

    const userToken = serverClient.createUserToken(user._id.toString());

    return {
      ...user._doc,
      streamToken: userToken,
    };
  },
  async refreshJWT(res, req) {
    console.log('refreshJWT');

    if (!req.userId) {
      const error = new Error(errorName.NOT_VERKER);
      throw error;
    }

    const user = await UserModel.findById(req.userId);
    let company = await CompanyModel.findById(user.companyId);

    if (user.companyId) {
      if (user.companyId.toString().length === 24) {
        company = await CompanyModel.findById(user.companyId);
      }
    }

    const jsonWebToken = await jwt.sign({
      email: user.email,
      userId: user._id.toString(), // If the user is autorised then we create a Json Web Token
      role: company != null ? 'verker' : 'user',
      companyId: user.companyId ??= '',
      // The following is the secret key, that can unlock the token cryptation
    }, jwtHt, {
      // expiresIn: '1h'
    });
    const userToken = serverClient.createUserToken(user._id.toString());

    return {
      jwt: jsonWebToken,
      user: {
        ...user._doc,
        streamToken: userToken,
      },
    };
  },
  async signinUser({
    email,
    password,
    verker,
  }) {
    console.log('signinUser');

    const user = await UserModel.findOne({
      email, // Checking if the email exists in the database
    });

    if (!user) {
      throw new Error(errorName.EMAIL_NOT_FOUND);
    }

    let company;
    if (user.companyId) {
      if (verker && user.companyId.toString().length === 24) {
        company = await CompanyModel.findById(user.companyId);
      }
    }

    const pwMatch = await bcrypt.compare(password, user.password);
    // If the email exists then we check if the password entered match

    if (!pwMatch) {
      const error = new Error('PASSWORD_IS_INCORRECT'); // We throw a error if the password does not match
      error.statusCode = 404;
      throw error;
    }

    const jsonWebToken = await jwt.sign({
      email: user.email,
      userId: user._id.toString(), // If the user is autorised then we create a Json Web Token
      role: company != null ? 'verker' : 'user',
      companyId: user.companyId ??= '',
      // The following is the secret key, that can unlock the token cryptation
    }, jwtHt, {
      // expiresIn: '1h'
    });

    const userToken = serverClient.createUserToken(user._id.toString());

    // const response = await serverClient.upsertUsers([{
    //   id: user._id.toString(),
    //   role: 'user',
    //   firstName: user.firstName,
    //   lastName: user.lastName,
    //   image: user.profileImage,

    // }]);

    return {
      jwt: jsonWebToken,
      verker: company != null,
      user: {
        ...user._doc,
        verker: company != null,
        streamToken: userToken,
      },
    };
  },
  async getProjects(res, req) {
    console.log('getProjects');

    if (!req.isUser && !req.isVerker) {
      const error = new Error(errorName.NOT_VERKER);
      throw error;
    }

    const project = await ProjectModel.find({
      consumerId: req.userId,
    });

    if (!project) {
      throw new Error(errorName.NO_PROJECTS);
    }

    return project;
  },
  async getOutreaches(res, req) {
    console.log('getOutreaches');

    if (!req.isUser) {
      const error = new Error(errorName.NOT_VERKER);
      throw error;
    }

    const outreaches = await OutreachModel.find({
      consumerId: req.userId,
    });

    return outreaches;
    // return outreaches
  },
};
