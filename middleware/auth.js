const jwt = require('jsonwebtoken');

// This is a middleware to check wether the user has signed in. This is done by validating the JWT

module.exports = function auth(req, res, next) {

    req.isUser = false;
    req.isVerker = false;
    req.isAdmin = false;

    const authHeader = req.get('Authorization');
    if(!authHeader){
        const error = new Error('NO_JWT');
        return next();
    }

    const token = req.get('Authorization').split(' ')[1];
    let decodedToken;


   

    // Now we can validate the token by using the jwt function verify. This returns an decodedToken if the server reconises it
    if(!token){
        console.log('No FUCNKING TOKEN')
        const error = new Error('NO_JWT');
        return next(); 
    }
    
    try {
        decodedToken = jwt.verify(token, 'UmPBRH49FaxIHEVct6ybHpiTp5TQEOZPYgmWvOU7dselq2UPo7COKrM6zuJovqVbWcbAVHC1XSEvpNtTXa6koJcufn0aWBSrOFpNoAHP6ri7gVPcVjKeoNLeYy8');
    } catch (err) {
        const error = new Error('NO_JWT');
        return next();
    }


    // Now we checks if the decodedToken is defined, and therefore valid
    if (!decodedToken) {
        console.log('FUCKING SVIN3')

        const error = new Error('NO_JWT');
        return next();
    }
 

    if (decodedToken.role === "user") {
        req.isUser = true;
        req.userId = decodedToken.userId;
    }
    if(decodedToken.role === "verker"){
        req.isVerker = true;
        req.companyId = decodedToken.companyId;
        req.userId = decodedToken.userId;

    }
    if(decodedToken.role === "admin"){
        req.isAdmin = true;
    }


    // If the token is valid, are storing the userId in the request, and parsing on to the next middleware
    req.userId = decodedToken.userId;

    next();
}
