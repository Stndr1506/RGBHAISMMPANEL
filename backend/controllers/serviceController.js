const serviceModel = require("../models/serviceModel");

const getServices = async (req, res) => {
    try {

        const services = await serviceModel.getAllServices();

        res.status(200).json({
            success: true,
            count: services.length,
            services
        });

    } catch (error) {

        console.error("Get services error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch services"
        });
    }
};

module.exports = {
    getServices
};