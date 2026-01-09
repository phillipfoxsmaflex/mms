import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'src/store';
import { checkEmployeeInstructionValid } from 'src/slices/safetyInstruction';
import {
  Alert,
  AlertTitle,
  Box,
  Typography,
  Button,
  CircularProgress
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import { useNavigate } from 'react-router-dom';

interface WorkOrderSafetyInstructionWarningProps {
  employeeId?: number;
  onOverride?: () => void;
}

const WorkOrderSafetyInstructionWarning: React.FC<WorkOrderSafetyInstructionWarningProps> = ({ employeeId, onOverride }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);

  useEffect(() => {
    if (employeeId) {
      setLoading(true);
      dispatch(checkEmployeeInstructionValid(employeeId))
        .then((result) => {
          setIsValid(result as unknown as boolean);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [employeeId, dispatch]);

  const handleNavigateToSafetyInstructions = () => {
    if (employeeId) {
      navigate(`/safety-instructions/employee/${employeeId}/create`);
    }
  };

  const handleOverride = () => {
    if (onOverride) {
      onOverride();
    }
    setOverrideConfirmed(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (isValid === null || isValid || overrideConfirmed) {
    return null;
  }

  return (
    <Alert 
      severity="warning"
      icon={<WarningIcon fontSize="inherit" />}
      sx={{ mb: 2 }}
    >
      <AlertTitle>Sicherheitswarnung</AlertTitle>
      <Typography variant="body2">
        Der zugewiesene Mitarbeiter hat keine gültige Sicherheitsunterweisung oder diese ist abgelaufen.
        Dies könnte gegen Sicherheitsvorschriften verstoßen.
      </Typography>
      <Box mt={2} display="flex" gap={2}>
        <Button
          variant="outlined"
          size="small"
          onClick={handleNavigateToSafetyInstructions}
        >
          Neue Unterweisung erstellen
        </Button>
        <Button
          variant="contained"
          size="small"
          color="warning"
          onClick={handleOverride}
        >
          Trotzdem zuweisen (Notfall)
        </Button>
      </Box>
    </Alert>
  );
};

export default WorkOrderSafetyInstructionWarning;