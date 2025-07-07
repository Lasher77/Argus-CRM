import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DescriptionIcon from '@mui/icons-material/Description';
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

// Styled-Komponente für die Info-Karte
const InfoCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [property, setProperty] = useState(null);
  const [account, setAccount] = useState(null);
  const [contact, setContact] = useState(null);

  // Hausobjekt-Daten laden
  useEffect(() => {
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
  }, [id]);

  // Account-Daten laden, wenn Hausobjekt geladen wurde
  useEffect(() => {
    if (property && property.account_id) {
      const fetchAccount = async () => {
        try {
          const response = await axios.get(`${API_URL}/accounts/${property.account_id}`);
          if (response.data.success) {
            setAccount(response.data.data);
          }
        } catch (err) {
          console.error('Fehler beim Abrufen des Accounts:', err);
        }
      };

      fetchAccount();
    }
  }, [property]);

  // Kontakt-Daten laden, wenn Hausobjekt geladen wurde
  useEffect(() => {
    if (property && property.contact_id) {
      const fetchContact = async () => {
        try {
          const response = await axios.get(`${API_URL}/contacts/${property.contact_id}`);
          if (response.data.success) {
            setContact(response.data.data);
          }
        } catch (err) {
          console.error('Fehler beim Abrufen des Kontakts:', err);
        }
      };

      fetchContact();
    }
  }, [property]);

  // Zurück zur Hausobjekt-Liste
  const handleBack = () => {
    navigate('/properties');
  };

  // Zum Bearbeiten-Formular navigieren
  const handleEdit = () => {
    navigate(`/properties/edit/${id}`);
  };

  // Zum Account navigieren
  const handleAccountClick = () => {
    if (account) {
      navigate(`/accounts/${account.account_id}`);
    }
  };

  // Zum Kontakt navigieren
  const handleContactClick = () => {
    if (contact) {
      navigate(`/contacts/${contact.contact_id}`);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !property) {
    return (
      <Box>
        <HeaderBox>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={handleBack}
          >
            Zurück
          </Button>
        </HeaderBox>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error">
            {error || 'Hausobjekt nicht gefunden'}
          </Typography>
        </Paper>
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
            {property.name}
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<EditIcon />}
          onClick={handleEdit}
        >
          Bearbeiten
        </Button>
      </HeaderBox>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 3 }}>
            <InfoCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Hausobjekt-Informationen
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <HomeIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Name" 
                          secondary={property.name} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <LocationOnIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Adresse" 
                          secondary={property.address} 
                        />
                      </ListItem>
                      {(property.postal_code || property.city) && (
                        <ListItem>
                          <ListItemIcon>
                            <LocationOnIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary="PLZ / Ort" 
                            secondary={`${property.postal_code || ''} ${property.city || ''}`} 
                          />
                        </ListItem>
                      )}
                      {property.country && (
                        <ListItem>
                          <ListItemIcon>
                            <LocationOnIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Land" 
                            secondary={property.country} 
                          />
                        </ListItem>
                      )}
                    </List>
                  </Grid>
                  {property.notes && (
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle1" gutterBottom>
                        Notizen
                      </Typography>
                      <Typography variant="body2">
                        {property.notes}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </InfoCard>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          {account && (
            <Paper sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Zugehöriger Account
                </Typography>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 6 },
                    mb: 2
                  }}
                  onClick={handleAccountClick}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {account.name}
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <BusinessIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Adresse" 
                          secondary={account.address || 'Nicht angegeben'} 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </CardContent>
            </Paper>
          )}

          {contact && (
            <Paper sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Zuständiger Kontakt
                </Typography>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 6 }
                  }}
                  onClick={handleContactClick}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {`${contact.first_name} ${contact.last_name}`}
                    </Typography>
                    {contact.is_primary_contact === 1 && (
                      <Chip 
                        label="Hauptkontakt" 
                        color="primary" 
                        size="small" 
                        sx={{ mb: 1 }}
                      />
                    )}
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <PersonIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Position" 
                          secondary={contact.position || 'Nicht angegeben'} 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </CardContent>
            </Paper>
          )}
        </Grid>
      </Grid>

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

export default PropertyDetail;
