const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  // Check if token exists in the Authorization header (Format: Bearer <token>)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token provided.' });
  }

  try {
    // Verify token using the secret key in your .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach the decoded user data (e.g., id, role) to the request object
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Not authorized, token invalid or expired.' });
  }
};

module.exports = { protect };