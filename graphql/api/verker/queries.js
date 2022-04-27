/* eslint no-underscore-dangle: ["error", { "allow": ["_id", "_doc"] }] */
require('dotenv').config();

const ProjectModel = require('../../../models/project-model');
const OutreachModel = require('../../../models/outreach-model');
// const MessageModel = require('../../../models/message-model');
const CompanyModel = require('../../../models/company-model');

const {
  errorName,
} = require('../../constants');

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
function getDistanceFromLatLonInKm(lon1, lat1, lon2, lat2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1); // deg2rad below
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
              + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2))
              * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

module.exports = {
  async verkerGetProjects(res, req) {
    if (!req.isVerker) {
      const error = new Error(errorName.NOT_VERKER);
      throw error;
    }

    const outreaches = await OutreachModel.find({
      companyId: req.companyId,
    }).populate('projectId').sort([['updatedAt', -1]]);

    const result = [];

    outreaches.forEach((e) => {
      result.push({
        project: e.projectId,
        outreach: e,
      });
    });
    return result;
  },
  // async getOffer({
  //   offerId,
  // }) {
  //   const offer = await OfferModel.findById(offerId);
  //   if (!offer) {
  //     throw Error(errorName.NO_SOCKET_FOUND);
  //   }
  //   return offer;
  // },
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
      id: {
        $nin: outreachIds,
      },

    };

    // We find the projects for the current user
    const projects = await ProjectModel.find(query).limit(limit).skip(skip);

    // if (projects.length === 0) {
    //     const error = new Error('NO_PROJECTS');
    //     throw error;
    // }

    projects.forEach(async (e) => {
      const distance = await getDistanceFromLatLonInKm(
        e.location.coordinates[0],
        e.location.coordinates[1],
        coordinates[0],
        coordinates[1],
      );
      Object.assign(e, {
        distance,
      });
    });

    return projects;
  },
};
