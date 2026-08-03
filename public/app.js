const state = {
  employees: [],
  summary: null,
  filter: {
    query: '',
    status: 'all',
  },
};

const summaryGrid = document.getElementById('summary-grid');
const tableBody = document.getElementById('employee-table-body');
const searchInput = document.getElementById('search');
const statusFilter = document.getElementById('statusFilter');

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

function getVisibleEmployees() {
  const query = state.filter.query.toLowerCase();

  return state.employees.filter((employee) => {
    const matchesQuery = `${employee.full_name} ${employee.department}`.toLowerCase().includes(query);
    const matchesStatus = state.filter.status === 'all' || employee.employment_status.toLowerCase() === state.filter.status;
    return matchesQuery && matchesStatus;
  });
}

function renderTable() {
  const visibleEmployees = getVisibleEmployees();
  tableBody.innerHTML = '';

  if (!visibleEmployees.length) {
    tableBody.innerHTML = '<tr><td colspan="5">No matching employees found.</td></tr>';
    return;
  }

  visibleEmployees.forEach((employee) => {
    const row = document.createElement('tr');
    const badgeClass = employee.employment_status.toLowerCase() === 'active' ? 'status-active' : 'status-terminated';
    row.innerHTML = `
      <td>${employee.candidate_id}</td>
      <td>${employee.full_name}</td>
      <td>${employee.recruiting_source}</td>
      <td><span class="status-badge ${badgeClass}">${employee.employment_status}</span></td>
      <td>${employee.department}</td>
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

loadData().catch((error) => {
  console.error('Failed to load employee dashboard data', error);
  tableBody.innerHTML = '<tr><td colspan="5">Unable to load employee data.</td></tr>';
});
