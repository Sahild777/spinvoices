
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '@/types';

export const generatePDF = (invoice: Invoice) => {
  const doc = new jsPDF();
  
  // Modern TAX INVOICE Header
  // Top Center
  // Add a subtle line below header for separation
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', 105, 18, { align: 'center' });
  doc.setDrawColor(200);
  doc.line(20, 22, 190, 22);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill From:', 20, 32);
  doc.setFont('helvetica', 'normal');
  doc.text(`${invoice.business_name}`, 20, 38);
  doc.text(`${invoice.business_address}`, 20, 43);
  doc.text(`GSTIN: ${invoice.business_gst}`, 20, 48);

  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 120, 32);
  doc.setFont('helvetica', 'normal');
  doc.text(`${invoice.customer_name}`, 120, 38);
  doc.text(`${invoice.customer_address}`, 120, 43);
  doc.text(`GSTIN: ${invoice.customer_gst}`, 120, 48);

  doc.setFont('helvetica', 'bold');
  doc.text(`Invoice Number:`, 20, 58);
  doc.setFont('helvetica', 'normal');
  doc.text(`${invoice.invoice_number}`, 55, 58);
  doc.setFont('helvetica', 'bold');
  doc.text(`Date:`, 120, 58);
  doc.setFont('helvetica', 'normal');
  const createdDate = new Date(invoice.created_at);
const formattedDate = `${createdDate.getDate().toString().padStart(2, '0')}/${(createdDate.getMonth()+1).toString().padStart(2, '0')}/${createdDate.getFullYear()}`;
doc.text(formattedDate, 135, 58);

  // Modern Items Table with Sr. No and minimum 10 rows
  const tableHead = [['Sr. No', 'Description', 'Quantity', 'Rate', 'GST Rate', 'Total']];
  let tableBody = invoice.items.map((item, idx) => [
    (idx + 1).toString(),
    item.description,
    item.quantity,
    item.rate.toFixed(2),
    `${item.gstRate}%`,
    (item.quantity * item.rate).toFixed(2)
  ]);
  // Pad rows to ensure at least 10 rows
  while (tableBody.length < 10) {
    tableBody.push(['', '', '', '', '', '']);
  }
  autoTable(doc, {
    startY: 70,
    head: tableHead,
    body: tableBody,
    theme: 'striped',
    headStyles: {
      fillColor: [41, 128, 185], // Modern blue
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 11
    },
    bodyStyles: {
      fontSize: 10,
      halign: 'center',
      valign: 'middle',
    },
    styles: {
      cellPadding: 3,
      lineColor: [220, 220, 220],
      lineWidth: 0.5
    },
    columnStyles: {
      1: { halign: 'left' }, // Description left-aligned
    }
  });
  
  // Modern Tax Calculation Box and Summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  // Draw square box for CGST, SGST, IGST
  const boxX = 20;
  const boxY = finalY;
  const boxW = 60;
  const boxH = 24;
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(0.7);
  doc.roundedRect(boxX, boxY, boxW, boxH, 3, 3, 'S');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Tax Breakdown', boxX + 3, boxY + 7);
  doc.setFont('helvetica', 'normal');
  const cgst = (invoice.gst_amount / 2).toFixed(2);
  const sgst = (invoice.gst_amount / 2).toFixed(2);
  const igst = '0.00';
  doc.text(`CGST: ${cgst}`, boxX + 3, boxY + 13);
  doc.text(`SGST: ${sgst}`, boxX + 3, boxY + 18);
  doc.text(`IGST: ${igst}`, boxX + 3, boxY + 23);
  // Modern summary values on right (no currency symbol)
  doc.setFont('helvetica', 'bold');
  doc.text(`Subtotal:`, 125, boxY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`${invoice.subtotal.toFixed(2)}`, 185, boxY + 7, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(`GST Amount:`, 125, boxY + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(`${invoice.gst_amount.toFixed(2)}`, 185, boxY + 13, { align: 'right' });

  // Calculate round off and rounded total
  const unroundedTotal = invoice.subtotal + invoice.gst_amount;
  const roundedTotal = Math.round(unroundedTotal);
  const roundOff = (roundedTotal - unroundedTotal).toFixed(2);

  doc.setFont('helvetica', 'bold');
  doc.text('Round Off:', 125, boxY + 19);
  doc.setFont('helvetica', 'normal');
  doc.text(`${roundOff}`, 185, boxY + 19, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount:', 125, boxY + 25);
  doc.setFont('helvetica', 'normal');
  doc.text(`${roundedTotal.toFixed(2)}`, 185, boxY + 25, { align: 'right' });

  // Amount in Words below summary
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
doc.text('Amount in Words:', 20, boxY + 32);
doc.setFont('helvetica', 'normal');
doc.text(`${amountWords}`, 55, boxY + 32);

  // Footer greeting section
const pageHeight = doc.internal.pageSize.getHeight();
doc.setDrawColor(220);
doc.setLineWidth(0.5);
doc.line(20, pageHeight - 25, 190, pageHeight - 25); // subtle separator

doc.setFont('helvetica', 'italic');
doc.setFontSize(11);
doc.setTextColor(41, 128, 185);
doc.text('Thank you for your business!', 105, pageHeight - 15, { align: 'center' });

doc.setFont('helvetica', 'normal');
doc.setFontSize(10);
doc.setTextColor(0, 0, 0);

// Save the PDF
doc.save(`invoice-${invoice.invoice_number}.pdf`);
};
