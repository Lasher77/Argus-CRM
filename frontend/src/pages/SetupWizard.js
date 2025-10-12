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
import apiClient from '../services/apiClient';

const SetupWizard = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusChecked, setStatusChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkSetupStatus = async () => {
      try {
        await apiClient.get('/setup');
        if (isMounted) {
          setStatusChecked(true);
        }
      } catch (err) {
        if (err.response?.status === 409) {
          navigate('/login', { replace: true });
        } else if (isMounted) {
          setError(err.response?.data?.message || 'Setup-Assistent konnte nicht geladen werden.');
          setStatusChecked(true);
        }
      }
    };

    checkSetupStatus();

    return () => {
      isMounted = false;
    };
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
      await apiClient.post('/setup', {
        companyName: form.companyName.trim(),
        email: form.email.trim(),
        password: form.password
      });

      navigate('/login', {
        replace: true,
        state: { setupCompleted: true }
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Setup konnte nicht abgeschlossen werden.');
    } finally {
      setLoading(false);
    }
  };

  if (!statusChecked) {
    return null;
  }

  return (
    <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', minHeight: '100vh' }}>
      <Paper elevation={6} sx={{ width: '100%', p: 4 }}>
        <Stack spacing={3} component="form" onSubmit={handleSubmit}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              WerkAssist Setup
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Legen Sie einen Administrator-Zugang an und hinterlegen Sie den Namen Ihrer Firma.
            </Typography>
          </Box>

          {error ? (
            <Alert severity="error" data-testid="setup-error">
              {error}
            </Alert>
          ) : null}

          <TextField
            label="Firmenname"
            name="companyName"
            value={form.companyName}
            onChange={handleChange}
            required
            fullWidth
          />

          <TextField
            label="Administrator E-Mail"
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
            {loading ? 'Setup wird abgeschlossen...' : 'Setup abschließen'}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default SetupWizard;
