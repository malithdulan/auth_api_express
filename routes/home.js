const router = require("express").Router();

// Routes
router.get("/", function (req, res) {
    res.redirect('https://auth-api-two.vercel.app/api-docs/')
});

module.exports = router;