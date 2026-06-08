const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (e) {
    res.status(400).json({ status: 'fail', message: e.errors });
  }
};

module.exports = validate;