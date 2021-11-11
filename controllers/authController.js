const {
    validationResult
} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const UserModel = require('../models/user-model');


// This file signs up users to the database, and signs them in by returning their Json Web Token

exports.signup = (req, res, next) => {
    // We validate the inputs though the router
    const errors = validationResult(req);
    // If our errors is not emty then we create a new error object, and throws it to be cached by the error middleware
    if (!errors.isEmpty()) {
        const error = new Error('Auth validation failed');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    };

    // We are retriving the values from the request
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const password = req.body.password;
    const phone = req.body.phone;
    const profileImage = req.body.profileImage;
    const token = req.body.token;
    const address = req.body.address;

    // Now we encrypt the password, so it cant be understood in the dataBase
    bcrypt.hash(password, 12)
        .then((hashPw) => {
            // The return of this is a encryptet string that we then can use when creating filling our mongo schema
            const user = new UserModel({
                firstName: firstName,
                lastName: lastName,
                email: email,
                phone: phone,
                profileImage: profileImage,
                password: hashPw,
                token: token,
                address: address,
            });
            // We return the values to the next step
            return user.save()
        })
        .then((result) => {
            // Here we finaly response to our client
            res.status(201).json({
                message: 'User created!',
                userId: result._id
            });
        })
        .catch((err) => {
            // If we got any network errors or errors encrypting the password (Should never happen, because we validated the input)
            // we return a error to the error midleware handler
            if (!err.statusCode) {
                err.statusCode = err.statusCode = 500;
            }
            next(err);
        });
}

exports.signin = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty) {
        const error = new Error('Auth validation failed');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }


    // We create a variable to store the user information, so we can use it in the whole function
    let loadedUser;
    let role = "user";
    let level;

    // We start of finding the user by email, to check if the email exists
    UserModel.findOne({
            email: req.body.email
        })
        .then((user) => {
            // If the object is undefined then we throw an error
            if (!user) {
                const error = new Error('No user with this email address was found');
                error.statusCode = 401;
                throw error;
            }
            // Otherwise we store the docuement data in the loadedUser variable
            loadedUser = user;

            // Then we check to see if the entered password is correct
            // To do this we use the bcrypt library because the password is encrypted
            // This returns a boolean, to tell if the password maches
            return bcrypt.compare(req.body.password, user.password);
        })
        .then(async (isEqual) => {

            // If the password is not correct then we throw an error
            if (!isEqual) {
                const error = new Error('Password is incorrect');
                error.statusCode = 401;
                throw error;
            }

            if (loadedUser.companyId) {
                console.log(loadedUser.companyId);
                await CompanyModel.findById(loadedUser.companyId)
                    .then((company) => {
                        role = "verker";
                        level = company.roles.get(loadedUser._id);
                    }).catch(err => {
                        if (!err.statusCode) {
                            err.statusCode = 500;
                        };
                        next(err);
                    });
            }

            // If the password is correct, then we create a json web token signiture, that identifies the session
            // This token will be saved on the database and used to authenticate, the user. We can attach some values in the signiture
            const token = jwt.sign({
                email: loadedUser.email,
                token: loadedUser.token,
                role: role,
                level: level,
                companyId: loadedUser.companyId,
                userId: loadedUser._id.toString(),
                //The following is the secret key, that can unlock the token cryptation
            }, 'UmPBRH49FaxIHEVct6ybHpiTp5TQEOZPYgmWvOU7dselq2UPo7COKrM6zuJovqVbWcbAVHC1XSEvpNtTXa6koJcufn0aWBSrOFpNoAHP6ri7gVPcVjKeoNLeYy8', {
                expiresIn: '1h'
            });

            // Now we return the token together with the user data
            res.status(200).json({
                token: token,
                userId: loadedUser._id.toString(),
                firstName: loadedUser.firstName,
                lastName: loadedUser.lastName,
                email: loadedUser.email,
                phone: loadedUser.phone,
                profileImage: loadedUser.profileImage,
                address: loadedUser.address,
            })
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })

}

exports.signinAdmin = (req, res, next) => {
    //We reseave the email and password so we can check if the user is signed up
    const email = req.body.email;
    const password = req.body.password;

    // We create a variable to store the user information, so we can use it in the whole function
    let loadedUser;

    // We start of finding the user by email, to check if the email exists
    AdminModel.findOne({
            email: email
        })
        .then((user) => {
            // If the object is undefined then we throw an error
            if (!user) {
                const error = new Error('Email does not exist');
                error.statusCode = 401;
                throw error;
            }
            // Otherwise we store the docuement data in the loadedUser variable
            loadedUser = user;

            // Then we check to see if the entered password is correct
            // To do this we use the bcrypt library because the password is encrypted
            // This returns a boolean, to tell if the password maches
            return bcrypt.compare(password, user.password);
        })
        .then((isEqual) => {
            // If the password is not correct then we throw an error
            if (!isEqual) {
                const error = new Error('Password is incorrect');
                error.statusCode = 401;
                throw error;
            }
            // If the password is correct, then we create a json web token signiture, that identifies the session
            // This token will be saved on the database and used to authenticate, the user. We can attach some values in the signiture
            const token = jwt.sign({
                email: loadedUser.email,
                token: loadedUser.token,
                role: loadedUser.role,
                userId: loadedUser._id.toString(),
                //The following is the secret key, that can unlock the token cryptation
            }, 'UmPBRH49FaxIHEVct6ybHpiTp5TQEOZPYgmWvOU7dselq2UPo7COKrM6zuJovqVbWcbAVHC1XSEvpNtTXa6koJcufn0aWBSrOFpNoAHP6ri7gVPcVjKeoNLeYy8');

            // Now we return the token together with the user data
            res.status(200).json({
                token: token,
                userId: loadedUser._id.toString(),
                firstName: loadedUser.firstName,
                lastName: loadedUser.lastName,
                email: loadedUser.email,
                phone: loadedUser.phone,
                role: loadedUser.role,
            })
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })

}

exports.signupAdmin = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty) {
        const error = new Error('Validation failed');
        error.statusCode = 401;
        error.data = error.data.array();
    }

    const email = req.body.email;
    const password = req.body.password;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const role = req.body.role;
    const phone = req.body.phone;

    bcrypt.hash(password, 12)
        .then((hashPw) => {
            // The return of this is a encryptet string that we then can use when creating filling our mongo schema
            const user = new AdminModel({
                firstName: firstName,
                lastName: lastName,
                email: email,
                phone: phone,
                password: hashPw,
                role: role,
            });
            // We return the values to the next step
            return user.save()
        })
        .then((result) => {
            // Here we finaly response to our client
            res.status(201).json({
                message: 'Admin created!',
                userId: result._id
            });
        })
        .catch((err) => {
            // If we got any network errors or errors encrypting the password (Should never happen, because we validated the input)
            // we return a error to the error midleware handler
            if (!err.statusCode) {
                err.statusCode = err.statusCode = 500;
            }
            next(err);
        });

}

exports.signupVerker = (req, res, next) => {
    // We validate the inputs though the router
    const errors = validationResult(req);
    // If our errors is not emty then we create a new error object, and throws it to be cached by the error middleware
    if (!errors.isEmpty()) {
        const error = new Error('Auth validation failed');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    };

    // We are retriving the values from the request
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const phone = req.body.phone;
    const profileImage = req.body.profileImage;
    const password = req.body.password;
    const token = req.body.token;
    const address = req.body.address;
    const companyId = req.body.companyId;
    const companyName = req.body.companyName;

    // Now we encrypt the password, so it cant be understood in the dataBase
    bcrypt.hash(password, 12)
        .then((hashPw) => {
            // The return of this is a encryptet string that we then can use when creating filling our mongo schema
            const user = new VerkerModel({
                firstName: firstName,
                lastName: lastName,
                email: email,
                phone: phone,
                profileImage: profileImage,
                password: hashPw,
                token: token,
                address: address,
                companyId: companyId,
                companyName: companyName,
            });
            // We return the values to the next step
            return user.save()
        })
        .then((result) => {
            // Here we finaly response to our client
            res.status(201).json({
                message: 'Verker created!',
                userId: result._id
            });
        })
        .catch((err) => {
            // If we got any network errors or errors encrypting the password (Should never happen, because we validated the input)
            // we return a error to the error midleware handler
            if (!err.statusCode) {
                err.statusCode = err.statusCode = 500;
            }
            next(err);
        });
}

exports.signinVerker = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty) {
        const error = new Error('Auth validation failed');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }


    // We create a variable to store the user information, so we can use it in the whole function
    let loadedUser;
    let level;
    let role = 'verker';

    // We start of finding the user by email, to check if the email exists
    VerkerModel.findOne({
            email: req.body.email
        })
        .then((user) => {
            // If the object is undefined then we throw an error
            if (!user) {
                const error = new Error('No verker with this email address was found');
                error.statusCode = 401;
                throw error;
            }
            // Otherwise we store the docuement data in the loadedUser variable
            loadedUser = user;

            // Then we check to see if the entered password is correct
            // To do this we use the bcrypt library because the password is encrypted
            // This returns a boolean, to tell if the password maches
            return bcrypt.compare(req.body.password, user.password);
        })
        .then(async (isEqual) => {

            // If the password is not correct then we throw an error
            if (!isEqual) {
                const error = new Error('Password is incorrect');
                error.statusCode = 401;
                throw error;
            }

            CompanyModel.findById(loadedUser.companyId)
                .then((company) => {
                    if (!company) {
                        const error = new Error('You are no longer assigned to a company');
                        error.statusCode = 401;
                        throw error;
                    }
                    level = company.roles.get(loadedUser._id);
                    if (!level) {
                        const error = new Error('You are no longer assigned to a company');
                        error.statusCode = 401;
                        throw error;
                    }
                    const token = jwt.sign({
                        email: loadedUser.email,
                        token: loadedUser.token,
                        role: role,
                        level: level,
                        companyId: loadedUser.companyId,
                        userId: loadedUser._id.toString(),
                        //The following is the secret key, that can unlock the token cryptation
                    }, 'UmPBRH49FaxIHEVct6ybHpiTp5TQEOZPYgmWvOU7dselq2UPo7COKrM6zuJovqVbWcbAVHC1XSEvpNtTXa6koJcufn0aWBSrOFpNoAHP6ri7gVPcVjKeoNLeYy8', {
                        expiresIn: '1h'
                    });

                    // Now we return the token together with the user data
                    res.status(200).json({
                        token: token,
                        userId: loadedUser._id.toString(),
                        firstName: loadedUser.firstName,
                        lastName: loadedUser.lastName,
                        level: level,
                        email: loadedUser.email,
                        phone: loadedUser.phone,
                        profileImage: loadedUser.profileImage,
                        address: loadedUser.address,
                    })
                }).catch(err => {
                    if (!err.statusCode) {
                        err.statusCode = 500;
                    };
                    next(err);
                });


            // If the password is correct, then we create a json web token signiture, that identifies the session
            // This token will be saved on the database and used to authenticate, the user. We can attach some values in the signiture

        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })

}