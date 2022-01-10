require('dotenv').config();


var aws = require('aws-sdk');
const { compareSync } = require('bcryptjs');
const express = require('express');


// MULTER: 
var multer = require('multer')
var multerS3 = require('multer-s3-transform')
var sharp = require('sharp')

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY


var s3 = new aws.S3({
    region,
    accessKeyId,
    secretAccessKey
})

var router = express.Router()

var uploadProjectFiles = () => {
    const folderName = "projectFiles/";
    console.log(folderName);
    return multer({
        storage: multerS3({
            s3: s3,
            bucket: bucketName,
            shouldTransform: true,
            transforms: [{
                id: 'original',
                key: function (req, file, cb) {
                    // cb(null, folderName+"/"+Date.now().toString()+".jpg")
                    if(file.mimetype.split('/')[0] == "image"){
                        cb(null, folderName+ req.userId + Date.now().toString()+"/"+Date.now().toString()+".jpg")
                    } else if(file.mimetype.split('/')[0] == "video"){
                        cb(null, folderName+ req.userId + Date.now().toString()+"/"+Date.now().toString()+".mp4")
                    }
                },
                transform: function (req, file, cb) {
                    if(file.mimetype.split('/')[0] == "image"){
                        cb(null, sharp().jpeg())
                    } else if(file.mimetype.split('/')[0] == "video"){
                        cb(null, sharp())
                    }
                }
    
            }]
        })
    });
}

var uploadProfileImages = () => {
    const folderName = "profileImages/";
    return multer({
        storage: multerS3({
            s3: s3,
            bucket: bucketName,
            shouldTransform: true,
            transforms: [{
                id: 'original',
                key: function (req, file, cb) {
                        cb(null, folderName+req.userId+".jpg")
                },
                transform: function (req, file, cb) {
                        cb(null, sharp().resize(100, 100).jpeg())
                }
    
            }]
        })
    });
}

router.use("/", (req, res, next) => {
    if(!req.isUser){
        const error = new Error("Need to be user for uploading files");
        next(error);
    }

    // print(req)   

    next();
})



router.post('/uploadProjectFiles', uploadProjectFiles().array('files'), (req, res, next) => {
    const paths = [];


    for(var i in req.files){
        paths.push(req.files[i].transforms[0].key);
    }
    
    res.status(200).json({
        path: paths,
    })

    console.log(paths);

})

router.post("/profileImage", uploadProfileImages().single('files'), (req, res, next) => {
    res.status(200).json({
        // data: req.files,
        somethingElse: "asd",
        path: req.file.transforms[0].key,
    })
})

exports.getFileStream = function getFileStream(fileKey){

    console.log(fileKey, "   ", bucketName)

    const downloadParams = {
        Bucket: bucketName, /* required */
        Key: fileKey, /* required */
    }

    return s3.getObject(downloadParams).createReadStream();

}

exports.router = router
