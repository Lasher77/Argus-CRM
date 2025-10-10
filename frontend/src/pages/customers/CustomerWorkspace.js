import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Stack,
  Chip,
  Button,
  Divider,
  CircularProgress
} from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import ContactsIcon from '@mui/icons-material/Contacts';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { Link as RouterLink } from 'react-router-dom';
import AccountService from '../../services/accountService';
import ServiceOrderService from '../../services/serviceOrderService';

const CustomerWorkspace = () => {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const accountRes = await AccountService.getAllAccounts();
        const accountsData = accountRes.data;
        const enriched = await Promise.all(accountsData.map(async (account) => {
          const [propertiesRes, contactsRes] = await Promise.all([
            AccountService.getAccountProperties(account.account_id),
            AccountService.getAccountContacts(account.account_id)
          ]);
          return {
            ...account,
            properties: propertiesRes.data,
            contacts: contactsRes.data
          };
        }));
        setAccounts(enriched);

        const orders = await ServiceOrderService.getServiceOrders({ onlyActive: true });
        setRecentOrders(orders.slice(0, 5));
      } catch (error) {
        console.error('Kundeninformationen konnten nicht geladen werden', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4">Kundenkartei</Typography>
          <Typography variant="body1" color="text.secondary">
            Überblick über Hausverwaltungen, Objekte und Ansprechpartner.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button component={RouterLink} to="/accounts/new" variant="contained">Neue Hausverwaltung</Button>
          <Button component={RouterLink} to="/contacts/new" variant="outlined">Kontakt anlegen</Button>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            {accounts.map((account) => (
              <Grid item xs={12} md={6} key={account.account_id}>
                <Card elevation={1}>
                  <CardHeader title={account.name} subheader={account.address || 'Adresse unbekannt'} />
                  <CardContent>
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                      <Chip icon={<ApartmentIcon />} label={`${account.properties.length} Objekte`} />
                      <Chip icon={<ContactsIcon />} label={`${account.contacts.length} Kontakte`} />
                    </Stack>
                    {account.notes && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {account.notes}
                      </Typography>
                    )}
                    <Stack direction="row" spacing={1}>
                      <Button size="small" component={RouterLink} to={`/accounts/${account.account_id}`}>Details</Button>
                      <Button size="small" component={RouterLink} to={`/accounts/${account.account_id}/edit`}>Bearbeiten</Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={1}>
            <CardHeader title="Aktuelle Einsätze je Kunde" />
            <Divider />
            <CardContent>
              {recentOrders.length === 0 ? (
                <Typography color="text.secondary">Keine offenen Aufträge.</Typography>
              ) : (
                recentOrders.map((order) => (
                  <Box key={order.order_id} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">{order.account_name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {order.title}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" icon={<AssignmentIcon />} label={order.status} />
                      <Button size="small" component={RouterLink} to={`/orders/${order.order_id}`}>öffnen</Button>
                    </Stack>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CustomerWorkspace;
