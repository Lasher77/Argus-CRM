import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  CircularProgress,
  Autocomplete
} from '@mui/material';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import ServiceOrderService from '../../services/serviceOrderService';
import AccountService from '../../services/accountService';
import EmployeeService from '../../services/employeeService';
import ContactService from '../../services/contactService';

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
  const [customerOptions, setCustomerOptions] = useState([]);
  const [customerInputValue, setCustomerInputValue] = useState('');
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerValue, setCustomerValue] = useState(null);
  const [invoiceOptions, setInvoiceOptions] = useState([]);
  const [invoiceInputValue, setInvoiceInputValue] = useState('');
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceValue, setInvoiceValue] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [properties, setProperties] = useState([]);
  const [recipientOptions, setRecipientOptions] = useState([]);
  const [recipientInputValue, setRecipientInputValue] = useState('');
  const [recipientLoading, setRecipientLoading] = useState(false);
  const [recipientValue, setRecipientValue] = useState(null);
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

  const ensureOptionIncluded = useCallback((options, option, key) => {
    if (!option) {
      return options;
    }
    const exists = options.some((item) => item[key] === option[key]);
    return exists ? options : [...options, option];
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await EmployeeService.getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Mitarbeitende konnten nicht geladen werden', error);
    }
  };

  const loadAccountData = useCallback(async (accountId, currentRecipient = recipientValue) => {
    if (!accountId) {
      setProperties([]);
      setRecipientOptions([]);
      setRecipientValue(null);
      return;
    }
    try {
      const [propertyRes, contactRes] = await Promise.all([
        AccountService.getAccountProperties(accountId),
        AccountService.getAccountContacts(accountId)
      ]);
      setProperties(propertyRes.data);
      const fetchedContacts = contactRes.data || [];
      setRecipientOptions((prev) => {
        const base = fetchedContacts.length ? fetchedContacts : prev;
        return ensureOptionIncluded(base, currentRecipient ?? recipientValue, 'contact_id');
      });
    } catch (error) {
      console.error('Account-Daten konnten nicht geladen werden', error);
    }
  }, [ensureOptionIncluded, recipientValue]);

  const loadOrder = async () => {
    if (!isEdit) {
      return;
    }
    try {
      const data = await ServiceOrderService.getServiceOrder(id);
      const accountOption = data.account_id
        ? { account_id: data.account_id, name: data.account_name }
        : null;
      const invoiceOption = data.invoice_account_id
        ? {
            account_id: data.invoice_account_id,
            name: data.invoice_account_name || data.account_name
          }
        : accountOption;
      const recipientOption = data.service_recipient_contact_id
        ? {
            contact_id: data.service_recipient_contact_id,
            first_name: data.service_recipient_name || '',
            last_name: '',
            display_name: data.service_recipient_name
          }
        : null;
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
      setCustomerValue(accountOption || null);
      setCustomerOptions((prev) => ensureOptionIncluded(prev, accountOption, 'account_id'));
      setInvoiceValue(invoiceOption || null);
      setInvoiceOptions((prev) => ensureOptionIncluded(prev, invoiceOption, 'account_id'));
      setRecipientValue(recipientOption || null);
      setRecipientOptions((prev) => ensureOptionIncluded(prev, recipientOption, 'contact_id'));
      setAssignedEmployees(data.assignments?.map((assignment) => assignment.employee_id.toString()) || []);
      await loadAccountData(data.account_id, recipientOption);
    } catch (error) {
      console.error('Auftrag konnte nicht geladen werden', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    loadAccountData(form.account_id);
  }, [form.account_id, loadAccountData]);

  useEffect(() => {
    let active = true;
    const handler = setTimeout(async () => {
      try {
        setCustomerLoading(true);
        const response = await AccountService.searchAccounts(customerInputValue, { limit: 20 });
        if (!active) {
          return;
        }
        const data = response.data || [];
        setCustomerOptions(ensureOptionIncluded(data, customerValue, 'account_id'));
      } catch (error) {
        console.error('Accounts konnten nicht geladen werden', error);
      } finally {
        if (active) {
          setCustomerLoading(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(handler);
    };
  }, [customerInputValue, customerValue, ensureOptionIncluded]);

  useEffect(() => {
    let active = true;
    const handler = setTimeout(async () => {
      try {
        setInvoiceLoading(true);
        const response = await AccountService.searchAccounts(invoiceInputValue, { limit: 20 });
        if (!active) {
          return;
        }
        const data = response.data || [];
        setInvoiceOptions(ensureOptionIncluded(data, invoiceValue, 'account_id'));
      } catch (error) {
        console.error('Rechnungsempfänger konnten nicht geladen werden', error);
      } finally {
        if (active) {
          setInvoiceLoading(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(handler);
    };
  }, [invoiceInputValue, invoiceValue, ensureOptionIncluded]);

  useEffect(() => {
    if (!form.account_id) {
      setRecipientOptions([]);
      setRecipientValue(null);
      return;
    }

    let active = true;
    const handler = setTimeout(async () => {
      try {
        setRecipientLoading(true);
        const response = await ContactService.searchContacts(recipientInputValue, {
          accountId: form.account_id,
          limit: 25
        });
        if (!active) {
          return;
        }
        const data = response.data || [];
        setRecipientOptions(ensureOptionIncluded(data, recipientValue, 'contact_id'));
      } catch (error) {
        console.error('Kontakte konnten nicht geladen werden', error);
      } finally {
        if (active) {
          setRecipientLoading(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(handler);
    };
  }, [recipientInputValue, form.account_id, recipientValue, ensureOptionIncluded]);

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAccountSelect = (_, value) => {
    const previousAccountId = form.account_id;
    setCustomerValue(value);
    setCustomerInputValue(value ? value.name : '');
    setCustomerOptions((prev) => ensureOptionIncluded(prev, value, 'account_id'));
    setForm((prev) => ({
      ...prev,
      account_id: value ? value.account_id : '',
      property_id: '',
      service_recipient_contact_id: '',
      invoice_account_id:
        value && (!invoiceValue || !previousAccountId || invoiceValue.account_id === previousAccountId)
          ? value.account_id
          : value
            ? prev.invoice_account_id
            : ''
    }));

    if (!value) {
      setInvoiceValue(null);
    } else if (!invoiceValue || !previousAccountId || invoiceValue.account_id === previousAccountId) {
      setInvoiceValue(value);
      setInvoiceOptions((prev) => ensureOptionIncluded(prev, value, 'account_id'));
      setInvoiceInputValue(value.name);
    }

    setRecipientValue(null);
    setRecipientOptions([]);
    setRecipientInputValue('');
  };

  const handleInvoiceSelect = (_, value) => {
    setInvoiceValue(value);
    setInvoiceOptions((prev) => ensureOptionIncluded(prev, value, 'account_id'));
    setInvoiceInputValue(value ? value.name : '');
    setForm((prev) => ({
      ...prev,
      invoice_account_id: value ? value.account_id : ''
    }));
  };

  const handleRecipientSelect = (_, value) => {
    setRecipientValue(value);
    setRecipientOptions((prev) => ensureOptionIncluded(prev, value, 'contact_id'));
    setRecipientInputValue(
      value
        ? value.display_name || `${value.first_name || ''} ${value.last_name || ''}`.trim()
        : ''
    );
    setForm((prev) => ({
      ...prev,
      service_recipient_contact_id: value ? value.contact_id : ''
    }));
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
                <Autocomplete
                  options={customerOptions}
                  value={customerValue}
                  inputValue={customerInputValue}
                  loading={customerLoading}
                  onChange={handleAccountSelect}
                  onInputChange={(_, newValue) => setCustomerInputValue(newValue)}
                  getOptionLabel={(option) => option?.name || ''}
                  isOptionEqualToValue={(option, value) => option?.account_id === value?.account_id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Auftraggeber"
                      required
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {customerLoading ? <CircularProgress color="inherit" size={18} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                />
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
                <Autocomplete
                  options={recipientOptions}
                  value={recipientValue}
                  inputValue={recipientInputValue}
                  loading={recipientLoading}
                  onChange={handleRecipientSelect}
                  onInputChange={(_, newValue) => setRecipientInputValue(newValue)}
                  getOptionLabel={(option) =>
                    option?.display_name
                      || `${option?.first_name || ''} ${option?.last_name || ''}`.trim()
                  }
                  isOptionEqualToValue={(option, value) => option?.contact_id === value?.contact_id}
                  disabled={!form.account_id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Leistungsempfänger"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {recipientLoading ? <CircularProgress color="inherit" size={18} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                />
                <Autocomplete
                  options={invoiceOptions}
                  value={invoiceValue}
                  inputValue={invoiceInputValue}
                  loading={invoiceLoading}
                  onChange={handleInvoiceSelect}
                  onInputChange={(_, newValue) => setInvoiceInputValue(newValue)}
                  getOptionLabel={(option) => option?.name || ''}
                  isOptionEqualToValue={(option, value) => option?.account_id === value?.account_id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Rechnungsempfänger"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {invoiceLoading ? <CircularProgress color="inherit" size={18} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                />
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
