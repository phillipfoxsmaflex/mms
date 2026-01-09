import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch, RootState } from 'src/store';
import { 
  addSafetyInstruction, 
  editSafetyInstruction, 
  getSingleSafetyInstruction,
  clearSingleSafetyInstruction
} from 'src/slices/safetyInstruction';
import { getContractorEmployeesByVendor } from 'src/slices/contractorEmployee';
import { SafetyInstruction } from 'src/models/owns/safetyInstruction';
import { ContractorEmployee } from 'src/models/owns/contractorEmployee';
import Location from 'src/models/owns/location';
import { OwnUser } from 'src/models/user';
import {
  Card,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Alert,
  Autocomplete
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { de } from 'date-fns/locale';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SafetyInstructionDocumentUpload from './SafetyInstructionDocumentUpload';

const SafetyInstructionForm: React.FC<{ vendorId: number }> = ({ vendorId }) => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { singleSafetyInstruction, loadingGet } = useSelector((state: RootState) => state.safetyInstructions);
  const { contractorEmployees } = useSelector((state: RootState) => state.contractorEmployees);
  const { locations } = useSelector((state: RootState) => state.locations);
  const { users } = useSelector((state: RootState) => state.users);
  
  const [formData, setFormData] = useState<SafetyInstruction>({
    id: 0,
    title: '',
    description: '',
    instructionDate: new Date().toISOString(),
    expirationDate: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 12 months from now
    type: 'DOCUMENT',
    instructionMaterialUrl: '',
    instructionMaterialFileId: '',
    locationId: 0,
    vendorId: vendorId,
    instructorId: 0,
    employeeId: 0,
    completed: false,
    completionDate: '',
    signatureData: '',
    signatureName: '',
    createdBy: 0,
    updatedBy: 0,
    createdAt: '',
    updatedAt: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(getContractorEmployeesByVendor(vendorId));
    // Additional data loading would go here
    
    if (id) {
      dispatch(getSingleSafetyInstruction(parseInt(id)));
    }
    
    return () => {
      if (id) {
        dispatch(clearSingleSafetyInstruction());
      }
    };
  }, [dispatch, vendorId, id]);

  useEffect(() => {
    if (singleSafetyInstruction && id) {
      setFormData(singleSafetyInstruction);
    }
  }, [singleSafetyInstruction, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, date: Date | null) => {
    if (date) {
      setFormData(prev => ({ ...prev, [name]: date.toISOString() }));
      
      // Auto-calculate expiration date if instruction date changes
      if (name === 'instructionDate') {
        const newExpirationDate = new Date(date.getTime() + 12 * 30 * 24 * 60 * 60 * 1000);
        setFormData(prev => ({ ...prev, expirationDate: newExpirationDate.toISOString() }));
      }
    }
  };

  const handleDocumentUpload = (fileId: string, fileUrl: string) => {
    setFormData(prev => ({ 
      ...prev, 
      instructionMaterialFileId: fileId, 
      instructionMaterialUrl: fileUrl
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Titel ist erforderlich';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Beschreibung ist erforderlich';
    }
    
    if (!formData.employeeId) {
      newErrors.employeeId = 'Mitarbeiter ist erforderlich';
    }
    
    if (!formData.locationId) {
      newErrors.locationId = 'Standort ist erforderlich';
    }
    
    if (!formData.instructorId) {
      newErrors.instructorId = 'Durchführender ist erforderlich';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    const instructionData = {
      ...formData,
      vendorId: vendorId
    };
    
    if (id) {
      // Update existing instruction
      dispatch(editSafetyInstruction(parseInt(id), instructionData))
        .then(() => {
          setIsSubmitting(false);
          navigate(`/vendors/${vendorId}/safety-instructions`);
        })
        .catch((error: any) => {
          setIsSubmitting(false);
          setErrors({ submit: 'Fehler beim Speichern der Unterweisung: ' + error.message });
        });
    } else {
      // Create new instruction
      dispatch(addSafetyInstruction(instructionData))
        .then(() => {
          setIsSubmitting(false);
          navigate(`/vendors/${vendorId}/safety-instructions`);
        })
        .catch((error: any) => {
          setIsSubmitting(false);
          setErrors({ submit: 'Fehler beim Erstellen der Unterweisung: ' + error.message });
        });
    }
  };

  if (loadingGet && id) {
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
          <Typography variant="h2">
            {id ? 'Sicherheitsunterweisung bearbeiten' : 'Neue Sicherheitsunterweisung'}
          </Typography>
        </Box>
        
        {errors.submit && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.submit}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Box mb={3}>
                <Typography variant="h4" gutterBottom>
                  Grundinformationen
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <TextField
                  fullWidth
                  label="Titel"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  error={!!errors.title}
                  helperText={errors.title}
                  margin="normal"
                  required
                />
                
                <TextField
                  fullWidth
                  label="Beschreibung"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  error={!!errors.description}
                  helperText={errors.description}
                  margin="normal"
                  multiline
                  rows={4}
                  required
                />
                
                <FormControl fullWidth margin="normal">
                  <InputLabel>Typ</InputLabel>
                  <Select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    label="Typ"
                  >
                    <MenuItem value="DOCUMENT">Dokument</MenuItem>
                    <MenuItem value="VIDEO">Video</MenuItem>
                    <MenuItem value="LINK">Externer Link</MenuItem>
                  </Select>
                </FormControl>
                
                {formData.type === 'LINK' && (
                  <TextField
                    fullWidth
                    label="URL"
                    name="instructionMaterialUrl"
                    value={formData.instructionMaterialUrl}
                    onChange={handleChange}
                    margin="normal"
                    placeholder="https://example.com/safety-material"
                  />
                )}
                
                {(formData.type === 'DOCUMENT' || formData.type === 'VIDEO') && (
                  <Box mt={2}>
                    <SafetyInstructionDocumentUpload
                      onDocumentUpload={handleDocumentUpload}
                      existingDocument={formData.instructionMaterialFileId ? {
                        id: formData.instructionMaterialFileId,
                        url: formData.instructionMaterialUrl,
                        name: formData.instructionMaterialUrl.split('/').pop() || 'Unterweisungsmaterial'
                      } : undefined}
                    />
                  </Box>
                )}
              </Box>
              
              <Box mb={3}>
                <Typography variant="h4" gutterBottom>
                  Zeitliche Informationen
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
                  <DateTimePicker
                    label="Unterweisungsdatum"
                    value={new Date(formData.instructionDate)}
                    onChange={(date) => handleDateChange('instructionDate', date as Date | null)}
                    renderInput={(params) => <TextField {...params} fullWidth margin="normal" required />}
                  />
                  
                  <DateTimePicker
                    label="Ablaufdatum"
                    value={new Date(formData.expirationDate)}
                    onChange={(date) => handleDateChange('expirationDate', date as Date | null)}
                    renderInput={(params) => <TextField {...params} fullWidth margin="normal" required />}
                    minDateTime={new Date(formData.instructionDate)}
                  />
                </LocalizationProvider>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box mb={3}>
                <Typography variant="h4" gutterBottom>
                  Zuweisungen
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <FormControl fullWidth margin="normal" error={!!errors.employeeId}>
                  <InputLabel>Mitarbeiter</InputLabel>
                  <Select
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleChange}
                    label="Mitarbeiter"
                    required
                  >
                    {contractorEmployees.content.map((employee: ContractorEmployee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.employeeId && <Typography color="error" variant="caption">{errors.employeeId}</Typography>}
                </FormControl>
                
                <FormControl fullWidth margin="normal" error={!!errors.locationId}>
                  <InputLabel>Standort</InputLabel>
                  <Select
                    name="locationId"
                    value={formData.locationId}
                    onChange={handleChange}
                    label="Standort"
                    required
                  >
                    {locations.map((location: Location) => (
                      <MenuItem key={location.id} value={location.id}>
                        {location.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.locationId && <Typography color="error" variant="caption">{errors.locationId}</Typography>}
                </FormControl>
                
                <FormControl fullWidth margin="normal" error={!!errors.instructorId}>
                  <InputLabel>Durchführender</InputLabel>
                  <Select
                    name="instructorId"
                    value={formData.instructorId}
                    onChange={handleChange}
                    label="Durchführender"
                    required
                  >
                    {users.content.map((user: OwnUser) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.instructorId && <Typography color="error" variant="caption">{errors.instructorId}</Typography>}
                </FormControl>
              </Box>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Box display="flex" justifyContent="space-between">
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(`/vendors/${vendorId}/safety-instructions`)}
            >
              Zurück
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              disabled={isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={20} /> : (id ? 'Speichern' : 'Erstellen')}
            </Button>
          </Box>
        </form>
      </Box>
    </Card>
  );
};

export default SafetyInstructionForm;