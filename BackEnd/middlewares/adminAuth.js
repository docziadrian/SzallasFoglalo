// No admin required, allow all requests to proceed
module.exports = function (req, res, next) {
  return next();
};
