require('dotenv').config();

// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// const { StreamChat } = require('stream-chat');

// const apiKey = 'cm6ynpu8m6f9';
// const apiSecret = 'twqjvajkmwvdd24epsd9f2z2zgtwb7zhc2mg7cxa9ab4kkn72tpeun3bewvzj42h';

// const serverClient = StreamChat.getInstance(apiKey, apiSecret);

const UserModel = require('../../models/user-model');
const ProjectModel = require('../../models/project-model');
const OutreachModel = require('../../models/outreach-model');
const CompanyModel = require('../../models/company-model');
const { errorName } = require('../constants');
// const OfferModel = require('../../models/offer-model');

module.exports = {
  async createCompany({
    companyInput,
  }, req) {
    if (!req.isUser) {
      const error = new Error(errorName.NOT_VERKER);
      throw error;
    }
    const newCompany = new CompanyModel({
      owner: req.userId,
      name: companyInput.name,
      type: companyInput.type,
      description: companyInput.description,
      cvr: companyInput.cvr,
      email: companyInput.email,
      phone: companyInput.phone,
      employees: companyInput.employees,
      logo: companyInput.logo,
      established: companyInput.established,
      address: companyInput.address,
    });

    const result = await newCompany.save();

    if (!result) {
      const error = new Error(errorName.NOT_VERKER);
      throw error;
    }
    await UserModel.findByIdAndUpdate(req.userId, {
      companyId: result._id.toString(),
    });

    return {
      ...result._doc,
      _id: result._id.toString(),
    };
  },
  async browseProjects({
    limit,
    skip,
    coordinates,
    maxDistance,
    type,
  }, req) {
    if (!req.isVerker) {
      const error = new Error(errorName.NOT_VERKER);
      throw error;
    }

    const company = await CompanyModel.findById(req.companyId);

    if (!company) throw new Error(errorName.NOT_VERKER);

    const outreachIds = company.outreaches.map((item) => item.projectId);

    const query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates,
          },
          $maxDistance: maxDistance,
        },
      },
      projectType: type,
      _id: {
        $nin: outreachIds,
      },

    };

    // We find the projects for the current user
    const projects = await ProjectModel.find(query).limit(limit).skip(skip);

    console.log(projects);
    // if (projects.length === 0) {
    //     const error = new Error('NO_PROJECTS');
    //     throw error;
    // }

    for (const i in projects) {
      const distance = await getDistanceFromLatLonInKm(projects[i].location.coordinates[0], projects[i].location.coordinates[1], coordinates[0], coordinates[1]);
      Object.assign(projects[i], {
        distance,
      });
    }

    return projects;
  },
  async verkerGetProjects(req) {
    if (!req.isVerker) {
      const error = new Error(errorName.NOT_VERKER);
      throw error;
    }

    const outreaches = await OutreachModel.find({
      companyId: req.companyId,
    }).populate('projectId').sort([
      ['updatedAt', -1],
    ]);

    const result = [];

    Object.values(outreaches).forEach((e) => {
      result.push({
        project: e.projectId,
        outreach: e,
      });
    });

    // for (const i in outreaches) {
    //   if (true) {
    //     result.push({
    //       project: outreaches[i].projectId,
    //       outreach: outreaches[i],
    //     });
    //   }
    // }

    return result;
  },
};
