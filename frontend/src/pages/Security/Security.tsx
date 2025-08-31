import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

const Security: React.FC = () => {
  const securityChecks = [
    { name: 'Certificate Validation', status: 'pass', description: 'All vehicle certificates are valid' },
    { name: 'Signature Verification', status: 'pass', description: 'Message signatures verified successfully' },
    { name: 'Trust Scoring', status: 'pass', description: 'Trust scores within acceptable range' },
    { name: 'Anomaly Detection', status: 'warning', description: '2 potential anomalies detected' },
    { name: 'Encryption Status', status: 'pass', description: 'All communications encrypted' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <CheckIcon color="success" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'success';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Security Status
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Security Checks
              </Typography>
              <List>
                {securityChecks.map((check) => (
                  <ListItem key={check.name} divider>
                    <ListItemIcon>
                      {getStatusIcon(check.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {check.name}
                          <Chip
                            label={check.status}
                            size="small"
                            color={getStatusColor(check.status) as any}
                          />
                        </Box>
                      }
                      secondary={check.description}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Overall Security Score
              </Typography>
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h2" color="success.main" gutterBottom>
                  94%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Excellent security posture
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Security;
