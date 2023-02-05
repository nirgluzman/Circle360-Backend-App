require("dotenv").config();
require("colors");

const express = require("express");
const cors = require("cors");

const app = express();

const apiRoutes = require("./routes/api");

PORT = process.env.PORT || 9090;

// Middleware
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Welcome to Circle360 app tier");
});

app.use("/api", apiRoutes);

app.listen(PORT, () => {
  console.log(`server is running http://localhost:${PORT}`.red);
});
