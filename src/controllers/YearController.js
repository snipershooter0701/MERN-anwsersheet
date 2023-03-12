const YearModel = require("../models/YearModel");

const fetch = async (req, res) => {
    try {
        let years = await YearModel.find().populate("subjects");
        res.json({
            success: true,
            data: years
        });
    } catch (err) {
        res.json({
            success: false,
            msg: err.message
        });
    }
}

module.exports = {
    fetch
}