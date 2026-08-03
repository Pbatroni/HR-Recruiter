const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'data', 'employees.csv');

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split(',').map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(',').map((value) => value.trim());
    return headers.reduce((acc, header, index) => {
      acc[header] = values[index] || '';
      return acc;
    }, {});
  });
}

function loadEmployees() {
  const csvText = fs.readFileSync(csvPath, 'utf8');
  return parseCsv(csvText);
}

function buildSummary(employees) {
  const activeCount = employees.filter((employee) => employee.employment_status.toLowerCase() === 'active').length;
  const terminatedCount = employees.length - activeCount;

  const departmentCounts = employees.reduce((acc, employee) => {
    acc[employee.department] = (acc[employee.department] || 0) + 1;
    return acc;
  }, {});

  return {
    total: employees.length,
    active: activeCount,
    terminated: terminatedCount,
    departments: departmentCounts,
  };
}

module.exports = { loadEmployees, buildSummary };
