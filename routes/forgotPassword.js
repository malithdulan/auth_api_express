const router = require("express").Router();

// Controllers
const {
  forgot,
  reset
} = require("../app/controllers/ForgotPasswordController");

// Routes
router.post("/forgot", forgot);
router.post("/reset", reset);

module.exports = router;
