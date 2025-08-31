import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

const Alerts: React.FC = () => {
  const alerts = [
    {
      id: 1,
      type: 'Security',
      severity: 'high',
      message: 'Suspicious certificate detected from Vehicle-003',
      time: '2 minutes ago',
      status: 'active',
    },
    {
      id: 2,
      type: 'Performance',
      severity: 'medium',
      message: 'High latency detected in network segment',
      time: '5 minutes ago',
      status: 'active',
    },
    {
      id: 3,
      type: 'System',
      severity: 'low',
      message: 'Database connection restored',
      time: '10 minutes ago',
      status: 'resolved',
    },
    {
      id: 4,
      type: 'Security',
      severity: 'medium',
      message: 'Unusual message pattern detected',
      time: '15 minutes ago',
      status: 'investigating',
    },
  ];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <ErrorIcon color="error" />;
      case 'medium':
        return <WarningIcon color="warning" />;
      case 'low':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'error';
      case 'investigating':
        return 'warning';
      case 'resolved':
        return 'success';
      default:
        return 'default';
    }
  };

  const handleResolve = (id: number) => {
    console.log(`Marking alert ${id} as resolved`);
    // In a real application, you would update the alerts state
  };

  const handleDelete = (id: number) => {
    console.log(`Deleting alert ${id}`);
    // In a real application, you would update the alerts state
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          System Alerts
        </Typography>
        <Button variant="contained" color="primary">
          Acknowledge All
        </Button>
      </Box>

      <Card>
        <CardContent>
          <List>
            {alerts.map((alert) => (
              <ListItem key={alert.id} divider>
                <ListItemIcon>
                  {getSeverityIcon(alert.severity)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle1">
                        {alert.message}
                      </Typography>
                      <Chip
                        label={alert.severity}
                        size="small"
                        color={getSeverityColor(alert.severity) as any}
                      />
                      <Chip
                        label={alert.status}
                        size="small"
                        color={getStatusColor(alert.status) as any}
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {alert.type} • {alert.time}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" variant="outlined">
                          Investigate
                        </Button>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="success"
                          onClick={() => handleResolve(alert.id)}
                        >
                          Resolve
                        </Button>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(alert.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Alerts;
