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
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import axios from 'axios';

// API Service für Accounts
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

const AccountForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [account, setAccount] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    tax_number: '',
    notes: ''
  });

  const isEditMode = !!id;

  // Account-Daten laden, wenn im Edit-Modus
  useEffect(() => {
    if (isEditMode) {
      const fetchAccount = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`${API_URL}/accounts/${id}`);
          if (response.data.success) {
            setAccount(response.data.data);
          } else {
            setError('Fehler beim Laden der Account-Daten');
          }
        } catch (err) {
          console.error('Fehler beim Abrufen des Accounts:', err);
          setError('Fehler beim Laden der Account-Daten');
        } finally {
          setLoading(false);
        }
      };

      fetchAccount();
    }
  }, [id, isEditMode]);

  // Formular-Eingaben aktualisieren
  const handleChange = (e) => {
    const { name, value } = e.target;
    setAccount(prev => ({
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
        // Account aktualisieren
        response = await axios.put(`${API_URL}/accounts/${id}`, account);
      } else {
        // Neuen Account erstellen
        response = await axios.post(`${API_URL}/accounts`, account);
      }

      if (response.data.success) {
        setSuccess(true);
        // Nach erfolgreicher Speicherung zur Account-Liste zurückkehren
        setTimeout(() => {
          navigate('/accounts');
        }, 1500);
      } else {
        setError('Fehler beim Speichern des Accounts');
      }
    } catch (err) {
      console.error('Fehler beim Speichern des Accounts:', err);
      setError('Fehler beim Speichern des Accounts');
    } finally {
      setSaving(false);
    }
  };

  // Zurück zur Account-Liste
  const handleBack = () => {
    navigate('/accounts');
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
            {isEditMode ? 'Account bearbeiten' : 'Neuer Account'}
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
                    Allgemeine Informationen
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        required
                        label="Name"
                        name="name"
                        value={account.name || ''}
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
                        value={account.address || ''}
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
                    Kontaktinformationen
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Telefon"
                        name="phone"
                        value={account.phone || ''}
                        onChange={handleChange}
                        variant="outlined"
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="E-Mail"
                        name="email"
                        type="email"
                        value={account.email || ''}
                        onChange={handleChange}
                        variant="outlined"
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Website"
                        name="website"
                        value={account.website || ''}
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
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Steuernummer"
                        name="tax_number"
                        value={account.tax_number || ''}
                        onChange={handleChange}
                        variant="outlined"
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Notizen"
                        name="notes"
                        value={account.notes || ''}
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
          Account erfolgreich {isEditMode ? 'aktualisiert' : 'erstellt'}!
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

export default AccountForm;
