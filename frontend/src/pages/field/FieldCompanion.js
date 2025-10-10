import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Button,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RefreshIcon from '@mui/icons-material/Refresh';
import ServiceOrderService from '../../services/serviceOrderService';
import EmployeeService from '../../services/employeeService';
import dayjs from 'dayjs';
import { Link as RouterLink } from 'react-router-dom';

const FieldCompanion = () => {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [orders, setOrders] = useState([]);
  const todayKey = dayjs().format('YYYY-MM-DD');

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeeData, orderData] = await Promise.all([
        EmployeeService.getEmployees(),
        ServiceOrderService.getServiceOrders({ from: todayKey, to: todayKey })
      ]);
      setEmployees(employeeData.filter((employee) => employee.is_field_worker));
      setOrders(orderData);
    } catch (error) {
      console.error('Feld-Daten konnten nicht geladen werden', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const assignmentsByEmployee = useMemo(() => {
    const map = {};
    employees.forEach((employee) => {
      map[employee.employee_id] = [];
    });
    orders.forEach((order) => {
      order.assignments?.forEach((assignment) => {
        if (map[assignment.employee_id]) {
          map[assignment.employee_id].push(order);
        }
      });
    });
    return map;
  }, [employees, orders]);

  const handleCheckIn = async (orderId, employeeId) => {
    try {
      await ServiceOrderService.addTimeEntry(orderId, {
        employee_id: employeeId,
        start_time: new Date().toISOString(),
        source: 'gps',
        notes: 'Automatischer Check-In'
      });
      await loadData();
    } catch (error) {
      console.error('Check-in fehlgeschlagen', error);
    }
  };

  const handleCheckOut = async (entry) => {
    try {
      await ServiceOrderService.updateTimeEntry(entry.time_entry_id, {
        employee_id: entry.employee_id,
        start_time: entry.start_time,
        end_time: new Date().toISOString(),
        notes: entry.notes,
        source: entry.source,
        distance_km: entry.distance_km
      });
      await loadData();
    } catch (error) {
      console.error('Check-out fehlgeschlagen', error);
    }
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
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4">Arbeitszettel – Mobiler Begleiter</Typography>
          <Typography variant="body1" color="text.secondary">
            Heute, {dayjs().format('dddd, DD.MM.YYYY')} – GPS-Check-ins und Materialbuchungen im Überblick.
          </Typography>
        </Box>
        <Button startIcon={<RefreshIcon />} onClick={loadData}>Aktualisieren</Button>
      </Stack>

      {employees.length === 0 ? (
        <Typography color="text.secondary">Keine Außendienstmitarbeitenden hinterlegt.</Typography>
      ) : (
        employees.map((employee) => {
          const employeeOrders = assignmentsByEmployee[employee.employee_id] || [];
          return (
            <Accordion key={employee.employee_id} defaultExpanded sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                  <Typography variant="h6">{employee.full_name || `${employee.first_name} ${employee.last_name}`}</Typography>
                  <Chip label={`${employeeOrders.length} Auftrag/⸚e`} color="primary" size="small" />
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                {employeeOrders.length === 0 ? (
                  <Typography color="text.secondary">Heute keine Einsätze geplant.</Typography>
                ) : (
                  employeeOrders.map((order) => {
                    const assignment = order.assignments?.find((a) => a.employee_id === employee.employee_id);
                    const activeEntry = order.time_entries?.find((entry) => entry.employee_id === employee.employee_id && !entry.end_time);
                    return (
                      <Box key={order.order_id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{order.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {order.property_name || order.account_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {order.planned_start ? dayjs(order.planned_start).format('HH:mm') : '--:--'} – {order.planned_end ? dayjs(order.planned_end).format('HH:mm') : '--:--'}
                        </Typography>
                        {assignment?.scheduled_start && (
                          <Typography variant="body2" color="text.secondary">
                            Check-In Fenster: {dayjs(assignment.scheduled_start).format('HH:mm')}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                          {!activeEntry ? (
                            <Button
                              variant="contained"
                              startIcon={<PlayArrowIcon />}
                              onClick={() => handleCheckIn(order.order_id, employee.employee_id)}
                            >
                              Check-In
                            </Button>
                          ) : (
                            <Button
                              color="secondary"
                              variant="contained"
                              startIcon={<StopIcon />}
                              onClick={() => handleCheckOut(activeEntry)}
                            >
                              Check-Out
                            </Button>
                          )}
                          <Tooltip title="Arbeitszettel öffnen">
                            <IconButton component={RouterLink} to={`/orders/${order.order_id}`}>
                              <ExpandMoreIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                        {activeEntry && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Gestartet um {dayjs(activeEntry.start_time).format('HH:mm')} – läuft...
                          </Typography>
                        )}
                      </Box>
                    );
                  })
                )}
              </AccordionDetails>
            </Accordion>
          );
        })
      )}
    </Box>
  );
};

export default FieldCompanion;
