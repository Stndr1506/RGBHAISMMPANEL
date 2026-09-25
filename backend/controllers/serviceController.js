const serviceModel = require("../models/adminServiceModel");
const {getCache, setCache} = require('../utils/cache');

// =====================================================
// GET ALL SERVICES
// =====================================================

const getServices = async (req, res) => {
  try {
    //check redis first
    const cachedServices = await getCache('services');
    
    if(cachedServices){
      console.log("Services fetched from Redis memory")
      return res.json(cachedServices);
    }
    
    //redis miss cache
    console.log("Redis miss, fetched from SQL server");

    const services =
      await serviceModel.getAllServices();
    
    //store redis in memory
    await setCache(
      "services",
      services,
      300
    )
    console.log("services stored in cache memory")
    res.status(200).json(services);
  } catch (error) {
    console.error("GET SERVICES ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch services",
      error: error.message,
    });
  }
};

// =====================================================
// GET SINGLE SERVICE
// =====================================================

const getService = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        message: "Invalid service ID",
      });
    }

    const service =
      await serviceModel.getServiceById(id);

    if (!service) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    res.status(200).json(service);
  } catch (error) {
    console.error("GET SERVICE ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch service",
      error: error.message,
    });
  }
};

module.exports = {
  getServices,
  getService,
};
