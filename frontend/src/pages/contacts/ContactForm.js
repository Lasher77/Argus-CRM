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

// API Service für Kontakte
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

const ContactForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [contact, setContact] = useState({
    account_id: '',
    first_name: '',
    last_name: '',
    position: '',
    phone: '',
    mobile: '',
    email: '',
    address: '',
    birthday: '',
    is_primary_contact: 0,
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

  // Kontakt-Daten laden, wenn im Edit-Modus
  useEffect(() => {
    if (isEditMode) {
      const fetchContact = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`${API_URL}/contacts/${id}`);
          if (response.data.success) {
            setContact(response.data.data);
          } else {
            setError('Fehler beim Laden der Kontakt-Daten');
          }
        } catch (err) {
          console.error('Fehler beim Abrufen des Kontakts:', err);
          setError('Fehler beim Laden der Kontakt-Daten');
        } finally {
          setLoading(false);
        }
      };

      fetchContact();
    }
  }, [id, isEditMode]);

  // Formular-Eingaben aktualisieren
  const handleChange = (e) => {
    const { name, value } = e.target;
    setContact(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Checkbox-Änderungen behandeln
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setContact(prev => ({
      ...prev,
      [name]: checked ? 1 : 0
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
        // Kontakt aktualisieren
        response = await axios.put(`${API_URL}/contacts/${id}`, contact);
      } else {
        // Neuen Kontakt erstellen
        response = await axios.post(`${API_URL}/contacts`, contact);
      }

      if (response.data.success) {
        setSuccess(true);
        // Nach erfolgreicher Speicherung zur Kontakt-Liste zurückkehren
        setTimeout(() => {
          navigate('/contacts');
        }, 1500);
      } else {
        setError('Fehler beim Speichern des Kontakts');
      }
    } catch (err) {
      console.error('Fehler beim Speichern des Kontakts:', err);
      setError('Fehler beim Speichern des Kontakts');
    } finally {
      setSaving(false);
    }
  };

  // Zurück zur Kontakt-Liste
  const handleBack = () => {
    navigate('/contacts');
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
            {isEditMode ? 'Kontakt bearbeiten' : 'Neuer Kontakt'}
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
                    <Grid item xs={12}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel id="account-select-label">Account</InputLabel>
                        <Select
                          labelId="account-select-label"
                          id="account-select"
                          name="account_id"
                          value={contact.account_id || ''}
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
                  </Grid>
                </CardContent>
              </FormCard>
            </Grid>

            <Grid item xs={12}>
              <FormCard>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Persönliche Informationen
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        required
                        label="Vorname"
                        name="first_name"
                        value={contact.first_name || ''}
                        onChange={handleChange}
                        variant="outlined"
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        required
                        label="Nachname"
                        name="last_name"
                        value={contact.last_name || ''}
                        onChange={handleChange}
                        variant="outlined"
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Position"
                        name="position"
                        value={contact.position || ''}
                        onChange={handleChange}
                        variant="outlined"
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Geburtstag"
                        name="birthday"
                        type="date"
                        value={contact.birthday || ''}
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
                  <Typography variant="h6" gutterBottom>
                    Kontaktinformationen
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Telefon"
                        name="phone"
                        value={contact.phone || ''}
                        onChange={handleChange}
                        variant="outlined"
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Mobiltelefon"
                        name="mobile"
                        value={contact.mobile || ''}
                        onChange={handleChange}
                        variant="outlined"
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="E-Mail"
                        name="email"
                        type="email"
                        value={contact.email || ''}
                        onChange={handleChange}
                        variant="outlined"
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Adresse"
                        name="address"
                        value={contact.address || ''}
                        onChange={handleChange}
                        variant="outlined"
                        margin="normal"
                        multiline
                        rows={2}
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
                      <FormControl fullWidth margin="normal">
                        <InputLabel id="primary-contact-label">Hauptkontakt</InputLabel>
                        <Select
                          labelId="primary-contact-label"
                          id="primary-contact-select"
                          name="is_primary_contact"
                          value={contact.is_primary_contact || 0}
                          onChange={handleChange}
                          label="Hauptkontakt"
                        >
                          <MenuItem value={0}>Nein</MenuItem>
                          <MenuItem value={1}>Ja</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Notizen"
                        name="notes"
                        value={contact.notes || ''}
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
          Kontakt erfolgreich {isEditMode ? 'aktualisiert' : 'erstellt'}!
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

export default ContactForm;
