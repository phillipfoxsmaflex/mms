import { Helmet } from 'react-helmet-async';
import { Container, Typography, Box } from '@mui/material';
import LocationFloorPlanMapDemo from './LocationFloorPlanMapDemo';

export default function FloorPlanDemo() {
  return (
    <>
      <Helmet>
        <title>Digital Twin Floor Plan - Demo</title>
      </Helmet>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box mb={3}>
          <Typography variant="h3" component="h1" gutterBottom>
            Digital Twin Floor Plan - Interactive Demo
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Visualize assets and work orders on building floor plans using React Leaflet with pixel-based coordinates
          </Typography>
        </Box>
        <LocationFloorPlanMapDemo />
      </Container>
    </>
  );
}
