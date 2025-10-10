import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  TextField,
  MenuItem,
  Button,
  Chip,
  CircularProgress
} from '@mui/material';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import ServiceOrderService from '../../services/serviceOrderService';
import AccountService from '../../services/accountService';
import EmployeeService from '../../services/employeeService';

const priorityOptions = [
  { value: 'low', label: 'Niedrig' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Hoch' }
];

const statusOptions = [
  { value: 'planned', label: 'Geplant' },
  { value: 'in_progress', label: 'In Arbeit' },
  { value: 'completed', label: 'Abgeschlossen' },
  { value: 'cancelled', label: 'Storniert' }
];

const ServiceOrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [properties, setProperties] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [assignedEmployees, setAssignedEmployees] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    account_id: '',
    property_id: '',
    service_recipient_contact_id: '',
    invoice_account_id: '',
    priority: 'normal',
    status: 'planned',
    planned_date: dayjs().format('YYYY-MM-DD'),
    planned_start: dayjs().hour(8).minute(0).format('YYYY-MM-DDTHH:mm'),
    planned_end: dayjs().hour(12).minute(0).format('YYYY-MM-DDTHH:mm'),
    estimated_hours: '',
    notes: ''
  });

  const loadAccounts = async () => {
    try {
      const response = await AccountService.getAllAccounts();
      setAccounts(response.data);
    } catch (error) {
      console.error('Accounts konnten nicht geladen werden', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await EmployeeService.getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Mitarbeitende konnten nicht geladen werden', error);
    }
  };

  const loadAccountData = async (accountId) => {
    if (!accountId) {
      setProperties([]);
      setContacts([]);
      return;
    }
    try {
      const [propertyRes, contactRes] = await Promise.all([
        AccountService.getAccountProperties(accountId),
        AccountService.getAccountContacts(accountId)
      ]);
      setProperties(propertyRes.data);
      setContacts(contactRes.data);
    } catch (error) {
      console.error('Account-Daten konnten nicht geladen werden', error);
    }
  };

  const loadOrder = async () => {
    if (!isEdit) {
      return;
    }
    try {
      const data = await ServiceOrderService.getServiceOrder(id);
      setForm({
        title: data.title,
        description: data.description || '',
        account_id: data.account_id,
        property_id: data.property_id || '',
        service_recipient_contact_id: data.service_recipient_contact_id || '',
        invoice_account_id: data.invoice_account_id || data.account_id,
        priority: data.priority || 'normal',
        status: data.status || 'planned',
        planned_date: data.planned_date ? dayjs(data.planned_date).format('YYYY-MM-DD') : '',
        planned_start: data.planned_start ? dayjs(data.planned_start).format('YYYY-MM-DDTHH:mm') : '',
        planned_end: data.planned_end ? dayjs(data.planned_end).format('YYYY-MM-DDTHH:mm') : '',
        estimated_hours: data.estimated_hours || '',
        notes: data.notes || ''
      });
      setAssignedEmployees(data.assignments?.map((assignment) => assignment.employee_id.toString()) || []);
      await loadAccountData(data.account_id);
    } catch (error) {
      console.error('Auftrag konnte nicht geladen werden', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
    loadEmployees();
  }, []);

  useEffect(() => {
    if (form.account_id) {
      loadAccountData(form.account_id);
    }
  }, [form.account_id]);

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const plannedStartISO = useMemo(() => (form.planned_start ? new Date(form.planned_start).toISOString() : null), [form.planned_start]);
  const plannedEndISO = useMemo(() => (form.planned_end ? new Date(form.planned_end).toISOString() : null), [form.planned_end]);
  const plannedDateISO = useMemo(() => (form.planned_date ? new Date(form.planned_date).toISOString().slice(0, 10) : null), [form.planned_date]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        account_id: Number(form.account_id),
        property_id: form.property_id ? Number(form.property_id) : null,
        service_recipient_contact_id: form.service_recipient_contact_id ? Number(form.service_recipient_contact_id) : null,
        invoice_account_id: form.invoice_account_id ? Number(form.invoice_account_id) : Number(form.account_id),
        priority: form.priority,
        status: form.status,
        planned_date: plannedDateISO,
        planned_start: plannedStartISO,
        planned_end: plannedEndISO,
        estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null,
        notes: form.notes || null,
        assignments: assignedEmployees.map((employeeId, index) => ({
          employee_id: Number(employeeId),
          scheduled_date: plannedDateISO,
          scheduled_start: plannedStartISO,
          scheduled_end: plannedEndISO,
          is_primary: index === 0
        }))
      };

      if (isEdit) {
        await ServiceOrderService.updateServiceOrder(id, payload);
        navigate(`/orders/${id}`);
      } else {
        const created = await ServiceOrderService.createServiceOrder(payload);
        navigate(`/orders/${created.order_id}`);
      }
    } catch (error) {
      console.error('Auftrag konnte nicht gespeichert werden', error);
    } finally {
      setSaving(false);
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
    <Box component="form" onSubmit={handleSubmit}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {isEdit ? 'Auftrag bearbeiten' : 'Neuer Auftrag'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Erfassen Sie Termin, Team und Informationen für Ihren Einsatz.
          </Typography>
        </Box>
        {isEdit && <Chip label="Bearbeitungsmodus" color="primary" />}
      </Stack>

      <Card elevation={1}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Stack spacing={2}>
                <TextField
                  name="title"
                  label="Titel"
                  required
                  value={form.title}
                  onChange={handleChange}
                  fullWidth
                />
                <TextField
                  name="description"
                  label="Beschreibung"
                  value={form.description}
                  onChange={handleChange}
                  multiline
                  minRows={3}
                />
                <TextField
                  name="notes"
                  label="Interne Notizen"
                  value={form.notes}
                  onChange={handleChange}
                  multiline
                  minRows={2}
                />
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack spacing={2}>
                <TextField
                  name="account_id"
                  label="Kunde"
                  select
                  required
                  value={form.account_id}
                  onChange={handleChange}
                >
                  <MenuItem value="">Bitte auswählen</MenuItem>
                  {accounts.map((account) => (
                    <MenuItem key={account.account_id} value={account.account_id}>
                      {account.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  name="property_id"
                  label="Objekt"
                  select
                  value={form.property_id}
                  onChange={handleChange}
                  disabled={!form.account_id}
                >
                  <MenuItem value="">Kein Objekt</MenuItem>
                  {properties.map((property) => (
                    <MenuItem key={property.property_id} value={property.property_id}>
                      {property.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  name="service_recipient_contact_id"
                  label="Leistungsempfänger"
                  select
                  value={form.service_recipient_contact_id}
                  onChange={handleChange}
                  disabled={!form.account_id}
                >
                  <MenuItem value="">Kein Ansprechpartner</MenuItem>
                  {contacts.map((contact) => (
                    <MenuItem key={contact.contact_id} value={contact.contact_id}>
                      {contact.first_name} {contact.last_name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  name="invoice_account_id"
                  label="Rechnungsempfänger"
                  select
                  value={form.invoice_account_id}
                  onChange={handleChange}
                >
                  {accounts.map((account) => (
                    <MenuItem key={account.account_id} value={account.account_id}>
                      {account.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              <Stack spacing={2}>
                <TextField
                  name="planned_date"
                  label="Geplanter Tag"
                  type="date"
                  value={form.planned_date}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  name="planned_start"
                  label="Startzeit"
                  type="datetime-local"
                  value={form.planned_start}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  name="planned_end"
                  label="Endzeit"
                  type="datetime-local"
                  value={form.planned_end}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  name="estimated_hours"
                  label="Geplante Stunden"
                  type="number"
                  inputProps={{ min: 0, step: 0.5 }}
                  value={form.estimated_hours}
                  onChange={handleChange}
                />
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack spacing={2}>
                <TextField
                  name="priority"
                  label="Priorität"
                  select
                  value={form.priority}
                  onChange={handleChange}
                >
                  {priorityOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  name="status"
                  label="Status"
                  select
                  value={form.status}
                  onChange={handleChange}
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
                  SelectProps={{ multiple: true }}
                  value={assignedEmployees}
                  onChange={(event) => setAssignedEmployees(event.target.value)}
                  helperText="Mehrfachauswahl möglich"
                >
                  {employees.map((employee) => (
                    <MenuItem key={employee.employee_id} value={employee.employee_id.toString()}>
                      {employee.full_name || `${employee.first_name} ${employee.last_name}`}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </Grid>
          </Grid>

          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4 }}>
            <Button variant="outlined" onClick={() => navigate(isEdit ? `/orders/${id}` : '/orders')}>
              Abbrechen
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Speichern...' : 'Speichern'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ServiceOrderForm;
