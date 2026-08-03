const { loadEmployees, buildSummary } = require('../lib/employees');

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(buildSummary(loadEmployees()));
};
