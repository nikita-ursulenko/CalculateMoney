import html2pdf from 'html2pdf.js';
import { Entry } from './useEntries';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface DailyStats {
  balance: number;
  income: number;
  tipsTotal: number;
  recipients: Record<string, number>;
}

interface DateRange {
  from: Date;
  to?: Date;
}

const serviceLabels: Record<string, string> = {
  manicure: 'Маникюр',
  pedicure: 'Педикюр',
  other: 'Другое',
};

export function useExportData() {


  const exportToPDF = (entries: Entry[], dateRange: DateRange, dailyStats: DailyStats, rateCash: number, rateCard: number, masterName: string = 'Мастер') => {
    // Format date range
    const periodText = dateRange.to && dateRange.from.getTime() !== dateRange.to.getTime()
      ? `${format(dateRange.from, 'd MMMM yyyy', { locale: ru })} - ${format(dateRange.to, 'd MMMM yyyy', { locale: ru })}`
      : format(dateRange.from, 'd MMMM yyyy', { locale: ru });

    // Group and render entries by date
    const entriesByDate: Record<string, Entry[]> = {};
    entries.forEach(entry => {
      const dateKey = entry.date;
      if (!entriesByDate[dateKey]) {
        entriesByDate[dateKey] = [];
      }
      entriesByDate[dateKey].push(entry);
    });

    const sortedDates = Object.keys(entriesByDate).sort();

    let globalIndex = 0;
    const tableRowsHtml = sortedDates.map(dateKey => {
      const dateEntries = entriesByDate[dateKey];
      const dateLabel = format(new Date(dateKey), 'd MMMM yyyy, EEEE', { locale: ru });

      const headerRow = `
        <tr class="date-header-row">
          <td colspan="7" style="background: #dfe6e9; color: #2d3436; font-weight: bold; font-size: 13px; padding: 8px 12px; text-transform: uppercase; border: 1px solid #bdc3c7;">
            ${dateLabel}
          </td>
        </tr>
      `;

      const rows = dateEntries.map(entry => {
        globalIndex++;
        const isCash = entry.payment_method === 'cash';
        const type = entry.transaction_type || 'service';

        let methodCol = isCash ? 'Наличные' : 'Карта';
        let serviceCol = entry.service
          .split(',')
          .map(s => serviceLabels[s.trim()] || s.trim())
          .join(', ');
        let priceCol = `€${entry.price.toFixed(2)}`;

        if (type === 'debt_salon_to_master') {
          methodCol = '<span style="color:#27ae60; font-weight:bold;">Салон мне</span>';
        } else if (type === 'debt_master_to_salon') {
          methodCol = '<span style="color:#c0392b; font-weight:bold;">Я салону</span>';
          priceCol = `<span style="color:#c0392b;">-€${entry.price.toFixed(2)}</span>`;
        }

        const recipientText = entry.recipient_role === 'me' || !entry.recipient_role
          ? 'Я'
          : entry.recipient_role === 'admin'
            ? 'Администратор'
            : entry.recipient_name || 'Мастер';

        const cardTips = (entry.tips > 0 && entry.tips_payment_method === 'card') ? entry.tips : 0;

        return `
          <tr class="entry-row">
            <td>${globalIndex}</td>
            <td>${entry.client_name || 'Без имени'}</td>
            <td>${serviceCol}</td>
            <td>${methodCol}</td>
            <td class="price">${priceCol}</td>
            <td class="tips-cell">${cardTips > 0 ? `€${cardTips.toFixed(2)}` : '-'}</td>
            <td>${recipientText}</td>
          </tr>
        `;
      }).join('');

      return headerRow + rows;
    }).join('');

    // Build HTML content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      padding: 40px;
      color: #2c3e50;
      background: white;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #3498db;
      padding-bottom: 20px;
    }
    
    .header h1 {
      font-size: 28px;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .header .subtitle {
      font-size: 16px;
      color: #34495e;
      margin-bottom: 5px;
      font-weight: 500;
    }
    
    .header .period {
      font-size: 14px;
      color: #7f8c8d;
      margin-top: 8px;
    }
    
    .report-section {
      margin-bottom: 30px;
    }
    
    .summary-header {
      font-size: 20px;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .summary-grid {
      background: #f8f9fa;
      padding: 20px;
      margin-bottom: 25px;
      border-left: 4px solid #2c3e50;
    }
    
    .summary-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #dee2e6;
    }
    
    .summary-item:last-child {
      border-bottom: none;
    }
    
    .summary-label {
      font-size: 15px;
      color: #495057;
    }
    
    .summary-value {
      font-size: 16px;
      font-weight: bold;
      color: #27ae60;
    }
    
    .entries-header {
      font-size: 18px;
      font-weight: bold;
      color: #2c3e50;
      margin: 25px 0 15px 0;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    
    .unified-table {
      width: 100%;
      border-collapse: collapse;
      margin: 25px 0;
      border: 2px solid #2c3e50;
    }
    
    .unified-table td,
    .unified-table th {
      padding: 12px;
      border: 1px solid #bdc3c7;
      text-align: left;
    }
    

    .entries-title-row td {
      background: #34495e;
      color: white;
      font-size: 16px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      padding: 12px;
      text-align: center;
    }
    
    .table-header {
      background: #2c3e50;
      color: white;
    }
    
    .table-header th {
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      text-align: left;
    }
    
    .entry-row {
      background: white;
    }
    
    .entry-row:nth-of-type(even) {
      background: #f8f9fa;
    }
    
    .entry-row .price {
      font-weight: bold;
      color: #2c3e50;
      text-align: right;
    }
    
    .entry-row .tips-cell {
      font-weight: 600;
      color: #7f8c8d;
      text-align: right;
      font-size: 13px;
    }
    
    .unified-table .total-row {
      background: #ecf0f1;
      font-weight: bold;
      border-top: 3px solid #2c3e50;
    }
    
    .unified-table .total-label {
      text-align: right;
      font-size: 14px;
      color: #2c3e50;
      font-weight: bold;
    }
    
    .unified-table .total-value {
      font-size: 16px;
      color: #27ae60;
      font-weight: bold;
      text-align: right;
    }
    

    .section {
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #ecf0f1;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .metric-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #f8f9fa;
    }
    
    .metric-row:last-child {
      border-bottom: none;
    }
    
    .metric-label {
      font-size: 14px;
      color: #555;
    }
    
    .metric-value {
      font-size: 14px;
      font-weight: bold;
      color: #2c3e50;
    }
    
    .metric-value.positive {
      color: #27ae60;
    }
    
    .total-row {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 2px solid #3498db;
    }
    
    .total-row .metric-label {
      font-weight: bold;
      font-size: 15px;
    }
    
    .total-row .metric-value {
      font-size: 16px;
    }
    
    .balance-box {
      background: #2c3e50;
      color: white;
      padding: 25px;
      border: 3px solid #1a252f;
      text-align: center;
      margin: 30px 0;
    }
    
    .balance-box .label {
      font-size: 14px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    
    .balance-box .value {
      font-size: 36px;
      font-weight: bold;
    }
    
    .footer {
      margin-top: 50px;
      text-align: center;
      font-size: 11px;
      color: #95a5a6;
      padding-top: 20px;
      border-top: 1px solid #ecf0f1;
    }
    
    .entries-table {
      width: 100%;
      border-collapse: collapse;
      margin: 25px 0;
      font-size: 13px;
      border: 2px solid #2c3e50;
    }
    
    .entries-table thead {
      background: #2c3e50;
      color: white;
    }
    
    .entries-table th {
      padding: 12px;
      text-align: left;
      font-weight: bold;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      border: 1px solid #1a252f;
    }
    
    .entries-table td {
      padding: 10px 12px;
      border: 1px solid #bdc3c7;
    }
    
    .entries-table tbody tr {
      background: white;
      page-break-inside: avoid;
    }
    
    .entries-table tbody tr:nth-child(even) {
      background: #f8f9fa;
    }

    tr {
      page-break-inside: avoid;
    }
    
    .entries-table .price {
      font-weight: bold;
      color: #2c3e50;
      text-align: right;
    }
    
    .entries-table .total-row {
      background: #ecf0f1;
      font-weight: bold;
      border-top: 2px solid #34495e;
      page-break-inside: avoid;
    }
    
    .entries-table .total-label {
      text-align: right;
      font-size: 14px;
      color: #2c3e50;
    }
    
    .entries-table .total-value {
      font-size: 16px;
      color: #27ae60;
      font-weight: bold;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Финансовый отчет</h1>
    <div class="subtitle">Мастер: ${masterName}</div>
    <div class="period">${periodText}</div>
  </div>

  <table class="unified-table">
    <tbody>
      <!-- Entries Section Header -->
      <tr class="entries-title-row">
        <td colspan="6">ЗАПИСИ НА ${periodText.toUpperCase()}</td>
      </tr>
      
      <!-- Table Headers -->
      <tr class="table-header">
        <th>№</th>
        <th>Клиент</th>
        <th>Услуга</th>
        <th>Метод оплаты</th>
        <th>Цена</th>
        <th>Чаевые (Карта)</th>
        <th>Кто принял</th>
      </tr>
      
      <!-- Entry Rows -->
      <!-- Entry Rows -->
      ${tableRowsHtml}
      
      <!-- Total Row -->
      <tr class="total-row">
        <td colspan="5" class="total-label">ИТОГО:</td>
        <td class="total-value">€${(() => {
        const servicesTotal = entries.reduce((sum, e) => {
          const t = e.transaction_type || 'service';
          if (t === 'debt_master_to_salon') return sum - e.price;
          return sum + e.price;
        }, 0);
        const tipsTotal = entries.reduce((sum, e) => e.tips > 0 && e.tips_payment_method === 'card' ? sum + e.tips : sum, 0);
        return (servicesTotal + tipsTotal).toFixed(2);
      })()}</td>
        <td></td>
      </tr>
      
    </tbody>
  </table>


  <div class="balance-box">
    <div class="label">${dailyStats.balance >= 0 ? 'К ВАМ ОТ САЛОНА' : 'ОТ ВАС САЛОНУ'}</div>
    <div class="value">${dailyStats.balance >= 0 ? '+' : ''}€${dailyStats.balance.toFixed(2)}</div>
  </div>

  <div class="footer">
    Сгенерировано: ${format(new Date(), 'd MMMM yyyy, HH:mm', { locale: ru })}
  </div>
</body>
</html>
        `;

    // Generate filename
    const filename = dateRange.to && dateRange.from.getTime() !== dateRange.to.getTime()
      ? `Отчет_${format(dateRange.from, 'dd-MM-yyyy')}_${format(dateRange.to, 'dd-MM-yyyy')}.pdf`
      : `Отчет_${format(dateRange.from, 'dd-MM-yyyy')}.pdf`;

    // Convert HTML to PDF
    const element = document.createElement('div');
    element.innerHTML = htmlContent;

    const opt = {
      margin: 10,
      filename: filename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    html2pdf().from(element).set(opt).save();
  };

  return {
    exportToPDF
  };
}
