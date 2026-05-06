"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const db = require("./app/models");

const PORT = Number(process.env.PORT || 3001);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
const ADMIN_ORIGIN = process.env.ADMIN_ORIGIN || "http://localhost:3002";

const defaultOrigins = [
  FRONTEND_ORIGIN,
  ADMIN_ORIGIN,
  "https://test.busy.mn",
  "https://testadmin.busy.mn",
];
const parsedOrigins = (process.env.CORS_ORIGINS || defaultOrigins.join(","))
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const allowAllOrigins = parsedOrigins.includes("*");

const app = express();

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowAllOrigins || parsedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(null, false);
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

require("./app/routes/auth.routes")(app);
require("./app/routes/platform/trips.routes")(app);
require("./app/routes/platform/uploads.routes")(app);
require("./app/routes/health.routes")(app);
require("./app/routes/region.routes")(app);
require("./app/routes/admin.routes")(app);
require("./app/routes/events.routes")(app);
require("./app/routes/home.routes")(app);
require("./app/routes/site-settings.routes")(app);
require("./app/routes/trip-forms.routes")(app);
require("./app/routes/form-org.routes")(app);
require("./app/routes/public-form.routes")(app);
require("./app/routes/meetings-weekly.routes")(app);

db.sequelize
  .authenticate()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`newbni-backend listening on http://localhost:${PORT}`);
      console.log(`CORS origins: ${allowAllOrigins ? "*" : parsedOrigins.join(", ")}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });
