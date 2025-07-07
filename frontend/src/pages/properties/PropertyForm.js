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
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import axios from 'axios';

// API Service für Hausobjekte
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

const PropertyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [property, setProperty] = useState({
    account_id: '',
    contact_id: '',
    name: '',
    address: '',
    alt_invoice_address: '',
    city: '',
    postal_code: '',
    country: '',
    notes: ''
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
      }
    };

    fetchAccounts();
  }, []);

  // Kontakte für den ausgewählten Account laden
  useEffect(() => {
    if (property.account_id) {
      const fetchContacts = async () => {
        try {
          const response = await axios.get(`${API_URL}/accounts/${property.account_id}/contacts`);
          if (response.data.success) {
            setContacts(response.data.data);
          }
        } catch (err) {
          console.error('Fehler beim Abrufen der Kontakte:', err);
        }
      };

      fetchContacts();
    } else {
      setContacts([]);
    }
  }, [property.account_id]);

  // Hausobjekt-Daten laden, wenn im Edit-Modus
  useEffect(() => {
    if (isEditMode) {
      const fetchProperty = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`${API_URL}/properties/${id}`);
          if (response.data.success) {
            setProperty(response.data.data);
          } else {
            setError('Fehler beim Laden der Hausobjekt-Daten');
          }
        } catch (err) {
          console.error('Fehler beim Abrufen des Hausobjekts:', err);
          setError('Fehler beim Laden der Hausobjekt-Daten');
        } finally {
          setLoading(false);
        }
      };

      fetchProperty();
    }
  }, [id, isEditMode]);

  // Formular-Eingaben aktualisieren
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProperty(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Formular absenden
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let response;
      
      if (isEditMode) {
        // Hausobjekt aktualisieren
        response = await axios.put(`${API_URL}/properties/${id}`, property);
      } else {
        // Neues Hausobjekt erstellen
        response = await axios.post(`${API_URL}/properties`, property);
      }

      if (response.data.success) {
        setSuccess(true);
        // Nach erfolgreicher Speicherung zur Hausobjekt-Liste zurückkehren
        setTimeout(() => {
          navigate('/properties');
        }, 1500);
      } else {
        setError('Fehler beim Speichern des Hausobjekts');
      }
    } catch (err) {
      console.error('Fehler beim Speichern des Hausobjekts:', err);
      setError('Fehler beim Speichern des Hausobjekts');
    } finally {
      setSaving(false);
    }
  };

  // Zurück zur Hausobjekt-Liste
  const handleBack = () => {
    navigate('/properties');
  };

  if (loading) {
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
            {isEditMode ? 'Hausobjekt bearbeiten' : 'Neues Hausobjekt'}
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<SaveIcon />}
          onClick={handleSubmit}
          disabled={saving}
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
                    Zuordnung
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel id="account-select-label">Account</InputLabel>
                        <Select
                          labelId="account-select-label"
                          id="account-select"
                          name="account_id"
                          value={property.account_id || ''}
                          onChange={handleChange}
                          label="Account"
                          required
                        >
                          {accounts.map((account) => (
                            <MenuItem key={account.account_id} value={account.account_id}>
                              {account.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel id="contact-select-label">Kontakt</InputLabel>
                        <Select
                          labelId="contact-select-label"
                          id="contact-select"
                          name="contact_id"
                          value={property.contact_id || ''}
                          onChange={handleChange}
                          label="Kontakt"
                          disabled={!property.account_id}
                        >
                          {contacts.map((contact) => (
                            <MenuItem key={contact.contact_id} value={contact.contact_id}>
                              {`${contact.first_name} ${contact.last_name}`}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </FormCard>
            </Grid>

            <Grid item xs={12}>
              <FormCard>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Hausobjekt-Informationen
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        required
                        label="Name"
                        name="name"
                        value={property.name || ''}
                        onChange={handleChange}
                        variant="outlined"
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        required
                        label="Adresse"
                        name="address"
                        value={property.address || ''}
                        onChange={handleChange}
                        variant="outlined"
                        margin="normal"
                        multiline
                        rows={2}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Alternative Rechnungsanschrift"
                        name="alt_invoice_address"
                        value={property.alt_invoice_address || ''}
                        onChange={handleChange}
                        variant="outlined"
                        margin="normal"
                        multiline
                        rows={2}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Stadt"
                        name="city"
                        value={property.city || ''}
                        onChange={handleChange}
                        variant="outlined"
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Postleitzahl"
                        name="postal_code"
                        value={property.postal_code || ''}
                        onChange={handleChange}
                        variant="outlined"
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Land"
                        name="country"
                        value={property.country || ''}
                        onChange={handleChange}
                        variant="outlined"
                        margin="normal"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </FormCard>
            </Grid>

            <Grid item xs={12}>
              <FormCard>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Zusätzliche Informationen
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Notizen"
                        name="notes"
                        value={property.notes || ''}
                        onChange={handleChange}
                        variant="outlined"
                        margin="normal"
                        multiline
                        rows={4}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </FormCard>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Snackbar 
        open={success} 
        autoHideDuration={3000} 
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Hausobjekt erfolgreich {isEditMode ? 'aktualisiert' : 'erstellt'}!
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!error} 
        autoHideDuration={3000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PropertyForm;
