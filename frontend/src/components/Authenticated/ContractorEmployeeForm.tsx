import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch, RootState } from 'src/store';
import {
  addContractorEmployee,
  editContractorEmployee,
  getSingleContractorEmployee,
  clearSingleContractorEmployee
} from 'src/slices/contractorEmployee';
import { ContractorEmployee } from 'src/models/owns/contractorEmployee';
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
import { SelectChangeEvent } from '@mui/material/Select';
import { useNavigate, useParams } from 'react-router-dom';
import { SafetyInstruction } from 'src/models/owns/safetyInstruction';
import { getSafetyInstructions } from 'src/slices/safetyInstruction';
import { VendorMiniDTO } from 'src/models/owns/vendor';
import { getVendors } from 'src/slices/vendor';
import { selectContractorVendors, loadContractorVendors } from 'src/slices/contractor';
import { getContractorEmployees } from 'src/slices/contractorEmployee';

const ContractorEmployeeForm: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const { singleContractorEmployee, loadingGet } = useSelector(
    (state: RootState) => state.contractorEmployees
  );
  const { safetyInstructions } = useSelector((state: RootState) => state.safetyInstructions);
  const { vendorsMini, loadingGet: loadingVendors } = useSelector((state: RootState) => state.vendors);
  const contractorVendors = selectContractorVendors({ vendors: { vendorsMini, loadingGet: loadingVendors } } as any);
  
  const [formData, setFormData] = useState<Partial<ContractorEmployee>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    vendorId: null,
    currentSafetyInstructionId: null
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof ContractorEmployee, string>>>({});
  const [success, setSuccess] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Load safety instructions for dropdown
    dispatch(getSafetyInstructions({ pageNum: 0, pageSize: 100, sortField: 'createdAt', direction: 'DESC', filterFields: [] }));
    
    // Load vendors for dropdown (this will be filtered to show only contractors)
    dispatch(loadContractorVendors());
    
    // If editing, load the employee data
    if (id) {
      dispatch(getSingleContractorEmployee(Number(id)));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (singleContractorEmployee) {
      setFormData({
        firstName: singleContractorEmployee.firstName || '',
        lastName: singleContractorEmployee.lastName || '',
        email: singleContractorEmployee.email || '',
        phone: singleContractorEmployee.phone || '',
        position: singleContractorEmployee.position || '',
        vendorId: singleContractorEmployee.vendorId || null,
        currentSafetyInstructionId: singleContractorEmployee.currentSafetyInstructionId || null
      });
    }
  }, [singleContractorEmployee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name as string]: value }));
    setErrors(prev => ({ ...prev, [name as string]: '' }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name as string]: value }));
    setErrors(prev => ({ ...prev, [name as string]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ContractorEmployee, string>> = {};
    
    if (!formData.firstName?.trim()) newErrors.firstName = 'Vorname ist erforderlich';
    if (!formData.lastName?.trim()) newErrors.lastName = 'Nachname ist erforderlich';
    if (!formData.email?.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/^[^@]+@[^@]+\.[^@]+$/.test(formData.email)) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
    }
    if (!formData.phone?.trim()) newErrors.phone = 'Telefon ist erforderlich';
    if (!formData.position?.trim()) newErrors.position = 'Position ist erforderlich';
    if (!formData.vendorId) newErrors.vendorId = 'Auftragnehmer ist erforderlich';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    try {
      if (id) {
        // Edit mode
        await dispatch(editContractorEmployee(Number(id), formData as ContractorEmployee));
        setSuccess('Mitarbeiter erfolgreich aktualisiert!');
      } else {
        // Create mode
        await dispatch(addContractorEmployee(formData as ContractorEmployee));
        setSuccess('Mitarbeiter erfolgreich erstellt!');
        
        // Refresh the employee list after creation
        // This ensures the new employee appears in the list
        await dispatch(getContractorEmployees({ 
          pageNum: 0, 
          pageSize: 10, 
          sortField: 'createdAt', 
          direction: 'DESC', 
          filterFields: [] 
        }));
      }
      
      // Clear form after successful submission
      setTimeout(() => {
        navigate('/app/contractors/employees');
      }, 2000);
    } catch (err) {
      setError('Fehler beim Speichern des Mitarbeiters. Bitte versuchen Sie es erneut.');
    }
  };

  const handleCancel = () => {
    navigate('/app/contractors/employees');
  };

  if (loadingGet) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <Box p={3}>
        <Typography variant="h3" gutterBottom>
          {id ? 'Mitarbeiter bearbeiten' : 'Neuen Mitarbeiter erstellen'}
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vorname"
                name="firstName"
                value={formData.firstName || ''}
                onChange={handleChange}
                error={!!errors.firstName}
                helperText={errors.firstName}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nachname"
                name="lastName"
                value={formData.lastName || ''}
                onChange={handleChange}
                error={!!errors.lastName}
                helperText={errors.lastName}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="E-Mail"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefon"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                error={!!errors.phone}
                helperText={errors.phone}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Position"
                name="position"
                value={formData.position || ''}
                onChange={handleChange}
                error={!!errors.position}
                helperText={errors.position}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.vendorId} disabled={loadingVendors}>
                <InputLabel>Auftragnehmer</InputLabel>
                <Select
                  name="vendorId"
                  value={formData.vendorId || ''}
                  onChange={handleSelectChange}
                  label="Auftragnehmer"
                  required
                >
                  <MenuItem value="">Auftragnehmer auswählen</MenuItem>
                  {contractorVendors.length > 0 ? (
                    contractorVendors.map((vendor: VendorMiniDTO) => (
                      <MenuItem key={vendor.id} value={vendor.id}>
                        {vendor.companyName}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      {loadingVendors ? 'Lade Auftragnehmer...' : 'Keine Auftragnehmer verfügbar'}
                    </MenuItem>
                  )}
                </Select>
                {errors.vendorId && <Typography color="error" variant="caption">
                  {errors.vendorId}
                </Typography>}
                {!loadingVendors && contractorVendors.length === 0 && (
                  <Typography color="warning" variant="caption" style={{ display: 'block', marginTop: '4px' }}>
                    Bitte stellen Sie sicher, dass Auftragnehmer als "Auftragnehmer" oder "Contractor" Typ angelegt sind.
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.currentSafetyInstructionId}>
                <InputLabel>Sicherheitsunterweisung</InputLabel>
                <Select
                  name="currentSafetyInstructionId"
                  value={formData.currentSafetyInstructionId || ''}
                  onChange={handleSelectChange}
                  label="Sicherheitsunterweisung"
                >
                  <MenuItem value="">Keine Unterweisung</MenuItem>
                  {safetyInstructions.content.map((instruction: SafetyInstruction) => (
                    <MenuItem key={instruction.id} value={instruction.id}>
                      {instruction.title}
                    </MenuItem>
                  ))}
                </Select>
                {errors.currentSafetyInstructionId && <Typography color="error" variant="caption">
                  {errors.currentSafetyInstructionId}
                </Typography>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleCancel}
                  disabled={loadingGet}
                >
                  Abbrechen
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={loadingGet}
                >
                  {loadingGet ? <CircularProgress size={24} /> : (id ? 'Aktualisieren' : 'Erstellen')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Box>
    </Card>
  );
};

export default ContractorEmployeeForm;