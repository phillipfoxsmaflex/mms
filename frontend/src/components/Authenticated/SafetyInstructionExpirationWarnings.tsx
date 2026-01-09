import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch, RootState } from 'src/store';
import { getExpiredSafetyInstructions } from 'src/slices/safetyInstruction';
import { SafetyInstruction } from 'src/models/owns/safetyInstruction';
import {
  Card,
  Box,
  Typography,
  CircularProgress,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  Button,
  Divider
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const SafetyInstructionExpirationWarnings: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { safetyInstructions, loadingGet } = useSelector((state: RootState) => state.safetyInstructions);
  
  const [showAll, setShowAll] = useState(false);
  
  useEffect(() => {
    dispatch(getExpiredSafetyInstructions());
  }, [dispatch]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy', { locale: de });
    } catch {
      return dateString;
    }
  };

  const visibleInstructions = showAll 
    ? safetyInstructions.content 
    : safetyInstructions.content.slice(0, 5);

  const handleNavigateToEmployee = (employeeId: number) => {
    navigate(`/contractor-employees/${employeeId}`);
  };

  const handleNavigateToSafetyInstructions = () => {
    navigate('/safety-instructions');
  };

  if (loadingGet) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (safetyInstructions.content.length === 0) {
    return null;
  }

  return (
    <Card>
      <Box p={2}>
        <Alert severity="warning" icon={<WarningIcon fontSize="inherit" />}>
          <AlertTitle>Abgelaufene Sicherheitsunterweisungen</AlertTitle>
          <Typography variant="body2">
            {safetyInstructions.totalElements} Mitarbeiter haben abgelaufene Sicherheitsunterweisungen.
          </Typography>
        </Alert>
        
        <Box mt={2}>
          <List dense>
            {visibleInstructions.map((instruction: SafetyInstruction) => (
              <React.Fragment key={instruction.id}>
                <ListItem 
                  secondaryAction={
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleNavigateToEmployee(instruction.employeeId)}
                    >
                      Details
                    </Button>
                  }
                >
                  <ListItemText
                    primary={`${instruction.employeeId} - ${instruction.title}`}
                    secondary={`Abgelaufen am: ${formatDate(instruction.expirationDate)}`}
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
          
          {!showAll && safetyInstructions.content.length > 5 && (
            <Box mt={2} display="flex" justifyContent="center">
              <Button 
                variant="text"
                onClick={() => setShowAll(true)}
              >
                Alle anzeigen ({safetyInstructions.totalElements})
              </Button>
            </Box>
          )}
          
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              onClick={handleNavigateToSafetyInstructions}
            >
              Sicherheitsunterweisungen verwalten
            </Button>
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

export default SafetyInstructionExpirationWarnings;