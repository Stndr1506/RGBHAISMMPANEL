const express = require("express");

const router = express.Router();

const {
  getServices,
  getService,
} = require("../controllers/adminServiceController");

// GET all services
router.get("/", 
  getServices);

// GET one service
router.get("/:id", 
  getService);


module.exports = router;
