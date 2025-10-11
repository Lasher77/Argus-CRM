import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  CircularProgress,
  Paper,
  Alert,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StopIcon from '@mui/icons-material/Stop';
import RefreshIcon from '@mui/icons-material/Refresh';
import NavigationIcon from '@mui/icons-material/Navigation';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import ServiceOrderService from '../../services/serviceOrderService';
import EmployeeService from '../../services/employeeService';
import dayjs from 'dayjs';
import { Link as RouterLink } from 'react-router-dom';

const GEOLOCATION_TIMEOUT = 10000;
const CHECK_IN_RADIUS_METERS = 50;

const formatDuration = (totalSeconds) => {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds]
    .map((value) => value.toString().padStart(2, '0'))
    .join(':');
};

const getNavigationLinks = (order) => {
  const label = order?.property_name || order?.account_name || 'Einsatzort';
  const addressParts = [order?.property_address, order?.property_postal_code, order?.property_city]
    .filter(Boolean)
    .join(' ');
  const encodedLabel = encodeURIComponent(label);
  const encodedQuery = encodeURIComponent(`${label} ${addressParts}`.trim());
  const hasCoordinates =
    typeof order?.property_latitude === 'number' && typeof order?.property_longitude === 'number';
  const latLng = hasCoordinates
    ? `${order.property_latitude},${order.property_longitude}`
    : null;

  return {
    apple: hasCoordinates
      ? `maps://maps.apple.com/?ll=${latLng}&q=${encodedLabel}`
      : `maps://maps.apple.com/?q=${encodedQuery || encodedLabel}`,
    google: hasCoordinates
      ? `https://maps.google.com/?q=${latLng}`
      : `https://maps.google.com/?q=${encodedQuery || encodedLabel}`
  };
};

const FieldCompanion = () => {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedContext, setSelectedContext] = useState(null);
  const [checkInStatus, setCheckInStatus] = useState({});
  const [actionLoading, setActionLoading] = useState({ checkIn: false, checkOut: false });
  const [geoError, setGeoError] = useState(null);
  const [timerTick, setTimerTick] = useState(0);

  const requestLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('GEOLOCATION_UNSUPPORTED'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: GEOLOCATION_TIMEOUT,
          maximumAge: 0
        }
      );
    });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [employeeData, orderData] = await Promise.all([
        EmployeeService.getEmployees(),
        (() => {
          const dayKey = dayjs().format('YYYY-MM-DD');
          return ServiceOrderService.getServiceOrders({ from: dayKey, to: dayKey });
        })()
      ]);
      setEmployees(employeeData.filter((employee) => employee.is_field_worker));
      setOrders(orderData);
    } catch (error) {
      console.error('Feld-Daten konnten nicht geladen werden', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
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

  useEffect(() => {
    if (loading || selectedContext) {
      return;
    }

    for (const employee of employees) {
      const employeeOrders = assignmentsByEmployee[employee.employee_id] || [];
      if (employeeOrders.length) {
        setSelectedContext({ orderId: employeeOrders[0].order_id, employeeId: employee.employee_id });
        break;
      }
    }
  }, [assignmentsByEmployee, employees, loading, selectedContext]);

  const activeContextData = useMemo(() => {
    if (!selectedContext) {
      return null;
    }

    const order = orders.find((item) => item.order_id === selectedContext.orderId);
    const employee = employees.find((item) => item.employee_id === selectedContext.employeeId);

    if (!order || !employee) {
      return null;
    }

    const activeEntry = order.time_entries?.find(
      (entry) => entry.employee_id === employee.employee_id && !entry.end_time
    );

    const elapsedSeconds = activeEntry
      ? Math.max(0, Math.floor((Date.now() - new Date(activeEntry.start_time).getTime()) / 1000)) + timerTick * 0
      : 0;

    return { order, employee, activeEntry, elapsedSeconds };
  }, [employees, orders, selectedContext, timerTick]);

  const handleSelect = (order, employee) => {
    setSelectedContext({ orderId: order.order_id, employeeId: employee.employee_id });
    setGeoError(null);
    setActionLoading({ checkIn: false, checkOut: false });
  };

  const buildErrorMessage = (error) => {
    if (!error) {
      return 'Unbekannter Fehler.';
    }

    if (error.message === 'GEOLOCATION_UNSUPPORTED') {
      return 'Der Browser unterstützt keine Geolokalisierung.';
    }

    if (typeof error.code === 'number') {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          return 'Standortfreigabe wurde verweigert.';
        case error.POSITION_UNAVAILABLE:
          return 'Standort konnte nicht bestimmt werden.';
        case error.TIMEOUT:
          return 'Standortbestimmung hat zu lange gedauert.';
        default:
          return 'Unbekannter Fehler bei der Standortbestimmung.';
      }
    }

    return error.response?.data?.message || 'Aktion fehlgeschlagen.';
  };

  const handleCheckIn = async (context) => {
    if (!context) {
      return;
    }

    try {
      setGeoError(null);
      setActionLoading((prev) => ({ ...prev, checkIn: true }));
      const position = await requestLocation();
      const { latitude, longitude, accuracy } = position.coords;
      const response = await ServiceOrderService.checkIn(context.order.order_id, {
        employee_id: context.employee.employee_id,
        latitude,
        longitude
      });

      setCheckInStatus((prev) => ({
        ...prev,
        [context.order.order_id]: {
          distance: response.distanceMeters,
          accuracy: Math.round(accuracy),
          timestamp: response.startedAt
        }
      }));

      if (navigator.vibrate) {
        navigator.vibrate(150);
      }

      await loadData();
    } catch (error) {
      const message = buildErrorMessage(error);
      const distanceInfo = error.response?.data?.distanceMeters;
      const finalMessage =
        typeof distanceInfo === 'number'
          ? `${message} (Entfernung: ${distanceInfo} m, erforderlich: ${CHECK_IN_RADIUS_METERS} m)`
          : message;
      setGeoError(finalMessage);
    } finally {
      setActionLoading((prev) => ({ ...prev, checkIn: false }));
    }
  };

  const handleCheckOut = async (context) => {
    if (!context?.activeEntry) {
      setGeoError('Es läuft keine Zeiterfassung für diesen Auftrag.');
      return;
    }

    try {
      setGeoError(null);
      setActionLoading((prev) => ({ ...prev, checkOut: true }));
      await ServiceOrderService.updateTimeEntry(context.activeEntry.time_entry_id, {
        employee_id: context.activeEntry.employee_id,
        start_time: context.activeEntry.start_time,
        end_time: new Date().toISOString(),
        notes: context.activeEntry.notes,
        source: context.activeEntry.source,
        distance_km: context.activeEntry.distance_km
      });

      if (navigator.vibrate) {
        navigator.vibrate([80, 40, 80]);
      }

      await loadData();
    } catch (error) {
      setGeoError(buildErrorMessage(error));
    } finally {
      setActionLoading((prev) => ({ ...prev, checkOut: false }));
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
    <>
      <Box sx={{ pb: { xs: 20, md: 12 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h4">Arbeitszettel – Mobiler Begleiter</Typography>
            <Typography variant="body1" color="text.secondary">
              Heute, {dayjs().format('dddd, DD.MM.YYYY')} – GPS-Check-ins und Materialbuchungen im Überblick.
            </Typography>
          </Box>
          <Button startIcon={<RefreshIcon />} onClick={loadData} variant="outlined">
            Aktualisieren
          </Button>
        </Stack>

        {geoError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setGeoError(null)}>
            {geoError}
          </Alert>
        )}

        {employees.length === 0 ? (
          <Typography color="text.secondary">Keine Außendienstmitarbeitenden hinterlegt.</Typography>
        ) : (
          employees.map((employee) => {
            const employeeOrders = assignmentsByEmployee[employee.employee_id] || [];
            return (
              <Accordion key={employee.employee_id} defaultExpanded sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                    <Typography variant="h6">
                      {employee.full_name || `${employee.first_name} ${employee.last_name}`}
                    </Typography>
                    <Chip label={`${employeeOrders.length} Auftrag/⸚e`} color="primary" size="small" />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  {employeeOrders.length === 0 ? (
                    <Typography color="text.secondary">Heute keine Einsätze geplant.</Typography>
                  ) : (
                    employeeOrders.map((order) => {
                      const isSelected =
                        selectedContext?.orderId === order.order_id &&
                        selectedContext?.employeeId === employee.employee_id;
                      const activeEntry = order.time_entries?.find(
                        (entry) => entry.employee_id === employee.employee_id && !entry.end_time
                      );
                      const elapsedSeconds = activeEntry
                        ? Math.max(0, Math.floor((Date.now() - new Date(activeEntry.start_time).getTime()) / 1000)) +
                          timerTick * 0
                        : 0;
                      const feedback = checkInStatus[order.order_id];

                      return (
                        <Box
                          key={order.order_id}
                          sx={{
                            border: '2px solid',
                            borderColor: isSelected ? 'primary.main' : 'divider',
                            borderRadius: 3,
                            p: 2,
                            mb: 2,
                            boxShadow: isSelected ? 4 : 0,
                            backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.04)' : 'background.paper',
                            transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                          }}
                          onClick={() => handleSelect(order, employee)}
                        >
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {order.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {order.property_name || order.account_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {order.planned_start ? dayjs(order.planned_start).format('HH:mm') : '--:--'} –{' '}
                            {order.planned_end ? dayjs(order.planned_end).format('HH:mm') : '--:--'}
                          </Typography>
                          {activeEntry ? (
                            <Typography variant="body2" color="success.main" sx={{ mt: 1, fontWeight: 600 }}>
                              Timer läuft seit {dayjs(activeEntry.start_time).format('HH:mm')} Uhr – {formatDuration(elapsedSeconds)}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              Noch kein aktiver Timer.
                            </Typography>
                          )}
                          {feedback && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              Zuletzt eingecheckt in {feedback.distance} m (GPS ±{feedback.accuracy} m) um{' '}
                              {dayjs(feedback.timestamp).format('HH:mm')} Uhr.
                            </Typography>
                          )}
                          <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                            <Button
                              variant="contained"
                              startIcon={<MyLocationIcon />}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleSelect(order, employee);
                                setTimeout(() => {
                                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                                }, 150);
                              }}
                            >
                              Aktionen
                            </Button>
                            <Tooltip title="Arbeitszettel öffnen">
                              <IconButton component={RouterLink} to={`/orders/${order.order_id}`} onClick={(event) => event.stopPropagation()}>
                                <ExpandMoreIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
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

      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          px: { xs: 2, md: 6 },
          pb: { xs: 2, md: 3 },
          zIndex: 1100
        }}
      >
        <Paper elevation={8} sx={{ p: { xs: 2, md: 3 }, maxWidth: 960, mx: 'auto' }}>
          {activeContextData ? (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {activeContextData.order.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {activeContextData.order.property_name || activeContextData.order.account_name}
                </Typography>
                {activeContextData.activeEntry ? (
                  <Typography variant="body2" color="success.main" sx={{ mt: 0.5 }}>
                    Timer: {formatDuration(activeContextData.elapsedSeconds)} (seit{' '}
                    {dayjs(activeContextData.activeEntry.start_time).format('HH:mm')} Uhr)
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Noch kein aktiver Timer. Check-in innerhalb von {CHECK_IN_RADIUS_METERS} m erforderlich.
                  </Typography>
                )}
                {checkInStatus[activeContextData.order.order_id] && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Zuletzt eingecheckt in {checkInStatus[activeContextData.order.order_id].distance} m (GPS ±
                    {checkInStatus[activeContextData.order.order_id].accuracy} m) um{' '}
                    {dayjs(checkInStatus[activeContextData.order.order_id].timestamp).format('HH:mm')} Uhr.
                  </Typography>
                )}
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={
                    actionLoading.checkIn ? <CircularProgress size={24} color="inherit" /> : <MyLocationIcon />
                  }
                  disabled={actionLoading.checkIn || Boolean(activeContextData.activeEntry)}
                  onClick={() => handleCheckIn(activeContextData)}
                  sx={{ flex: 1, py: 1.5, fontSize: '1.05rem' }}
                >
                  Ich bin am Objekt
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  startIcon={
                    actionLoading.checkOut ? <CircularProgress size={24} color="inherit" /> : <StopIcon />
                  }
                  disabled={actionLoading.checkOut || !activeContextData.activeEntry}
                  onClick={() => handleCheckOut(activeContextData)}
                  sx={{ flex: 1, py: 1.5, fontSize: '1.05rem' }}
                >
                  Timer stoppen
                </Button>
              </Stack>

              <Divider />

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Navigation zum Objekt
                  </Typography>
                  <Typography variant="body2">
                    {[activeContextData.order.property_address, activeContextData.order.property_postal_code, activeContextData.order.property_city]
                      .filter(Boolean)
                      .join(', ')}
                  </Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<NavigationIcon />}
                    component="a"
                    href={getNavigationLinks(activeContextData.order).apple}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Apple Karten
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<NavigationIcon />}
                    component="a"
                    href={getNavigationLinks(activeContextData.order).google}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google Maps
                  </Button>
                </Stack>
              </Stack>
            </Stack>
          ) : (
            <Typography align="center" color="text.secondary">
              Wähle einen Auftrag, um Aktionen und Navigation zu starten.
            </Typography>
          )}
        </Paper>
      </Box>
    </>
  );
};

export default FieldCompanion;
