const fs = require('fs');

const ProjectModel = require('../../models/project-model');
// const CompanyModel = require('../../models/companyModel');
// const ContactModel = require('../../models/companyContactModel');
// const MessageModel = require('../../models/messageModel');

const {
    validationResult
} = require('express-validator')
const path = require('path');

// const mongoose = require('mongoose');
// const { nextTick } = require('process');


// This function gets the projects of the sigend in user 
exports.getProjects = (req, res, next) => {

    console.log('getProject was called');

    const coordinates = [Number(req.query.lng), Number(req.query.lat)];
    const maxDistanceInMeters = Number(req.query.maxDistanceInMeters);

    let query = {
        location: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: coordinates,
                },
                $maxDistance: maxDistanceInMeters,
            },
        },
    };

    if (req.query.projectType) {
        Object.assign(query, {
            'projectType': req.query.projectType
        });
    };

    // We find the projects for the current user
    ProjectModel.find(query)
        .lean()
        .then((project) => {
            // Now we simply respond with the projects

            if (!project) {
                const error = new Error('No projects was found');
                error.statusCode = 404;
                throw error;
            }

            const projectWithDistance = [];

            for (var i in project) {
                var distance = getDistanceFromLatLonInKm(project[i]['location']['coordinates'][0], project[i]['location']['coordinates'][1], coordinates[0], coordinates[1])
                Object.assign(project[i], {
                    'distance': distance
                });
            }

            res.status(200).json({
                message: 'Projects was succesfully queried',
                projects: project,
            });
        })
        .catch((err) => {
            if (err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });

}

// This function gets a single project, if its owned by the user
exports.getProjectById = (req, res, next) => {

    const _id = req.params.projectId;

    const project = ProjectModel.findOne({
        _id: _id,
        consumerId: req.userId,
    }).then((project) => {
        if (!project) {
            const error = new Error('We found no project with this id, that you got acces to')
            error.statusCode = 404;
            throw error;
        }
        console.log(project);
        res.status(200).json(project);
    }).catch((err) => {
        if (err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
}

// This function establishes contact between the user and the company. Creates first message, and companyContact document
exports.contact = (req, res, next) => {

    const Contact = new ContactModel({
        projectId: req.body.projectId,
        company: {
            companyName: req.body.companyName,
            companyId: req.body.companyId,
            companyLogo: req.body.companyLogo,
        },
        consumer: {
            consumerFirstName: req.body.consumerFirstName,
            consumerId: req.body.consumerId,
            consumerProfileImage: req.body.consumerProfileImage,
            consumerEmail: req.body.consumerEmail,
            consumerPhone: req.body.consumerPhone,
        },
        status: 'pending',
        members: [
            {
                userId: req.userId,
                totalUndread: 0,
                role: req.role
            },
            {
                userId: req.body.consumerId,
                totalUndread: 1,
                role: 'user'
            }
        ],
        totalMessages: 1,
    });


    Contact.save().then(contact => {
        ProjectModel.findById(req.body.projectId).then((project) => {

            // We start checking if it exists
                if (!project) {
                    const error = new Error('Could not find project');
                    error.statusCode = 404;
                    throw error;
                }
    
                // If we reached this step we now updates the values. 
                project.contacts.push(contact._id);
    
                // Finaly we save the project to the database
                return project.save();
            }). 
            then(() => {
                const message = new MessageModel({
                    message: req.body.message,
                    files: req.body.files || [],
                    sender: {
                        firstName: req.body.firstName,
                        userId: req.userId,
                        role: req.role,
                        profileImage: req.body.firstName,
                    },
                    contactId: contact._id,
                });
            })
            .catch((err) => {
                if (!err.statusCode) {
                    err.statusCode = 500;
                }
                next(err);
            });


        res.status(201).json({status: 'success', data: result});
    }).catch(err => {
        if (err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    })

}




function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1); // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

// Close project
// Begin project