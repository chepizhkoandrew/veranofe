import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Typography,
} from '@mui/material';

// Simple dashboard component to test
const SimpleDashboard: React.FC = () => (
  <Box sx={{ p: 4 }}>
    <Typography variant="h4" gutterBottom>
      Dashboard Working
    </Typography>
    <Typography variant="body1">
      Frontend is running successfully!
    </Typography>
  </Box>
);

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<SimpleDashboard />} />
          <Route path="*" element={<SimpleDashboard />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;