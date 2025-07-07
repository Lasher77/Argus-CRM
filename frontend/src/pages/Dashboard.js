import React from 'react';
import { Box, Typography, Grid, Paper, Card, CardContent, CardHeader, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import BusinessIcon from '@mui/icons-material/Business';
import ContactsIcon from '@mui/icons-material/Contacts';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import DescriptionIcon from '@mui/icons-material/Description';
import ReceiptIcon from '@mui/icons-material/Receipt';

// Styled-Komponente für die Dashboard-Karten
const DashboardCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
  },
}));

// Styled-Komponente für die Statistik-Karten
const StatsCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
}));

// Styled-Komponente für die Icons
const StatsIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 60,
  height: 60,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.contrastText,
  marginBottom: theme.spacing(2),
}));

const Dashboard = () => {
  // Beispieldaten für das Dashboard
  const stats = [
    { title: 'Accounts', count: 32, icon: <BusinessIcon fontSize="large" /> },
    { title: 'Kontakte', count: 128, icon: <ContactsIcon fontSize="large" /> },
    { title: 'Hausobjekte', count: 47, icon: <HomeWorkIcon fontSize="large" /> },
    { title: 'Angebote', count: 18, icon: <DescriptionIcon fontSize="large" /> },
    { title: 'Rechnungen', count: 24, icon: <ReceiptIcon fontSize="large" /> },
  ];

  // Beispieldaten für aktuelle Aktivitäten
  const recentActivities = [
    { type: 'Angebot', title: 'Wartung Heizungsanlage', client: 'Hausverwaltung Schmidt GmbH', date: '05.04.2025' },
    { type: 'Rechnung', title: 'Reinigung Treppenhäuser', client: 'Immobilien Müller & Co.', date: '03.04.2025' },
    { type: 'Angebot', title: 'Gartenpflege', client: 'Hausverwaltung Becker', date: '01.04.2025' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Statistik-Karten */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={stat.title}>
            <StatsCard elevation={2}>
              <StatsIcon>
                {stat.icon}
              </StatsIcon>
              <Typography variant="h4" component="div">
                {stat.count}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {stat.title}
              </Typography>
            </StatsCard>
          </Grid>
        ))}
      </Grid>

      {/* Hauptinhalt */}
      <Grid container spacing={3}>
        {/* Neueste Accounts */}
        <Grid item xs={12} md={6}>
          <DashboardCard>
            <CardHeader title="Neueste Accounts" />
            <Divider />
            <CardContent>
              <Typography variant="body1" component="div">
                <strong>Hausverwaltung Schmidt GmbH</strong>
                <br />
                Berliner Str. 123, 10115 Berlin
                <br />
                Tel: 030 12345678
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1" component="div">
                <strong>Immobilien Müller & Co.</strong>
                <br />
                Hauptstraße 45, 80331 München
                <br />
                Tel: 089 87654321
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1" component="div">
                <strong>Hausverwaltung Becker</strong>
                <br />
                Gartenweg 8, 50667 Köln
                <br />
                Tel: 0221 9876543
              </Typography>
            </CardContent>
          </DashboardCard>
        </Grid>

        {/* Aktuelle Aktivitäten */}
        <Grid item xs={12} md={6}>
          <DashboardCard>
            <CardHeader title="Aktuelle Aktivitäten" />
            <Divider />
            <CardContent>
              {recentActivities.map((activity, index) => (
                <React.Fragment key={index}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {activity.date}
                    </Typography>
                    <Typography variant="body2" color="primary">
                      {activity.type}
                    </Typography>
                  </Box>
                  <Typography variant="body1" component="div">
                    <strong>{activity.title}</strong>
                    <br />
                    {activity.client}
                  </Typography>
                  {index < recentActivities.length - 1 && <Divider sx={{ my: 2 }} />}
                </React.Fragment>
              ))}
            </CardContent>
          </DashboardCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
