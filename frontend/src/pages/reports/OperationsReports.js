import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Button,
  Divider,
  Chip,
  CircularProgress,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import ReportService from '../../services/reportService';
import { Link as RouterLink } from 'react-router-dom';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import AccountService from '../../services/accountService';
import PropertyService from '../../services/propertyService';
import { utils as XLSXUtils, writeFile as writeXLSX } from 'xlsx';

dayjs.extend(isoWeek);

const OperationsReports = () => {
  const today = dayjs();
  const [dailyDate, setDailyDate] = useState(today.format('YYYY-MM-DD'));
  const [dailyReport, setDailyReport] = useState(null);
  const [weekStart, setWeekStart] = useState(today.startOf('isoWeek').format('YYYY-MM-DD'));
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [year, setYear] = useState(today.year());
  const [revenueReport, setRevenueReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serviceReport, setServiceReport] = useState(null);
  const [serviceReportLoading, setServiceReportLoading] = useState(true);
  const [filterFrom, setFilterFrom] = useState(today.startOf('month').format('YYYY-MM-DD'));
  const [filterTo, setFilterTo] = useState(today.endOf('month').format('YYYY-MM-DD'));
  const [filterAccountValue, setFilterAccountValue] = useState(null);
  const [filterAccountInput, setFilterAccountInput] = useState('');
  const [filterAccountOptions, setFilterAccountOptions] = useState([]);
  const [filterAccountLoading, setFilterAccountLoading] = useState(false);
  const [filterPropertyValue, setFilterPropertyValue] = useState(null);
  const [filterPropertyInput, setFilterPropertyInput] = useState('');
  const [filterPropertyOptions, setFilterPropertyOptions] = useState([]);
  const [filterPropertyLoading, setFilterPropertyLoading] = useState(false);

  const ensureOptionIncluded = (options, option, key) => {
    if (!option) {
      return options;
    }
    const exists = options.some((item) => item[key] === option[key]);
    return exists ? options : [...options, option];
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const [daily, weekly, revenue] = await Promise.all([
        ReportService.getDailyReport(dailyDate),
        ReportService.getWeeklyReport(weekStart, dayjs(weekStart).add(6, 'day').format('YYYY-MM-DD')),
        ReportService.getRevenueByMonth(year)
      ]);
      setDailyReport(daily);
      setWeeklyReport(weekly);
      setRevenueReport(revenue);
    } catch (error) {
      console.error('Berichte konnten nicht geladen werden', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyDate, weekStart, year]);

  useEffect(() => {
    let active = true;
    const handler = setTimeout(async () => {
      try {
        setFilterAccountLoading(true);
        const response = await AccountService.searchAccounts(filterAccountInput, { limit: 20 });
        if (!active) {
          return;
        }
        const data = response.data || [];
        setFilterAccountOptions(ensureOptionIncluded(data, filterAccountValue, 'account_id'));
      } catch (error) {
        console.error('Kunden konnten nicht geladen werden', error);
      } finally {
        if (active) {
          setFilterAccountLoading(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(handler);
    };
  }, [filterAccountInput, filterAccountValue]);

  useEffect(() => {
    if (!filterAccountValue?.account_id) {
      setFilterPropertyOptions([]);
      setFilterPropertyValue(null);
      return;
    }

    let active = true;
    const handler = setTimeout(async () => {
      try {
        setFilterPropertyLoading(true);
        const response = await PropertyService.searchProperties(filterPropertyInput, {
          accountId: filterAccountValue.account_id,
          limit: 25
        });
        if (!active) {
          return;
        }
        const data = response.data || [];
        setFilterPropertyOptions(ensureOptionIncluded(data, filterPropertyValue, 'property_id'));
      } catch (error) {
        console.error('Objekte konnten nicht geladen werden', error);
      } finally {
        if (active) {
          setFilterPropertyLoading(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(handler);
    };
  }, [filterPropertyInput, filterAccountValue, filterPropertyValue]);

  useEffect(() => {
    const fetchServiceReport = async () => {
      try {
        setServiceReportLoading(true);
        const data = await ReportService.getServiceOrderReport({
          from: filterFrom || undefined,
          to: filterTo || undefined,
          accountId: filterAccountValue?.account_id,
          propertyId: filterPropertyValue?.property_id
        });
        setServiceReport(data);
      } catch (error) {
        console.error('Auftragsreport konnte nicht geladen werden', error);
      } finally {
        setServiceReportLoading(false);
      }
    };

    fetchServiceReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterFrom, filterTo, filterAccountValue?.account_id, filterPropertyValue?.property_id]);

  const handleAccountChange = (_, value) => {
    setFilterAccountValue(value);
    setFilterAccountOptions((prev) => ensureOptionIncluded(prev, value, 'account_id'));
    setFilterAccountInput(value ? value.name : '');
    if (!value) {
      setFilterPropertyValue(null);
      setFilterPropertyOptions([]);
      setFilterPropertyInput('');
    }
  };

  const handlePropertyChange = (_, value) => {
    setFilterPropertyValue(value);
    setFilterPropertyOptions((prev) => ensureOptionIncluded(prev, value, 'property_id'));
    setFilterPropertyInput(value ? value.name : '');
  };

  const buildReportRows = () => {
    if (!serviceReport?.orders?.length) {
      return [];
    }

    return serviceReport.orders.map((order) => ({
      Datum: order.planned_date ? dayjs(order.planned_date).format('DD.MM.YYYY') : '',
      Auftrag: order.title,
      Kunde: order.account_name,
      Objekt: order.property_name || '',
      Status: order.status,
      Priorität: order.priority,
      'Geplante Stunden': order.estimated_hours ?? '',
      'Gebuchte Stunden': ((order.total_tracked_minutes ?? 0) / 60).toFixed(2),
      Team: order.assignments?.map((assignment) => assignment.employee_name).join(', ') || ''
    }));
  };

  const handleExportCsv = () => {
    const rows = buildReportRows();
    if (!rows.length) {
      return;
    }

    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(';'),
      ...rows.map((row) =>
        headers
          .map((header) => {
            const cell = row[header] ?? '';
            return `"${String(cell).replace(/"/g, '""')}"`;
          })
          .join(';')
      )
    ];

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `auftragsreport_${filterFrom || 'alle'}_${filterTo || 'alle'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportXlsx = () => {
    const rows = buildReportRows();
    if (!rows.length) {
      return;
    }

    const worksheet = XLSXUtils.json_to_sheet(rows);
    const workbook = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(workbook, worksheet, 'Aufträge');
    writeXLSX(workbook, `auftragsreport_${filterFrom || 'alle'}_${filterTo || 'alle'}.xlsx`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Berichtswesen
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Zeitnachweise, Materialverbrauch und Umsatzentwicklung im Überblick.
      </Typography>

      <Stack spacing={3}>
        <Card elevation={1}>
          <CardContent>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems={{ xs: 'flex-start', md: 'center' }}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h6">Auftragsauswertung</Typography>
                <Typography variant="body2" color="text.secondary">
                  Filtern Sie Ihre Aufträge nach Zeitraum, Kunde und Objekt und exportieren Sie die
                  Ergebnisse für die Büroauswertung.
                </Typography>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadOutlinedIcon />}
                  onClick={handleExportCsv}
                  disabled={!serviceReport?.orders?.length}
                >
                  CSV Export
                </Button>
                <Button
                  variant="contained"
                  startIcon={<FileDownloadOutlinedIcon />}
                  onClick={handleExportXlsx}
                  disabled={!serviceReport?.orders?.length}
                >
                  XLSX Export
                </Button>
              </Stack>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  type="date"
                  label="Zeitraum von"
                  value={filterFrom}
                  onChange={(event) => setFilterFrom(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  type="date"
                  label="Zeitraum bis"
                  value={filterTo}
                  onChange={(event) => setFilterTo(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Autocomplete
                  options={filterAccountOptions}
                  value={filterAccountValue}
                  inputValue={filterAccountInput}
                  onChange={handleAccountChange}
                  onInputChange={(_, newValue) => setFilterAccountInput(newValue)}
                  loading={filterAccountLoading}
                  getOptionLabel={(option) => option?.name || ''}
                  isOptionEqualToValue={(option, value) => option?.account_id === value?.account_id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Kunde"
                      fullWidth
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {filterAccountLoading ? (
                              <CircularProgress color="inherit" size={18} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Autocomplete
                  options={filterPropertyOptions}
                  value={filterPropertyValue}
                  inputValue={filterPropertyInput}
                  onChange={handlePropertyChange}
                  onInputChange={(_, newValue) => setFilterPropertyInput(newValue)}
                  loading={filterPropertyLoading}
                  disabled={!filterAccountValue?.account_id}
                  getOptionLabel={(option) => option?.name || ''}
                  isOptionEqualToValue={(option, value) => option?.property_id === value?.property_id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Objekt"
                      fullWidth
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {filterPropertyLoading ? (
                              <CircularProgress color="inherit" size={18} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>
            {serviceReportLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : serviceReport?.orders?.length ? (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {serviceReport?.totals?.orders ?? 0} Aufträge · Geplant:{' '}
                  {Number(serviceReport?.totals?.estimated_hours ?? 0).toFixed(2)} h · Gebucht:{' '}
                  {Number(serviceReport?.totals?.tracked_hours ?? 0).toFixed(2)} h
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Datum</TableCell>
                      <TableCell>Auftrag</TableCell>
                      <TableCell>Kunde</TableCell>
                      <TableCell>Objekt</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Team</TableCell>
                      <TableCell align="right">Soll (h)</TableCell>
                      <TableCell align="right">Ist (h)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {serviceReport.orders.map((order) => (
                      <TableRow key={order.order_id} hover>
                        <TableCell>
                          {order.planned_date ? dayjs(order.planned_date).format('DD.MM.YYYY') : '-'}
                        </TableCell>
                        <TableCell>
                          <Button component={RouterLink} to={`/orders/${order.order_id}`} size="small">
                            {order.title}
                          </Button>
                        </TableCell>
                        <TableCell>{order.account_name}</TableCell>
                        <TableCell>{order.property_name || '—'}</TableCell>
                        <TableCell>{order.status}</TableCell>
                        <TableCell>
                          {order.assignments?.map((assignment) => assignment.employee_name).join(', ') || '—'}
                        </TableCell>
                        <TableCell align="right">{order.estimated_hours ?? '0'}</TableCell>
                        <TableCell align="right">
                          {((order.total_tracked_minutes ?? 0) / 60).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <Typography color="text.secondary">
                Keine Aufträge im ausgewählten Zeitraum gefunden.
              </Typography>
            )}
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card elevation={1}>
              <CardContent>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
                  <Typography variant="h6">Tagesbericht</Typography>
                  <TextField
                    type="date"
                    label="Datum"
                    value={dailyDate}
                    onChange={(event) => setDailyDate(event.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
                <Divider sx={{ my: 2 }} />
                {dailyReport ? (
                  <Stack spacing={2}>
                    <Typography variant="subtitle2">Aufträge</Typography>
                    {dailyReport.orders.length === 0 ? (
                      <Typography color="text.secondary">Keine Einsätze an diesem Tag.</Typography>
                    ) : (
                      dailyReport.orders.map((order) => (
                        <Box key={order.order_id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
                          <Typography variant="subtitle1">{order.title}</Typography>
                          <Typography variant="body2" color="text.secondary">{order.account_name}</Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Chip size="small" label={`${order.total_tracked_minutes} min`} />
                            <Button size="small" component={RouterLink} to={`/orders/${order.order_id}`}>
                              Details
                            </Button>
                          </Stack>
                        </Box>
                      ))
                    )}
                    <Divider />
                    <Typography variant="subtitle2">Zeiterfassung</Typography>
                    {dailyReport.time_entries.length === 0 ? (
                      <Typography color="text.secondary">Keine Zeiten gebucht.</Typography>
                    ) : (
                      dailyReport.time_entries.map((entry) => (
                        <Typography key={entry.time_entry_id} variant="body2" color="text.secondary">
                          {entry.employee_name}: {dayjs(entry.start_time).format('HH:mm')} –{' '}
                          {entry.end_time ? dayjs(entry.end_time).format('HH:mm') : '--:--'} ({entry.duration_minutes || 0}{' '}
                          min)
                        </Typography>
                      ))
                    )}
                    <Divider />
                    <Typography variant="subtitle2">Material</Typography>
                    {dailyReport.material_usage.length === 0 ? (
                      <Typography color="text.secondary">Kein Materialverbrauch erfasst.</Typography>
                    ) : (
                      dailyReport.material_usage.map((usage) => (
                        <Typography key={usage.usage_id} variant="body2" color="text.secondary">
                          {usage.material_name}: {usage.quantity} {usage.unit} ({usage.order_title})
                        </Typography>
                      ))
                    )}
                    <Divider />
                    <Typography variant="body2">
                      Summe Arbeitszeit: {(dailyReport.totals.minutes / 60).toFixed(2)} h · Gefahrene Kilometer:
                      {dailyReport.totals.distance_km?.toFixed(1)} km
                    </Typography>
                  </Stack>
                ) : (
                  <Typography color="text.secondary">Keine Daten.</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={1}>
              <CardContent>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
                  <Typography variant="h6">Wochenreport</Typography>
                  <TextField
                    type="date"
                    label="Kalenderwoche (Start)"
                    value={weekStart}
                    onChange={(event) => setWeekStart(event.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
                <Divider sx={{ my: 2 }} />
                {weeklyReport ? (
                  <Stack spacing={2}>
                    <Typography variant="subtitle2">Zeitsummen</Typography>
                    {weeklyReport.time_summary.length === 0 ? (
                      <Typography color="text.secondary">Keine Zeiterfassungen.</Typography>
                    ) : (
                      weeklyReport.time_summary.map((item) => (
                        <Typography key={item.day} variant="body2" color="text.secondary">
                          {dayjs(item.day).format('DD.MM.YYYY')}: {(item.minutes / 60).toFixed(2)} h ·{' '}
                          {item.distance?.toFixed(1) || 0} km
                        </Typography>
                      ))
                    )}
                    <Divider />
                    <Typography variant="subtitle2">Umsatz nach Kunde</Typography>
                    {weeklyReport.revenue_by_account.length === 0 ? (
                      <Typography color="text.secondary">Keine Rechnungen in dieser Woche.</Typography>
                    ) : (
                      weeklyReport.revenue_by_account.map((item) => (
                        <Typography key={item.account_id} variant="body2" color="text.secondary">
                          Kunde #{item.account_id}: {item.total_gross.toFixed(2)} €
                        </Typography>
                      ))
                    )}
                  </Stack>
                ) : (
                  <Typography color="text.secondary">Keine Daten.</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card elevation={1}>
              <CardContent>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
                  <Typography variant="h6">Umsatz pro Monat</Typography>
                  <TextField
                    type="number"
                    label="Jahr"
                    value={year}
                    onChange={(event) => setYear(Number(event.target.value))}
                  />
                </Stack>
                <Divider sx={{ my: 2 }} />
                {revenueReport?.data?.length ? (
                  <Grid container spacing={2}>
                    {revenueReport.data.map((item) => (
                      <Grid item xs={12} sm={6} md={3} key={item.month}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle2">
                              {dayjs(`${year}-${item.month}-01`).format('MMMM')}
                            </Typography>
                            <Typography variant="h6">{item.total_gross?.toFixed(2)} €</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Netto: {item.total_net?.toFixed(2)} € · Bezahlt: {item.total_paid?.toFixed(2)} €
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography color="text.secondary">Keine Rechnungsdaten für dieses Jahr vorhanden.</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
};

export default OperationsReports;
