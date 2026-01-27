require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const morgan = require("morgan");
const connectDB = require("./utils/db");
const errorHandler = require("./src/middlewares/error");

const authRoutes = require("./src/routes/auth.routes");
const sellerRoutes = require("./src/routes/seller.routes");
const propertyRoutes = require("./src/routes/property.routes");
const carbonCoinRoutes = require("./src/routes/carbonCoin.routes");
const companyRoutes = require("./src/routes/company.routes");
const satelliteRoutes = require("./src/routes/satellite.routes");

connectDB();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/carboncoins", carbonCoinRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/satellite", satelliteRoutes);


app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Carbon Credit Marketplace API is running",
    });
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
