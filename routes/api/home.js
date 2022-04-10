const router = require("express").Router();

// Routes
router.get("/", function (req, res) {
    res.send('Full Auth API');
});

module.exports = router;