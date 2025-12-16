import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DescriptionIcon from '@mui/icons-material/Description';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaidIcon from '@mui/icons-material/Paid';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SendIcon from '@mui/icons-material/Send';
import dayjs from 'dayjs';
import { Link as RouterLink } from 'react-router-dom';
import InvoiceService from '../../services/invoiceService';
import InvoiceTemplateDialog from '../../components/invoices/InvoiceTemplateDialog';
import templateService from '../../services/templateService';

const statusOptions = [
  { value: '', label: 'Alle Status' },
  { value: 'created', label: 'Erstellt' },
  { value: 'sent', label: 'Gesendet' },
  { value: 'partially_paid', label: 'Teilbezahlt' },
  { value: 'paid', label: 'Bezahlt' },
  { value: 'cancelled', label: 'Storniert' }
];

const statusChipProps = {
  created: { color: 'info', label: 'Erstellt' },
  sent: { color: 'primary', label: 'Gesendet' },
  partially_paid: { color: 'warning', label: 'Teilbezahlt' },
  paid: { color: 'success', label: 'Bezahlt' },
  cancelled: { color: 'default', label: 'Storniert' }
};

const statusTransitions = ['created', 'sent', 'partially_paid', 'paid', 'cancelled'];

const formatCurrency = (value) => {
  const number = Number(value);
  if (Number.isNaN(number)) {
    return '–';
  }
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(number);
};

const getOutstandingAmount = (invoice) => {
  const total = Number(invoice.total_gross) || 0;
  const paid = Number(invoice.amount_paid) || 0;
  return Math.max(total - paid, 0);
};

const isOverdue = (invoice) => {
  if (invoice.status === 'paid' || invoice.status === 'cancelled') {
    return false;
  }
  if (!invoice.due_date) {
    return false;
  }
  return dayjs().startOf('day').isAfter(dayjs(invoice.due_date));
};

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [pendingStatus, setPendingStatus] = useState({});
  const [sendingInvoices, setSendingInvoices] = useState({});
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await InvoiceService.getInvoices();
      setInvoices(data);
    } catch (err) {
      console.error('Rechnungen konnten nicht geladen werden', err);
      setError('Rechnungen konnten nicht geladen werden. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleStatusChange = async (invoiceId, nextStatus) => {
    setError('');
    setPendingStatus((prev) => ({ ...prev, [invoiceId]: nextStatus }));
    try {
      const updated = await InvoiceService.updateStatus(invoiceId, nextStatus);
      setInvoices((prev) =>
        prev.map((invoice) => (invoice.invoice_id === invoiceId ? updated : invoice))
      );
      setPendingStatus((prev) => {
        const { [invoiceId]: _discarded, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      console.error('Status konnte nicht aktualisiert werden', err);
      setError('Status konnte nicht aktualisiert werden. Bitte versuchen Sie es erneut.');
      setPendingStatus((prev) => {
        const { [invoiceId]: _discarded, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleOpenTemplateDialog = (invoice) => {
    setSelectedInvoice(invoice);
    setTemplateDialogOpen(true);
  };

  const prepareTemplateData = async (invoice) => {
      // Need to fetch full invoice details to get items
      const fullInvoice = await InvoiceService.getInvoice(invoice.invoice_id);

      return {
        invoice: {
          number: fullInvoice.invoice_number,
          date: fullInvoice.invoice_date,
          dueDate: fullInvoice.due_date,
          subtotal: fullInvoice.total_net,
          vat: fullInvoice.total_gross - fullInvoice.total_net,
          total: fullInvoice.total_gross,
          items: fullInvoice.items.map(item => ({
             description: item.description,
             quantity: item.quantity,
             unit: item.unit,
             unitPrice: item.unit_price,
             total: item.total_net
          }))
        },
        customer: {
          name: fullInvoice.account_name,
          contact: fullInvoice.contact_name
        },
        company: {
           // Should ideally come from system settings
           name: 'Argus Facility Services',
           email: 'info@argus-facility.de'
        }
      };
  }

  const handleDownloadInvoice = async (templateId, invoice) => {
    try {
      const templateData = await prepareTemplateData(invoice);
      const blob = await templateService.renderPdf(templateId, templateData);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rechnung-${invoice.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("PDF generation failed", err);
      setError("PDF konnte nicht generiert werden.");
    }
  };

  const handleSendInvoice = async (templateId, invoice, email) => {
     if (sendingInvoices[invoice.invoice_id]) return;

     try {
       setSendingInvoices((prev) => ({ ...prev, [invoice.invoice_id]: true }));

       const templateData = await prepareTemplateData(invoice);
       const blob = await templateService.renderPdf(templateId, templateData);

       // Convert blob to Data URI for the legacy sendInvoice API
       // Note: Ideally sendInvoice should accept Blob/FormData, but we work with what we have
       const reader = new FileReader();
       reader.readAsDataURL(blob);
       reader.onloadend = async () => {
           const pdfData = reader.result;

           try {
             await InvoiceService.sendInvoice(invoice.invoice_id, {
                to: email,
                pdfData, // Send the Base64 Data URI
                filename: `Rechnung-${invoice.invoice_number || invoice.invoice_id}.pdf`,
                subject: `Rechnung ${invoice.invoice_number || `#${invoice.invoice_id}`}`,
                message: `Guten Tag,\n\nanbei erhalten Sie die Rechnung ${
                  invoice.invoice_number || `#${invoice.invoice_id}`
                } als PDF.\n\nMit freundlichen Grüßen\nIhr Serviceteam`,
              });
              window.alert('Rechnung wurde versendet.');
           } catch (sendErr) {
               throw sendErr;
           } finally {
               setSendingInvoices((prev) => {
                const { [invoice.invoice_id]: _discarded, ...rest } = prev;
                return rest;
              });
           }
       };
     } catch (err) {
       console.error("Sending invoice failed", err);
       window.alert("Versand fehlgeschlagen: " + (err.message || "Unbekannter Fehler"));
       setSendingInvoices((prev) => {
            const { [invoice.invoice_id]: _discarded, ...rest } = prev;
            return rest;
       });
     }
  };

  const filteredInvoices = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    return invoices.filter((invoice) => {
      if (statusFilter && invoice.status !== statusFilter) {
        return false;
      }
      if (searchLower) {
        const haystack = [
          invoice.invoice_number,
          invoice.account_name,
          invoice.property_name,
          invoice.contact_name
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(searchLower)) {
          return false;
        }
      }
      return true;
    });
  }, [invoices, search, statusFilter]);

  const metrics = useMemo(() => {
    if (!invoices.length) {
      return {
        totalInvoices: 0,
        totalOutstanding: 0,
        overdueCount: 0,
        paidCount: 0
      };
    }

    return invoices.reduce(
      (acc, invoice) => {
        acc.totalInvoices += 1;
        const outstanding = getOutstandingAmount(invoice);
        acc.totalOutstanding += outstanding;
        if (isOverdue(invoice) && outstanding > 0) {
          acc.overdueCount += 1;
        }
        if (invoice.status === 'paid') {
          acc.paidCount += 1;
        }
        return acc;
      },
      {
        totalInvoices: 0,
        totalOutstanding: 0,
        overdueCount: 0,
        paidCount: 0
      }
    );
  }, [invoices]);

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Rechnungszentrale
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Behalten Sie offene Posten, Fälligkeiten und den Versandstatus Ihrer Rechnungen im Blick.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            component={RouterLink}
            to="/quotes"
            variant="outlined"
            startIcon={<DescriptionIcon />}
          >
            Aus Angebot erstellen
          </Button>
          <Button startIcon={<RefreshIcon />} onClick={loadInvoices} variant="contained">
            Aktualisieren
          </Button>
        </Stack>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1}>
              <ReceiptLongIcon color="primary" />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Rechnungen gesamt
                </Typography>
                <Typography variant="h6">{metrics.totalInvoices}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1}>
              <PaidIcon color="success" />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Offene Summe
                </Typography>
                <Typography variant="h6">{formatCurrency(metrics.totalOutstanding)}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1}>
              <WarningAmberIcon color="warning" />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Überfällige Rechnungen
                </Typography>
                <Typography variant="h6">{metrics.overdueCount}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1}>
              <InfoOutlinedIcon color="info" />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Bereits bezahlt
                </Typography>
                <Typography variant="h6">{metrics.paidCount}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Card elevation={1} sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
            <TextField
              label="Suche"
              fullWidth
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechnungsnummer, Kunde oder Objekt"
            />
            <TextField
              label="Status"
              select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              sx={{ minWidth: 220 }}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {error && (
            <Box sx={{ mb: 2 }}>
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            </Box>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, mb: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rechnung</TableCell>
                    <TableCell>Kunde</TableCell>
                    <TableCell>Objekt</TableCell>
                    <TableCell>Leistungsempfänger</TableCell>
                    <TableCell>Rechnungsdatum</TableCell>
                    <TableCell>Fällig am</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Gesamt (Brutto)</TableCell>
                    <TableCell align="right">Offen</TableCell>
                    <TableCell align="center">Aktionen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        <Typography variant="body2" color="text.secondary">
                          Keine Rechnungen für die gewählten Filter gefunden.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice) => {
                      const outstanding = getOutstandingAmount(invoice);
                      const overdue = isOverdue(invoice);
                      const chip = statusChipProps[invoice.status] ?? {
                        color: 'default',
                        label: invoice.status
                      };
                      const currentStatus = pendingStatus[invoice.invoice_id] ?? invoice.status;

                      return (
                        <TableRow key={invoice.invoice_id} hover>
                          <TableCell>
                            <Stack spacing={0.5}>
                              <Typography variant="subtitle2">
                                {invoice.invoice_number}
                              </Typography>
                              {invoice.quote_id && (
                                <Typography variant="caption" color="text.secondary">
                                  Angebot #{invoice.quote_id}
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{invoice.account_name}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {invoice.property_name || '–'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {invoice.contact_name || '–'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {invoice.invoice_date
                              ? dayjs(invoice.invoice_date).format('DD.MM.YYYY')
                              : '–'}
                          </TableCell>
                          <TableCell>
                            <Stack spacing={0.5}>
                              <Typography color={overdue ? 'error' : 'inherit'}>
                                {invoice.due_date
                                  ? dayjs(invoice.due_date).format('DD.MM.YYYY')
                                  : '–'}
                              </Typography>
                              {overdue && outstanding > 0 && (
                                <Chip label="Überfällig" color="error" size="small" />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip size="small" color={chip.color} label={chip.label} />
                              <FormControl size="small" sx={{ minWidth: 160 }}>
                                <InputLabel id={`invoice-status-${invoice.invoice_id}`}>
                                  Status ändern
                                </InputLabel>
                                <Select
                                  labelId={`invoice-status-${invoice.invoice_id}`}
                                  label="Status ändern"
                                  value={currentStatus}
                                  onChange={(event) => handleStatusChange(invoice.invoice_id, event.target.value)}
                                  disabled={Boolean(pendingStatus[invoice.invoice_id])}
                                >
                                  {statusTransitions.map((status) => (
                                    <MenuItem key={status} value={status}>
                                      {statusChipProps[status]?.label || status}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(invoice.total_gross)}
                          </TableCell>
                          <TableCell align="right">
                            <Typography color={outstanding > 0 ? 'text.primary' : 'success.main'}>
                              {formatCurrency(outstanding)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <Tooltip title="Rechnung als PDF speichern">
                                <span>
                                  <IconButton size="small" onClick={() => handleOpenTemplateDialog(invoice)}>
                                    <PictureAsPdfIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Rechnung als PDF senden">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenTemplateDialog(invoice)}
                                    disabled={Boolean(sendingInvoices[invoice.invoice_id])}
                                  >
                                    <SendIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Verknüpftes Angebot öffnen">
                                <span>
                                  <IconButton
                                    component={invoice.quote_id ? RouterLink : 'button'}
                                    to={invoice.quote_id ? `/quotes/${invoice.quote_id}` : undefined}
                                    disabled={!invoice.quote_id}
                                    size="small"
                                  >
                                    <DescriptionIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <InvoiceTemplateDialog
        open={templateDialogOpen}
        onClose={() => setTemplateDialogOpen(false)}
        invoice={selectedInvoice}
        onDownload={handleDownloadInvoice}
        onSend={handleSendInvoice}
      />
    </Box>
  );
};

export default InvoiceList;
