const state = {
  employees: [],
  summary: null,
  filter: {
    query: '',
    status: 'all',
    department: 'all',
  },
};

const summaryGrid = document.getElementById('summary-grid');
const tableBody = document.getElementById('employee-table-body');
const searchInput = document.getElementById('search');
const statusFilter = document.getElementById('statusFilter');
const departmentFilter = document.getElementById('departmentFilter');

function createSummaryCard(title, value) {
  const card = document.createElement('article');
  card.className = 'card';
  card.innerHTML = `<h3>${title}</h3><p>${value}</p>`;
  return card;
}

function renderSummary(summary) {
  if (!summary) {
    return;
  }

  summaryGrid.innerHTML = '';
  summaryGrid.appendChild(createSummaryCard('Total employees', summary.total));
  summaryGrid.appendChild(createSummaryCard('Active', summary.active));
  summaryGrid.appendChild(createSummaryCard('Terminated', summary.terminated));
  summaryGrid.appendChild(createSummaryCard('Departments', Object.keys(summary.departments).length));
}

function populateDepartmentFilter(employees) {
  const departments = Array.from(new Set(employees.map((employee) => employee.department))).sort();
  const currentValue = departmentFilter.value;

  departmentFilter.innerHTML = '<option value="all">All departments</option>';
  departments.forEach((department) => {
    const option = document.createElement('option');
    option.value = department;
    option.textContent = department;
    departmentFilter.appendChild(option);
  });

  if (departments.includes(currentValue)) {
    departmentFilter.value = currentValue;
  }
}

function getVisibleEmployees() {
  const query = state.filter.query.toLowerCase();

  return state.employees.filter((employee) => {
    const matchesQuery = `${employee.full_name} ${employee.department}`.toLowerCase().includes(query);
    const matchesStatus = state.filter.status === 'all' || employee.employment_status.toLowerCase() === state.filter.status;
    const matchesDepartment = state.filter.department === 'all' || employee.department === state.filter.department;
    return matchesQuery && matchesStatus && matchesDepartment;
  });
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function renderTable() {
  const visibleEmployees = getVisibleEmployees();
  tableBody.innerHTML = '';

  if (!visibleEmployees.length) {
    tableBody.innerHTML = '<tr><td colspan="8">No matching employees found.</td></tr>';
    return;
  }

  visibleEmployees.forEach((employee) => {
    const row = document.createElement('tr');
    const badgeClass = employee.employment_status.toLowerCase() === 'active' ? 'status-active' : 'status-terminated';
    row.innerHTML = `
      <td>${employee.employee_id}</td>
      <td>${employee.full_name}</td>
      <td>${employee.job_title}</td>
      <td>${employee.department}</td>
      <td><span class="status-badge ${badgeClass}">${employee.employment_status}</span></td>
      <td>${formatDate(employee.date_of_hire)}</td>
      <td>${formatDate(employee.date_of_termination)}</td>
      <td>${employee.recruitment_source}</td>
    `;
    tableBody.appendChild(row);
  });
}

async function loadData() {
  const [employeesResponse, summaryResponse] = await Promise.all([
    fetch('/api/employees'),
    fetch('/api/summary'),
  ]);

  state.employees = await employeesResponse.json();
  state.summary = await summaryResponse.json();
  renderSummary(state.summary);
  populateDepartmentFilter(state.employees);
  renderTable();
}

searchInput.addEventListener('input', (event) => {
  state.filter.query = event.target.value;
  renderTable();
});

statusFilter.addEventListener('change', (event) => {
  state.filter.status = event.target.value;
  renderTable();
});

departmentFilter.addEventListener('change', (event) => {
  state.filter.department = event.target.value;
  renderTable();
});

loadData().catch((error) => {
  console.error('Failed to load employee dashboard data', error);
  tableBody.innerHTML = '<tr><td colspan="8">Unable to load employee data.</td></tr>';
});
