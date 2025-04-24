import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '@/types';

export const generatePDF = (invoice: Invoice) => {
  const doc = new jsPDF();

  // HEADER BAR
  doc.setFillColor(41, 128, 185); // Modern blue
  doc.rect(0, 0, 210, 30, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('TAX INVOICE', 105, 20, { align: 'center' });

  // BUSINESS & CUSTOMER DETAILS
  doc.setFontSize(11);
  doc.setTextColor(44, 62, 80); // Dark gray
  doc.setFont('helvetica', 'bold');
  doc.text('Bill From:', 15, 40);
  doc.setFont('helvetica', 'normal');
  doc.text(`${invoice.business_name}`, 15, 46);
  doc.text(`${invoice.business_address}`, 15, 51);
  doc.text(`GSTIN: ${invoice.business_gst}`, 15, 56);

  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 120, 40);
  doc.setFont('helvetica', 'normal');
  doc.text(`${invoice.customer_name}`, 120, 46);
  doc.text(`${invoice.customer_address}`, 120, 51);
  doc.text(`GSTIN: ${invoice.customer_gst}`, 120, 56);

  // INVOICE DETAILS BAR
  doc.setFillColor(236, 240, 241); // Light gray
  doc.roundedRect(15, 62, 180, 14, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(41, 128, 185);
  doc.text('Invoice Number:', 20, 71);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(44, 62, 80);
  doc.text(`${invoice.invoice_number}`, 54, 71);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(41, 128, 185);
  doc.text('Date:', 140, 71);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(44, 62, 80);
  const dateStr = invoice.invoice_date || invoice.created_at;
  const displayDate = dateStr ? new Date(dateStr) : new Date();
  const formattedDate = `${displayDate.getDate().toString().padStart(2, '0')}/${(displayDate.getMonth()+1).toString().padStart(2, '0')}/${displayDate.getFullYear()}`;
  doc.text(formattedDate, 152, 71);

  // ITEMS TABLE
  const tableY = 82;
  // Prepare body with at least 5 rows
  let itemRows = invoice.items.map((item, idx) => {
    const taxable = item.quantity * item.rate;
    const cgst = (taxable * item.gstRate / 2 / 100);
    const sgst = (taxable * item.gstRate / 2 / 100);
    const total = taxable + cgst + sgst;
    return [
      (idx + 1).toString(),
      item.description,
      item.quantity,
      taxable.toFixed(2),
      `${item.gstRate}%`,
      cgst.toFixed(2),
      sgst.toFixed(2),
      total.toFixed(2)
    ];
  });
  while (itemRows.length < 5) {
    itemRows.push([ '', '', '', '', '', '', '', '' ]);
  }
  autoTable(doc, {
    startY: tableY,
    head: [[
      'Sr. No',
      'Description',
      'Quantity',
      'Taxable',
      'GST Rate',
      'CGST',
      'SGST',
      'Total'
    ]],
    body: itemRows,
    theme: 'striped',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 11
    },
    bodyStyles: {
      fontSize: 10,
      halign: 'center',
      valign: 'middle',
      fillColor: [245, 245, 245], // very light gray
      textColor: [44, 62, 80]
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255]
    },
    styles: {
      cellPadding: 3,
      lineColor: [220, 220, 220],
      lineWidth: 0.5,
      font: 'helvetica'
    },
    columnStyles: {
      1: { halign: 'left' }, // Description left-aligned
    },
    didDrawPage: (data) => {
      // Draw rounded border around the table (only if all values are defined)
      const table = data.table;
      const { startX, startY, width, height } = table || {};
      if (
        typeof startX === 'number' &&
        typeof startY === 'number' &&
        typeof width === 'number' &&
        typeof height === 'number'
      ) {
        doc.setDrawColor(41,128,185);
        doc.setLineWidth(1);
        doc.roundedRect(startX-2, startY-2, width+4, height+4, 4, 4, 'S');
      }
    }
  });

  // GST SUMMARY (rate-wise)
  const summaryRates = [5, 12, 18, 28];
  const gstSummaryRows = summaryRates.map(rate => {
    const itemsForRate = invoice.items.filter(item => item.gstRate === rate);
    const taxable = itemsForRate.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const cgst = itemsForRate.reduce((sum, item) => sum + (item.quantity * item.rate * item.gstRate / 2 / 100), 0);
    const sgst = cgst; // For Indian GST, CGST and SGST are equal
    const totalGst = cgst + sgst;
    return [
      `${rate}%`,
      taxable.toFixed(2),
      cgst.toFixed(2),
      sgst.toFixed(2),
      totalGst.toFixed(2)
    ];
  });
  // Calculate grand totals for summary columns
  const totalTaxable = gstSummaryRows.reduce((sum, row) => sum + parseFloat(row[1]), 0);
  const totalCgst = gstSummaryRows.reduce((sum, row) => sum + parseFloat(row[2]), 0);
  const totalSgst = gstSummaryRows.reduce((sum, row) => sum + parseFloat(row[3]), 0);
  const totalTotal = gstSummaryRows.reduce((sum, row) => sum + parseFloat(row[4]), 0);
  // Position summary below items table, align left and make compact
  const gstSummaryY = doc.lastAutoTable.finalY + 10;
  autoTable(doc, {
    startY: gstSummaryY,
    margin: { left: 14 }, // left align
    tableWidth: 70, // make it compact
    head: [[
      'GST Rate',
      'Taxable',
      'CGST',
      'SGST',
      'Total'
    ]],
    body: [
      ...gstSummaryRows,
      [
        { content: 'TOTAL', styles: { fontStyle: 'bold', textColor: [41,128,185] } },
        { content: totalTaxable.toFixed(2), styles: { fontStyle: 'bold' } },
        { content: totalCgst.toFixed(2), styles: { fontStyle: 'bold' } },
        { content: totalSgst.toFixed(2), styles: { fontStyle: 'bold' } },
        { content: totalTotal.toFixed(2), styles: { fontStyle: 'bold' } }
      ]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 8,
      halign: 'center',
      valign: 'middle',
      textColor: [44, 62, 80]
    },
    styles: {
      cellPadding: 1.5,
      font: 'helvetica',
      lineColor: [220, 220, 220],
      lineWidth: 0.5
    }
  });

  // MODERN SUMMARY BOX
  const summaryY = doc.lastAutoTable.finalY + 10;
  const summaryX = 120;
  const summaryWidth = 76;
  const summaryLineHeight = 6; // Each line is about 6 units tall
  const summaryLines = 5; // Heading + 4 rows
  const summaryHeight = summaryLineHeight * summaryLines + 6; // Extra padding

  // Draw properly aligned background
  doc.setFillColor(236, 240, 241);
  doc.roundedRect(summaryX, summaryY, summaryWidth, summaryHeight, 4, 4, 'F');

  // Text positions
  let line = 0;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(44, 62, 80);
  doc.text('Summary', summaryX + summaryWidth / 2, summaryY + 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(44, 62, 80);

  // Calculate summary values
  const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const gstAmount = invoice.items.reduce((sum, item) => {
    const taxable = item.quantity * item.rate;
    return sum + (taxable * item.gstRate / 100);
  }, 0);
  const totalAmount = subtotal + gstAmount;
  const roundedTotal = Math.round(totalAmount);
  const roundOff = (roundedTotal - totalAmount);

  // Subtotal
  doc.text('Subtotal:', summaryX + 6, summaryY + 16);
  doc.text(subtotal.toFixed(2), summaryX + summaryWidth - 6, summaryY + 16, { align: 'right' });
  // GST Amount
  doc.text('GST Amount:', summaryX + 6, summaryY + 22);
  doc.text(gstAmount.toFixed(2), summaryX + summaryWidth - 6, summaryY + 22, { align: 'right' });
  // Round Off
  doc.text('Round Off:', summaryX + 6, summaryY + 28);
  doc.text(roundOff >= 0 ? `+${roundOff.toFixed(2)}` : roundOff.toFixed(2), summaryX + summaryWidth - 6, summaryY + 28, { align: 'right' });
  // Grand Total
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total:', summaryX + 6, summaryY + 34);
  doc.text(roundedTotal.toFixed(2), summaryX + summaryWidth - 6, summaryY + 34, { align: 'right' });
  doc.setFont('helvetica', 'normal');

  // AMOUNT IN WORDS
  function numberToWords(num: number): string {
    // Indian system, up to crores, with Rupees/Paise
    const a = [ '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen' ];
    const b = [ '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety' ];
    if (num === 0) return 'Rupees Zero Only';
    let n = Math.floor(num);
    let str = '';
    // Split into crore, lakh, thousand, hundred, rest
    const crore = Math.floor(n / 10000000);
    n = n % 10000000;
    const lakh = Math.floor(n / 100000);
    n = n % 100000;
    const thousand = Math.floor(n / 1000);
    n = n % 1000;
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    if (crore > 0) {
      if (crore < 20) str += a[crore] + ' Crore ';
      else str += b[Math.floor(crore / 10)] + ' ' + a[crore % 10] + ' Crore ';
    }
    if (lakh > 0) {
      if (lakh < 20) str += a[lakh] + ' Lakh ';
      else str += b[Math.floor(lakh / 10)] + ' ' + a[lakh % 10] + ' Lakh ';
    }
    if (thousand > 0) {
      if (thousand < 20) str += a[thousand] + ' Thousand ';
      else str += b[Math.floor(thousand / 10)] + ' ' + a[thousand % 10] + ' Thousand ';
    }
    if (hundred > 0) str += a[hundred] + ' Hundred ';
    if (rest > 0) {
      if (rest < 20) str += a[rest] + ' ';
      else str += b[Math.floor(rest / 10)] + ' ' + a[rest % 10] + ' ';
    }
    str = str.replace(/ +/g, ' ').trim();
    const paisa = Math.round((num % 1) * 100);
    if (paisa > 0) {
      return `Rupees ${str} and Paise ${numberToWords(paisa).replace('Rupees ', '').replace(' Only', '')} Only`;
    }
    return `Rupees ${str} Only`;
  }
  const amountWords = numberToWords(roundedTotal);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(41, 128, 185);
  doc.text('Amount in Words:', 15, summaryY + 44);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(44, 62, 80);
  doc.text(`${amountWords}`, 55, summaryY + 44);

  // SIGNATURE AREA
  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.line(160, summaryY + 55, 195, summaryY + 55);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text('Authorized Signature', 177, summaryY + 60, { align: 'center' });

  // FOOTER
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text('Thank you for your business!', 105, pageHeight - 10, { align: 'center' });

  doc.save(`invoice-${invoice.invoice_number}.pdf`);
};
