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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import BusinessIcon from '@mui/icons-material/Business';
import DescriptionIcon from '@mui/icons-material/Description';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import axios from 'axios';
import { jsPDF } from 'jspdf';

// API Service für Angebote
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

// Funktion zum Formatieren von Währungsbeträgen
const formatCurrency = (amount) => {
  // Handle potential null/undefined values
  const numericAmount = Number(amount);
  if (isNaN(numericAmount)) {
    return 'N/A'; // Or return a default value like '€0.00'
  }
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(numericAmount);
};

// Funktion zum Formatieren von Datumsangaben
const formatDate = (dateString) => {
  if (!dateString) return 'Nicht angegeben';
  try {
    return new Date(dateString).toLocaleDateString('de-DE');
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return 'Ungültiges Datum';
  }
};

// Funktion zum Übersetzen des Status
const translateStatus = (status) => {
  switch (status) {
    case 'draft': return 'Entwurf';
    case 'sent': return 'Gesendet';
    case 'accepted': return 'Akzeptiert';
    case 'rejected': return 'Abgelehnt';
    case 'created': return 'Erstellt'; // Added 'created' status
    default: return status;
  }
};

// Funktion zum Bestimmen der Statusfarbe
const getStatusColor = (status) => {
  switch (status) {
    case 'accepted': return 'success';
    case 'rejected': return 'error';
    case 'sent': return 'primary';
    case 'created': // Added 'created' status
    case 'draft':
    default: return 'default';
  }
};

const QuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quote, setQuote] = useState(null);
  const [account, setAccount] = useState(null);
  // *** NEU: Initialisiere items immer als leeres Array ***
  const [items, setItems] = useState([]); 

  // Angebots-Daten laden
  useEffect(() => {
    const fetchQuote = async () => {
      try {
        setLoading(true);
        setError(null); // Reset error on new fetch
        const response = await axios.get(`${API_URL}/quotes/${id}`);
        if (response.data.success) {
          const fetchedQuote = response.data.data;
          setQuote(fetchedQuote);
          // *** NEU: Stelle sicher, dass items ein Array ist, bevor es gesetzt wird ***
          setItems(Array.isArray(fetchedQuote.items) ? fetchedQuote.items : []);
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
  }, [id]);

  // Account-Daten laden, wenn Angebot geladen wurde
  useEffect(() => {
    if (quote && quote.account_id) {
      const fetchAccount = async () => {
        try {
          const response = await axios.get(`${API_URL}/accounts/${quote.account_id}`);
          if (response.data.success) {
            setAccount(response.data.data);
          }
        } catch (err) {
          console.error('Fehler beim Abrufen des Accounts:', err);
          // Optional: Set error state for account loading
        }
      };

      fetchAccount();
    }
  }, [quote]);

  // *** Entfernt: Separates Laden der Items, da sie jetzt im Haupt-Quote-Objekt enthalten sind ***
  // useEffect(() => {
  //   if (quote && quote.quote_id) {
  //     const fetchItems = async () => { ... };
  //     fetchItems();
  //   }
  // }, [id, quote]);

  // Gesamtbetrag berechnen
  const calculateTotalNet = () => {
    // *** NEU: Stelle sicher, dass items ein Array ist ***
    if (!Array.isArray(items)) return 0;
    return items.reduce((total, item) => total + (Number(item.total_net) || 0), 0);
  };
  
  const calculateTotalGross = () => {
    // *** NEU: Stelle sicher, dass items ein Array ist ***
    if (!Array.isArray(items)) return 0;
    return items.reduce((total, item) => total + (Number(item.total_gross) || 0), 0);
  };

  // Zurück zur Angebots-Liste
  const handleBack = () => {
    navigate('/quotes');
  };

  // Zum Bearbeiten-Formular navigieren
  const handleEdit = () => {
    navigate(`/quotes/edit/${id}`);
  };

  // Zum Account navigieren
  const handleAccountClick = () => {
    if (account) {
      navigate(`/accounts/${account.account_id}`);
    }
  };

  // Angebot in Rechnung umwandeln
  const handleCreateInvoice = () => {
    navigate(`/invoices/new?quote_id=${id}`);
  };

  // Angebot als PDF exportieren
  const handleExportPdf = () => {
    if (!quote) return;

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`Angebot #${quote.quote_number}`, 10, 10);

    doc.setFontSize(12);
    if (account) {
      doc.text(`Kunde: ${account.name}`, 10, 20);
    }
    doc.text(`Ausgestellt am: ${formatDate(quote.quote_date)}`, 10, 30);
    doc.text(`Gültig bis: ${formatDate(quote.valid_until)}`, 10, 40);

    let y = 50;
    doc.text('Pos  Beschreibung                    Menge  Einheit  Einzelpreis  MwSt  Netto  Brutto', 10, y);
    y += 6;

    validItems.forEach((item) => {
      doc.text(
        `${item.position}`,
        10,
        y
      );
      doc.text(`${item.description}`, 25, y);
      doc.text(String(item.quantity), 100, y, { align: 'right' });
      doc.text(`${item.unit}`, 115, y);
      doc.text(formatCurrency(item.unit_price), 135, y, { align: 'right' });
      doc.text(`${item.vat_rate}%`, 160, y, { align: 'right' });
      doc.text(formatCurrency(item.total_net), 180, y, { align: 'right' });
      doc.text(formatCurrency(item.total_gross), 205, y, { align: 'right' });
      y += 6;

      if (y > 270) {
        doc.addPage();
        y = 10;
      }
    });

    y += 10;
    doc.text(`Gesamt Netto: ${formatCurrency(calculateTotalNet())}`, 10, y);
    y += 6;
    doc.text(`Gesamt Brutto: ${formatCurrency(calculateTotalGross())}`, 10, y);

    doc.save(`Angebot_${quote.quote_number}.pdf`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !quote) {
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
            {error || 'Angebot nicht gefunden'}
          </Typography>
        </Paper>
      </Box>
    );
  }

  // *** NEU: Stelle sicher, dass items ein Array ist, bevor .map aufgerufen wird ***
  const validItems = Array.isArray(items) ? items : [];

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
            {/* *** Geändert: quote.title -> quote.quote_number *** */}
            Angebot #{quote.quote_number}
          </Typography>
          <Chip 
            label={translateStatus(quote.status)}
            color={getStatusColor(quote.status)}
            size="small"
            sx={{ ml: 2 }}
          />
        </Box>
        <Box>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={handleExportPdf}
            sx={{ mr: 1 }}
          >
            Als PDF
          </Button>
          {quote.status === 'accepted' && (
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={handleCreateInvoice}
              sx={{ mr: 1 }}
            >
              Rechnung erstellen
            </Button>
          )}
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<EditIcon />}
            onClick={handleEdit}
          >
            Bearbeiten
          </Button>
        </Box>
      </HeaderBox>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 3 }}>
            <InfoCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Angebotsinformationen
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <DescriptionIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Angebotsnr."
                          // *** Geändert: quote.title -> quote.quote_number ***
                          secondary={quote.quote_number} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CalendarTodayIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Ausstellungsdatum" 
                          // *** Geändert: quote.issue_date -> quote.quote_date ***
                          secondary={formatDate(quote.quote_date)} 
                        />
                      </ListItem>
                    </List>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <EventAvailableIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Gültig bis" 
                          secondary={formatDate(quote.valid_until)} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <ReceiptIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Status" 
                          secondary={translateStatus(quote.status)} 
                        />
                      </ListItem>
                    </List>
                  </Grid>
                  {/* *** Entfernt: quote.description (existiert nicht mehr im Schema) *** */}
                  {/* {quote.description && ( ... )} */}
                </Grid>
              </CardContent>
            </InfoCard>
          </Paper>

          <Paper sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Angebotspositionen
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Pos.</TableCell>
                      <TableCell>Beschreibung</TableCell>
                      <TableCell align="right">Menge</TableCell>
                      <TableCell>Einheit</TableCell>
                      <TableCell align="right">Einzelpreis</TableCell>
                      <TableCell align="right">MwSt.</TableCell>
                      <TableCell align="right">Netto</TableCell>
                      <TableCell align="right">Brutto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* *** Geändert: items -> validItems *** */}
                    {validItems.map((item) => (
                      <TableRow key={item.quote_item_id}>
                        <TableCell>{item.position}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell align="right">{`${item.vat_rate}%`}</TableCell>
                        <TableCell align="right">{formatCurrency(item.total_net)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.total_gross)}</TableCell>
                      </TableRow>
                    ))}
                    {/* *** Geändert: items -> validItems *** */}
                    {validItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography variant="body2" color="textSecondary">
                            Keine Positionen vorhanden
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, flexDirection: 'column', alignItems: 'flex-end' }}>
                 <Typography variant="h6">
                  Gesamt Netto: {formatCurrency(calculateTotalNet())}
                </Typography>
                <Typography variant="h6">
                  Gesamt Brutto: {formatCurrency(calculateTotalGross())}
                </Typography>
              </Box>
            </CardContent>
          </Paper>

          {quote.notes && (
            <Paper sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notizen
                </Typography>
                <Typography variant="body2">
                  {quote.notes}
                </Typography>
              </CardContent>
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          {account && (
            <Paper sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Kunde
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
                      {/* Add more account details if needed */}
                    </List>
                  </CardContent>
                </Card>
              </CardContent>
            </Paper>
          )}
          {/* Add Contact details section if needed */}
        </Grid>
      </Grid>

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} // Increased duration
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" sx={{ width: '100%' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default QuoteDetail;

