const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger'); // Import your shared logger

fs.readdirSync(__dirname).forEach((item) => {
  const itemPath = path.join(__dirname, item);
  
  // Skip utility or non-feature folders
  if (item === 'utils' || item === 'middleware') return;

  if (fs.statSync(itemPath).isDirectory()) {
    const routesFile = `${item}.routes.js`;
    const routesFilePath = path.join(itemPath, routesFile);
    
    if (fs.existsSync(routesFilePath)) {
      const featureRoutes = require(routesFilePath);
      router.use(`/${item}`, featureRoutes);
      logger.info(`Auto-mounted module: /api/${item}`);
    }
  }
});

module.exports = router;