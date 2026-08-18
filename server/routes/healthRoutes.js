const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const startTime = new Date();

const getHealthStatus = (req, res) => {
  const uptimeSeconds = process.uptime();
  const days = Math.floor(uptimeSeconds / (3600 * 24));
  const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);

  const formattedUptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const memUsage = process.memoryUsage();

  res.status(200).json({
    status: "ok",
    message: "Chatt Server is fully operational",
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(uptimeSeconds),
      formatted: formattedUptime,
      startedAt: startTime.toISOString(),
    },
    database: {
      status: dbStatusMap[dbState] || "unknown",
      readyState: dbState,
      name: mongoose.connection.name || "mongodb",
    },
    system: {
      nodeVersion: process.version,
      memory: {
        rssMb: (memUsage.rss / 1024 / 1024).toFixed(2),
        heapUsedMb: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMb: (memUsage.heapTotal / 1024 / 1024).toFixed(2),
      },
      environment: process.env.NODE_ENV || "development",
    },
  });
};

// Handle GET and HEAD requests for UptimeRobot / Render pingers
router.get("/", getHealthStatus);
router.head("/", (req, res) => {
  res.status(200).end();
});

module.exports = router;
