import {
  Box,
  Button,
  Card,
  Chip,
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
import { useDispatch, useSelector } from '../../../store';
import { CustomSnackBarContext } from '../../../contexts/CustomSnackBarContext';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
  GridActionsCellItem,
  GridRowParams,
  GridToolbar
} from '@mui/x-data-grid';
import { GridEnrichedColDef } from '@mui/x-data-grid/models/colDef/gridColDef';
import CustomDataGrid from '../components/CustomDatagrid';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import useAuth from '../../../hooks/useAuth';
import { PermissionEntity } from '../../../models/owns/role';
import { ManagementOfChange, MocStatus, MocType } from '../../../models/owns/moc';
import { CompanySettingsContext } from '../../../contexts/CompanySettingsContext';
import RejectDialog from '../PermitManagement/components/RejectDialog';

function MocManagement() {
  const { t }: { t: any } = useTranslation();
  const dispatch = useDispatch();
  const { showSnackBar } = useContext(CustomSnackBarContext);
  const { getFormattedDate } = useContext(CompanySettingsContext);
  const { hasEditPermission, hasCreatePermission } = useAuth();
  
  const [mocs, setMocs] = useState<ManagementOfChange[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [openForm, setOpenForm] = useState<boolean>(false);
  const [selectedMoc, setSelectedMoc] = useState<ManagementOfChange | null>(null);
  const [openRejectDialog, setOpenRejectDialog] = useState<boolean>(false);
  const [mocToReject, setMocToReject] = useState<number | null>(null);

  useEffect(() => {
    loadMocs();
  }, []);

  const loadMocs = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call
      // const response = await dispatch(getMocs());
      // setMocs(response);
      setMocs([]);
    } catch (error) {
      showSnackBar(t('failed_to_load_mocs'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = () => {
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setSelectedMoc(null);
    setOpenForm(false);
  };

  const handleSubmit = async (values: any) => {
    try {
      // TODO: Implement create API call
      showSnackBar(t('moc_created_success'), 'success');
      handleCloseForm();
      loadMocs();
    } catch (error) {
      showSnackBar(t('operation_failed'), 'error');
    }
  };

  const handleApprove = async (mocId: number) => {
    try {
      // TODO: Implement approve API call
      showSnackBar(t('moc_approved_success'), 'success');
      loadMocs();
    } catch (error) {
      showSnackBar(t('operation_failed'), 'error');
    }
  };

  const handleReject = async (reason: string) => {
    if (mocToReject) {
      try {
        // TODO: Implement reject API call
        showSnackBar(t('moc_rejected_success'), 'success');
        loadMocs();
      } catch (error) {
        showSnackBar(t('operation_failed'), 'error');
      }
    }
    setOpenRejectDialog(false);
    setMocToReject(null);
  };

  const validationSchema = Yup.object({
    title: Yup.string().required(t('required_field')),
    changeType: Yup.string().required(t('required_field')),
    description: Yup.string().required(t('required_field'))
  });

  const getStatusColor = (status: MocStatus): 'default' | 'warning' | 'success' | 'error' | 'info' => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'PENDING_REVIEW':
      case 'UNDER_REVIEW':
        return 'warning';
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'IMPLEMENTATION':
        return 'info';
      case 'COMPLETED':
      case 'CLOSED':
      case 'CANCELLED':
        return 'default';
      default:
        return 'default';
    }
  };

  const columns: GridEnrichedColDef[] = [
    {
      field: 'customId',
      headerName: t('id'),
      width: 100
    },
    {
      field: 'title',
      headerName: t('title'),
      flex: 1,
      minWidth: 200
    },
    {
      field: 'changeType',
      headerName: t('change_type'),
      width: 150,
      renderCell: (params) => t(params.value?.toLowerCase() || '')
    },
    {
      field: 'status',
      headerName: t('status'),
      width: 150,
      renderCell: (params) => (
        <Chip
          label={t(params.value?.toLowerCase() || '')}
          color={getStatusColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: 'permit',
      headerName: t('permit'),
      width: 150,
      valueGetter: (params) => params.row.permit?.title || '-'
    },
    {
      field: 'createdAt',
      headerName: t('created_at'),
      width: 150,
      valueGetter: (params) => getFormattedDate(params.value)
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: t('actions'),
      width: 150,
      getActions: (params: GridRowParams) => {
        const actions = [];
        
        actions.push(
          <GridActionsCellItem
            key="view"
            icon={<VisibilityIcon />}
            label={t('view')}
            onClick={() => setSelectedMoc(params.row)}
          />
        );

        if (
          params.row.status === 'PENDING_REVIEW' &&
          hasEditPermission(PermissionEntity.PERMITS, params.row)
        ) {
          actions.push(
            <GridActionsCellItem
              key="approve"
              icon={<CheckCircleIcon color="success" />}
              label={t('approve')}
              onClick={() => handleApprove(params.row.id)}
            />,
            <GridActionsCellItem
              key="reject"
              icon={<CancelIcon color="error" />}
              label={t('reject')}
              onClick={() => {
                setMocToReject(params.row.id);
                setOpenRejectDialog(true);
              }}
            />
          );
        }
        return actions;
      }
    }
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">{t('management_of_change')}</Typography>
        {hasCreatePermission(PermissionEntity.PERMITS) && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenForm}
          >
            {t('create_moc')}
          </Button>
        )}
      </Box>

      <Card>
        <CustomDataGrid
          rows={mocs}
          columns={columns}
          loading={loading}
          components={{ Toolbar: GridToolbar }}
          initialState={{
            columns: {
              columnVisibilityModel: {}
            }
          }}
        />
      </Card>

      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <DialogTitle>{t('create_moc')}</DialogTitle>
        <Formik
          initialValues={{
            title: '',
            changeType: '',
            description: '',
            riskAssessment: '',
            justification: '',
            impactAnalysis: '',
            implementationPlan: '',
            rollbackPlan: ''
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur }) => (
            <Form>
              <DialogContent>
                <Grid container spacing={2}>
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
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      select
                      name="changeType"
                      label={t('change_type')}
                      value={values.changeType}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.changeType && Boolean(errors.changeType)}
                      helperText={touched.changeType && errors.changeType}
                      required
                    >
                      <MenuItem value="EQUIPMENT">{t('equipment')}</MenuItem>
                      <MenuItem value="PROCESS">{t('process')}</MenuItem>
                      <MenuItem value="MATERIAL">{t('material')}</MenuItem>
                      <MenuItem value="PROCEDURE">{t('procedure')}</MenuItem>
                      <MenuItem value="PERSONNEL">{t('personnel')}</MenuItem>
                      <MenuItem value="FACILITY">{t('facility')}</MenuItem>
                      <MenuItem value="SOFTWARE">{t('software')}</MenuItem>
                      <MenuItem value="OTHER">{t('other')}</MenuItem>
                    </TextField>
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
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      name="justification"
                      label={t('justification')}
                      value={values.justification}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      name="riskAssessment"
                      label={t('risk_assessment')}
                      value={values.riskAssessment}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      name="impactAnalysis"
                      label={t('impact_analysis')}
                      value={values.impactAnalysis}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      name="implementationPlan"
                      label={t('implementation_plan')}
                      value={values.implementationPlan}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      name="rollbackPlan"
                      label={t('rollback_plan')}
                      value={values.rollbackPlan}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseForm}>{t('cancel')}</Button>
                <Button type="submit" variant="contained">
                  {t('create')}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      <RejectDialog
        open={openRejectDialog}
        onClose={() => {
          setOpenRejectDialog(false);
          setMocToReject(null);
        }}
        onConfirm={handleReject}
        title={t('reject_moc')}
        message={t('reject_moc_message')}
      />
    </Box>
  );
}

export default MocManagement;
