require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const https = require('https');


const {
    errorName
} = require('../constants')

const VerkerModel = require('../../models/verker-model');
const ProjectModel = require('../../models/project-model');
const CompanyModel = require('../../models/company-model');
const OutreachModel = require('../../models/outreach-model');
const MessageModel = require('../../models/message-model');

const {
    createProject
} = require('../userApi/user-resolvers');
const messageModel = require('../../models/message-model');


const jwtHt = process.env.JWT_TOKEN;

module.exports = {
    signinVerker: async function ({
        email,
        password
    }) {
        const verker = await VerkerModel.findOne({
            email: email
        });
        if (!verker) {
            const error = new Error('EMAIL_NOT_FOUND');
            error.statusCode = 404;
            throw error;
        }

        const pwMatch = await bcrypt.compare(password, verker.password);

        if (!pwMatch) {
            const error = new Error('PASSWORD_IS_INCORRECT');
            error.statusCode = 404;
            throw error;
        }

        const jsonWebToken = await jwt.sign({
            email: verker.email,
            userId: verker._id.toString(),
            role: "verker",
            //The following is the secret key, that can unlock the token cryptation
        }, jwtHt, {
            // expiresIn: '1h'
        });

        return {
            _id: verker._id.toString(),
            jwt: jsonWebToken,
        }
    },
    createCompany: async function ({
        companyInput
    }, req) {

        if (!req.isVerker) {
            const error = new Error('Need to be signed in');
            throw error;
        }

        const existingCompany = await CompanyModel.findOne({
            cvr: companyInput.cvr
        });

        if (existingCompany) {
            const error = new Error('Company already exists');
            throw error;
        }


        const verker = await VerkerModel.findById(req.userId);

        if (!verker) {
            const error = new Error('Failed to find verker');
            throw error;
        }

        if (verker.companyId) {
            const error = new Error('you already have a company');
            throw error;
        }

        const verkerId = verker._id;


        const newCompany = new CompanyModel({
            name: companyInput.name,
            description: companyInput.description,
            cvr: companyInput.cvr,
            email: companyInput.email,
            phone: companyInput.phone,
            employees: companyInput.employees,
            established: companyInput.established,
            totalProjects: companyInput.totalProjects,
            roles: {
                verkerId: "OWNER"
            },
            address: companyInput.address,
            location: {
                type: "Point",
                coordinates: companyInput.coordinates,
            }
        })



        const company = await newCompany.save();

        verker.companyId = company._id;

        await verker.save();


        return {
            ...company._doc,
            _id: company._id.toString()
        }




    },
    createVerker: async function ({
        verkerInput,
    }) {
        const existingVerker = await VerkerModel.findOne({
            email: verkerInput.email
        });

        if (existingVerker) {
            if (existingVerker.password) {
                const error = new Error('Verker already exists');
                throw error;
            }
            const hashedPw = await bcrypt.hash(verkerInput.password, 12);
            existingVerker.password = hashedPw;
            existingVerker.firstName = verkerInput.firstName;
            existingVerker.lastName = verkerInput.lastName;
            existingVerker.profileImage = verkerInput.profileImage;
            existingVerker.address = verkerInput.address;
            existingVerker.phone = verkerInput.phone;
            existingVerker.deviceToken = verkerInput.deviceToken;

            const updatedVerker = await existingVerker.save();

            return {
                ...updatedVerker._doc,
                _id: updatedVerker._id.toString()
            }
        }

        const hashedPw = await bcrypt.hash(verkerInput.password, 12);
        const newVerker = new VerkerModel({
            firstName: verkerInput.firstName,
            lastName: verkerInput.lastName,
            profileImage: verkerInput.profileImage || "https://s.starladder.com/uploads/team_logo/d/4/d/3/ce3c2349c7e3a70dac35cf4a28c400b9.png",
            deviceToken: verkerInput.deviceToken,
            address: verkerInput.address,
            email: verkerInput.email,
            phone: verkerInput.phone,
            password: hashedPw,
        });

        const verker = await newVerker.save();

        return {
            ...verker._doc,
            _id: verker._id.toString()
        }

    },
    // inviteVerker: async function ({email}, req){
    //     if(!req.isVerker){
    //         const error = new Error('You must be verker');
    //         throw error;
    //     }
    //     const currentVerker = await VerkerModel.findById(req.userId);

    //     const company = await CompanyModel.findById(currentVerker.companyId);
    //     if(!company){
    //         const error = new Error('I seems that you are are not connected to a company');
    //         throw error;
    //     }
    //     if(company.owner.ownerId !== req.userId){
    //         const error = new Error('You need to be the owner of the company to invite');
    //         throw error;  
    //     }
    //     console.log(company.employeeInvite);
    //     if(company.employeeInvite.includes(email)){
    //         const error = new Error('You allready invited this verker');
    //         throw error;  
    //     }


    //     const verkerExists = await VerkerModel.findOne({email: email});

    //     if(!verkerExists){
    //         const newVerker = new VerkerModel({
    //             email: email,
    //             companyInvite: {
    //                 companyName: company.name,
    //                 companyId: company._id
    //             }
    //         });
    //         await newVerker.save();
    //         company.employeeInvite.push(email);
    //         await company.save();
    //         return "You sent an invitation to email";
    //     }
    //         verkerExists.companyInvite = {
    //             companyName: company.name,
    //             companyId: company._id
    //         };
    //         await verkerExists.save();
    //         company.employeeInvite.push(email);
    //         await company.save();
    //         return "You sent an invitation to email";



    // },
    getVerker: async function ({}, req) {
        if (!req.isVerker) {
            const error = new Error(errorName.NOT_VERKER);
            throw error;
        }

        const verker = await VerkerModel.findById(req.userId);
        let company;
        let hasCompany = false;


        if (!verker) {
            const error = new Error(errorName.USER_DOES_NOT_EXIST);
            throw error;
        }

        if (verker.companyId) {
            companyResult = await VerkerModel.findById(req.userId).populate('companyId');
            if (companyResult) {
                hasCompany = true;
                company = companyResult.companyId
                return {
                    verker: {
                        ...verker._doc,
                        _id: verker._id.toString(),
                    },
                    hasCompany: hasCompany,
                    company: {
                        ...company._doc,
                        _id: verker._id.toString(),
                    }
                }
            }
        }



        return {
            verker: {
                ...verker._doc,
                _id: verker._id.toString(),
            },
            hasCompany: hasCompany,
        }

    },
    getProjects: async function ({
        coordinates,
        maxDistance,
        type
    }, req) {

        if (!req.isVerker) {
            const error = new Error(errorName.NOT_VERKER);
            throw error;
        }

        let query = {
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: coordinates,
                    },
                    $maxDistance: maxDistance,
                },
            },
            projectType: type
        };


        // We find the projects for the current user
        const projects = await ProjectModel.find(query)
            .lean()



        if (projects.length === 0) {
            const error = new Error('NO_PROJECTS');
            throw error;
        }


        for (var i in projects) {


            var distance = await getDistanceFromLatLonInKm(projects[i]['location']['coordinates'][0], projects[i]['location']['coordinates'][1], coordinates[0], coordinates[1])
            Object.assign(projects[i], {
                'distance': distance
            });
        }


        return projects;

    },
    getProject: async function ({
        projectId
    }, req) {

        // if (!req.isVerker) {
        //     const error = new Error(errorName.NOT_VERKER);
        //     throw error;
        // }

        if (projectId.length = !24) {
            throw new Error('NEED_OWNER_ACCOUNT')
        }

        const project = await ProjectModel.findById(projectId);

        if (!project) {
            throw new Error('NO_PROJECTS');
        }

        return project;


    },
    createOutreach: async function ({
        outreachInput
    }, req) {

        if (!req.isVerker) {
            const error = new Error('NOT_VERKER')
            throw error;
        }


        const project = await ProjectModel.findById(outreachInput.projectId).populate('consumerId');

        const verker = await VerkerModel.findById(req.userId).populate('companyId');

        for (var i in verker.companyId.outreaches) {
            if (verker.companyId.outreaches[i].projectId.toString() == project._id.toString()) {
                const error = new Error('ALREADT_OUTREACHED')
                throw error;
            }
        }


        if (verker.companyId.roles.get(req.userId) != 'Owner') {
            const error = new Error('NEED_OWNER_ACCOUNT')
            throw error;
        }

        const newOutreach = OutreachModel({
            companyId: verker.companyId._id,
            consumerId: project.consumerId,
            company: {
                name: verker.companyId.name,
                logo: verker.companyId.logo,
                established: verker.companyId.established,
                verkerSince: verker.companyId.createdAt,
            },
            projectId: outreachInput.projectId,
            projectTitle: project.title,
            initialMessage: outreachInput.initialMessage,
            totalMessages: 1,
            members: [{
                    userId: project.consumerId._id,
                    role: "CONSUMER",
                    firstName: project.consumerId.firstName,
                    profileImage: project.consumerId.profileImage,
                    totalUnread: 1,
                },
                {
                    userId: req.userId,
                    role: "VERKER",
                    firstName: verker.firstName,
                    profileImage: verker.profileImage,
                    totalUnread: 0
                }
            ],
        });

        const savedOutreach = await newOutreach.save();



        const pushOutreachesToProject = {
            "$push": {
                outreaches: savedOutreach._id,
            }
        };

        const pushOutreachesToCompany = {
            "$push": {
                outreaches: {
                    outreachId: savedOutreach._id,
                    projectId: project._id,
                }
            }
        };

        await project.updateOne(pushOutreachesToProject);

        await CompanyModel.findOneAndUpdate({
            _id: verker.companyId._id
        }, pushOutreachesToCompany)

        if (!savedOutreach) {
            const error = new Error('UNABLE_TO_SAVE_OUTREACH');
            throw error;
        }



        return savedOutreach;



    },
    getOutreaches: async function ({
        companyId
    }, req) {
        
          if (!req.isVerker) {
            const error = new Error(errorName.NOT_VERKER);
            throw error;
        }

        const outreaches = await OutreachModel.find({
            companyId: companyId
        });

        for (var i in outreaches) {
            outreaches[i]['messages'] = await MessageModel.find({
                outreachId: outreaches[i]._id
            }).sort({
                createdAt: -1
            }).limit(10);
        }

        return outreaches

    },
    sendMessage: async function ({
        messageInput
    }, req) {


        io = require('../../socket').getIO();

        const message = new MessageModel({
            outreachId: messageInput.outreachId,
            message: messageInput.message,
            senderId: req.userId,
        });
        const savedMessage = await message.save();

        
        
        await OutreachModel.findOneAndUpdate({
                _id: messageInput.outreachId
            }, {
                $inc: {
                    "members.$[members].totalUnread": 1
                }
            }, {
                arrayFilters: [{
                    "members.userId": {
                        $ne: req.userId
                    }
                }],
                multi: true
            }

        )


         io.to(messageInput.socketNotification).emit('message', {
            type: 'newMessage',
            data: {
            ...savedMessage._doc,
            senderName: messageInput.senderName,

        }
        });


        return  {
            ...savedMessage._doc,
            senderName: messageInput.senderName,
            createdAt: savedMessage.createdAt.toString(),
        }
    },
    getMessages: async function ({
        outreachId,
        page
    }, req) {
        if(!page){
            const page = 0;
        }
        const limit = 20;
        const skip = page * limit;

        const messages = await MessageModel.find({
            outreachId: outreachId
        }).limit(limit).skip(skip).sort({
            createdAt: -1
        });

        if (!messages) {
            throw new Error('NO_MESSAGES')
        }

        io = require('../../socket').getIO();

        await OutreachModel.findOneAndUpdate({
            _id: outreachId,
            "members.userId": req.userId
        }, {
            $set: {
                'members.$.totalUnread': 0
            }
        });

        return messages

    }





}

// async function getDriveDistance(lat1, lon1, lat2, lon2) {
//     //GET https://routing.openstreetmap.de/routed-car/route/v1/driving/11.652186,55.665043;11.6581663,55.6939533?overview=false&geometries=polyline

//     const apiUrl = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false&geometries=polyline`;
//     let result;

//     https.get(apiUrl, function (res) {
//         res.on('data', function (d) {
//             result = {
//                             distance: JSON.parse(d).routes[0].distance,
//                             time: JSON.parse(d).routes[0].duration
//                         }
//                         console.log(result);
//         });

//     }).on('error', function (e) {
//         console.error(e);
//     });
//     return result

// }




function getDistanceFromLatLonInKm(lon1, lat1, lon2, lat2) {
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