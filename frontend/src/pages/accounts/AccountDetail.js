import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
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
import BusinessIcon from '@mui/icons-material/Business';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import HomeIcon from '@mui/icons-material/Home';
import ReceiptIcon from '@mui/icons-material/Receipt';
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

// Styled-Komponente für die Info-Karte
const InfoCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

// TabPanel-Komponente für die Tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`account-tabpanel-${index}`}
      aria-labelledby={`account-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AccountDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [account, setAccount] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [properties, setProperties] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tabValue, setTabValue] = useState(0);

  // Account-Daten laden
  useEffect(() => {
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
  }, [id]);

  // Kontakte des Accounts laden
  useEffect(() => {
    if (account) {
      const fetchContacts = async () => {
        try {
          const response = await axios.get(`${API_URL}/accounts/${id}/contacts`);
          if (response.data.success) {
            setContacts(response.data.data);
          }
        } catch (err) {
          console.error('Fehler beim Abrufen der Kontakte:', err);
        }
      };

      fetchContacts();
    }
  }, [id, account]);

  // Hausobjekte des Accounts laden
  useEffect(() => {
    if (account) {
      const fetchProperties = async () => {
        try {
          const response = await axios.get(`${API_URL}/accounts/${id}/properties`);
          if (response.data.success) {
            setProperties(response.data.data);
          }
        } catch (err) {
          console.error('Fehler beim Abrufen der Hausobjekte:', err);
        }
      };

      fetchProperties();
    }
  }, [id, account]);

  // Angebote des Accounts laden
  useEffect(() => {
    if (account) {
      const fetchQuotes = async () => {
        try {
          const response = await axios.get(`${API_URL}/accounts/${id}/quotes`);
          if (response.data.success) {
            setQuotes(response.data.data);
          }
        } catch (err) {
          console.error('Fehler beim Abrufen der Angebote:', err);
        }
      };

      fetchQuotes();
    }
  }, [id, account]);

  // Rechnungen des Accounts laden
  useEffect(() => {
    if (account) {
      const fetchInvoices = async () => {
        try {
          const response = await axios.get(`${API_URL}/accounts/${id}/invoices`);
          if (response.data.success) {
            setInvoices(response.data.data);
          }
        } catch (err) {
          console.error('Fehler beim Abrufen der Rechnungen:', err);
        }
      };

      fetchInvoices();
    }
  }, [id, account]);

  // Tab-Wechsel
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Zurück zur Account-Liste
  const handleBack = () => {
    navigate('/accounts');
  };

  // Zum Bearbeiten-Formular navigieren
  const handleEdit = () => {
    navigate(`/accounts/edit/${id}`);
  };

  // Zur Kontakt-Detailansicht navigieren
  const handleContactClick = (contactId) => {
    navigate(`/contacts/${contactId}`);
  };

  // Zur Hausobjekt-Detailansicht navigieren
  const handlePropertyClick = (propertyId) => {
    navigate(`/properties/${propertyId}`);
  };

  // Zur Angebots-Detailansicht navigieren
  const handleQuoteClick = (quoteId) => {
    navigate(`/quotes/${quoteId}`);
  };

  // Zur Rechnungs-Detailansicht navigieren
  const handleInvoiceClick = (invoiceId) => {
    navigate(`/invoices/${invoiceId}`);
  };

  // Neuen Kontakt erstellen
  const handleCreateContact = () => {
    navigate(`/contacts/new?account_id=${id}`);
  };

  // Neues Hausobjekt erstellen
  const handleCreateProperty = () => {
    navigate(`/properties/new?account_id=${id}`);
  };

  // Neues Angebot erstellen
  const handleCreateQuote = () => {
    navigate(`/quotes/new?account_id=${id}`);
  };

  // Neue Rechnung erstellen
  const handleCreateInvoice = () => {
    navigate(`/invoices/new?account_id=${id}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !account) {
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
            {error || 'Account nicht gefunden'}
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
            {account.name}
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

      <Paper sx={{ mb: 3 }}>
        <InfoCard>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Allgemeine Informationen
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <BusinessIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Name" 
                      secondary={account.name || 'Nicht angegeben'} 
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
                  <ListItem>
                    <ListItemIcon>
                      <EmailIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="E-Mail" 
                      secondary={account.email || 'Nicht angegeben'} 
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <LocationOnIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Adresse" 
                      secondary={account.address || 'Nicht angegeben'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <DescriptionIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Steuernummer" 
                      secondary={account.tax_number || 'Nicht angegeben'} 
                    />
                  </ListItem>
                </List>
              </Grid>
              {account.notes && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Notizen
                  </Typography>
                  <Typography variant="body2">
                    {account.notes}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </InfoCard>
      </Paper>

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="account tabs">
            <Tab label="Kontakte" icon={<PersonIcon />} iconPosition="start" />
            <Tab label="Hausobjekte" icon={<HomeIcon />} iconPosition="start" />
            <Tab label="Angebote" icon={<DescriptionIcon />} iconPosition="start" />
            <Tab label="Rechnungen" icon={<ReceiptIcon />} iconPosition="start" />
          </Tabs>
        </Box>
        
        {/* Kontakte Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleCreateContact}
            >
              Neuer Kontakt
            </Button>
          </Box>
          
          {contacts.length > 0 ? (
            <Grid container spacing={2}>
              {contacts.map((contact) => (
                <Grid item xs={12} md={6} lg={4} key={contact.contact_id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 6 }
                    }}
                    onClick={() => handleContactClick(contact.contact_id)}
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
                      <Typography variant="body2" color="textSecondary">
                        {contact.position || 'Keine Position angegeben'}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2">
                        <strong>Telefon:</strong> {contact.phone || 'Nicht angegeben'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>E-Mail:</strong> {contact.email || 'Nicht angegeben'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body1" color="textSecondary" align="center">
              Keine Kontakte vorhanden
            </Typography>
          )}
        </TabPanel>
        
        {/* Hausobjekte Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleCreateProperty}
            >
              Neues Hausobjekt
            </Button>
          </Box>
          
          {properties.length > 0 ? (
            <Grid container spacing={2}>
              {properties.map((property) => (
                <Grid item xs={12} md={6} lg={4} key={property.property_id}>
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
          ) : (
            <Typography variant="body1" color="textSecondary" align="center">
              Keine Hausobjekte vorhanden
            </Typography>
          )}
        </TabPanel>
        
        {/* Angebote Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleCreateQuote}
            >
              Neues Angebot
            </Button>
          </Box>
          
          {quotes.length > 0 ? (
            <Grid container spacing={2}>
              {quotes.map((quote) => (
                <Grid item xs={12} md={6} lg={4} key={quote.quote_id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 6 }
                    }}
                    onClick={() => handleQuoteClick(quote.quote_id)}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {quote.title}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Chip 
                          label={
                            quote.status === 'draft' ? 'Entwurf' :
                            quote.status === 'sent' ? 'Gesendet' :
                            quote.status === 'accepted' ? 'Akzeptiert' :
                            quote.status === 'rejected' ? 'Abgelehnt' :
                            quote.status
                          }
                          color={
                            quote.status === 'accepted' ? 'success' :
                            quote.status === 'rejected' ? 'error' :
                            quote.status === 'sent' ? 'primary' :
                            'default'
                          }
                          size="small"
                        />
                        <Typography variant="body2" color="textSecondary">
                          {new Date(quote.issue_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2">
                        <strong>Gesamtbetrag:</strong> {quote.total_amount ? `${quote.total_amount.toFixed(2)} €` : 'Nicht berechnet'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body1" color="textSecondary" align="center">
              Keine Angebote vorhanden
            </Typography>
          )}
        </TabPanel>
        
        {/* Rechnungen Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleCreateInvoice}
            >
              Neue Rechnung
            </Button>
          </Box>
          
          {invoices.length > 0 ? (
            <Grid container spacing={2}>
              {invoices.map((invoice) => (
                <Grid item xs={12} md={6} lg={4} key={invoice.invoice_id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 6 }
                    }}
                    onClick={() => handleInvoiceClick(invoice.invoice_id)}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {invoice.title}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Chip 
                          label={
                            invoice.status === 'draft' ? 'Entwurf' :
                            invoice.status === 'sent' ? 'Gesendet' :
                            invoice.status === 'paid' ? 'Bezahlt' :
                            invoice.status === 'overdue' ? 'Überfällig' :
                            invoice.status
                          }
                          color={
                            invoice.status === 'paid' ? 'success' :
                            invoice.status === 'overdue' ? 'error' :
                            invoice.status === 'sent' ? 'primary' :
                            'default'
                          }
                          size="small"
                        />
                        <Typography variant="body2" color="textSecondary">
                          {new Date(invoice.issue_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2">
                        <strong>Gesamtbetrag:</strong> {invoice.total_amount ? `${invoice.total_amount.toFixed(2)} €` : 'Nicht berechnet'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body1" color="textSecondary" align="center">
              Keine Rechnungen vorhanden
            </Typography>
          )}
        </TabPanel>
      </Paper>

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

export default AccountDetail;
