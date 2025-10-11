import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';

const formatDate = (value, format = 'DD.MM.YYYY') => {
  if (!value) {
    return '–';
  }
  return dayjs(value).format(format);
};

const formatDateTime = (value) => {
  if (!value) {
    return '–';
  }
  return dayjs(value).format('DD.MM.YYYY HH:mm');
};

const formatCurrency = (value) => {
  const number = Number(value);
  if (Number.isNaN(number)) {
    return '–';
  }
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(number);
};

const getImageFormat = (dataUrl) => {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return 'PNG';
  }
  if (dataUrl.startsWith('data:image/png')) {
    return 'PNG';
  }
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) {
    return 'JPEG';
  }
  return 'PNG';
};

export const createServiceReportPdf = (order) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const marginLeft = 40;

  doc.setFontSize(22);
  doc.text('Servicebericht', marginLeft, 50);
  doc.setFontSize(12);
  doc.text(`Auftrag: ${order.title || `#${order.order_id}`}`, marginLeft, 70);
  if (order.account_name) {
    doc.text(`Kunde: ${order.account_name}`, marginLeft, 85);
  }

  const metaRows = [
    ['Auftragsnummer', order.order_id],
    ['Status', order.status],
    ['Geplant am', formatDate(order.planned_date)],
    [
      'Zeitraum',
      `${order.planned_start ? dayjs(order.planned_start).format('HH:mm') : '–'} - ${
        order.planned_end ? dayjs(order.planned_end).format('HH:mm') : '–'
      }`,
    ],
    ['Ort', order.property_address || order.property_name || '–'],
    ['Service-Empfänger', order.service_recipient_name || '–'],
  ];

  autoTable(doc, {
    startY: 105,
    head: [['Feld', 'Wert']],
    body: metaRows,
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [41, 128, 185] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 150 },
    },
  });

  let currentY = doc.lastAutoTable.finalY + 25;

  doc.setFontSize(14);
  doc.text('Zeiterfassungen', marginLeft, currentY);
  currentY += 10;

  if (order.time_entries && order.time_entries.length) {
    const timeRows = order.time_entries.map((entry) => [
      entry.employee_name || '–',
      formatDateTime(entry.start_time),
      formatDateTime(entry.end_time),
      entry.duration_minutes ? `${entry.duration_minutes} Min.` : '–',
      entry.notes || '–',
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Mitarbeiter', 'Start', 'Ende', 'Dauer', 'Notizen']],
      body: timeRows,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: {
        4: { cellWidth: 160 },
      },
    });

    currentY = doc.lastAutoTable.finalY + 20;
  } else {
    doc.setFontSize(10);
    doc.text('Keine Zeiterfassungen vorhanden.', marginLeft, currentY + 15);
    currentY += 35;
  }

  doc.setFontSize(14);
  doc.text('Materialverbrauch', marginLeft, currentY);
  currentY += 10;

  if (order.material_usage && order.material_usage.length) {
    const materialRows = order.material_usage.map((item) => [
      item.material_name || '–',
      item.quantity ? `${item.quantity} ${item.unit || ''}` : '–',
      item.unit_price ? formatCurrency(item.unit_price) : '–',
      item.employee_name || '–',
      item.notes || '–',
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Material', 'Menge', 'Einzelpreis', 'Erfasser', 'Notizen']],
      body: materialRows,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: {
        0: { cellWidth: 120 },
        4: { cellWidth: 140 },
      },
    });

    currentY = doc.lastAutoTable.finalY + 20;
  } else {
    doc.setFontSize(10);
    doc.text('Kein Materialverbrauch erfasst.', marginLeft, currentY + 15);
    currentY += 35;
  }

  if (order.signature?.signature_data) {
    const signatureY = currentY + 10;
    doc.setFontSize(14);
    doc.text('Unterschrift', marginLeft, signatureY);

    doc.addImage(
      order.signature.signature_data,
      getImageFormat(order.signature.signature_data),
      marginLeft,
      signatureY + 10,
      160,
      80
    );

    if (order.signature.signed_by) {
      doc.setFontSize(10);
      doc.text(`Unterschrieben von: ${order.signature.signed_by}`, marginLeft, signatureY + 100);
    }

    currentY = signatureY + 120;
  }

  if (order.photos && order.photos.length) {
    if (currentY + 180 > doc.internal.pageSize.getHeight()) {
      doc.addPage();
      currentY = 60;
    } else {
      currentY += 20;
    }

    doc.setFontSize(14);
    doc.text('Fotodokumentation', marginLeft, currentY);
    currentY += 20;

    const maxWidth = doc.internal.pageSize.getWidth() - marginLeft * 2;
    const photoHeight = 150;

    order.photos.forEach((photo, index) => {
      if (!photo.photo_data) {
        return;
      }

      if (currentY + photoHeight > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        currentY = 60;
      }

      const caption = photo.caption || `Foto ${index + 1}`;
      doc.setFontSize(10);
      doc.text(caption, marginLeft, currentY);
      doc.addImage(
        photo.photo_data,
        getImageFormat(photo.photo_data),
        marginLeft,
        currentY + 10,
        maxWidth,
        photoHeight
      );
      currentY += photoHeight + 30;
    });
  }

  return doc;
};

export const createInvoicePdf = (invoice) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const marginLeft = 40;

  doc.setFontSize(22);
  doc.text('Rechnung', marginLeft, 50);
  doc.setFontSize(12);
  doc.text(`Rechnungsnummer: ${invoice.invoice_number || `#${invoice.invoice_id}`}`, marginLeft, 70);
  doc.text(`Rechnungsdatum: ${formatDate(invoice.invoice_date)}`, marginLeft, 85);
  doc.text(`Fällig am: ${formatDate(invoice.due_date)}`, marginLeft, 100);

  const recipientLines = [];
  if (invoice.account_name) {
    recipientLines.push(invoice.account_name);
  }
  if (invoice.property_name) {
    recipientLines.push(`Objekt: ${invoice.property_name}`);
  }
  if (invoice.contact_name) {
    recipientLines.push(`Ansprechpartner: ${invoice.contact_name}`);
  }

  if (recipientLines.length) {
    doc.text(recipientLines, marginLeft, 125);
  }

  const itemRows = (invoice.items || []).map((item, index) => [
    index + 1,
    item.description,
    `${item.quantity} ${item.unit || ''}`,
    formatCurrency(item.unit_price),
    formatCurrency(item.total_gross),
  ]);

  autoTable(doc, {
    startY: 150,
    head: [['Pos.', 'Beschreibung', 'Menge', 'Einzelpreis', 'Gesamt']],
    body: itemRows,
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [41, 128, 185] },
    columnStyles: {
      0: { cellWidth: 40, halign: 'right' },
      2: { cellWidth: 100 },
      3: { cellWidth: 90, halign: 'right' },
      4: { cellWidth: 90, halign: 'right' },
    },
  });

  let currentY = doc.lastAutoTable.finalY + 20;
  const summaryX = marginLeft + 260;

  doc.setFontSize(12);
  doc.text('Zusammenfassung', marginLeft, currentY);
  currentY += 18;

  doc.setFontSize(10);
  doc.text('Zwischensumme (netto):', summaryX, currentY);
  doc.text(formatCurrency(invoice.total_net), summaryX + 160, currentY, { align: 'right' });
  currentY += 16;
  doc.text('Gesamtbetrag (brutto):', summaryX, currentY);
  doc.text(formatCurrency(invoice.total_gross), summaryX + 160, currentY, { align: 'right' });
  currentY += 16;
  doc.text('Bereits bezahlt:', summaryX, currentY);
  doc.text(formatCurrency(invoice.amount_paid || 0), summaryX + 160, currentY, { align: 'right' });
  currentY += 16;
  const outstanding = Math.max(
    (Number(invoice.total_gross) || 0) - (Number(invoice.amount_paid) || 0),
    0
  );
  doc.text('Offener Betrag:', summaryX, currentY);
  doc.text(formatCurrency(outstanding), summaryX + 160, currentY, { align: 'right' });
  currentY += 24;

  if (invoice.payment_terms) {
    doc.setFontSize(10);
    doc.text('Zahlungsbedingungen:', marginLeft, currentY);
    currentY += 14;
    doc.text(invoice.payment_terms, marginLeft, currentY, { maxWidth: 480 });
    currentY += 24;
  }

  if (invoice.notes) {
    doc.setFontSize(10);
    doc.text('Notizen:', marginLeft, currentY);
    currentY += 14;
    doc.text(invoice.notes, marginLeft, currentY, { maxWidth: 480 });
  }

  return doc;
};

export const pdfToDataUri = (doc) => doc.output('datauristring');
