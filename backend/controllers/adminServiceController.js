const serviceModel = require("../models/adminServiceModel");

// =====================================================
// GET ALL SERVICES
// =====================================================

const getServices = async (req, res) => {
  try {
    const services =
      await serviceModel.getAllServices();

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

// =====================================================
// CREATE SERVICE
// =====================================================

const createService = async (req, res) => {
  try {
    const {
      category,
      service,
      rate,
      min_order,
      max_order,
      average_time,
    } = req.body;

    // Required field validation

    if (
      !category ||
      !service ||
      rate === undefined ||
      min_order === undefined ||
      max_order === undefined ||
      !average_time
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const numericRate = Number(rate);
    const numericMin = Number(min_order);
    const numericMax = Number(max_order);

    // Number validation

    if (
      Number.isNaN(numericRate) ||
      Number.isNaN(numericMin) ||
      Number.isNaN(numericMax)
    ) {
      return res.status(400).json({
        message:
          "Rate, minimum order and maximum order must be numbers",
      });
    }

    // Min / max validation

    if (numericMin > numericMax) {
      return res.status(400).json({
        message:
          "Minimum order cannot be greater than maximum order",
      });
    }

    const newService =
      await serviceModel.createService({
        category: category.trim(),
        service: service.trim(),
        rate: numericRate,
        min_order: numericMin,
        max_order: numericMax,
        average_time: average_time.trim(),
      });

    res.status(201).json(newService);
  } catch (error) {
    console.error("CREATE SERVICE ERROR:", error);

    res.status(500).json({
      message: "Failed to create service",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE SERVICE
// =====================================================

const updateService = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        message: "Invalid service ID",
      });
    }

    const {
      category,
      service,
      rate,
      min_order,
      max_order,
      average_time,
    } = req.body;

    // Required field validation

    if (
      !category ||
      !service ||
      rate === undefined ||
      min_order === undefined ||
      max_order === undefined ||
      !average_time
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const numericRate = Number(rate);
    const numericMin = Number(min_order);
    const numericMax = Number(max_order);

    if (
      Number.isNaN(numericRate) ||
      Number.isNaN(numericMin) ||
      Number.isNaN(numericMax)
    ) {
      return res.status(400).json({
        message:
          "Rate, minimum order and maximum order must be numbers",
      });
    }

    if (numericMin > numericMax) {
      return res.status(400).json({
        message:
          "Minimum order cannot be greater than maximum order",
      });
    }

    // Check service exists

    const existingService =
      await serviceModel.getServiceById(id);

    if (!existingService) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    const updatedService =
      await serviceModel.updateService(id, {
        category: category.trim(),
        service: service.trim(),
        rate: numericRate,
        min_order: numericMin,
        max_order: numericMax,
        average_time: average_time.trim(),
      });

    res.status(200).json(updatedService);
  } catch (error) {
    console.error("UPDATE SERVICE ERROR:", error);

    res.status(500).json({
      message: "Failed to update service",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE SERVICE
// =====================================================

const deleteService = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        message: "Invalid service ID",
      });
    }

    const deletedService =
      await serviceModel.deleteService(id);

    if (!deletedService) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    res.status(200).json({
      message: "Service deleted successfully",
      id,
    });
  } catch (error) {
    console.error("DELETE SERVICE ERROR:", error);

    res.status(500).json({
      message: "Failed to delete service",
      error: error.message,
    });
  }
};

module.exports = {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
};
