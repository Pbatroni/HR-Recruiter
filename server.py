import csv
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

BASE_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = BASE_DIR / "public"
CSV_PATH = BASE_DIR.parent / "employees.csv"


def load_employees():
    with CSV_PATH.open(newline='', encoding='utf-8') as handle:
        rows = list(csv.DictReader(handle))
    return rows


def build_summary(employees):
    active_count = sum(1 for item in employees if item.get('employment_status', '').lower() == 'active')
    terminated_count = len(employees) - active_count
    departments = {}
    for employee in employees:
        department = employee.get('department', 'Unknown')
        departments[department] = departments.get(department, 0) + 1

    return {
        'total': len(employees),
        'active': active_count,
        'terminated': terminated_count,
        'departments': departments,
    }


EMPLOYEES = load_employees()
SUMMARY = build_summary(EMPLOYEES)


class EmployeeHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == '/api/employees':
            self.send_json(EMPLOYEES)
            return

        if path == '/api/summary':
            self.send_json(SUMMARY)
            return

        if path == '/':
            path = '/index.html'

        file_path = PUBLIC_DIR / path.lstrip('/')
        if file_path.exists() and file_path.is_file():
            self.serve_file(file_path)
            return

        self.send_error(404, 'Not Found')

    def send_json(self, payload):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def serve_file(self, file_path):
        content_type = 'text/plain; charset=utf-8'
        if file_path.suffix == '.html':
            content_type = 'text/html; charset=utf-8'
        elif file_path.suffix == '.css':
            content_type = 'text/css; charset=utf-8'
        elif file_path.suffix == '.js':
            content_type = 'application/javascript; charset=utf-8'

        body = file_path.read_bytes()
        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        return


if __name__ == '__main__':
    server = ThreadingHTTPServer(('0.0.0.0', 3000), EmployeeHandler)
    print('Employee dashboard running at http://localhost:3000')
    server.serve_forever()
