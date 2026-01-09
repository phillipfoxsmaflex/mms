import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch, RootState } from 'src/store';
import {
  getSingleSafetyInstruction,
  completeSafetyInstruction,
  clearSingleSafetyInstruction
} from 'src/slices/safetyInstruction';
import { SafetyInstruction } from 'src/models/owns/safetyInstruction';
import {
  Card,
  Box,
  Typography,
  CircularProgress,
  Button,
  Chip,
  Divider,
  Grid,
  Paper
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import CheckIcon from '@mui/icons-material/Check';
import SignaturePad from './SignaturePad';
import { getSingleContractorEmployee } from 'src/slices/contractorEmployee';
import { getSingleLocation } from 'src/slices/location';
import { getSingleUser } from 'src/slices/user';

const SafetyInstructionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { singleSafetyInstruction, loadingGet } = useSelector((state: RootState) => state.safetyInstructions);
  const { singleContractorEmployee } = useSelector((state: RootState) => state.contractorEmployees);
  const { singleLocation } = useSelector((state: RootState) => state.locations);
  const { singleUser } = useSelector((state: RootState) => state.users);
  
  const [openSignaturePad, setOpenSignaturePad] = useState(false);
  
  useEffect(() => {
    if (id) {
      dispatch(getSingleSafetyInstruction(parseInt(id)));
    }
    
    return () => {
      dispatch(clearSingleSafetyInstruction());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (singleSafetyInstruction) {
      if (singleSafetyInstruction.employeeId) {
        dispatch(getSingleContractorEmployee(singleSafetyInstruction.employeeId));
      }
      if (singleSafetyInstruction.locationId) {
        dispatch(getSingleLocation(singleSafetyInstruction.locationId));
      }
      if (singleSafetyInstruction.instructorId) {
        dispatch(getSingleUser(singleSafetyInstruction.instructorId));
      }
    }
  }, [singleSafetyInstruction, dispatch]);

  const handleComplete = () => {
    setOpenSignaturePad(true);
  };

  const handleSignatureSave = (signatureData: string, signatureName: string) => {
    if (id) {
      dispatch(completeSafetyInstruction(parseInt(id), signatureData, signatureName))
        .then(() => {
          setOpenSignaturePad(false);
          navigate('/safety-instructions');
        });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: de });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = () => {
    if (!singleSafetyInstruction) return 'default';
    
    if (!singleSafetyInstruction.completed) return 'warning';
    
    const expiration = new Date(singleSafetyInstruction.expirationDate);
    const now = new Date();
    const diffDays = Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'error';
    if (diffDays < 30) return 'warning';
    return 'success';
  };

  const getStatusText = () => {
    if (!singleSafetyInstruction) return 'Unbekannt';
    
    if (!singleSafetyInstruction.completed) return 'Nicht abgeschlossen';
    
    const expiration = new Date(singleSafetyInstruction.expirationDate);
    const now = new Date();
    const diffDays = Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Abgelaufen';
    if (diffDays < 30) return `Läuft ab in ${diffDays} Tagen`;
    return 'Aktiv';
  };

  if (loadingGet || !singleSafetyInstruction) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h2">Sicherheitsunterweisung</Typography>
          <Chip
            label={getStatusText()}
            color={getStatusColor()}
          />
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="h4" gutterBottom>Allgemeine Informationen</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box mb={2}>
                <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                  Titel
                </Typography>
                <Typography variant="body1">{singleSafetyInstruction.title}</Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                  Beschreibung
                </Typography>
                <Typography variant="body1">{singleSafetyInstruction.description}</Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                  Typ
                </Typography>
                <Typography variant="body1">{singleSafetyInstruction.type}</Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                  Material
                </Typography>
                {singleSafetyInstruction.type === 'LINK' ? (
                  <Typography variant="body1">
                    <a href={singleSafetyInstruction.instructionMaterialUrl} target="_blank" rel="noopener noreferrer">
                      {singleSafetyInstruction.instructionMaterialUrl}
                    </a>
                  </Typography>
                ) : singleSafetyInstruction.type === 'DOCUMENT' ? (
                  <Typography variant="body1">
                    Dokument: {singleSafetyInstruction.instructionMaterialUrl}
                  </Typography>
                ) : (
                  <Typography variant="body1">
                    Video: {singleSafetyInstruction.instructionMaterialUrl}
                  </Typography>
                )}
              </Box>
            </Paper>
            
            <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="h4" gutterBottom>Zeitliche Informationen</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box mb={2}>
                <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                  Unterweisungsdatum
                </Typography>
                <Typography variant="body1">{formatDate(singleSafetyInstruction.instructionDate)}</Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                  Ablaufdatum
                </Typography>
                <Typography variant="body1">{formatDate(singleSafetyInstruction.expirationDate)}</Typography>
              </Box>
              
              {singleSafetyInstruction.completed && (
                <Box mb={2}>
                  <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                    Abschlussdatum
                  </Typography>
                  <Typography variant="body1">{formatDate(singleSafetyInstruction.completionDate)}</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="h4" gutterBottom>Beteiligte Personen</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box mb={2}>
                <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                  Mitarbeiter
                </Typography>
                <Typography variant="body1">
                  {singleContractorEmployee ? 
                    `${singleContractorEmployee.firstName} ${singleContractorEmployee.lastName}` :
                    singleSafetyInstruction.employeeId}
                </Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                  Durchführender
                </Typography>
                <Typography variant="body1">
                  {singleUser ? 
                    `${singleUser.firstName} ${singleUser.lastName}` :
                    singleSafetyInstruction.instructorId}
                </Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                  Standort
                </Typography>
                <Typography variant="body1">
                  {singleLocation ? singleLocation.name : singleSafetyInstruction.locationId}
                </Typography>
              </Box>
            </Paper>
            
            {singleSafetyInstruction.completed && (
              <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="h4" gutterBottom>Signatur</Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box mb={2}>
                  <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                    Unterzeichner
                  </Typography>
                  <Typography variant="body1">{singleSafetyInstruction.signatureName}</Typography>
                </Box>
                
                <Box mb={2}>
                  <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                    Signatur
                  </Typography>
                  {singleSafetyInstruction.signatureData && (
                    <Box>
                      <img
                        src={singleSafetyInstruction.signatureData}
                        alt="Signatur"
                        style={{ maxWidth: '100%', height: 'auto', border: '1px solid #eee' }}
                      />
                    </Box>
                  )}
                </Box>
              </Paper>
            )}
            
            {!singleSafetyInstruction.completed && (
              <Box mt={2}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CheckIcon />}
                  onClick={handleComplete}
                  fullWidth
                >
                  Als abgeschlossen markieren
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
        
        <SignaturePad
          open={openSignaturePad}
          onClose={() => setOpenSignaturePad(false)}
          onSignatureSave={handleSignatureSave}
        />
      </Box>
    </Card>
  );
};

export default SafetyInstructionDetail;