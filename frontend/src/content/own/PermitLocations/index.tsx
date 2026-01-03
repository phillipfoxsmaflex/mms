import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
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
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ConfirmDialog from '../components/ConfirmDialog';
import useAuth from '../../../hooks/useAuth';
import { PermissionEntity } from '../../../models/owns/role';
import { PermitLocation } from '../../../models/owns/permit';

interface PermitLocationFormValues {
  name: string;
  facility: string;
  building: string;
  floor: string;
  area: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  description: string;
}

function PermitLocations() {
  const { t }: { t: any } = useTranslation();
  const dispatch = useDispatch();
  const { showSnackBar } = useContext(CustomSnackBarContext);
  const { hasEditPermission, hasDeletePermission, hasCreatePermission } = useAuth();
  
  const [locations, setLocations] = useState<PermitLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [openForm, setOpenForm] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<PermitLocation | null>(null);
  const [openDelete, setOpenDelete] = useState<boolean>(false);
  const [locationToDelete, setLocationToDelete] = useState<number | null>(null);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call
      // const response = await dispatch(getPermitLocations());
      // setLocations(response);
      setLocations([]);
    } catch (error) {
      showSnackBar(t('failed_to_load_locations'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (location?: PermitLocation) => {
    setSelectedLocation(location || null);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setSelectedLocation(null);
    setOpenForm(false);
  };

  const handleSubmit = async (values: PermitLocationFormValues) => {
    try {
      if (selectedLocation) {
        // TODO: Implement update API call
        showSnackBar(t('location_updated_success'), 'success');
      } else {
        // TODO: Implement create API call
        showSnackBar(t('location_created_success'), 'success');
      }
      handleCloseForm();
      loadLocations();
    } catch (error) {
      showSnackBar(t('operation_failed'), 'error');
    }
  };

  const handleDelete = async () => {
    if (locationToDelete) {
      try {
        // TODO: Implement delete API call
        showSnackBar(t('location_deleted_success'), 'success');
        loadLocations();
      } catch (error) {
        showSnackBar(t('delete_failed'), 'error');
      }
    }
    setOpenDelete(false);
    setLocationToDelete(null);
  };

  const validationSchema = Yup.object({
    name: Yup.string().required(t('required_field')),
    facility: Yup.string().required(t('required_field'))
  });

  const initialValues: PermitLocationFormValues = {
    name: selectedLocation?.name || '',
    facility: selectedLocation?.facility || '',
    building: selectedLocation?.building || '',
    floor: selectedLocation?.floor || '',
    area: selectedLocation?.area || '',
    address: selectedLocation?.address || '',
    latitude: selectedLocation?.latitude || null,
    longitude: selectedLocation?.longitude || null,
    description: selectedLocation?.description || ''
  };

  const columns: GridEnrichedColDef[] = [
    {
      field: 'name',
      headerName: t('name'),
      flex: 1,
      minWidth: 150
    },
    {
      field: 'facility',
      headerName: t('facility'),
      flex: 1,
      minWidth: 150
    },
    {
      field: 'building',
      headerName: t('building'),
      flex: 1,
      minWidth: 150
    },
    {
      field: 'address',
      headerName: t('address'),
      flex: 1,
      minWidth: 200
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: t('actions'),
      width: 100,
      getActions: (params: GridRowParams) => {
        const actions = [];
        if (hasEditPermission(PermissionEntity.PERMITS, params.row)) {
          actions.push(
            <GridActionsCellItem
              key="edit"
              icon={<EditIcon />}
              label={t('edit')}
              onClick={() => handleOpenForm(params.row)}
            />
          );
        }
        if (hasDeletePermission(PermissionEntity.PERMITS, params.row)) {
          actions.push(
            <GridActionsCellItem
              key="delete"
              icon={<DeleteIcon color="error" />}
              label={t('delete')}
              onClick={() => {
                setLocationToDelete(params.row.id);
                setOpenDelete(true);
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
        <Typography variant="h4">{t('permit_locations')}</Typography>
        {hasCreatePermission(PermissionEntity.PERMITS) && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
          >
            {t('add_location')}
          </Button>
        )}
      </Box>

      <Card>
        <CustomDataGrid
          rows={locations}
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
        <DialogTitle>
          {selectedLocation ? t('edit_location') : t('add_location')}
        </DialogTitle>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, errors, touched, handleChange, handleBlur }) => (
            <Form>
              <DialogContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      name="name"
                      label={t('name')}
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      name="facility"
                      label={t('facility')}
                      value={values.facility}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.facility && Boolean(errors.facility)}
                      helperText={touched.facility && errors.facility}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      name="building"
                      label={t('building')}
                      value={values.building}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      name="floor"
                      label={t('floor')}
                      value={values.floor}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      name="area"
                      label={t('area')}
                      value={values.area}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      name="address"
                      label={t('address')}
                      value={values.address}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      name="latitude"
                      label={t('latitude')}
                      type="number"
                      value={values.latitude || ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      name="longitude"
                      label={t('longitude')}
                      type="number"
                      value={values.longitude || ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
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
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseForm}>{t('cancel')}</Button>
                <Button type="submit" variant="contained">
                  {selectedLocation ? t('update') : t('create')}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      <ConfirmDialog
        open={openDelete}
        onCancel={() => {
          setOpenDelete(false);
          setLocationToDelete(null);
        }}
        onConfirm={handleDelete}
        confirmText={t('delete')}
        question={t('confirm_delete_location')}
      />
    </Box>
  );
}

export default PermitLocations;
