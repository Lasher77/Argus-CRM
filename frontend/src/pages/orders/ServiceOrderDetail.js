import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  Chip,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Divider,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Avatar,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import BrushIcon from '@mui/icons-material/Brush';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ServiceOrderService from '../../services/serviceOrderService';
import EmployeeService from '../../services/employeeService';
import MaterialService from '../../services/materialService';

const SectionCard = styled(Card)(({ theme }) => ({
  height: '100%',
  border: `1px solid ${theme.palette.divider}`
}));

const statusLabel = (status) => {
  switch (status) {
    case 'planned':
      return 'Geplant';
    case 'in_progress':
      return 'In Arbeit';
    case 'completed':
      return 'Abgeschlossen';
    case 'cancelled':
      return 'Storniert';
    default:
      return status;
  }
};

const ServiceOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [timeEntryForm, setTimeEntryForm] = useState({
    employee_id: '',
    start_time: dayjs().format('YYYY-MM-DDTHH:mm'),
    end_time: '',
    distance_km: '',
    notes: ''
  });
  const [materialForm, setMaterialForm] = useState({
    material_id: '',
    material_name: '',
    quantity: 1,
    unit: 'Stk.',
    unit_price: ''
  });
  const [photoForm, setPhotoForm] = useState({
    photo_data: '',
    caption: ''
  });
  const [signatureForm, setSignatureForm] = useState({
    signed_by: '',
    signature_data: ''
  });

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await ServiceOrderService.getServiceOrder(id);
      setOrder(data);
    } catch (error) {
      console.error('Auftrag konnte nicht geladen werden', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [employeeData, materialData] = await Promise.all([
          EmployeeService.getEmployees(),
          MaterialService.getMaterials()
        ]);
        setEmployees(employeeData);
        setMaterials(materialData);
      } catch (error) {
        console.error('Stammdaten konnten nicht geladen werden', error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      const updated = await ServiceOrderService.updateStatus(order.order_id, newStatus);
      setOrder(updated);
    } catch (error) {
      console.error('Status konnte nicht aktualisiert werden', error);
    }
  };

  const handleTimeEntrySubmit = async (event) => {
    event.preventDefault();
    if (!timeEntryForm.employee_id || !timeEntryForm.start_time) {
      return;
    }
    try {
      const payload = {
        employee_id: Number(timeEntryForm.employee_id),
        start_time: new Date(timeEntryForm.start_time).toISOString(),
        end_time: timeEntryForm.end_time ? new Date(timeEntryForm.end_time).toISOString() : null,
        distance_km: timeEntryForm.distance_km ? Number(timeEntryForm.distance_km) : null,
        notes: timeEntryForm.notes || null,
        source: 'mobile'
      };
      const updated = await ServiceOrderService.addTimeEntry(order.order_id, payload);
      setOrder(updated);
      setTimeEntryForm({
        employee_id: '',
        start_time: dayjs().format('YYYY-MM-DDTHH:mm'),
        end_time: '',
        distance_km: '',
        notes: ''
      });
    } catch (error) {
      console.error('Zeiterfassung konnte nicht gespeichert werden', error);
    }
  };

  const handleTimeEntryDelete = async (entryId) => {
    try {
      const updated = await ServiceOrderService.deleteTimeEntry(entryId);
      setOrder(updated);
    } catch (error) {
      console.error('Zeiterfassung konnte nicht gelöscht werden', error);
    }
  };

  const handleMaterialSelect = (value) => {
    if (!value) {
      setMaterialForm((prev) => ({ ...prev, material_id: '', material_name: '', unit: 'Stk.', unit_price: '' }));
      return;
    }
    const selected = materials.find((material) => material.material_id === Number(value));
    if (selected) {
      setMaterialForm((prev) => ({
        ...prev,
        material_id: selected.material_id,
        material_name: selected.name,
        unit: selected.unit,
        unit_price: selected.supplier_price ?? prev.unit_price
      }));
    }
  };

  const handleMaterialSubmit = async (event) => {
    event.preventDefault();
    if (!materialForm.material_name || !materialForm.quantity) {
      return;
    }
    try {
      const payload = {
        material_id: materialForm.material_id || null,
        material_name: materialForm.material_name,
        quantity: Number(materialForm.quantity),
        unit: materialForm.unit,
        unit_price: materialForm.unit_price ? Number(materialForm.unit_price) : null,
        employee_id: null
      };
      const updated = await ServiceOrderService.addMaterialUsage(order.order_id, payload);
      setOrder(updated);
      setMaterialForm({ material_id: '', material_name: '', quantity: 1, unit: 'Stk.', unit_price: '' });
    } catch (error) {
      console.error('Materialverbrauch konnte nicht gespeichert werden', error);
    }
  };

  const handleMaterialDelete = async (usageId) => {
    try {
      const updated = await ServiceOrderService.deleteMaterialUsage(usageId);
      setOrder(updated);
    } catch (error) {
      console.error('Materialverbrauch konnte nicht gelöscht werden', error);
    }
  };

  const handlePhotoSubmit = async (event) => {
    event.preventDefault();
    if (!photoForm.photo_data) {
      return;
    }
    try {
      const updated = await ServiceOrderService.addPhoto(order.order_id, photoForm);
      setOrder(updated);
      setPhotoForm({ photo_data: '', caption: '' });
    } catch (error) {
      console.error('Foto konnte nicht gespeichert werden', error);
    }
  };

  const handlePhotoDelete = async (photoId) => {
    try {
      const updated = await ServiceOrderService.deletePhoto(order.order_id, photoId);
      setOrder(updated);
    } catch (error) {
      console.error('Foto konnte nicht gelöscht werden', error);
    }
  };

  const handleSignatureSubmit = async (event) => {
    event.preventDefault();
    if (!signatureForm.signature_data) {
      return;
    }
    try {
      const updated = await ServiceOrderService.setSignature(order.order_id, {
        signed_by: signatureForm.signed_by,
        signature_data: signatureForm.signature_data,
      });
      setOrder(updated);
      setSignatureForm({ signed_by: '', signature_data: '' });
    } catch (error) {
      console.error('Signatur konnte nicht gespeichert werden', error);
    }
  };

  const handleSignatureClear = async () => {
    try {
      const updated = await ServiceOrderService.clearSignature(order.order_id);
      setOrder(updated);
    } catch (error) {
      console.error('Signatur konnte nicht gelöscht werden', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4">{order.title}</Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            <Chip label={statusLabel(order.status)} color={order.status === 'completed' ? 'success' : order.status === 'in_progress' ? 'primary' : 'default'} />
            <Typography variant="body2" color="text.secondary">
              Auftrag für {order.account_name}
            </Typography>
          </Stack>
        </Box>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/orders/${order.order_id}/edit`)}>
            Bearbeiten
          </Button>
          {order.status !== 'completed' && (
            <Button variant="contained" startIcon={<CheckCircleIcon />} onClick={() => handleStatusChange('completed')}>
              Auftrag abschließen
            </Button>
          )}
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <SectionCard>
            <CardHeader title="Auftragsdetails" />
            <Divider />
            <CardContent>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {order.description || 'Keine Beschreibung hinterlegt.'}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2">Kunde</Typography>
              <Typography variant="body2" color="text.secondary">
                {order.account_name}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2">Ort</Typography>
              <Typography variant="body2" color="text.secondary">
                {order.property_name || '---'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {order.property_address}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2">Zeitraum</Typography>
              <Typography variant="body2" color="text.secondary">
                {order.planned_date ? dayjs(order.planned_date).format('DD.MM.YYYY') : 'Kein Datum geplant'} · {order.planned_start ? dayjs(order.planned_start).format('HH:mm') : '--:--'} - {order.planned_end ? dayjs(order.planned_end).format('HH:mm') : '--:--'}
              </Typography>
              {order.notes && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2">Notizen</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.notes}
                  </Typography>
                </>
              )}
            </CardContent>
          </SectionCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <SectionCard>
            <CardHeader title="Team & Zuweisung" />
            <Divider />
            <CardContent>
              {order.assignments && order.assignments.length ? (
                order.assignments.map((assignment) => (
                  <Box key={assignment.assignment_id} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: assignment.color || 'primary.main' }}>
                      {assignment.employee_name?.split(' ').map((part) => part[0]).join('').slice(0, 2)}
                    </Avatar>
                    <Box>
                      <Typography variant="body1">{assignment.employee_name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {assignment.scheduled_start ? dayjs(assignment.scheduled_start).format('DD.MM.YYYY HH:mm') : '---'}
                      </Typography>
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">Noch keine Mitarbeitenden zugewiesen.</Typography>
              )}
            </CardContent>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard component="form" onSubmit={handleTimeEntrySubmit}>
            <CardHeader title="Zeiterfassung" />
            <Divider />
            <CardContent>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField
                    label="Mitarbeiter"
                    select
                    required
                    value={timeEntryForm.employee_id}
                    onChange={(event) => setTimeEntryForm((prev) => ({ ...prev, employee_id: event.target.value }))}
                    fullWidth
                  >
                    <MenuItem value="">Auswählen</MenuItem>
                    {employees.map((employee) => (
                      <MenuItem key={employee.employee_id} value={employee.employee_id}>
                        {employee.full_name || `${employee.first_name} ${employee.last_name}`}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Start"
                    type="datetime-local"
                    required
                    value={timeEntryForm.start_time}
                    onChange={(event) => setTimeEntryForm((prev) => ({ ...prev, start_time: event.target.value }))}
                    fullWidth
                  />
                </Stack>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField
                    label="Ende"
                    type="datetime-local"
                    value={timeEntryForm.end_time}
                    onChange={(event) => setTimeEntryForm((prev) => ({ ...prev, end_time: event.target.value }))}
                    fullWidth
                  />
                  <TextField
                    label="Kilometer"
                    type="number"
                    inputProps={{ step: 0.1, min: 0 }}
                    value={timeEntryForm.distance_km}
                    onChange={(event) => setTimeEntryForm((prev) => ({ ...prev, distance_km: event.target.value }))}
                    fullWidth
                  />
                </Stack>
                <TextField
                  label="Notiz"
                  multiline
                  minRows={2}
                  value={timeEntryForm.notes}
                  onChange={(event) => setTimeEntryForm((prev) => ({ ...prev, notes: event.target.value }))}
                />
                <Button type="submit" variant="contained" startIcon={<AddIcon />}>Zeit erfassen</Button>
              </Stack>

              <Divider sx={{ my: 3 }} />

              {order.time_entries && order.time_entries.length ? (
                order.time_entries.map((entry) => (
                  <Box key={entry.time_entry_id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle2">{entry.employee_name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {dayjs(entry.start_time).format('DD.MM.YYYY HH:mm')} - {entry.end_time ? dayjs(entry.end_time).format('HH:mm') : '--:--'} ({entry.duration_minutes ?? 0} Minuten)
                      </Typography>
                      {entry.notes && (
                        <Typography variant="body2" color="text.secondary">{entry.notes}</Typography>
                      )}
                    </Box>
                    <Tooltip title="Löschen">
                      <IconButton onClick={() => handleTimeEntryDelete(entry.time_entry_id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">Noch keine Zeiten erfasst.</Typography>
              )}
            </CardContent>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard component="form" onSubmit={handleMaterialSubmit}>
            <CardHeader title="Materialverbrauch" />
            <Divider />
            <CardContent>
              <Stack spacing={2}>
                <TextField
                  label="Material aus Lager"
                  select
                  value={materialForm.material_id}
                  onChange={(event) => handleMaterialSelect(event.target.value)}
                >
                  <MenuItem value="">Freie Eingabe</MenuItem>
                  {materials.map((material) => (
                    <MenuItem key={material.material_id} value={material.material_id}>
                      {material.name} ({material.stock} {material.unit} verfügbar)
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Materialbezeichnung"
                  required
                  value={materialForm.material_name}
                  onChange={(event) => setMaterialForm((prev) => ({ ...prev, material_name: event.target.value }))}
                />
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField
                    label="Menge"
                    type="number"
                    required
                    inputProps={{ min: 0, step: 0.1 }}
                    value={materialForm.quantity}
                    onChange={(event) => setMaterialForm((prev) => ({ ...prev, quantity: event.target.value }))}
                  />
                  <TextField
                    label="Einheit"
                    value={materialForm.unit}
                    onChange={(event) => setMaterialForm((prev) => ({ ...prev, unit: event.target.value }))}
                  />
                  <TextField
                    label="Preis (€)"
                    type="number"
                    inputProps={{ step: 0.01 }}
                    value={materialForm.unit_price}
                    onChange={(event) => setMaterialForm((prev) => ({ ...prev, unit_price: event.target.value }))}
                  />
                </Stack>
                <Button type="submit" variant="contained" startIcon={<AddIcon />}>Material verbuchen</Button>
              </Stack>

              <Divider sx={{ my: 3 }} />

              {order.material_usage && order.material_usage.length ? (
                order.material_usage.map((usage) => (
                  <Box key={usage.usage_id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle2">{usage.material_name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {usage.quantity} {usage.unit} · {usage.unit_price ? `${usage.unit_price.toFixed(2)} €` : 'Preis offen'}
                      </Typography>
                    </Box>
                    <Tooltip title="Löschen">
                      <IconButton onClick={() => handleMaterialDelete(usage.usage_id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">Keine Materialien verbucht.</Typography>
              )}
            </CardContent>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard component="form" onSubmit={handlePhotoSubmit}>
            <CardHeader title="Fotodokumentation" />
            <Divider />
            <CardContent>
              <Stack spacing={2}>
                <TextField
                  label="Bild (Data URL)"
                  required
                  multiline
                  minRows={3}
                  value={photoForm.photo_data}
                  onChange={(event) => setPhotoForm((prev) => ({ ...prev, photo_data: event.target.value }))}
                />
                <TextField
                  label="Beschreibung"
                  value={photoForm.caption}
                  onChange={(event) => setPhotoForm((prev) => ({ ...prev, caption: event.target.value }))}
                />
                <Button type="submit" variant="contained" startIcon={<AddIcon />}>Foto hinzufügen</Button>
              </Stack>

              <Divider sx={{ my: 3 }} />

              {order.photos && order.photos.length ? (
                order.photos.map((photo) => (
                  <Box key={photo.photo_id} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {photo.photo_data?.startsWith('data:image') ? (
                      <img src={photo.photo_data} alt={photo.caption || 'Auftragsfoto'} style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8, marginRight: 16 }} />
                    ) : (
                      <Box sx={{ width: 96, height: 96, bgcolor: 'grey.200', borderRadius: 2, mr: 2 }} />
                    )}
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2">{photo.caption || 'Ohne Beschreibung'}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {photo.created_at ? dayjs(photo.created_at).format('DD.MM.YYYY HH:mm') : ''}
                      </Typography>
                    </Box>
                    <Tooltip title="Löschen">
                      <IconButton onClick={() => handlePhotoDelete(photo.photo_id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">Keine Fotos vorhanden.</Typography>
              )}
            </CardContent>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard component="form" onSubmit={handleSignatureSubmit}>
            <CardHeader title="Digitale Unterschrift" />
            <Divider />
            <CardContent>
              {order.signature ? (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2">Signiert von {order.signature.signed_by || 'Kunde'}</Typography>
                  {order.signature.signature_data?.startsWith('data:image') ? (
                    <img src={order.signature.signature_data} alt="Signatur" style={{ maxWidth: '100%', marginTop: 16, border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8 }} />
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      {order.signature.signature_data}
                    </Typography>
                  )}
                  <Button onClick={handleSignatureClear} startIcon={<DeleteIcon />} sx={{ mt: 2 }}>
                    Signatur entfernen
                  </Button>
                </Box>
              ) : (
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Hinterlegen Sie eine Kundenunterschrift als Bild (Data URL) oder Text.
                </Typography>
              )}

              <Stack spacing={2}>
                <TextField
                  label="Signiert von"
                  value={signatureForm.signed_by}
                  onChange={(event) => setSignatureForm((prev) => ({ ...prev, signed_by: event.target.value }))}
                />
                <TextField
                  label="Signatur (Data URL oder Text)"
                  required
                  multiline
                  minRows={3}
                  value={signatureForm.signature_data}
                  onChange={(event) => setSignatureForm((prev) => ({ ...prev, signature_data: event.target.value }))}
                />
                <Button type="submit" variant="contained" startIcon={<BrushIcon />}>Signatur speichern</Button>
              </Stack>
            </CardContent>
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ServiceOrderDetail;
