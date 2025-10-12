import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import EmployeeService from '../../services/employeeService';

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

const DropZone = styled(Box)(({ theme, isover }) => ({
  minHeight: 120,
  borderRadius: theme.shape.borderRadius,
  border: `1px dashed ${theme.palette.divider}`,
  padding: theme.spacing(1.5),
  backgroundColor: isover === 'true' ? theme.palette.action.hover : theme.palette.background.default,
  transition: 'background-color 0.2s ease',
  display: 'flex',
  flexDirection: 'column'
}));

const ScheduleBoard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [weekOffset, setWeekOffset] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);

  const formatDayKey = useCallback((value) => {
    if (!value) {
      return null;
    }
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    if (Number.isNaN(date.valueOf())) {
      return null;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const getEmployeeKey = (employeeId) => (employeeId ? `employee-${employeeId}` : 'employee-unassigned');

  const parseEmployeeKeyValue = (employeeKey) => {
    if (!employeeKey || employeeKey === 'employee-unassigned') {
      return null;
    }
    const parsed = Number(employeeKey.replace('employee-', ''));
    return Number.isNaN(parsed) ? null : parsed;
  };

  const createDroppableId = (dayKey, employeeKey) => `cell|${dayKey}|${employeeKey}`;

  const parseDroppableId = (droppableId) => {
    if (!droppableId) {
      return null;
    }
    const parts = droppableId.split('|');
    if (parts.length !== 3) {
      return null;
    }
    return { dayKey: parts[1], employeeKey: parts[2] };
  };

  const mergeDateTime = (value, dayKey) => {
    if (!value || !dayKey) {
      return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.valueOf())) {
      return null;
    }
    const [year, month, day] = dayKey.split('-').map(Number);
    if (!year || !month || !day) {
      return value;
    }
    date.setFullYear(year, month - 1, day);
    return date.toISOString();
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find((item) => item.employee_id === employeeId);
    if (!employee) {
      return '';
    }
    return employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
  };

  const getPrimaryAssignmentForDay = useCallback((order, dayKey) => {
    if (!order.assignments || order.assignments.length === 0) {
      return null;
    }
    const matchesDay = (assignment) => {
      if (!assignment.scheduled_date) {
        return true;
      }
      return formatDayKey(assignment.scheduled_date) === dayKey;
    };

    const primary = order.assignments.find((assignment) => assignment.is_primary && matchesDay(assignment));
    if (primary) {
      return primary;
    }

    const fallback = order.assignments.find(matchesDay);
    return fallback || order.assignments[0];
  }, [formatDayKey]);

  const buildAssignmentsForMove = (order, employeeId, dayKey) => {
    const baseAssignments = order.assignments
      ? order.assignments.map((assignment) => ({ ...assignment }))
      : [];

    const normalizedAssignments = baseAssignments.map((assignment) => ({
      ...assignment,
      scheduled_date: dayKey,
      scheduled_start: mergeDateTime(assignment.scheduled_start || order.planned_start, dayKey),
      scheduled_end: mergeDateTime(assignment.scheduled_end || order.planned_end, dayKey)
    }));

    if (employeeId) {
      let hasEmployee = false;
      const updatedAssignments = normalizedAssignments.map((assignment) => {
        if (assignment.employee_id === employeeId) {
          hasEmployee = true;
          return {
            ...assignment,
            is_primary: true
          };
        }
        return {
          ...assignment,
          is_primary: false
        };
      });

      if (!hasEmployee) {
        updatedAssignments.push({
          employee_id: employeeId,
          employee_name: getEmployeeName(employeeId),
          scheduled_date: dayKey,
          scheduled_start: mergeDateTime(order.planned_start, dayKey),
          scheduled_end: mergeDateTime(order.planned_end, dayKey),
          is_primary: true
        });
      }

      return updatedAssignments;
    }

    return normalizedAssignments.map((assignment) => ({
      ...assignment,
      is_primary: false
    }));
  };

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

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await EmployeeService.getEmployees();
        setEmployees(data);
      } catch (error) {
        console.error('Mitarbeitende konnten nicht geladen werden', error);
      }
    };

    loadEmployees();
  }, []);

  const handleWeekChange = (direction) => {
    setWeekOffset((prev) => prev + direction);
  };

  const employeeColumns = useMemo(() => {
    const sortedEmployees = [...employees].sort((a, b) => {
      const aWorker = a.is_field_worker ? 1 : 0;
      const bWorker = b.is_field_worker ? 1 : 0;
      return bWorker - aWorker;
    });

    const normalizeName = (employee) =>
      employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim();

    return [
      { employee_id: null, full_name: 'Ohne Zuordnung' },
      ...sortedEmployees.map((employee) => ({ ...employee, full_name: normalizeName(employee) }))
    ];
  }, [employees]);

  const boardCells = useMemo(() => {
    if (!weekDays.length) {
      return {};
    }

    const cells = {};
    const dayKeys = weekDays.map((day) => formatDayKey(day));

    dayKeys.forEach((dayKey) => {
      employeeColumns.forEach((employee) => {
        const droppableId = createDroppableId(dayKey, getEmployeeKey(employee.employee_id));
        cells[droppableId] = [];
      });
    });

    orders.forEach((order) => {
      const dayKey = formatDayKey(order.planned_date);
      if (!dayKey || !dayKeys.includes(dayKey)) {
        return;
      }
      const primary = getPrimaryAssignmentForDay(order, dayKey);
      const employeeKey = getEmployeeKey(primary?.employee_id ?? null);
      const droppableId = createDroppableId(dayKey, employeeKey);
      if (!cells[droppableId]) {
        cells[droppableId] = [];
      }
      cells[droppableId].push(order);
    });

    Object.values(cells).forEach((list) =>
      list.sort((a, b) => (a.planned_start || '').localeCompare(b.planned_start || ''))
    );

    return cells;
  }, [orders, weekDays, employeeColumns, getPrimaryAssignmentForDay, formatDayKey]);

  const assignmentsLabel = (order) => {
    if (!order.assignments || order.assignments.length === 0) {
      return 'Kein Team zugeordnet';
    }
    return order.assignments.map((assignment) => assignment.employee_name).join(', ');
  };

  const preparePayload = (order, overrides = {}) => {
    const assignments = overrides.assignments ?? order.assignments ?? [];

    return {
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
      assignments: assignments.map((assignment) => ({
        employee_id: assignment.employee_id,
        scheduled_date: assignment.scheduled_date ?? overrides.planned_date ?? order.planned_date,
        scheduled_start:
          assignment.scheduled_start ?? overrides.planned_start ?? order.planned_start,
        scheduled_end: assignment.scheduled_end ?? overrides.planned_end ?? order.planned_end,
        is_primary: Boolean(assignment.is_primary)
      }))
    };
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const orderId = Number(draggableId.replace('order-', ''));
    if (!orderId) {
      return;
    }

    const order = orders.find((item) => item.order_id === orderId);
    if (!order) {
      return;
    }

    const destinationMeta = parseDroppableId(destination.droppableId);
    if (!destinationMeta) {
      return;
    }

    const targetDayKey = destinationMeta.dayKey;
    const targetEmployeeId = parseEmployeeKeyValue(destinationMeta.employeeKey);

    const newPlannedStart = mergeDateTime(order.planned_start, targetDayKey) || order.planned_start;
    const newPlannedEnd = mergeDateTime(order.planned_end, targetDayKey) || order.planned_end;
    const updatedAssignments = buildAssignmentsForMove(order, targetEmployeeId, targetDayKey);

    const optimisticOrder = {
      ...order,
      planned_date: targetDayKey,
      planned_start: newPlannedStart,
      planned_end: newPlannedEnd,
      assignments: updatedAssignments
    };

    setOrders((prev) =>
      prev.map((item) => (item.order_id === orderId ? optimisticOrder : item))
    );

    try {
      const payload = preparePayload(optimisticOrder, {
        planned_date: targetDayKey,
        planned_start: newPlannedStart,
        planned_end: newPlannedEnd,
        assignments: updatedAssignments
      });
      await ServiceOrderService.updateServiceOrder(orderId, payload);
      await loadOrders();
    } catch (error) {
      console.error('Auftrag konnte nicht verschoben werden', error);
      await loadOrders();
    }
  };

  const todayKey = formatDayKey(new Date());
  const todaysOrders = orders.filter(
    (order) => order.planned_date && formatDayKey(order.planned_date) === todayKey
  );

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4">Termin- & Einsatzplanung</Typography>
          <Typography variant="body1" color="text.secondary">
            Ziehen Sie Aufträge per Drag & Drop auf den passenden Tag und die richtige
            Teamspalte.
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

      <DragDropContext onDragEnd={handleDragEnd}>
        <Grid container spacing={3}>
          {weekDays.map((day) => {
            const dayKey = formatDayKey(day);
            const isToday = dayKey === todayKey;

            return (
              <Grid item xs={12} sm={6} md={3} lg={12 / 7} key={dayKey}>
                <Card elevation={1} sx={{ height: '100%' }}>
                  <CardHeader
                    title={day.toLocaleDateString('de-DE', { weekday: 'long' })}
                    subheader={day.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                    sx={{ backgroundColor: isToday ? theme.palette.action.selected : 'inherit' }}
                  />
                  <Divider />
                  <CardContent sx={{ minHeight: 320 }}>
                    {employeeColumns.map((employee, index) => {
                      const employeeKey = getEmployeeKey(employee.employee_id);
                      const droppableId = createDroppableId(dayKey, employeeKey);
                      const cellOrders = boardCells[droppableId] || [];

                      return (
                        <Box key={`${droppableId}`} sx={{ mb: index === employeeColumns.length - 1 ? 0 : 2 }}>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                            {employee.employee_id ? employee.full_name : 'Ohne Zuordnung'}
                          </Typography>
                          <Droppable droppableId={droppableId} type="orders">
                            {(provided, snapshot) => (
                              <DropZone
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                isover={snapshot.isDraggingOver.toString()}
                              >
                                {loading ? (
                                  <Typography color="text.secondary">Lade...</Typography>
                                ) : cellOrders.length === 0 ? (
                                  <Typography variant="body2" color="text.secondary">
                                    Keine Aufträge
                                  </Typography>
                                ) : (
                                  cellOrders.map((order, orderIndex) => (
                                    <Draggable
                                      key={`order-${order.order_id}`}
                                      draggableId={`order-${order.order_id}`}
                                      index={orderIndex}
                                    >
                                      {(dragProvided, dragSnapshot) => (
                                        <Tooltip key={order.order_id} title="Zum Auftrag" placement="top" arrow>
                                          <OrderCard
                                            ref={dragProvided.innerRef}
                                            {...dragProvided.draggableProps}
                                            {...dragProvided.dragHandleProps}
                                            component={RouterLink}
                                            to={`/orders/${order.order_id}`}
                                            sx={{
                                              mb: 1.5,
                                              boxShadow: dragSnapshot.isDragging
                                                ? theme.shadows[4]
                                                : theme.shadows[1]
                                            }}
                                            style={dragProvided.draggableProps.style}
                                          >
                                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                {order.title}
                                              </Typography>
                                              <Chip
                                                size="small"
                                                label={order.priority}
                                                color={
                                                  order.priority === 'high'
                                                    ? 'error'
                                                    : order.priority === 'medium'
                                                    ? 'warning'
                                                    : 'default'
                                                }
                                              />
                                            </Stack>
                                            <Typography variant="body2" color="text.secondary">
                                              {order.planned_start
                                                ? new Date(order.planned_start).toLocaleTimeString('de-DE', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                  })
                                                : 'Ohne Startzeit'}{' '}
                                              · {order.property_name || order.account_name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                              {assignmentsLabel(order)}
                                            </Typography>
                                          </OrderCard>
                                        </Tooltip>
                                      )}
                                    </Draggable>
                                  ))
                                )}
                                {provided.placeholder}
                              </DropZone>
                            )}
                          </Droppable>
                        </Box>
                      );
                    })}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </DragDropContext>
    </Box>
  );
};

export default ScheduleBoard;
