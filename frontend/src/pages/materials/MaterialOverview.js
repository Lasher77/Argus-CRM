import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Divider,
  CircularProgress,
  Grid,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RefreshIcon from '@mui/icons-material/Refresh';
import MaterialService from '../../services/materialService';

const unitOptions = ['Stk.', 'm', 'm²', 'Liter', 'kg', 'Kartusche'];

const MaterialOverview = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    sku: '',
    unit: 'Stk.',
    stock: 0,
    reorder_level: 0,
    supplier_name: '',
    supplier_article_number: '',
    supplier_price: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const data = await MaterialService.getMaterials();
      setMaterials(data);
    } catch (error) {
      console.error('Materialien konnten nicht geladen werden', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const handleAdjust = async (materialId, delta) => {
    try {
      await MaterialService.adjustStock(materialId, delta);
      await loadMaterials();
    } catch (error) {
      console.error('Bestandsänderung fehlgeschlagen', error);
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        stock: Number(form.stock) || 0,
        reorder_level: Number(form.reorder_level) || 0,
        supplier_price: form.supplier_price ? Number(form.supplier_price) : null
      };
      await MaterialService.createMaterial(payload);
      setForm({ name: '', sku: '', unit: 'Stk.', stock: 0, reorder_level: 0, supplier_name: '', supplier_article_number: '', supplier_price: '', notes: '' });
      await loadMaterials();
    } catch (error) {
      console.error('Material konnte nicht angelegt werden', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4">Materialverwaltung</Typography>
          <Typography variant="body1" color="text.secondary">
            Überwachen Sie Lagerbestände und hinterlegen Sie Lieferantenpreise.
          </Typography>
        </Box>
        <Button startIcon={<RefreshIcon />} onClick={loadMaterials}>Aktualisieren</Button>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card elevation={1}>
            <CardContent>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Material</TableCell>
                        <TableCell>Bestand</TableCell>
                        <TableCell>Lieferant</TableCell>
                        <TableCell align="right">Aktionen</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {materials.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            Noch keine Materialien angelegt.
                          </TableCell>
                        </TableRow>
                      ) : (
                        materials.map((material) => (
                          <TableRow key={material.material_id} hover>
                            <TableCell>
                              <Stack spacing={0.5}>
                                <Typography variant="subtitle2">{material.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{material.sku || 'Ohne Artikelnummer'}</Typography>
                                <Stack direction="row" spacing={1}>
                                  <Chip size="small" label={material.unit} />
                                  {material.low_stock && <Chip size="small" color="error" label="Bestand niedrig" />}
                                </Stack>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{material.stock} {material.unit}</Typography>
                              <Typography variant="caption" color="text.secondary">Meldebestand: {material.reorder_level} {material.unit}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{material.supplier_name || '---'}</Typography>
                              {material.supplier_price && (
                                <Typography variant="caption" color="text.secondary">Preis: {material.supplier_price.toFixed(2)} €</Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="Bestand erhöhen">
                                <IconButton size="small" onClick={() => handleAdjust(material.material_id, 1)}>
                                  <ArrowUpwardIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Bestand verringern">
                                <IconButton size="small" onClick={() => handleAdjust(material.material_id, -1)}>
                                  <ArrowDownwardIcon fontSize="small" />
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
        </Grid>

        <Grid item xs={12} md={5}>
          <Card elevation={1} component="form" onSubmit={handleCreate}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Neues Material</Typography>
              <Stack spacing={2}>
                <TextField
                  label="Bezeichnung"
                  required
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                />
                <TextField
                  label="Artikelnummer"
                  value={form.sku}
                  onChange={(event) => setForm((prev) => ({ ...prev, sku: event.target.value }))}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Einheit"
                    select
                    value={form.unit}
                    onChange={(event) => setForm((prev) => ({ ...prev, unit: event.target.value }))}
                  >
                    {unitOptions.map((unit) => (
                      <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Bestand"
                    type="number"
                    value={form.stock}
                    onChange={(event) => setForm((prev) => ({ ...prev, stock: event.target.value }))}
                  />
                  <TextField
                    label="Meldebestand"
                    type="number"
                    value={form.reorder_level}
                    onChange={(event) => setForm((prev) => ({ ...prev, reorder_level: event.target.value }))}
                  />
                </Stack>
                <Divider />
                <TextField
                  label="Lieferant"
                  value={form.supplier_name}
                  onChange={(event) => setForm((prev) => ({ ...prev, supplier_name: event.target.value }))}
                />
                <TextField
                  label="Lieferanten-Nr."
                  value={form.supplier_article_number}
                  onChange={(event) => setForm((prev) => ({ ...prev, supplier_article_number: event.target.value }))}
                />
                <TextField
                  label="Einkaufspreis (€)"
                  type="number"
                  value={form.supplier_price}
                  onChange={(event) => setForm((prev) => ({ ...prev, supplier_price: event.target.value }))}
                />
                <TextField
                  label="Notiz"
                  multiline
                  minRows={2}
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                />
                <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={saving}>
                  {saving ? 'Speichern...' : 'Material anlegen'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MaterialOverview;
