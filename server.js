const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const publicDir = path.join(rootDir, 'public');
const csvPath = path.join(rootDir, '..', 'employees.csv');

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

function sendJson(res, payload) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function serveStaticFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
  };

  const stream = fs.createReadStream(filePath);
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain; charset=utf-8' });
  stream.pipe(res);
}

const employees = loadEmployees();
const summary = buildSummary(employees);

const server = http.createServer((req, res) => {
  if (req.url === '/api/employees') {
    sendJson(res, employees);
    return;
  }

  if (req.url === '/api/summary') {
    sendJson(res, summary);
    return;
  }

  const requestPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(publicDir, requestPath);

  if (filePath.startsWith(publicDir) && fs.existsSync(filePath)) {
    serveStaticFile(res, filePath);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(3000, () => {
  console.log('Employee dashboard running at http://localhost:3000');
});
