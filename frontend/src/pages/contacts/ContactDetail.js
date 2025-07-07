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
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import CakeIcon from '@mui/icons-material/Cake';
import WorkIcon from '@mui/icons-material/Work';
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

// Styled-Komponente für die Info-Karte
const InfoCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const ContactDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contact, setContact] = useState(null);
  const [account, setAccount] = useState(null);
  const [properties, setProperties] = useState([]);

  // Kontakt-Daten laden
  useEffect(() => {
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
  }, [id]);

  // Account-Daten laden, wenn Kontakt geladen wurde
  useEffect(() => {
    if (contact && contact.account_id) {
      const fetchAccount = async () => {
        try {
          const response = await axios.get(`${API_URL}/accounts/${contact.account_id}`);
          if (response.data.success) {
            setAccount(response.data.data);
          }
        } catch (err) {
          console.error('Fehler beim Abrufen des Accounts:', err);
        }
      };

      fetchAccount();
    }
  }, [contact]);

  // Hausobjekte laden, die diesem Kontakt zugeordnet sind
  useEffect(() => {
    if (contact) {
      const fetchProperties = async () => {
        try {
          const response = await axios.get(`${API_URL}/contacts/${id}/properties`);
          if (response.data.success) {
            setProperties(response.data.data);
          }
        } catch (err) {
          console.error('Fehler beim Abrufen der Hausobjekte:', err);
        }
      };

      fetchProperties();
    }
  }, [id, contact]);

  // Zurück zur Kontakt-Liste
  const handleBack = () => {
    navigate('/contacts');
  };

  // Zum Bearbeiten-Formular navigieren
  const handleEdit = () => {
    navigate(`/contacts/edit/${id}`);
  };

  // Zum Account navigieren
  const handleAccountClick = () => {
    if (account) {
      navigate(`/accounts/${account.account_id}`);
    }
  };

  // Zur Hausobjekt-Detailansicht navigieren
  const handlePropertyClick = (propertyId) => {
    navigate(`/properties/${propertyId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !contact) {
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
            {error || 'Kontakt nicht gefunden'}
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
            {`${contact.first_name} ${contact.last_name}`}
          </Typography>
          {contact.is_primary_contact === 1 && (
            <Chip 
              label="Hauptkontakt" 
              color="primary" 
              size="small" 
              sx={{ ml: 2 }}
            />
          )}
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
                  Persönliche Informationen
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <PersonIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Name" 
                          secondary={`${contact.first_name} ${contact.last_name}`} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <WorkIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Position" 
                          secondary={contact.position || 'Nicht angegeben'} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CakeIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Geburtstag" 
                          secondary={contact.birthday ? new Date(contact.birthday).toLocaleDateString() : 'Nicht angegeben'} 
                        />
                      </ListItem>
                    </List>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <PhoneIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Telefon" 
                          secondary={contact.phone || 'Nicht angegeben'} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <PhoneIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Mobiltelefon" 
                          secondary={contact.mobile || 'Nicht angegeben'} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <EmailIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="E-Mail" 
                          secondary={contact.email || 'Nicht angegeben'} 
                        />
                      </ListItem>
                    </List>
                  </Grid>
                  <Grid item xs={12}>
                    <ListItem>
                      <ListItemIcon>
                        <LocationOnIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Adresse" 
                        secondary={contact.address || 'Nicht angegeben'} 
                      />
                    </ListItem>
                  </Grid>
                  {contact.notes && (
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle1" gutterBottom>
                        Notizen
                      </Typography>
                      <Typography variant="body2">
                        {contact.notes}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </InfoCard>
          </Paper>

          {properties.length > 0 && (
            <Paper sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Zugeordnete Hausobjekte
                </Typography>
                <Grid container spacing={2}>
                  {properties.map((property) => (
                    <Grid item xs={12} md={6} key={property.property_id}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { boxShadow: 6 }
                        }}
                        onClick={() => handlePropertyClick(property.property_id)}
                      >
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {property.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {property.address}
                          </Typography>
                          {property.city && property.postal_code && (
                            <Typography variant="body2" color="textSecondary">
                              {`${property.postal_code} ${property.city}`}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Paper>
          )}
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
                    '&:hover': { boxShadow: 6 }
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
                      <ListItem>
                        <ListItemIcon>
                          <PhoneIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Telefon" 
                          secondary={account.phone || 'Nicht angegeben'} 
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

export default ContactDetail;
