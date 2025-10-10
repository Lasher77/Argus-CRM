import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  CircularProgress,
  Button,
  Stack
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EngineeringIcon from '@mui/icons-material/Engineering';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Link as RouterLink } from 'react-router-dom';
import ReportService from '../services/reportService';

const StatCard = styled(Card)(({ theme }) => ({
  height: '100%',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
}));

const IconWrapper = styled('div')(({ theme }) => ({
  width: 48,
  height: 48,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.contrastText,
  marginBottom: theme.spacing(2)
}));

const Dashboard = () => {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await ReportService.getDashboardSnapshot();
        setSnapshot(data);
      } catch (err) {
        console.error('Fehler beim Laden des Dashboards', err);
        setError('Dashboard-Daten konnten nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const stats = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    const minutesToday = snapshot.time_by_employee?.reduce((sum, entry) => sum + (entry.minutes || 0), 0) ?? 0;
    return [
      {
        title: 'Aufträge heute',
        value: snapshot.orders_today?.length ?? 0,
        icon: <ScheduleIcon fontSize="medium" />,
      },
      {
        title: 'Offene Aufträge',
        value: snapshot.weekly_overview?.open_orders ?? 0,
        icon: <EngineeringIcon fontSize="medium" />,
      },
      {
        title: 'Warnungen Lager',
        value: snapshot.material_alerts?.length ?? 0,
        icon: <WarningAmberIcon fontSize="medium" />,
      },
      {
        title: 'Teamminuten heute',
        value: minutesToday,
        icon: <TrendingUpIcon fontSize="medium" />,
        suffix: 'min'
      }
    ];
  }, [snapshot]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h5" color="error" gutterBottom>
          {error}
        </Typography>
      </Box>
    );
  }

  if (!snapshot) {
    return null;
  }

  const weeklyWorkload = Object.entries(snapshot.weekly_overview?.workload_per_day || {});

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Willkommen bei WerkAssist
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Alle Einsätze, Materialien und Finanzen auf einen Blick.
          </Typography>
        </Box>
        <Button component={RouterLink} to="/orders/new" variant="contained">
          Neuer Auftrag
        </Button>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <StatCard elevation={1}>
              <IconWrapper>{stat.icon}</IconWrapper>
              <Typography variant="overline" color="text.secondary">
                {stat.title}
              </Typography>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {stat.value} {stat.suffix}
              </Typography>
            </StatCard>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card elevation={1}>
            <CardHeader
              title="Heutige Einsätze"
              action={
                <Button component={RouterLink} to="/schedule" size="small">
                  Zur Planung
                </Button>
              }
            />
            <Divider />
            <CardContent>
              {snapshot.orders_today.length === 0 ? (
                <Typography color="text.secondary">Heute sind keine Außentermine geplant.</Typography>
              ) : (
                <List disablePadding>
                  {snapshot.orders_today.map((order) => (
                    <ListItem
                      key={order.order_id}
                      divider
                      alignItems="flex-start"
                      component={RouterLink}
                      to={`/orders/${order.order_id}`}
                      sx={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle1">{order.title}</Typography>
                            <Chip label={order.status} size="small" color={order.status === 'completed' ? 'success' : order.status === 'in_progress' ? 'primary' : 'default'} />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {order.planned_start ? new Date(order.planned_start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : 'Ohne Startzeit'} · {order.property_name || order.account_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {order.assignments.map((assignment) => assignment.employee_name).join(', ')}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card elevation={1}>
            <CardHeader title="Materialwarnungen" />
            <Divider />
            <CardContent>
              {snapshot.material_alerts.length === 0 ? (
                <Typography color="text.secondary">Alle Lagerbestände sind ausreichend.</Typography>
              ) : (
                <List disablePadding>
                  {snapshot.material_alerts.map((material) => (
                    <ListItem key={material.material_id} divider>
                      <ListItemText
                        primary={material.name}
                        secondary={`${material.stock} ${material.unit} auf Lager · Nachbestellen ab ${material.reorder_level} ${material.unit}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card elevation={1}>
            <CardHeader title="Wochenüberblick" />
            <Divider />
            <CardContent>
              {weeklyWorkload.length === 0 ? (
                <Typography color="text.secondary">Es liegen keine geplanten Einsätze vor.</Typography>
              ) : (
                <List disablePadding>
                  {weeklyWorkload.map(([day, data]) => (
                    <ListItem key={day} divider>
                      <ListItemText
                        primary={new Date(day).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {data.orders} Auftrag/⸚e · {Math.round((data.planned_minutes || 0) / 60)}h geplant · {Math.round((data.tracked_minutes || 0) / 60)}h erfasst
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(100, ((data.tracked_minutes || 0) / Math.max(1, data.planned_minutes || 1)) * 100)}
                              sx={{ height: 8, borderRadius: 1, mt: 1 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card elevation={1}>
            <CardHeader title="Umsatz (letzte Monate)" />
            <Divider />
            <CardContent>
              {snapshot.invoice_stats.length === 0 ? (
                <Typography color="text.secondary">Noch keine Rechnungsdaten vorhanden.</Typography>
              ) : (
                <List disablePadding>
                  {snapshot.invoice_stats.map((item) => (
                    <ListItem key={item.period} divider>
                      <ListItemText
                        primary={new Date(`${item.period}-01`).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                        secondary={`Brutto: ${item.total_gross.toFixed(2)} € · Offene Zahlungen: ${(item.total_gross - item.total_paid).toFixed(2)} €`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card elevation={1}>
            <CardHeader title="Teamleistung heute" />
            <Divider />
            <CardContent>
              {snapshot.time_by_employee.length === 0 ? (
                <Typography color="text.secondary">Noch keine Zeiterfassungen vorhanden.</Typography>
              ) : (
                <Grid container spacing={2}>
                  {snapshot.time_by_employee.map((entry) => (
                    <Grid item xs={12} md={4} key={entry.employee_id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1">{entry.employee_name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {entry.minutes} Minuten heute erfasst
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
