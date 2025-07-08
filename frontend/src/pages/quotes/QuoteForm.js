import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField, 
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

// API Service
const API_URL = 'http://localhost:3000/api';

// Styled-Komponente für den Header-Bereich
const HeaderBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
}));

// Styled-Komponente für die Form-Karte
const FormCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

// Funktion zum Formatieren von Währungsbeträgen
const formatCurrency = (amount) => {
  const numericAmount = Number(amount);
  if (isNaN(numericAmount)) {
    return 'N/A';
  }
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(numericAmount);
};

const QuoteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [properties, setProperties] = useState([]); // State für Hausobjekte
  const [products, setProducts] = useState([]);
  const [quote, setQuote] = useState({
    account_id: '',
    property_id: '', // Hausobjekt ist jetzt Pflicht
    // contact_id: '', // Entfernt
    quote_number: '', 
    quote_date: new Date().toISOString().split('T')[0], 
    valid_until: '',
    status: 'created', 
    notes: '',
    total_net: 0,
    total_gross: 0,
    items: []
  });

  const isEditMode = !!id;

  // Accounts laden für die Auswahl
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await axios.get(`${API_URL}/accounts`);
        if (response.data.success) {
          setAccounts(response.data.data);
        }
      } catch (err) {
        console.error('Fehler beim Abrufen der Accounts:', err);
        setError('Fehler beim Laden der Accounts.');
      }
    };
    fetchAccounts();
  }, []);

  // *** GEÄNDERT: Hausobjekte laden, wenn ein Account ausgewählt wird ***
  useEffect(() => {
    if (quote.account_id) {
      const fetchProperties = async () => {
        try {
          const response = await axios.get(`${API_URL}/accounts/${quote.account_id}/properties`);
          if (response.data.success) {
            setProperties(response.data.data);
            // Reset property_id if the current one is not in the new list
            if (!response.data.data.some(p => p.property_id === quote.property_id)) {
              setQuote(prev => ({ ...prev, property_id: '' }));
            }
          } else {
            setProperties([]);
            setQuote(prev => ({ ...prev, property_id: '' }));
          }
        } catch (err) {
          console.error('Fehler beim Abrufen der Hausobjekte:', err);
          setProperties([]);
          setQuote(prev => ({ ...prev, property_id: '' }));
          setError('Fehler beim Laden der Hausobjekte für diesen Account.');
        }
      };
      fetchProperties();
    } else {
      setProperties([]); // Reset properties if no account is selected
      setQuote(prev => ({ ...prev, property_id: '' }));
    }
  }, [quote.account_id]); // Abhängigkeit von account_id
  // *** ENDE GEÄNDERT ***

  // Produkte laden für die Auswahl (optional, da wir zu Freitext wechseln)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API_URL}/products`);
        if (response.data.success) {
          setProducts(response.data.data);
        }
      } catch (err) {
        console.error('Fehler beim Abrufen der Produkte:', err);
        // setError('Fehler beim Laden der Produkte.'); // Optional
      }
    };
    fetchProducts();
  }, []);

  // Angebots-Daten laden, wenn im Edit-Modus
  useEffect(() => {
    if (isEditMode) {
      const fetchQuote = async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await axios.get(`${API_URL}/quotes/${id}`);
          if (response.data.success) {
            const fetchedData = response.data.data;
            // Stelle sicher, dass items ein Array ist
            fetchedData.items = Array.isArray(fetchedData.items) ? fetchedData.items : [];
            // Konvertiere Datumswerte für Input-Felder
            fetchedData.quote_date = fetchedData.quote_date ? new Date(fetchedData.quote_date).toISOString().split('T')[0] : '';
            fetchedData.valid_until = fetchedData.valid_until ? new Date(fetchedData.valid_until).toISOString().split('T')[0] : '';
            // Entferne contact_id, falls es noch vom Backend kommt (sollte nicht, aber sicher ist sicher)
            delete fetchedData.contact_id;
            setQuote(fetchedData);
          } else {
            setError(response.data.message || 'Fehler beim Laden der Angebots-Daten');
          }
        } catch (err) {
          console.error('Fehler beim Abrufen des Angebots:', err);
          setError(err.response?.data?.message || 'Fehler beim Laden der Angebots-Daten');
        } finally {
          setLoading(false);
        }
      };
      fetchQuote();
    }
  }, [id, isEditMode]);

  // Formular-Eingaben aktualisieren
  const handleChange = (e) => {
    const { name, value } = e.target;
    setQuote(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Neues Item zum Angebot hinzufügen
  const handleAddItem = () => {
    setQuote(prev => ({
      ...prev,
      items: [
        ...(Array.isArray(prev.items) ? prev.items : []), // Sicherstellen, dass items ein Array ist
        {
          // product_id: '', // Vorerst entfernt für Freitext
          description: '',
          quantity: 1,
          unit: 'Stk', // Standardeinheit
          unit_price: 0,
          vat_rate: 19, // Standard MwSt.
          total_net: 0,
          total_gross: 0,
          position: (Array.isArray(prev.items) ? prev.items.length : 0) + 1 // Position automatisch setzen
        }
      ]
    }));
  };

  // Item aus dem Angebot entfernen
  const handleRemoveItem = (index) => {
    setQuote(prev => ({
      ...prev,
      items: (Array.isArray(prev.items) ? prev.items : []).filter((_, i) => i !== index)
    }));
  };

  // Item-Eingaben aktualisieren und Summen neu berechnen
  const handleItemChange = (index, field, value) => {
    setQuote(prev => {
      const updatedItems = [...(Array.isArray(prev.items) ? prev.items : [])];
      if (!updatedItems[index]) return prev; // Sicherheitscheck

      let numericValue = value;
      if (['quantity', 'unit_price', 'vat_rate'].includes(field)) {
        numericValue = parseFloat(value) || 0;
      }

      updatedItems[index] = {
        ...updatedItems[index],
        [field]: numericValue
      };

      // Neuberechnung der Zeilensummen
      const item = updatedItems[index];
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      const vatRate = Number(item.vat_rate) || 0;
      
      item.total_net = quantity * unitPrice;
      item.total_gross = item.total_net * (1 + vatRate / 100);

      return {
        ...prev,
        items: updatedItems
      };
    });
  };

  // Gesamtbeträge neu berechnen, wenn sich Items ändern
  useEffect(() => {
    const calculateTotals = () => {
      const currentItems = Array.isArray(quote.items) ? quote.items : [];
      const totalNet = currentItems.reduce((sum, item) => sum + (Number(item.total_net) || 0), 0);
      const totalGross = currentItems.reduce((sum, item) => sum + (Number(item.total_gross) || 0), 0);
      setQuote(prev => ({
        ...prev,
        total_net: totalNet,
        total_gross: totalGross
      }));
    };
    calculateTotals();
  }, [quote.items]);

  // Formular absenden
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    // Stelle sicher, dass items ein Array ist
    const submissionData = {
        ...quote,
        items: Array.isArray(quote.items) ? quote.items : []
    };

    // Entferne contact_id explizit vor dem Senden
    delete submissionData.contact_id;

    try {
      let response;
      if (isEditMode) {
        response = await axios.put(`${API_URL}/quotes/${id}`, submissionData);
      } else {
        response = await axios.post(`${API_URL}/quotes`, submissionData);
      }

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/quotes');
        }, 1500);
      } else {
        setError(response.data.message || 'Fehler beim Speichern des Angebots');
      }
    } catch (err) {
      console.error('Fehler beim Speichern des Angebots:', err);
      setError(err.response?.data?.message || 'Fehler beim Speichern des Angebots');
    } finally {
      setSaving(false);
    }
  };

  // Zurück zur Angebots-Liste
  const handleBack = () => {
    navigate('/quotes');
  };

  if (loading && isEditMode) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <HeaderBox>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            Zurück
          </Button>
          <Typography variant="h4">
            {isEditMode ? `Angebot #${quote.quote_number} bearbeiten` : 'Neues Angebot erstellen'}
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<SaveIcon />}
          onClick={handleSubmit}
          // *** GEÄNDERT: Speichern deaktivieren, wenn kein Account/Hausobjekt gewählt ***
          disabled={saving || !quote.account_id || !quote.property_id} 
        >
          {saving ? 'Wird gespeichert...' : 'Speichern'}
        </Button>
      </HeaderBox>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormCard>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Allgemeine Informationen
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth margin="normal" required>
                        <InputLabel id="account-select-label">Account *</InputLabel>
                        <Select
                          labelId="account-select-label"
                          id="account-select"
                          name="account_id"
                          value={quote.account_id || ''}
                          onChange={handleChange}
                          label="Account *"
                        >
                          <MenuItem value="">
                            <em>Account auswählen</em>
                          </MenuItem>
                          {accounts.map((account) => (
                            <MenuItem key={account.account_id} value={account.account_id}>
                              {account.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    {/* *** GEÄNDERT: Kontakt-Auswahl durch Hausobjekt-Auswahl ersetzt *** */}
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth margin="normal" required disabled={!quote.account_id}> 
                        <InputLabel id="property-select-label">Hausobjekt *</InputLabel>
                        <Select
                          labelId="property-select-label"
                          id="property-select"
                          name="property_id"
                          value={quote.property_id || ''}
                          onChange={handleChange}
                          label="Hausobjekt *"
                        >
                          <MenuItem value="">
                            <em>Hausobjekt auswählen</em>
                          </MenuItem>
                          {properties.map((property) => (
                            <MenuItem key={property.property_id} value={property.property_id}>
                              {`${property.name} – ${property.address || ''}${property.postal_code ? ', ' + property.postal_code : ''} ${property.city || ''}`}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    {/* *** ENDE GEÄNDERT *** */}
                    <Grid item xs={12} md={6}>
                       <TextField
                        fullWidth
                        required
                        label="Angebotsnummer *"
                        name="quote_number" 
                        value={quote.quote_number || ''}
                        onChange={handleChange}
                        variant="outlined"
                        margin="normal"
                      />
                    </Grid>
                     <Grid item xs={12} md={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel id="status-select-label">Status</InputLabel>
                        <Select
                          labelId="status-select-label"
                          id="status-select"
                          name="status"
                          value={quote.status || 'created'}
                          onChange={handleChange}
                          label="Status"
                        >
                          <MenuItem value="created">Erstellt</MenuItem>
                          <MenuItem value="sent">Gesendet</MenuItem>
                          <MenuItem value="accepted">Akzeptiert</MenuItem>
                          <MenuItem value="rejected">Abgelehnt</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        required
                        label="Angebotsdatum *"
                        name="quote_date" 
                        type="date"
                        value={quote.quote_date || ''}
                        onChange={handleChange}
                        variant="outlined"
                        margin="normal"
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Gültig bis"
                        name="valid_until"
                        type="date"
                        value={quote.valid_until || ''}
                        onChange={handleChange}
                        variant="outlined"
                        margin="normal"
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </FormCard>
            </Grid>

            <Grid item xs={12}>
              <FormCard>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Positionen
                    </Typography>
                    <Button 
                      variant="outlined" 
                      startIcon={<AddIcon />} 
                      onClick={handleAddItem}
                    >
                      Position hinzufügen
                    </Button>
                  </Box>
                  
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ width: '5%' }}>Pos.</TableCell>
                          <TableCell sx={{ width: '40%' }}>Beschreibung</TableCell>
                          <TableCell sx={{ width: '10%' }} align="right">Menge</TableCell>
                          <TableCell sx={{ width: '10%' }}>Einheit</TableCell>
                          <TableCell sx={{ width: '10%' }} align="right">Einzelpreis</TableCell>
                          <TableCell sx={{ width: '10%' }} align="right">MwSt.(%)</TableCell>
                          <TableCell sx={{ width: '10%' }} align="right">Netto</TableCell>
                          {/* <TableCell align="right">Brutto</TableCell> */}
                          <TableCell sx={{ width: '5%' }}></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(Array.isArray(quote.items) ? quote.items : []).map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.position}</TableCell>
                            <TableCell>
                              <TextField
                                fullWidth
                                multiline // Für Freitext
                                value={item.description || ''}
                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                variant="standard"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                value={item.quantity || 1}
                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                variant="standard"
                                inputProps={{ min: 0, step: 0.1 }}
                                sx={{ width: '70px' }}
                              />
                            </TableCell>
                             <TableCell>
                              <TextField
                                value={item.unit || 'Stk'}
                                onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                variant="standard"
                                sx={{ width: '60px' }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                value={item.unit_price || 0}
                                onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                variant="standard"
                                inputProps={{ min: 0, step: 0.01 }}
                                sx={{ width: '80px' }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                value={item.vat_rate || 19}
                                onChange={(e) => handleItemChange(index, 'vat_rate', e.target.value)}
                                variant="standard"
                                inputProps={{ min: 0, step: 1 }}
                                sx={{ width: '60px' }}
                              />
                            </TableCell>
                            <TableCell align="right">{formatCurrency(item.total_net)}</TableCell>
                            {/* <TableCell align="right">{formatCurrency(item.total_gross)}</TableCell> */}
                            <TableCell align="center">
                              <IconButton onClick={() => handleRemoveItem(index)} size="small">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </FormCard>
            </Grid>

            <Grid item xs={12}>
              <FormCard>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Zusammenfassung & Notizen
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Notizen"
                        name="notes"
                        value={quote.notes || ''}
                        onChange={handleChange}
                        variant="outlined"
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ textAlign: 'right', mt: 2 }}>
                        <Typography variant="subtitle1">Gesamt Netto: {formatCurrency(quote.total_net)}</Typography>
                        <Typography variant="h6">Gesamt Brutto: {formatCurrency(quote.total_gross)}</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </FormCard>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Snackbar für Erfolgs- und Fehlermeldungen */} 
      <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Angebot erfolgreich gespeichert!
        </Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default QuoteForm;

