const express = require("express");
const app = express();
const connectToMongoDB = require("./config/db");

const auth = require("./routes/auth")

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: 'Authentication API',
            discription: 'Full authentication api for testing your client app',
            contact: {
                name: 'Malith Dulan',
            },
            servers: 'http://localhost:5000',
        },
    },

    apis: ['index.js', './routes/*.js']
}
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))

// Accept incoming request
app.use(express.json({ extended: false }));

// Connect to MongoDB
connectToMongoDB();

// Routes
app.use("", require("./routes/home"));

/**
 * @swagger
 * /api/auth:
 *   post:
 *     parameters:
 *      - in: path
 *        name: userId
 *        required: true
 *      - in: query
 *        name: offset
 *        schema:
 *        type: integer
 *     description: SignIn user
 *     responses:
 *       '200':
 *         description: A successful response
 */
app.use("/api/auth", auth);

app.use("/api/password", require("./routes/forgotPassword"));

// Run the server
app.listen(5000, () => console.log(`Server running in 5000`));


// Export the Express API
module.exports = app;