import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField, 
  InputAdornment,
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DescriptionIcon from '@mui/icons-material/Description';
import HomeWorkIcon from '@mui/icons-material/HomeWork'; // Icon for Property
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// API Service für Angebote
const API_URL = 'http://localhost:3000/api';

// Styled-Komponente für den Header-Bereich
const HeaderBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
}));

// Styled-Komponente für die Suchleiste
const SearchBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
}));

// Status-Chip-Komponente
const StatusChip = ({ status }) => {
  let color = 'default';
  let label = status;
  
  switch (status) {
    case 'created':
      color = 'info';
      label = 'Erstellt';
      break;
    case 'sent':
      color = 'primary';
      label = 'Gesendet';
      break;
    case 'accepted':
      color = 'success';
      label = 'Angenommen';
      break;
    case 'rejected':
      color = 'error';
      label = 'Abgelehnt';
      break;
    default:
      color = 'default';
      label = status;
  }
  
  return <Chip label={label} color={color} size="small" />;
};

const QuoteList = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [accounts, setAccounts] = useState({}); // Store accounts by ID for quick lookup
  const [properties, setProperties] = useState({}); // Store properties by ID
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data function
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all necessary data concurrently
      const [quotesRes, accountsRes, propertiesRes] = await Promise.all([
        axios.get(`${API_URL}/quotes`),
        axios.get(`${API_URL}/accounts`),
        axios.get(`${API_URL}/properties`) // Assuming an endpoint for all properties exists
      ]);

      if (quotesRes.data.success) {
        setQuotes(quotesRes.data.data);
      } else {
        setError('Fehler beim Laden der Angebote.');
      }

      if (accountsRes.data.success) {
        const accountsMap = accountsRes.data.data.reduce((acc, account) => {
          acc[account.account_id] = account;
          return acc;
        }, {});
        setAccounts(accountsMap);
      } else {
        console.error('Fehler beim Laden der Accounts.');
        // Handle account loading error if necessary
      }

      if (propertiesRes.data.success) {
        const propertiesMap = propertiesRes.data.data.reduce((acc, property) => {
          acc[property.property_id] = property;
          return acc;
        }, {});
        setProperties(propertiesMap);
      } else {
        console.error('Fehler beim Laden der Hausobjekte.');
        // Handle property loading error if necessary
      }

    } catch (err) {
      console.error('Fehler beim Abrufen der Daten:', err);
      setError('Ein Fehler ist beim Laden der Daten aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Seitenänderung
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Anzahl der Zeilen pro Seite ändern
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Zur Angebot-Detail-Seite navigieren
  const handleViewQuote = (id) => {
    navigate(`/quotes/${id}`);
  };

  // Zur Angebot-Bearbeiten-Seite navigieren
  const handleEditQuote = (id) => {
    navigate(`/quotes/edit/${id}`);
  };

  // Angebot löschen
  const handleDeleteQuote = async (id) => {
    if (window.confirm('Sind Sie sicher, dass Sie dieses Angebot löschen möchten?')) {
      try {
        const response = await axios.delete(`${API_URL}/quotes/${id}`);
        if (response.data.success) {
          // Refetch data after deletion
          fetchData(); 
        } else {
           alert('Fehler beim Löschen des Angebots: ' + response.data.message);
        }
      } catch (err) {
        console.error('Fehler beim Löschen des Angebots:', err);
        alert('Fehler beim Löschen des Angebots: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Neues Angebot erstellen
  const handleCreateQuote = () => {
    navigate('/quotes/new');
  };

  // Suche
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Zum Account navigieren
  const handleNavigateToAccount = (accountId) => {
    navigate(`/accounts/${accountId}`);
  };
  
  // Zum Hausobjekt navigieren (optional)
  const handleNavigateToProperty = (propertyId) => {
    // Assuming a route like /properties/:id exists
    navigate(`/properties/${propertyId}`); 
  };

  // Angebote filtern
  const filteredQuotes = quotes.filter(quote => {
    const accountName = accounts[quote.account_id]?.name || '';
    const propertyInfo = properties[quote.property_id]
      ? `${properties[quote.property_id].name} ${properties[quote.property_id].address || ''}`
      : '';
    const searchTermLower = searchTerm.toLowerCase();

    return (
      quote.quote_number.toLowerCase().includes(searchTermLower) ||
      accountName.toLowerCase().includes(searchTermLower) ||
      propertyInfo.toLowerCase().includes(searchTermLower) ||
      (quote.notes && quote.notes.toLowerCase().includes(searchTermLower))
    );
  });

  // Paginierte Angebote
  const paginatedQuotes = filteredQuotes.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Formatieren von Währungsbeträgen
  const formatCurrency = (amount) => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) return 'N/A';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(numericAmount);
  };

  // Formatieren von Datumsangaben
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
       return new Date(dateString).toLocaleDateString('de-DE');
    } catch (e) {
       return 'Ungültig';
    }
  };

  return (
    <Box>
      <HeaderBox>
        <Typography variant="h4">
          Angebote
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleCreateQuote}
        >
          Neues Angebot
        </Button>
      </HeaderBox>

      <SearchBox>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Suche nach Angebotsnummer, Account, Hausobjekt..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </SearchBox>

      <Paper elevation={2}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Angebotsnummer</strong></TableCell>
                    <TableCell><strong>Datum</strong></TableCell>
                    <TableCell><strong>Account</strong></TableCell>
                    <TableCell><strong>Hausobjekt</strong></TableCell> {/* Added Property Column */}
                    <TableCell><strong>Betrag</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell align="right"><strong>Aktionen</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedQuotes.length > 0 ? (
                    paginatedQuotes.map((quote) => {
                      const account = accounts[quote.account_id];
                      const property = properties[quote.property_id];
                      return (
                        <TableRow key={quote.quote_id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <DescriptionIcon sx={{ mr: 1, color: 'text.secondary' }} />
                              {quote.quote_number}
                            </Box>
                          </TableCell>
                          <TableCell>{formatDate(quote.quote_date)}</TableCell>
                          <TableCell>
                            {account ? (
                              <Chip 
                                label={account.name} 
                                color="primary" 
                                variant="outlined" 
                                clickable
                                onClick={() => handleNavigateToAccount(quote.account_id)}
                                size="small"
                              />
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell>
                            {property ? (
                               <Tooltip title={`${property.address || ''}${property.postal_code ? ', ' + property.postal_code : ''} ${property.city || ''}`}>
                                <Chip
                                    icon={<HomeWorkIcon fontSize="small"/>}
                                    label={property.name}
                                    variant="outlined"
                                    clickable
                                    onClick={() => handleNavigateToProperty(quote.property_id)}
                                    size="small"
                                    sx={{ maxWidth: 150, textOverflow: 'ellipsis' }}
                                />
                               </Tooltip>
                            ) : (
                                'N/A'
                            )}
                          </TableCell>
                          <TableCell>{formatCurrency(quote.total_gross)}</TableCell>
                          <TableCell>
                            <StatusChip status={quote.status} />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Details anzeigen">
                              <IconButton 
                                color="primary"
                                onClick={() => handleViewQuote(quote.quote_id)}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Bearbeiten">
                              <IconButton 
                                color="secondary"
                                onClick={() => handleEditQuote(quote.quote_id)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Löschen">
                              <IconButton 
                                color="error"
                                onClick={() => handleDeleteQuote(quote.quote_id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center"> {/* Updated colSpan */} 
                        Keine Angebote gefunden, die den Suchkriterien entsprechen.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredQuotes.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Zeilen pro Seite:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} von ${count}`}
            />
          </>
        )}
      </Paper>
    </Box>
  );
};

export default QuoteList;

