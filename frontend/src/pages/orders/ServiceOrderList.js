import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  TextField,
  MenuItem,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import CancelIcon from '@mui/icons-material/Cancel';
import { Link as RouterLink } from 'react-router-dom';
import dayjs from 'dayjs';
import ServiceOrderService from '../../services/serviceOrderService';
import EmployeeService from '../../services/employeeService';

const statusOptions = [
  { value: '', label: 'Alle Status' },
  { value: 'planned', label: 'Geplant' },
  { value: 'in_progress', label: 'In Arbeit' },
  { value: 'completed', label: 'Abgeschlossen' },
  { value: 'cancelled', label: 'Storniert' }
];

const statusColor = (status) => {
  switch (status) {
    case 'planned':
      return 'info';
    case 'in_progress':
      return 'primary';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'default';
    default:
      return 'default';
  }
};

const statusIcon = (status) => {
  switch (status) {
    case 'planned':
      return <HourglassTopIcon fontSize="small" />;
    case 'in_progress':
      return <HourglassTopIcon fontSize="small" />;
    case 'completed':
      return <CheckCircleIcon fontSize="small" />;
    case 'cancelled':
      return <CancelIcon fontSize="small" />;
    default:
      return null;
  }
};

const ServiceOrderList = () => {
  const [orders, setOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [search, setSearch] = useState('');

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) {
        params.status = statusFilter;
      }
      if (employeeFilter) {
        params.employeeId = employeeFilter;
      }
      const data = await ServiceOrderService.getServiceOrders(params);
      setOrders(data);
    } catch (error) {
      console.error('Aufträge konnten nicht geladen werden', error);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, employeeFilter]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (search) {
        const searchLower = search.toLowerCase();
        const haystack = `${order.title} ${order.account_name} ${order.property_name}`.toLowerCase();
        if (!haystack.includes(searchLower)) {
          return false;
        }
      }
      return true;
    });
  }, [orders, search]);

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Aufträge & Einsätze
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Planen Sie neue Einsätze und behalten Sie alle laufenden Aufträge im Blick.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button component={RouterLink} to="/orders/new" variant="contained">
            Neuer Auftrag
          </Button>
          <Button startIcon={<RefreshIcon />} onClick={loadOrders} variant="outlined">
            Aktualisieren
          </Button>
        </Stack>
      </Stack>

      <Card elevation={1}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
            <TextField
              label="Suche"
              fullWidth
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Titel, Kunde oder Objekt"
            />
            <TextField
              label="Status"
              select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              sx={{ minWidth: 180 }}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Mitarbeitende"
              select
              value={employeeFilter}
              onChange={(event) => setEmployeeFilter(event.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">Alle Personen</MenuItem>
              {employees.map((employee) => (
                <MenuItem key={employee.employee_id} value={employee.employee_id}>
                  {employee.full_name || `${employee.first_name} ${employee.last_name}`}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, mb: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Datum</TableCell>
                    <TableCell>Auftrag</TableCell>
                    <TableCell>Ort</TableCell>
                    <TableCell>Mitarbeitende</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Aktionen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Keine Aufträge gefunden.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.order_id} hover>
                        <TableCell>
                          <Typography variant="subtitle2">
                            {order.planned_date ? dayjs(order.planned_date).format('DD.MM.YYYY') : 'TBD'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {order.planned_start ? dayjs(order.planned_start).format('HH:mm') : '--:--'} - {order.planned_end ? dayjs(order.planned_end).format('HH:mm') : '--:--'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle1">{order.title}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {order.account_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{order.property_name || '---'}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {order.property_address}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {order.assignments?.length
                              ? order.assignments.map((assignment) => assignment.employee_name).join(', ')
                              : 'Noch nicht zugeteilt'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={statusColor(order.status)}
                            icon={statusIcon(order.status)}
                            label={order.status}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Details anzeigen">
                            <IconButton component={RouterLink} to={`/orders/${order.order_id}`}>
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Bearbeiten">
                            <IconButton component={RouterLink} to={`/orders/${order.order_id}/edit`}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ServiceOrderList;
