
// const VerkerModel = require('../../models/verkerModel');


exports.getUserInfo = (req, res, next) => {
    VerkerModel.findById(req.userId).then((user) => {
        if(!user){
            const error = new Error('No user found');
            error.statusCode = 404;
            throw error;
        }
        console.log(user);
        res.status(200).json({userData: user, role: req.role,  level: req.level});

    })
    .catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
}