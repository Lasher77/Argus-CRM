import React, { useCallback, useEffect, useState } from 'react';
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
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SendIcon from '@mui/icons-material/Send';
import ServiceOrderService from '../../services/serviceOrderService';
import EmployeeService from '../../services/employeeService';
import MaterialService from '../../services/materialService';
import UploadService from '../../services/uploadService';
import {
  queueTimeEntry,
  queuePhoto,
  removeQueuedTimeEntry,
  removeQueuedPhoto,
  processTimeEntryQueue,
  processPhotoQueue,
} from '../../utils/offlineQueue';
import { createServiceReportPdf, pdfToDataUri } from '../../utils/pdfUtils';
import { createFileName, dataUrlToBlob, getExtensionFromMime } from '../../utils/fileUtils';

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

const createClientId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const resolveImageSource = (photo) => {
  if (!photo) {
    return null;
  }
  if (photo.photo_data && (photo.photo_data.startsWith('data:') || photo.photo_data.startsWith('http'))) {
    return photo.photo_data;
  }
  if (photo.photo_url) {
    return photo.photo_url;
  }
  return null;
};

const resolveSignatureSource = (signature) => {
  if (!signature) {
    return null;
  }
  if (signature.signature_data && (signature.signature_data.startsWith('data:') || signature.signature_data.startsWith('http'))) {
    return signature.signature_data;
  }
  if (signature.signature_url) {
    return signature.signature_url;
  }
  return null;
};

const isNetworkError = (error) => !navigator.onLine || (error?.isAxiosError && !error.response);

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
  const [sendingReport, setSendingReport] = useState(false);

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ServiceOrderService.getServiceOrder(id);
      setOrder(data);
    } catch (error) {
      console.error('Auftrag konnte nicht geladen werden', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const uploadDataUrl = useCallback(async (dataUrl, orderId, type) => {
    const blob = await dataUrlToBlob(dataUrl);
    const extension = getExtensionFromMime(blob.type);
    const fileName = createFileName(`${type}`, extension);
    const presign = await UploadService.createPresignedUpload({
      fileName,
      fileType: blob.type,
      fileSize: blob.size,
      prefix: `orders/${orderId}/${type}`,
    });

    const formData = new FormData();
    Object.entries(presign.fields).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append('file', blob);

    const response = await fetch(presign.url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload fehlgeschlagen');
    }

    return presign.assetUrl || `${presign.url}/${presign.fields.key}`;
  }, []);

  const syncOfflineData = useCallback(async () => {
    if (!navigator.onLine) {
      return;
    }

    let shouldReload = false;
    try {
      const processedTimeEntries = await processTimeEntryQueue(async (record) => {
        await ServiceOrderService.addTimeEntry(record.orderId, record.payload);
        if (String(record.orderId) === String(id)) {
          shouldReload = true;
        }
      });

      const processedPhotos = await processPhotoQueue(async (record) => {
        if (!record.photo_data) {
          return;
        }
        const photoUrl = record.photo_data.startsWith('data:')
          ? await uploadDataUrl(record.photo_data, record.orderId, 'photos')
          : record.photo_data;
        await ServiceOrderService.addPhoto(record.orderId, {
          caption: record.caption,
          photo_data: photoUrl,
        });
        if (String(record.orderId) === String(id)) {
          shouldReload = true;
        }
      });

      if (shouldReload || processedTimeEntries || processedPhotos) {
        await loadOrder();
      }
    } catch (error) {
      console.error('Offline-Daten konnten nicht synchronisiert werden', error);
    }
  }, [id, loadOrder, uploadDataUrl]);

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
  }, [loadOrder]);

  useEffect(() => {
    syncOfflineData();
    const handleOnline = () => {
      syncOfflineData();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncOfflineData]);

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
    if (!order || !timeEntryForm.employee_id || !timeEntryForm.start_time) {
      return;
    }

    const payload = {
      employee_id: Number(timeEntryForm.employee_id),
      start_time: new Date(timeEntryForm.start_time).toISOString(),
      end_time: timeEntryForm.end_time ? new Date(timeEntryForm.end_time).toISOString() : null,
      distance_km: timeEntryForm.distance_km ? Number(timeEntryForm.distance_km) : null,
      notes: timeEntryForm.notes || null,
      source: 'mobile',
    };

    const employee = employees.find((item) => item.employee_id === Number(timeEntryForm.employee_id));
    const clientId = createClientId('offline-time');

    const addPendingEntry = async () => {
      await queueTimeEntry({
        clientId,
        orderId: order.order_id,
        payload,
      });
      setOrder((prev) => ({
        ...prev,
        time_entries: [
          ...(prev?.time_entries || []),
          {
            ...payload,
            time_entry_id: clientId,
            employee_name: employee ? `${employee.first_name} ${employee.last_name}`.trim() : undefined,
            notes: payload.notes,
            duration_minutes:
              payload.start_time && payload.end_time
                ? Math.max(0, Math.round((new Date(payload.end_time) - new Date(payload.start_time)) / 60000))
                : null,
            pending: true,
          },
        ],
      }));
      window.alert('Keine Verbindung. Die Zeiterfassung wird synchronisiert, sobald eine Verbindung besteht.');
      setTimeEntryForm({
        employee_id: '',
        start_time: dayjs().format('YYYY-MM-DDTHH:mm'),
        end_time: '',
        distance_km: '',
        notes: '',
      });
    };

    try {
      if (!navigator.onLine) {
        await addPendingEntry();
        return;
      }

      const updated = await ServiceOrderService.addTimeEntry(order.order_id, payload);
      setOrder(updated);
      setTimeEntryForm({
        employee_id: '',
        start_time: dayjs().format('YYYY-MM-DDTHH:mm'),
        end_time: '',
        distance_km: '',
        notes: '',
      });
    } catch (error) {
      if (isNetworkError(error)) {
        await addPendingEntry();
      } else {
        console.error('Zeiterfassung konnte nicht gespeichert werden', error);
      }
    }
  };

  const handleTimeEntryDelete = async (entryId) => {
    if (typeof entryId === 'string' && entryId.startsWith('offline-time')) {
      await removeQueuedTimeEntry(entryId);
      setOrder((prev) => ({
        ...prev,
        time_entries: prev.time_entries.filter((entry) => entry.time_entry_id !== entryId),
      }));
      return;
    }
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
    if (!order || !photoForm.photo_data) {
      return;
    }

    const clientId = createClientId('offline-photo');
    const addPendingPhoto = async () => {
      if (!photoForm.photo_data.startsWith('data:')) {
        window.alert('Offline können nur Data-URLs zwischengespeichert werden.');
        return;
      }
      await queuePhoto({
        clientId,
        orderId: order.order_id,
        caption: photoForm.caption,
        photo_data: photoForm.photo_data,
      });
      setOrder((prev) => ({
        ...prev,
        photos: [
          {
            photo_id: clientId,
            caption: photoForm.caption,
            photo_data: photoForm.photo_data,
            created_at: new Date().toISOString(),
            pending: true,
          },
          ...(prev?.photos || []),
        ],
      }));
      window.alert('Keine Verbindung. Das Foto wird synchronisiert, sobald eine Verbindung besteht.');
      setPhotoForm({ photo_data: '', caption: '' });
    };

    const submitOnline = async () => {
      let photoPayload = photoForm.photo_data;
      if (photoForm.photo_data.startsWith('data:')) {
        photoPayload = await uploadDataUrl(photoForm.photo_data, order.order_id, 'photos');
      }
      const updated = await ServiceOrderService.addPhoto(order.order_id, {
        caption: photoForm.caption,
        photo_data: photoPayload,
      });
      setOrder(updated);
      setPhotoForm({ photo_data: '', caption: '' });
    };

    try {
      if (!navigator.onLine) {
        await addPendingPhoto();
        return;
      }
      await submitOnline();
    } catch (error) {
      if (isNetworkError(error)) {
        await addPendingPhoto();
      } else {
        console.error('Foto konnte nicht gespeichert werden', error);
      }
    }
  };

  const handlePhotoDelete = async (photoId) => {
    if (typeof photoId === 'string' && photoId.startsWith('offline-photo')) {
      await removeQueuedPhoto(photoId);
      setOrder((prev) => ({
        ...prev,
        photos: prev.photos.filter((photo) => photo.photo_id !== photoId),
      }));
      return;
    }
    try {
      const updated = await ServiceOrderService.deletePhoto(order.order_id, photoId);
      setOrder(updated);
    } catch (error) {
      console.error('Foto konnte nicht gelöscht werden', error);
    }
  };

  const handleSignatureSubmit = async (event) => {
    event.preventDefault();
    if (!order || !signatureForm.signature_data) {
      return;
    }
    try {
      let signatureData = signatureForm.signature_data;
      if (navigator.onLine && signatureForm.signature_data.startsWith('data:')) {
        try {
          signatureData = await uploadDataUrl(signatureForm.signature_data, order.order_id, 'signatures');
        } catch (uploadError) {
          console.warn('Signatur-Upload fehlgeschlagen, verwende lokale Daten.', uploadError);
        }
      }
      const updated = await ServiceOrderService.setSignature(order.order_id, {
        signed_by: signatureForm.signed_by,
        signature_data: signatureData,
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

  const handleDownloadReport = async () => {
    if (!order) {
      return;
    }

    try {
      const doc = await createServiceReportPdf(order);
      doc.save(`Servicebericht-${order.order_id}.pdf`);
    } catch (error) {
      console.error('PDF konnte nicht erstellt werden', error);
      window.alert('Der Servicebericht konnte nicht erzeugt werden.');
    }
  };

  const handleSendReport = async () => {
    if (!order || sendingReport) {
      return;
    }

    const defaultRecipient = order.service_recipient_email || order.account_email || '';
    const to = window.prompt('Empfänger E-Mail-Adresse', defaultRecipient);
    if (!to) {
      return;
    }

    try {
      setSendingReport(true);
      const doc = await createServiceReportPdf(order);
      const pdfData = pdfToDataUri(doc);
      await ServiceOrderService.sendReport(order.order_id, {
        to,
        pdfData,
        filename: `Servicebericht-${order.order_id}.pdf`,
        subject: `Servicebericht ${order.title || `#${order.order_id}`}`,
        message: `Guten Tag,\n\nanbei erhalten Sie den Servicebericht zum Auftrag "${
          order.title || `#${order.order_id}`
        }".\n\nMit freundlichen Grüßen\nIhr Serviceteam`,
      });
      window.alert('Servicebericht wurde versendet.');
    } catch (error) {
      console.error('Servicebericht konnte nicht gesendet werden', error);
      window.alert('Servicebericht konnte nicht gesendet werden. Bitte versuchen Sie es erneut.');
    } finally {
      setSendingReport(false);
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
          <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={handleDownloadReport}>
            Servicebericht (PDF)
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<SendIcon />}
            disabled={sendingReport}
            onClick={handleSendReport}
          >
            Als PDF senden
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
                order.time_entries.map((entry) => {
                  const isPending = Boolean(entry.pending);
                  return (
                    <Box key={entry.time_entry_id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle2">{entry.employee_name}</Typography>
                          {isPending && <Chip size="small" color="warning" label="Offline" />}
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {entry.start_time ? dayjs(entry.start_time).format('DD.MM.YYYY HH:mm') : '--:--'} - {entry.end_time ? dayjs(entry.end_time).format('HH:mm') : '--:--'} ({entry.duration_minutes ?? 0} Minuten)
                        </Typography>
                        {entry.notes && (
                          <Typography variant="body2" color="text.secondary">{entry.notes}</Typography>
                        )}
                      </Box>
                      <Tooltip title={isPending ? 'Synchronisation ausstehend' : 'Löschen'}>
                        <span>
                          <IconButton
                            onClick={() => handleTimeEntryDelete(entry.time_entry_id)}
                            disabled={isPending}
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  );
                })
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
                order.photos.map((photo) => {
                  const isPending = Boolean(photo.pending);
                  const photoSrc = resolveImageSource(photo);
                  return (
                    <Box key={photo.photo_id} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {photoSrc ? (
                        <img
                          src={photoSrc}
                          alt={photo.caption || 'Auftragsfoto'}
                          style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8, marginRight: 16 }}
                        />
                      ) : (
                        <Box sx={{ width: 96, height: 96, bgcolor: 'grey.200', borderRadius: 2, mr: 2 }} />
                      )}
                      <Box sx={{ flexGrow: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle2">{photo.caption || 'Ohne Beschreibung'}</Typography>
                          {isPending && <Chip size="small" color="warning" label="Offline" />}
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {photo.created_at ? dayjs(photo.created_at).format('DD.MM.YYYY HH:mm') : ''}
                        </Typography>
                      </Box>
                      <Tooltip title={isPending ? 'Synchronisation ausstehend' : 'Löschen'}>
                        <span>
                          <IconButton onClick={() => handlePhotoDelete(photo.photo_id)} disabled={isPending} size="small">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  );
                })
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
                  {(() => {
                    const signatureSrc = resolveSignatureSource(order.signature);
                    if (signatureSrc && (signatureSrc.startsWith('http') || signatureSrc.startsWith('data:image'))) {
                      return (
                        <img
                          src={signatureSrc}
                          alt="Signatur"
                          style={{ maxWidth: '100%', marginTop: 16, border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8 }}
                        />
                      );
                    }
                    if (signatureSrc) {
                      return (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                          {signatureSrc}
                        </Typography>
                      );
                    }
                    return (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Keine Signatur hinterlegt.
                      </Typography>
                    );
                  })()}
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {order.signature.signed_at ? dayjs(order.signature.signed_at).format('DD.MM.YYYY HH:mm') : ''}
                  </Typography>
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
