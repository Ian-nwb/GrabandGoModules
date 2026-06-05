// src/modules/index.routes.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Read all files/folders in the current directory (src/modules)
fs.readdirSync(__dirname).forEach((item) => {
  const itemPath = path.join(__dirname, item);
  
  // Verify if it's a feature folder (like 'auth' or 'payments')
  if (fs.statSync(itemPath).isDirectory()) {
    const routesFile = `${item}.routes.js`;
    const routesFilePath = path.join(itemPath, routesFile);
    
    // Auto-mount if the expected folder-name.routes.js file exists
    if (fs.existsSync(routesFilePath)) {
      const featureRoutes = require(routesFilePath);
      
      // Mounts dynamically: e.g., /auth maps to auth.routes.js, /payments to payments.routes.js
      router.use(`/${item}`, featureRoutes);
      console.log(` Auto-mounted module: /api/${item}`);
    }
  }
});

module.exports = router;