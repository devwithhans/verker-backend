const fs = require('fs');

const ProjectModel = require('../../models/project-model');
const {
    validationResult
} = require('express-validator')
const path = require('path');

const mongoose = require('mongoose');
const { nextTick } = require('process');


// This file contains all the functionality for projects. This could be creating, getting and updating the projects


// Following function adds a project to the project collection in mongoDB
exports.addProject = (req, res, next) => {
    // Validating the request body
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    // Here we are creating a list of the file paths that was uploaded together with the request
    // const paths = req.files.map(file => file.path);

    // Here we fetch all the variables
    const title = req.body.title;
    const address = req.body.address;
    const location = req.body.location;
    const projectType = req.body.projectType;
    const projectImage = []; // We use the array containing the file paths
    const description = req.body.description;
    const creator = req.userId; // This was declared in the isAuth middleware
    const consumerFirstName = req.body.consumerFirstName;
    const consumerEmail = req.body.consumerEmail;
    const consumerPhone = req.body.consumerPhone;
    const consumerProfileImage = req.body.consumerProfileImage;


    // Now we can create our mongoose object with th data
    const project = new ProjectModel({
        title: title,
        address: address,
        location: location,
        projectType: projectType,
        projectImage: projectImage,
        description: description,
        creator: creator,
        consumerFirstName: consumerFirstName,
        consumerEmail: consumerEmail,
        consumerPhone: consumerPhone,
        consumerProfileImage: consumerProfileImage,
    });

    // We save the project to the database:
    project.save().then(result => {
            console.log(result)
            res.status(201).json({
                status: 'success',
                data: result
            });
        })
        .catch((err) => {
            if (err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}

// Following function updates the project parsed in the URL parameters
exports.updateProject = (req, res, next) => {

    // We get the projectId for the parameter entered to the URL
    const projectId = req.params.projectId;

    // Validation:
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422;
        throw error;
    }

    // Assigning values
    const title = req.body.title;
    const address = req.body.address;
    const geolocation = req.body.geolocation;
    const projectType = req.body.projectType;
    const description = req.body.description;
    const consumerId = req.userId;
    const consumerFirstName = req.body.consumerFirstName;
    const consumerEmail = req.body.consumerEmail;
    const consumerPhone = req.body.consumerPhone;
    const consumerProfileImage = req.body.consumerProfileImage;
    const projectImage = [req.body.projectImage];

    // If we detects new files, then we wanna push them to the existing projectImage array
    if (req.file) {
        projectImage.push(req.file.path);
        console.log(projectImage)
    }
    // If we at this point has no images, something went wrong and we throw a error
    if (!projectImage) {
        const error = new Error('There was no project image')
        error.statusCode = 422;
        throw error;
    }

    // Now we find the old document by the id parsed as parameter
    ProjectModel.findById(projectId).then((project) => {
        // We start checking if it exists
            if (!project) {
                const error = new Error('Could not find project');
                error.statusCode = 404;
                throw error;
            }
            // If the document exists then we wanna check if the current user has acces to it.
            // we do this by checking if the consumerId is the same as the current users.
            if(project.consumerId != req.userId && req.role != "master"){
                const error = new Error('You dont have permission to update this project');
                error.statusCode = 404;
                throw error;
            }

            // If we reached this step we now updates the values. 
            project.title = title;
            project.address = address;
            project.geolocation = geolocation;
            project.projectType = projectType;
            project.description = description;
            project.consumerId = consumerId;
            project.consumerFirstName = consumerFirstName;
            project.consumerEmail = consumerEmail;
            project.consumerPhone = consumerPhone;
            project.consumerProfileImage = consumerProfileImage;
            project.projectImage = projectImage;

            // Finaly we save the project to the database
            return project.save();

        })
        .then((result => {
            // We resonds witch a message and the updated data
            res.status(200).json({
                message: 'Project succesfully updated',
                data: result
            });
        }))
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}

// Following function deletes the project parsed in the URL
exports.deleteProject = (req, res, next) => {
    const projectId = req.params.projectId;

    ProjectModel.findById(projectId).then((project) => {
        if (!project) {
            const error = new Error('Project to delete not found');
            error.statusCode = 500;
            throw error;

        }
        if(project.consumerId != req.userId && req.role != "master"){
            const error = new Error('You dont have permission to delete this project');
            error.statusCode = 401;
            throw error;
        }
        project.projectImage.forEach((image) => {
            console.log(image);
            fs.unlink(path.join(__dirname, '..', image), (err) => console.log(err))
        });

        ProjectModel.deleteOne({
            _id: projectId
        }).then((result) => {
            res.status(200).json({
                message: 'Project successfully deleted',
                data: result
            });
        }).catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
    }).catch((err) => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    });

    
}

// This function gets the projects of the sigend in user 
exports.getProjects = (req, res, next) => {

    // We find the projects for the current user
    ProjectModel.find({
            'creator': req.userId
        })
        .then((project) => {
            // Now we simply respond with the projects
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
        if(!project){
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

// Close project
// Begin project