import { Box } from '@mui/material';
import Location from '../../../models/owns/location';
import DocumentManager from '../components/DocumentManager';

interface LocationDocumentsProps {
  location: Location;
}

const LocationDocuments = ({ location }: LocationDocumentsProps) => {
  return (
    <Box>
      <DocumentManager entityType="LOCATION" entityId={location.id} />
    </Box>
  );
};

export default LocationDocuments;
