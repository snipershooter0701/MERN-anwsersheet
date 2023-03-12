const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const UserModel = require('../models/UserModel');
const MembershipModel = require("../models/MembershipModel");

const dbConnect = (dbUrl) => {
    mongoose.connect(dbUrl, {
        logger: process.env.NODE_ENV === "development",
        serverSelectionTimeoutMS: 5000,
        dbName: "strapi_cms"
    });
    mongoose.connection.on("connected", () => {
        console.log(`Database was connected successfully! ===>: ${dbUrl}`);

    });
}

const seedUser = async () => {
    let salt = bcrypt.genSaltSync(10);
    let user = {
        firstName: "Hong",
        lastName: "Li",
        email: "hongomg@gmail.com",
        password: bcrypt.hashSync("admin123!@#", salt),
        status: true,
        isPaid: true,
        role: 2
    }
    let isExist = await UserModel.findOne({email: "hongomg@gmail.com"});
    if (!isExist) {
        let result = await UserModel.create(user);
        if (result) console.log("Created admin user!");
    }
}

const seedMembership = async () => {
    let count = await MembershipModel.count();
    if (count == 0) {
        let memberships = [{
            name: "3 Months Membership",
            slug: "3-months-membership",
            label: "3 Months",
            description: "Three Months Membership Description",
            period: 3
        }, {
            name: "Annual Membership",
            slug: "annual-membership",
            label: "1 Year",
            description: "Annual Membership Description",
            period: 12
        }, {
            name: "Unlimited Membership",
            slug: "unlimited-membership",
            label: "Unlimited",
            description: "Unlimited Membership Description",
            period: -1
        }];
        let result = await MembershipModel.insertMany(memberships);
        if (result) console.log("Created memberships");
    }
}

module.exports = {
    dbConnect, 
    seedUser,
    seedMembership
}