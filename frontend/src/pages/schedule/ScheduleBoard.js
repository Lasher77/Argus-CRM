import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Stack,
  Button,
  Chip,
  Divider,
  Tooltip,
  useMediaQuery,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import RefreshIcon from '@mui/icons-material/Refresh';
import ServiceOrderService from '../../services/serviceOrderService';
import { Link as RouterLink } from 'react-router-dom';

const DayColumn = styled(Card)(({ theme, isover }) => ({
  minHeight: 360,
  border: `1px dashed ${theme.palette.divider}`,
  backgroundColor: isover === 'true' ? theme.palette.action.hover : theme.palette.background.paper,
  transition: 'background-color 0.2s ease'
}));

const OrderCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  marginBottom: theme.spacing(1.5),
  cursor: 'grab',
  boxShadow: theme.shadows[1],
  '&:active': {
    cursor: 'grabbing'
  }
}));

const ScheduleBoard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [weekOffset, setWeekOffset] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedOrderId, setDraggedOrderId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  const startOfWeek = useMemo(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + weekOffset * 7);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }, [weekOffset]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + index);
      return day;
    });
  }, [startOfWeek]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const from = weekDays[0].toISOString().slice(0, 10);
      const to = weekDays[6].toISOString().slice(0, 10);
      const data = await ServiceOrderService.getServiceOrders({ from, to });
      setOrders(data);
    } catch (error) {
      console.error('Aufträge konnten nicht geladen werden', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (weekDays.length > 0) {
      loadOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset]);

  const handleWeekChange = (direction) => {
    setWeekOffset((prev) => prev + direction);
  };

  const ordersByDay = useMemo(() => {
    const grouped = {};
    weekDays.forEach((day) => {
      const key = day.toISOString().slice(0, 10);
      grouped[key] = [];
    });

    orders.forEach((order) => {
      const key = order.planned_date ? new Date(order.planned_date).toISOString().slice(0, 10) : null;
      if (key && grouped[key]) {
        grouped[key].push(order);
      }
    });

    Object.values(grouped).forEach((list) => list.sort((a, b) => (a.planned_start || '').localeCompare(b.planned_start || '')));

    return grouped;
  }, [orders, weekDays]);

  const assignmentsLabel = (order) => {
    if (!order.assignments || order.assignments.length === 0) {
      return 'Kein Team zugeordnet';
    }
    return order.assignments.map((assignment) => assignment.employee_name).join(', ');
  };

  const preparePayload = (order, overrides = {}) => ({
    title: order.title,
    description: order.description,
    account_id: order.account_id,
    property_id: order.property_id,
    service_recipient_contact_id: order.service_recipient_contact_id,
    invoice_account_id: order.invoice_account_id,
    status: order.status,
    priority: order.priority,
    planned_date: overrides.planned_date ?? order.planned_date,
    planned_start: overrides.planned_start ?? order.planned_start,
    planned_end: overrides.planned_end ?? order.planned_end,
    actual_start: order.actual_start,
    actual_end: order.actual_end,
    estimated_hours: order.estimated_hours,
    google_event_id: order.google_event_id,
    outlook_event_id: order.outlook_event_id,
    notes: order.notes,
    assignments: order.assignments?.map((assignment) => ({
      employee_id: assignment.employee_id,
      scheduled_date: overrides.planned_date ?? assignment.scheduled_date,
      scheduled_start: overrides.planned_start ?? assignment.scheduled_start,
      scheduled_end: overrides.planned_end ?? assignment.scheduled_end,
      is_primary: assignment.is_primary
    })) ?? []
  });

  const handleDrop = async (event, day) => {
    event.preventDefault();
    const orderId = Number(event.dataTransfer.getData('text/plain')) || draggedOrderId;
    setDropTarget(null);

    if (!orderId) {
      return;
    }

    const targetDate = day.toISOString().slice(0, 10);
    const order = orders.find((o) => o.order_id === orderId);
    if (!order) {
      return;
    }

    try {
      const payload = preparePayload(order, { planned_date: targetDate });
      await ServiceOrderService.updateServiceOrder(orderId, payload);
      await loadOrders();
    } catch (error) {
      console.error('Auftrag konnte nicht verschoben werden', error);
    }
  };

  const todayKey = new Date().toISOString().slice(0, 10);
  const todaysOrders = orders.filter((order) => order.planned_date && new Date(order.planned_date).toISOString().slice(0, 10) === todayKey);

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4">Termin- & Einsatzplanung</Typography>
          <Typography variant="body1" color="text.secondary">
            Ziehen Sie Aufträge per Drag & Drop auf den passenden Tag.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<ChevronLeftIcon />} onClick={() => handleWeekChange(-1)}>
            Vorherige Woche
          </Button>
          <Button variant="outlined" endIcon={<ChevronRightIcon />} onClick={() => handleWeekChange(1)}>
            Nächste Woche
          </Button>
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={loadOrders}>
            Aktualisieren
          </Button>
        </Stack>
      </Stack>

      {isMobile ? (
        <Card elevation={1} sx={{ mb: 3 }}>
          <CardHeader title="Heute auf der Baustelle" subheader={new Date().toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' })} />
          <Divider />
          <CardContent>
            {todaysOrders.length === 0 ? (
              <Typography color="text.secondary">Heute sind keine Einsätze geplant.</Typography>
            ) : (
              <List disablePadding>
                {todaysOrders.map((order) => (
                  <ListItem key={order.order_id} alignItems="flex-start" divider component={RouterLink} to={`/orders/${order.order_id}`} sx={{ color: 'inherit', textDecoration: 'none' }}>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1">
                          {order.title}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary">
                            {order.planned_start ? new Date(order.planned_start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : 'Ohne Startzeit'} · {order.property_name || order.account_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {assignmentsLabel(order)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Grid container spacing={3}>
        {weekDays.map((day) => {
          const key = day.toISOString().slice(0, 10);
          const dayOrders = ordersByDay[key] || [];
          const isToday = key === todayKey;

          return (
            <Grid item xs={12} sm={6} md={3} lg={12 / 7} key={key}>
              <DayColumn
                elevation={0}
                isover={(dropTarget === key).toString()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDropTarget(key);
                }}
                onDragLeave={() => setDropTarget(null)}
                onDrop={(event) => handleDrop(event, day)}
              >
                <CardHeader
                  title={day.toLocaleDateString('de-DE', { weekday: 'long' })}
                  subheader={day.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                  sx={{ backgroundColor: isToday ? theme.palette.action.selected : 'inherit' }}
                />
                <Divider />
                <CardContent sx={{ minHeight: 300 }}>
                  {loading ? (
                    <Typography color="text.secondary">Lade...</Typography>
                  ) : dayOrders.length === 0 ? (
                    <Typography color="text.secondary">Keine Aufträge geplant.</Typography>
                  ) : (
                    dayOrders.map((order) => (
                      <Tooltip key={order.order_id} title="Zum Auftrag" placement="top" arrow>
                        <OrderCard
                          component={RouterLink}
                          to={`/orders/${order.order_id}`}
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.setData('text/plain', String(order.order_id));
                            setDraggedOrderId(order.order_id);
                          }}
                          onDragEnd={() => {
                            setDraggedOrderId(null);
                            setDropTarget(null);
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {order.title}
                            </Typography>
                            <Chip size="small" label={order.priority} color={order.priority === 'high' ? 'error' : order.priority === 'medium' ? 'warning' : 'default'} />
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            {order.planned_start ? new Date(order.planned_start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : 'Ohne Startzeit'} · {order.property_name || order.account_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {assignmentsLabel(order)}
                          </Typography>
                        </OrderCard>
                      </Tooltip>
                    ))
                  )}
                </CardContent>
              </DayColumn>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default ScheduleBoard;
