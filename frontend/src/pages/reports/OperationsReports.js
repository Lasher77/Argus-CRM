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
  CircularProgress
} from '@mui/material';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import ReportService from '../../services/reportService';
import { Link as RouterLink } from 'react-router-dom';

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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Berichtswesen</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Zeitnachweise, Materialverbrauch und Umsatzentwicklung im Überblick.
      </Typography>

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
                          <Button size="small" component={RouterLink} to={`/orders/${order.order_id}`}>Details</Button>
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
                        {entry.employee_name}: {dayjs(entry.start_time).format('HH:mm')} – {entry.end_time ? dayjs(entry.end_time).format('HH:mm') : '--:--'} ({entry.duration_minutes || 0} min)
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
                  <Typography variant="body2">Summe Arbeitszeit: {(dailyReport.totals.minutes / 60).toFixed(2)} h · Gefahrene Kilometer: {dailyReport.totals.distance_km?.toFixed(1)} km</Typography>
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
                        {dayjs(item.day).format('DD.MM.YYYY')}: {(item.minutes / 60).toFixed(2)} h · {item.distance?.toFixed(1) || 0} km
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
                          <Typography variant="subtitle2">{dayjs(`${year}-${item.month}-01`).format('MMMM')}</Typography>
                          <Typography variant="h6">{item.total_gross?.toFixed(2)} €</Typography>
                          <Typography variant="caption" color="text.secondary">Netto: {item.total_net?.toFixed(2)} € · Bezahlt: {item.total_paid?.toFixed(2)} €</Typography>
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
    </Box>
  );
};

export default OperationsReports;
