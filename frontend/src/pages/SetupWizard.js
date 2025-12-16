import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Create a direct axios instance for setup to bypass auth interceptors if any
const setupClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api'
});

const SetupWizard = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await setupClient.get('/setup/status');
        if (response.data.initialized) {
          // If already initialized, go to login
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error("Failed to check setup status", err);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkSetupStatus();
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await setupClient.post('/setup/register', {
        username: form.username.trim(),
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        password: form.password
      });

      navigate('/login', {
        replace: true,
        state: { message: 'Administrator-Account erfolgreich erstellt. Bitte anmelden.' }
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Setup konnte nicht abgeschlossen werden.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Lade Setup...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', minHeight: '100vh' }}>
      <Paper elevation={6} sx={{ width: '100%', p: 4 }}>
        <Stack spacing={3} component="form" onSubmit={handleSubmit}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Willkommen bei Argus CRM
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Es wurde kein Benutzerkonto gefunden. Bitte erstellen Sie einen Administrator-Zugang, um zu beginnen.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <TextField
            label="Benutzername"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            fullWidth
          />

          <Stack direction="row" spacing={2}>
             <TextField
              label="Vorname"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Nachname"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              fullWidth
            />
          </Stack>

          <TextField
            label="E-Mail Adresse"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            required
            fullWidth
          />

          <TextField
            label="Passwort"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            required
            fullWidth
            helperText="Mindestens 8 Zeichen."
          />

          <TextField
            label="Passwort bestätigen"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            required
            fullWidth
          />

          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {loading ? 'Konto erstellen...' : 'Administrator erstellen'}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default SetupWizard;
