import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
  Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from '../../../store';
import { CustomSnackBarContext } from '../../../contexts/CustomSnackBarContext';
import Permit, {
  PermitStatus,
  PermitType,
  RiskLevel
} from '../../../models/owns/permit';
import { createPermit, updatePermit } from '../../../slices/permit';
import { UserMiniDTO } from '../../../models/user';
import Team from '../../../models/owns/team';
import { PermitLocation } from '../../../models/owns/permit';

interface PermitFormProps {
  open: boolean;
  onClose: () => void;
  permit?: Permit | null;
  onSuccess?: () => void;
}

interface PermitFormValues {
  title: string;
  description: string;
  permitType: PermitType | '';
  riskLevel: RiskLevel | '';
  permitLocationId: number | '';
  startDate: string;
  endDate: string;
  safetyRequirements: string;
  hazardsIdentified: string;
  controlMeasures: string;
  equipmentNeeded: string;
  ppeRequired: string;
  emergencyProcedures: string;
  specialInstructions: string;
  assignedUserIds: number[];
  teamIds: number[];
}

function PermitForm({ open, onClose, permit, onSuccess }: PermitFormProps) {
  const { t }: { t: any } = useTranslation();
  const dispatch = useDispatch();
  const { showSnackBar } = useContext(CustomSnackBarContext);
  
  const [locations, setLocations] = useState<PermitLocation[]>([]);
  const [users, setUsers] = useState<UserMiniDTO[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      loadFormData();
    }
  }, [open]);

  const loadFormData = async () => {
    // TODO: Load locations, users, teams from API
    // const [locationsRes, usersRes, teamsRes] = await Promise.all([
    //   dispatch(getPermitLocations()),
    //   dispatch(getUsers()),
    //   dispatch(getTeams())
    // ]);
    // setLocations(locationsRes);
    // setUsers(usersRes);
    // setTeams(teamsRes);
  };

  const validationSchema = Yup.object({
    title: Yup.string().required(t('required_field')),
    description: Yup.string().required(t('required_field')),
    permitType: Yup.string().required(t('required_field')),
    riskLevel: Yup.string().required(t('required_field')),
    startDate: Yup.date().required(t('required_field')),
    endDate: Yup.date()
      .required(t('required_field'))
      .min(Yup.ref('startDate'), t('end_date_after_start'))
  });

  const initialValues: PermitFormValues = {
    title: permit?.title || '',
    description: permit?.description || '',
    permitType: permit?.permitType || '',
    riskLevel: permit?.riskLevel || '',
    permitLocationId: permit?.permitLocation?.id || '',
    startDate: permit?.startDate
      ? new Date(permit.startDate).toISOString().slice(0, 16)
      : '',
    endDate: permit?.endDate
      ? new Date(permit.endDate).toISOString().slice(0, 16)
      : '',
    safetyRequirements: permit?.safetyRequirements || '',
    hazardsIdentified: permit?.hazardsIdentified || '',
    controlMeasures: permit?.controlMeasures || '',
    equipmentNeeded: permit?.equipmentNeeded || '',
    ppeRequired: permit?.ppeRequired || '',
    emergencyProcedures: permit?.emergencyProcedures || '',
    specialInstructions: permit?.specialInstructions || '',
    assignedUserIds: permit?.assignedUsers?.map((u) => u.id) || [],
    teamIds: permit?.teams?.map((t) => t.id) || []
  };

  const handleSubmit = async (values: PermitFormValues) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        permitLocation: values.permitLocationId
          ? { id: values.permitLocationId }
          : null,
        assignedUsers: values.assignedUserIds.map((id) => ({ id })),
        teams: values.teamIds.map((id) => ({ id }))
      };

      if (permit) {
        await dispatch(updatePermit(permit.id, payload));
        showSnackBar(t('permit_updated_success'), 'success');
      } else {
        await dispatch(createPermit(payload));
        showSnackBar(t('permit_created_success'), 'success');
      }
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      showSnackBar(t('operation_failed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const permitTypes: PermitType[] = [
    'HOT_WORK',
    'CONFINED_SPACE',
    'ELECTRICAL',
    'EXCAVATION',
    'WORKING_AT_HEIGHT',
    'COLD_WORK',
    'CHEMICAL_HANDLING',
    'LOCKOUT_TAGOUT',
    'RADIATION',
    'GENERAL'
  ];

  const riskLevels: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {permit ? t('edit_permit') : t('create_permit')}
      </DialogTitle>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => (
          <Form>
            <DialogContent>
              <Grid container spacing={2}>
                {/* Basic Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    {t('basic_information')}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="title"
                    label={t('title')}
                    value={values.title}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.title && Boolean(errors.title)}
                    helperText={touched.title && errors.title}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    name="description"
                    label={t('description')}
                    value={values.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.description && Boolean(errors.description)}
                    helperText={touched.description && errors.description}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    name="permitType"
                    label={t('permit_type')}
                    value={values.permitType}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.permitType && Boolean(errors.permitType)}
                    helperText={touched.permitType && errors.permitType}
                    required
                  >
                    {permitTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {t(type.toLowerCase())}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    name="riskLevel"
                    label={t('risk_level')}
                    value={values.riskLevel}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.riskLevel && Boolean(errors.riskLevel)}
                    helperText={touched.riskLevel && errors.riskLevel}
                    required
                  >
                    {riskLevels.map((level) => (
                      <MenuItem key={level} value={level}>
                        {t(level.toLowerCase())}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    name="permitLocationId"
                    label={t('location')}
                    value={values.permitLocationId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  >
                    <MenuItem value="">{t('select_location')}</MenuItem>
                    {locations.map((loc) => (
                      <MenuItem key={loc.id} value={loc.id}>
                        {loc.name} - {loc.facility}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Schedule */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    {t('schedule')}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    name="startDate"
                    label={t('start_date')}
                    value={values.startDate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.startDate && Boolean(errors.startDate)}
                    helperText={touched.startDate && errors.startDate}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    name="endDate"
                    label={t('end_date')}
                    value={values.endDate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.endDate && Boolean(errors.endDate)}
                    helperText={touched.endDate && errors.endDate}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>

                {/* Safety Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    {t('safety_information')}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    name="safetyRequirements"
                    label={t('safety_requirements')}
                    value={values.safetyRequirements}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={t('safety_requirements_placeholder')}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    name="hazardsIdentified"
                    label={t('hazards_identified')}
                    value={values.hazardsIdentified}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={t('hazards_identified_placeholder')}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    name="controlMeasures"
                    label={t('control_measures')}
                    value={values.controlMeasures}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={t('control_measures_placeholder')}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    name="equipmentNeeded"
                    label={t('equipment_needed')}
                    value={values.equipmentNeeded}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    name="ppeRequired"
                    label={t('ppe_required')}
                    value={values.ppeRequired}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    name="emergencyProcedures"
                    label={t('emergency_procedures')}
                    value={values.emergencyProcedures}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    name="specialInstructions"
                    label={t('special_instructions')}
                    value={values.specialInstructions}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>

                {/* Assignments */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    {t('assignments')}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    name="assignedUserIds"
                    label={t('assigned_users')}
                    value={values.assignedUserIds}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFieldValue(
                        'assignedUserIds',
                        typeof value === 'string' ? value.split(',').map(Number) : value
                      );
                    }}
                    SelectProps={{
                      multiple: true
                    }}
                  >
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    name="teamIds"
                    label={t('teams')}
                    value={values.teamIds}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFieldValue(
                        'teamIds',
                        typeof value === 'string' ? value.split(',').map(Number) : value
                      );
                    }}
                    SelectProps={{
                      multiple: true
                    }}
                  >
                    {teams.map((team) => (
                      <MenuItem key={team.id} value={team.id}>
                        {team.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions>
              <Button onClick={onClose} disabled={loading}>
                {t('cancel')}
              </Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {permit ? t('update') : t('create')}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
}

export default PermitForm;
