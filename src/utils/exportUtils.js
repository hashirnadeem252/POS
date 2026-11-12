// utils/exportUtils.js

export function printTable({
  tableSelector = '.table-wrapper',
  title = 'Data List',
  subtitle = 'Generated from POS System',
  totalItems = 0,
  date = new Date(),
  additionalInfo = null,
}) {
  const tableWrapper = document.querySelector(tableSelector);
  if (!tableWrapper) {
    alert('No table to print.');
    return;
  }

  const tableEl = tableWrapper.querySelector('table');
  if (!tableEl) {
    alert('No table found to print.');
    return;
  }

  // Extract headers
  const headerCells = tableEl.querySelectorAll('thead tr th');
  const headers = Array.from(headerCells).map((th) => th.textContent.trim());

  // Extract data rows
  const bodyRows = tableEl.querySelectorAll('tbody tr');
  const dataRows = Array.from(bodyRows).map((tr) => {
    const cells = tr.querySelectorAll('td');
    return Array.from(cells).map((td) => {
      // ✅ FIX: Extract text, then strip out emojis like ✅ and ❌
      let text = td.textContent.trim();
      text = text.replace(/[✅❌✔️✖️]/g, '').trim();
      return text;
    });
  });

  // Remove empty Actions column
  const lastHeader = headers[headers.length - 1]?.toLowerCase() || '';
  const isActionColumn =
    lastHeader === '' ||
    lastHeader === 'actions' ||
    lastHeader === 'action' ||
    lastHeader === ' ';

  const cleanHeaders = isActionColumn ? headers.slice(0, -1) : headers;
  const cleanDataRows = isActionColumn
    ? dataRows.map((row) => row.slice(0, -1))
    : dataRows;

  const dateStr = date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });

  const printWindow = window.open('', '_blank', 'width=1200,height=800');
  if (!printWindow) {
    alert('Please allow popups to print.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title.replace(/[📦📋👥👤🔄]/g, '').trim()}</title>
        <style>${getPrintStyles()}</style>
      </head>
      <body>
        <div class="print-header">
          <div class="print-header-left">
            <div class="print-title">${title.replace(/[📦📋👥👤🔄]/g, '').trim()}</div>
            <div class="print-subtitle">${subtitle}</div>
            ${additionalInfo ? `<div class="print-additional">${additionalInfo}</div>` : ''}
          </div>
          <div class="print-header-right">
            <div>Date: <strong>${dateStr}</strong></div>
            <div>Time: <strong>${timeStr}</strong></div>
            <div>Total: <strong>${totalItems}</strong> records</div>
          </div>
        </div>

        <table class="print-table">
          <thead>
            <tr>
              ${cleanHeaders.map((h) => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${cleanDataRows.map((row) => `
              <tr>
                ${row.map((cell) => `<td>${cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="print-footer">
          <span>POS System — Generated Report</span>
          <span>Page 1</span>
        </div>

        <script>
          window.onload = function () {
            setTimeout(function () { window.print(); }, 500);
            window.onafterprint = function () { window.close(); };
          };
        <\/script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
function getPrintStyles() {
  return `
    @page { size: A4 landscape; margin: 12mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1A2B4C;
      background: white;
      padding: 20px;
    }

    .print-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #1A2B4C;
    }
    .print-title {
      font-size: 22px;
      font-weight: 700;
      color: #1A2B4C;
    }
    .print-subtitle {
      font-size: 13px;
      color: #6B7A8F;
      margin-top: 4px;
    }
    .print-additional {
      font-size: 12px;
      color: #6B7A8F;
      margin-top: 4px;
    }
    .print-header-right {
      text-align: right;
      font-size: 12px;
      color: #6B7A8F;
      line-height: 1.6;
    }
    .print-header-right strong {
      color: #1A2B4C;
      font-weight: 600;
    }

    .print-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      table-layout: auto;
    }
    .print-table th {
      background: #1A2B4C;
      color: #fff;
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 10px;
      text-align: left;
      border: 1px solid #1A2B4C;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .print-table td {
      padding: 6px 10px;
      border: 1px solid #DEE2E6;
      text-align: left;
      vertical-align: middle;
      color: #1A2B4C;
    }
    .print-table tr:nth-child(even) td {
      background: #F8F9FA;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .print-footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #DEE2E6;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #6B7A8F;
    }
  `;
}

export function exportToCSV({
  data = [],
  headers = [],
  rowMapper = null,
  filename = 'export',
  date = new Date(),
}) {
  if (data.length === 0) {
    alert('No data to export.');
    return;
  }

  let rows;
  if (rowMapper) {
    rows = data.map(rowMapper);
  } else {
    rows = data.map((item) => {
      return headers.map((header) => {
        const key = header.toLowerCase().replace(/ /g, '');
        return item[key] ?? '';
      });
    });
  }

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  const dateStr = date.toISOString().split('T')[0];
  link.setAttribute('download', `${filename}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel({
  data = [],
  headers = [],
  rowMapper = null,
  filename = 'export',
  date = new Date(),
}) {
  if (data.length === 0) {
    alert('No data to export.');
    return;
  }

  let rows;
  if (rowMapper) {
    rows = data.map(rowMapper);
  } else {
    rows = data.map((item) => {
      return headers.map((header) => {
        const key = header.toLowerCase().replace(/ /g, '');
        return item[key] ?? '';
      });
    });
  }

  const BOM = '\uFEFF';
  const csvContent = BOM + [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  const dateStr = date.toISOString().split('T')[0];
  link.setAttribute('download', `${filename}_${dateStr}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}