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
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
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

// Styled-Komponente für die Suchleiste
const SearchBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
}));

const AccountList = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Accounts von der API abrufen
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/accounts`);
        if (response.data.success) {
          setAccounts(response.data.data);
        } else {
          setError('Fehler beim Laden der Accounts');
        }
      } catch (err) {
        console.error('Fehler beim Abrufen der Accounts:', err);
        setError('Fehler beim Laden der Accounts');
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
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

  // Zur Account-Detail-Seite navigieren
  const handleViewAccount = (id) => {
    navigate(`/accounts/${id}`);
  };

  // Zur Account-Bearbeiten-Seite navigieren
  const handleEditAccount = (id) => {
    navigate(`/accounts/${id}/edit`);
  };

  // Account löschen
  const handleDeleteAccount = async (id) => {
    if (window.confirm('Sind Sie sicher, dass Sie diesen Account löschen möchten?')) {
      try {
        const response = await axios.delete(`${API_URL}/accounts/${id}`);
        if (response.data.success) {
          // Account aus der Liste entfernen
          setAccounts(accounts.filter(account => account.account_id !== id));
        } else {
          alert('Fehler beim Löschen des Accounts');
        }
      } catch (err) {
        console.error('Fehler beim Löschen des Accounts:', err);
        alert('Fehler beim Löschen des Accounts');
      }
    }
  };

  // Neuen Account erstellen
  const handleCreateAccount = () => {
    navigate('/accounts/new');
  };

  // Suche
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Accounts filtern
  const filteredAccounts = accounts.filter(account => 
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.email && account.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (account.phone && account.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Paginierte Accounts
  const paginatedAccounts = filteredAccounts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <HeaderBox>
        <Typography variant="h4">
          Accounts
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleCreateAccount}
        >
          Neuer Account
        </Button>
      </HeaderBox>

      <SearchBox>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Suche nach Name, E-Mail oder Telefon"
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
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Adresse</strong></TableCell>
                    <TableCell><strong>Telefon</strong></TableCell>
                    <TableCell><strong>E-Mail</strong></TableCell>
                    <TableCell align="right"><strong>Aktionen</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedAccounts.length > 0 ? (
                    paginatedAccounts.map((account) => (
                      <TableRow key={account.account_id}>
                        <TableCell>{account.name}</TableCell>
                        <TableCell>{account.address || '-'}</TableCell>
                        <TableCell>{account.phone || '-'}</TableCell>
                        <TableCell>{account.email || '-'}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Details anzeigen">
                            <IconButton 
                              color="primary"
                              onClick={() => handleViewAccount(account.account_id)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Bearbeiten">
                            <IconButton 
                              color="primary"
                              onClick={() => handleEditAccount(account.account_id)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Löschen">
                            <IconButton 
                              color="error"
                              onClick={() => handleDeleteAccount(account.account_id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        Keine Accounts gefunden
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredAccounts.length}
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

export default AccountList;
