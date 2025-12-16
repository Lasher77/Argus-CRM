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
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../services/apiClient';
import axios from 'axios';

const setupClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api'
});

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Check setup status on mount
  useEffect(() => {
    const checkSetup = async () => {
       try {
        const res = await setupClient.get('/setup/status');
        if (!res.data.initialized) {
           navigate('/setup', { replace: true });
        }
       } catch (err) {
         console.error("Failed to check setup status", err);
       }
    };
    checkSetup();
  }, [navigate]);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear state so refresh doesn't show it again
      window.history.replaceState({}, document.title);
    }
  }, [location, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/auth/login', form);
      if (response.data?.success) {
        const { accessToken, refreshToken, user } = response.data.data;
        window.localStorage.setItem('accessToken', accessToken);
        window.localStorage.setItem('refreshToken', refreshToken);
        if (user) {
          window.localStorage.setItem('currentUser', JSON.stringify(user));
        }

        const redirectTo = location.state?.from?.pathname || '/';
        navigate(redirectTo, { replace: true });
      } else {
        setError('Anmeldung fehlgeschlagen.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Anmeldung fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', minHeight: '100vh' }}>
      <Paper elevation={6} sx={{ width: '100%', p: 4 }}>
        <Stack spacing={3} component="form" onSubmit={handleSubmit}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Argus CRM Anmeldung
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Melden Sie sich mit Ihren Zugangsdaten an.
            </Typography>
          </Box>

          {successMessage && (
            <Alert severity="success">
              {successMessage}
            </Alert>
          )}

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <TextField
            label="Benutzername oder E-Mail"
            name="username"
            value={form.username}
            onChange={handleChange}
            autoComplete="username"
            required
            fullWidth
          />
          <TextField
            label="Passwort"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
            required
            fullWidth
          />

          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {loading ? 'Anmeldung...' : 'Anmelden'}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default Login;
