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
      description,
      rate,
      min_order,
      max_order,
      average_time,
    } = req.body;

    // Required field validation

    if (
      !category ||
      !service ||
      !description ||
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
        description: description.trim(),
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

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid service ID",
      });
    }

    const {
      category,
      service,
      description,
      rate,
      min_order,
      max_order,
      average_time,
    } = req.body;

    // Validate required fields.
    // Description is optional, so an empty description is allowed.

    if (
      typeof category !== "string" ||
      !category.trim() ||
      typeof service !== "string" ||
      !service.trim() ||
      rate === undefined ||
      min_order === undefined ||
      max_order === undefined
    ) {
      return res.status(400).json({
        message: "Please provide all required fields",
      });
    }

    const numericRate = Number(rate);
    const numericMin = Number(min_order);
    const numericMax = Number(max_order);

    if (
      !Number.isFinite(numericRate) ||
      !Number.isInteger(numericMin) ||
      !Number.isInteger(numericMax) ||
      numericRate < 0 ||
      numericMin < 0 ||
      numericMax < numericMin
    ) {
      return res.status(400).json({
        message: "Please provide valid rates and order limits",
      });
    }

    // Validate description and average time.
    if (
      description !== undefined &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        message: "Description must be text",
      });
    }

    if (
      average_time !== undefined &&
      typeof average_time !== "string"
    ) {
      return res.status(400).json({
        message: "Average time must be text",
      });
    }

    // Check whether the service exists.
    const existingService =
      await serviceModel.getServiceById(id);

    if (!existingService) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    // Update service, including description.
    const updatedService =
      await serviceModel.updateService(id, {
        category: category.trim(),
        service: service.trim(),
        description:
          description === undefined
            ? existingService.description || ""
            : description.trim(),
        rate: numericRate,
        min_order: numericMin,
        max_order: numericMax,
        average_time:
          average_time === undefined
            ? existingService.average_time || ""
            : average_time.trim(),
      });

    if (!updatedService) {
      return res.status(500).json({
        message: "Service update returned no data",
      });
    }

    return res.status(200).json({
      message: "Service updated successfully",
      service: updatedService,
    });
  } catch (error) {
    console.error("UPDATE SERVICE ERROR:", error);

    return res.status(500).json({
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

// =====================================================
// BULK CREATE SERVICES
// =====================================================

const createBulkServices = async (req, res) => {
  try {
    const { services } = req.body;

    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one service",
      });
    }

    if (services.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Maximum 100 services can be added at once",
      });
    }

    // Validate the entire batch before inserting anything.
    const validatedServices = [];

    for (let i = 0; i < services.length; i++) {
      const item = services[i];

      const category =
        typeof item.category === "string" ? item.category.trim() : "";

      const service =
        typeof item.service === "string" ? item.service.trim() : "";

      const description =
        typeof item.description === "string"
          ? item.description.trim()
          : "";

      const average_time =
        typeof item.average_time === "string"
          ? item.average_time.trim()
          : "";

      const rate = Number(item.rate);
      const min_order = Number(item.min_order);
      const max_order = Number(item.max_order);

      if (
        !category ||
        !service ||
        !description ||
        !average_time ||
        item.rate === "" ||
        item.min_order === "" ||
        item.max_order === "" ||
        !Number.isFinite(rate) ||
        !Number.isInteger(min_order) ||
        !Number.isInteger(max_order) ||
        rate < 0 ||
        min_order < 0 ||
        max_order < min_order
      ) {
        return res.status(400).json({
          success: false,
          message: `Please check the required fields and numeric values in service row ${i + 1}`,
        });
      }

      validatedServices.push({
        category,
        service,
        description,
        rate,
        min_order,
        max_order,
        average_time,
      });
    }

    const createdServices =
      await serviceModel.bulkCreateServices(validatedServices);

    return res.status(201).json({
      success: true,
      count: createdServices.length,
      message: "Services added successfully",
      services: createdServices,
    });
  } catch (error) {
    console.error("BULK CREATE SERVICES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add services",
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
  createBulkServices
};
