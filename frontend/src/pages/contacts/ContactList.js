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

// API Service für Kontakte
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

const ContactList = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Kontakte von der API abrufen
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/contacts`);
        if (response.data.success) {
          setContacts(response.data.data);
        } else {
          setError('Fehler beim Laden der Kontakte');
        }
      } catch (err) {
        console.error('Fehler beim Abrufen der Kontakte:', err);
        setError('Fehler beim Laden der Kontakte');
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
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

  // Zur Kontakt-Detail-Seite navigieren
  const handleViewContact = (id) => {
    navigate(`/contacts/${id}`);
  };

  // Zur Kontakt-Bearbeiten-Seite navigieren
  const handleEditContact = (id) => {
    navigate(`/contacts/${id}/edit`);
  };

  // Kontakt löschen
  const handleDeleteContact = async (id) => {
    if (window.confirm('Sind Sie sicher, dass Sie diesen Kontakt löschen möchten?')) {
      try {
        const response = await axios.delete(`${API_URL}/contacts/${id}`);
        if (response.data.success) {
          setContacts(contacts.filter(contact => contact.contact_id !== id));
        } else {
          alert('Fehler beim Löschen des Kontakts');
        }
      } catch (err) {
        console.error('Fehler beim Löschen des Kontakts:', err);
        alert('Fehler beim Löschen des Kontakts');
      }
    }
  };

  // Neuen Kontakt erstellen
  const handleCreateContact = () => {
    navigate('/contacts/new');
  };

  // Suche
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Kontakte filtern
  const filteredContacts = contacts.filter(contact => 
    `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contact.phone && contact.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contact.position && contact.position.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Paginierte Kontakte
  const paginatedContacts = filteredContacts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <HeaderBox>
        <Typography variant="h4">
          Kontakte
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleCreateContact}
        >
          Neuer Kontakt
        </Button>
      </HeaderBox>

      <SearchBox>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Suche nach Name, Position, E-Mail oder Telefon"
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
                    <TableCell><strong>Position</strong></TableCell>
                    <TableCell><strong>Telefon</strong></TableCell>
                    <TableCell><strong>E-Mail</strong></TableCell>
                    <TableCell align="right"><strong>Aktionen</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedContacts.length > 0 ? (
                    paginatedContacts.map((contact) => (
                      <TableRow key={contact.contact_id}>
                        <TableCell>{`${contact.first_name} ${contact.last_name}`}</TableCell>
                        <TableCell>{contact.position || '-'}</TableCell>
                        <TableCell>{contact.phone || contact.mobile || '-'}</TableCell>
                        <TableCell>{contact.email || '-'}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Details anzeigen">
                            <IconButton 
                              color="primary"
                              onClick={() => handleViewContact(contact.contact_id)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Bearbeiten">
                            <IconButton 
                              color="primary"
                              onClick={() => handleEditContact(contact.contact_id)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Löschen">
                            <IconButton 
                              color="error"
                              onClick={() => handleDeleteContact(contact.contact_id)}
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
                        Keine Kontakte gefunden
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredContacts.length}
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

export default ContactList;
