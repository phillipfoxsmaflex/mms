import { Helmet } from 'react-helmet-async';
import {
  Box,
  Button,
  Card,
  debounce,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ChangeEvent, useContext, useEffect, useMemo, useState } from 'react';
import { TitleContext } from '../../../contexts/TitleContext';
import {
  addPermit,
  clearSinglePermit,
  deletePermit,
  editPermit,
  getPermits,
  getSinglePermit,
  getPermitLocations
} from '../../../slices/permit';
import { useDispatch, useSelector } from '../../../store';
import ConfirmDialog from '../components/ConfirmDialog';
import { GridEnrichedColDef } from '@mui/x-data-grid/models/colDef/gridColDef';
import CustomDataGrid from '../components/CustomDatagrid';
import {
  GridRenderCellParams,
  GridToolbar,
  GridValueGetterParams
} from '@mui/x-data-grid';
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import Permit, { PermitStatus, PermitType, RiskLevel, PermitLocation } from '../../../models/owns/permit';
import Form from '../components/form';
import * as Yup from 'yup';
import { IField } from '../type';
import PermitDetails from './PermitDetails';
import { useNavigate, useParams } from 'react-router-dom';
import { isNumeric } from '../../../utils/validators';
import { CustomSnackBarContext } from '../../../contexts/CustomSnackBarContext';
import useAuth from '../../../hooks/useAuth';
import { CompanySettingsContext } from '../../../contexts/CompanySettingsContext';
import { PermissionEntity } from '../../../models/owns/role';
import PermissionErrorMessage from '../components/PermissionErrorMessage';
import NoRowsMessageWrapper from '../components/NoRowsMessageWrapper';
import { onSearchQueryChange } from '../../../utils/overall';
import {
  FilterField,
  SearchCriteria
} from '../../../models/owns/page';
import { useGridApiRef } from '@mui/x-data-grid-pro';
import useGridStatePersist from '../../../hooks/useGridStatePersist';
import _ from 'lodash';
import FilterAltTwoToneIcon from '@mui/icons-material/FilterAltTwoTone';
import EnumFilter from '../WorkOrders/Filters/EnumFilter';
import CircleTwoToneIcon from '@mui/icons-material/CircleTwoTone';
import SearchInput from '../components/SearchInput';
import * as React from 'react';
import MoreVertTwoToneIcon from '@mui/icons-material/MoreVertTwoTone';
import { formatSelect, formatSelectMultiple } from '../../../utils/formatters';
import PermitStatusBadge from './components/PermitStatusBadge';
import RiskLevelBadge from './components/RiskLevelBadge';

function PermitManagement() {
  const { t }: { t: any } = useTranslation();
  const { setTitle } = useContext(TitleContext);
  const [openAddModal, setOpenAddModal] = useState<boolean>(false);
  const [openUpdateModal, setOpenUpdateModal] = useState<boolean>(false);
  const [openDrawer, setOpenDrawer] = useState<boolean>(false);
  const [openFilterDrawer, setOpenFilterDrawer] = useState<boolean>(false);
  const { hasViewPermission, hasCreatePermission } = useAuth();
  const [currentPermit, setCurrentPermit] = useState<Permit>();
  const { getFormattedDate } = useContext(CompanySettingsContext);
  const { permitId } = useParams();
  const dispatch = useDispatch();
  const [openDelete, setOpenDelete] = useState<boolean>(false);
  const { permits, loadingGet, singlePermit, locations } = useSelector(
    (state) => state.permits
  );
  const [openDrawerFromUrl, setOpenDrawerFromUrl] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);
  const navigate = useNavigate();

  const defaultFilterFields: FilterField[] = [
    {
      field: 'status',
      operation: 'in',
      values: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE'],
      value: '',
      enumName: 'PERMIT_STATUS'
    }
  ];

  const [criteria, setCriteria] = useState<SearchCriteria>({
    filterFields: defaultFilterFields,
    pageSize: 10,
    pageNum: 0,
    direction: 'DESC'
  });

  const { showSnackBar } = useContext(CustomSnackBarContext);

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleOpenDrawer = (permit: Permit) => {
    setCurrentPermit(permit);
    window.history.replaceState(
      null,
      'Permit details',
      `/app/permits/${permit.id}`
    );
    setOpenDrawer(true);
  };

  useEffect(() => {
    setTitle(t('permit_management'));
  }, []);

  useEffect(() => {
    if (permitId && isNumeric(permitId)) {
      dispatch(getSinglePermit(Number(permitId)));
    }
  }, [permitId]);

  useEffect(() => {
    if (hasViewPermission(PermissionEntity.PERMITS)) {
      dispatch(getPermits(criteria));
      dispatch(getPermitLocations());
    }
  }, [criteria]);

  useEffect(() => {
    if (singlePermit || permits.content.length) {
      const currentInContent = permits.content.find(
        (permit) => permit.id === currentPermit?.id
      );
      const updatedPermit = currentInContent ?? singlePermit;
      if (updatedPermit) {
        if (openDrawerFromUrl) {
          setCurrentPermit(updatedPermit);
        } else {
          handleOpenDrawer(updatedPermit);
          setOpenDrawerFromUrl(true);
        }
      }
    }
    return () => {
      dispatch(clearSinglePermit());
    };
  }, [singlePermit, permits]);

  const onPageSizeChange = (size: number) => {
    setCriteria({ ...criteria, pageSize: size });
  };

  const onPageChange = (number: number) => {
    setCriteria({ ...criteria, pageNum: number });
  };

  const handleDelete = (id: number) => {
    handleCloseDetails();
    dispatch(deletePermit(id)).then(onDeleteSuccess).catch(onDeleteFailure);
    setOpenDelete(false);
  };

  const handleOpenUpdate = () => {
    setOpenUpdateModal(true);
  };

  const onCreationSuccess = () => {
    setOpenAddModal(false);
    showSnackBar(t('permit_create_success'), 'success');
  };

  const onCreationFailure = (err) =>
    showSnackBar(t('permit_create_failure'), 'error');

  const onEditSuccess = () => {
    setOpenUpdateModal(false);
    showSnackBar(t('changes_saved_success'), 'success');
  };

  const onEditFailure = (err) =>
    showSnackBar(t('permit_edit_failure'), 'error');

  const onDeleteSuccess = () => {
    showSnackBar(t('permit_delete_success'), 'success');
  };

  const onDeleteFailure = (err) =>
    showSnackBar(t('permit_delete_failure'), 'error');

  const handleOpenDetails = (id: number) => {
    const foundPermit = permits.content.find((permit) => permit.id === id);
    if (foundPermit) {
      handleOpenDrawer(foundPermit);
    }
  };

  const handleCloseDetails = () => {
    window.history.replaceState(null, 'Permits', `/app/permits`);
    setOpenDrawer(false);
  };

  const formatValues = (values) => {
    const newValues = { ...values };
    newValues.permitLocation = formatSelect(newValues.permitLocation);
    newValues.assignedUsers = formatSelectMultiple(newValues.assignedUsers);
    newValues.teams = formatSelectMultiple(newValues.teams);
    return newValues;
  };

  const columns: GridEnrichedColDef[] = [
    {
      field: 'customId',
      headerName: t('id'),
      description: t('id'),
      width: 80
    },
    {
      field: 'title',
      headerName: t('title'),
      description: t('title'),
      width: 200,
      renderCell: (params: GridRenderCellParams<string>) => (
        <Box sx={{ fontWeight: 'bold' }}>{params.value}</Box>
      )
    },
    {
      field: 'permitType',
      headerName: t('permit_type'),
      description: t('permit_type'),
      width: 150,
      valueGetter: (params: GridValueGetterParams<null, Permit>) =>
        t((params.row?.permitType || '').toLowerCase())
    },
    {
      field: 'status',
      headerName: t('status'),
      description: t('status'),
      width: 150,
      renderCell: (params: GridRenderCellParams<PermitStatus>) => (
        <PermitStatusBadge status={params.value} />
      )
    },
    {
      field: 'riskLevel',
      headerName: t('risk_level'),
      description: t('risk_level'),
      width: 120,
      renderCell: (params: GridRenderCellParams<RiskLevel>) => (
        <RiskLevelBadge riskLevel={params.value} />
      )
    },
    {
      field: 'permitLocation',
      headerName: t('location'),
      description: t('location'),
      width: 150,
      valueGetter: (params: GridValueGetterParams<null, Permit>) =>
        params.row.permitLocation?.name || ''
    },
    {
      field: 'startDate',
      headerName: t('start_date'),
      description: t('start_date'),
      width: 150,
      valueGetter: (params: GridValueGetterParams<null, Permit>) =>
        getFormattedDate(params.value)
    },
    {
      field: 'endDate',
      headerName: t('end_date'),
      description: t('end_date'),
      width: 150,
      valueGetter: (params: GridValueGetterParams<null, Permit>) =>
        getFormattedDate(params.value)
    },
    {
      field: 'createdAt',
      headerName: t('created_at'),
      description: t('created_at'),
      width: 150,
      valueGetter: (params: GridValueGetterParams<null, Permit>) =>
        getFormattedDate(params.value)
    }
  ];

  const apiRef = useGridApiRef();
  useGridStatePersist(apiRef, columns, 'permit');

  const permitTypeOptions = [
    { label: t('hot_work'), value: 'HOT_WORK' },
    { label: t('confined_space'), value: 'CONFINED_SPACE' },
    { label: t('electrical'), value: 'ELECTRICAL' },
    { label: t('excavation'), value: 'EXCAVATION' },
    { label: t('working_at_height'), value: 'WORKING_AT_HEIGHT' },
    { label: t('cold_work'), value: 'COLD_WORK' },
    { label: t('general'), value: 'GENERAL' },
    { label: t('other'), value: 'OTHER' }
  ];

  const riskLevelOptions = [
    { label: t('low'), value: 'LOW' },
    { label: t('medium'), value: 'MEDIUM' },
    { label: t('high'), value: 'HIGH' },
    { label: t('critical'), value: 'CRITICAL' }
  ];

  const locationOptions = locations.map((loc) => ({
    label: `${loc.name} - ${loc.facility || ''}`,
    value: loc.id
  }));

  const defaultFields: Array<IField> = [
    {
      name: 'title',
      type: 'text',
      label: t('title'),
      placeholder: t('enter_permit_title'),
      required: true
    },
    {
      name: 'description',
      type: 'text',
      label: t('description'),
      placeholder: t('enter_description'),
      multiple: true
    },
    {
      name: 'permitType',
      type: 'select',
      label: t('permit_type'),
      placeholder: t('select_permit_type'),
      items: permitTypeOptions,
      required: true
    },
    {
      name: 'riskLevel',
      type: 'select',
      label: t('risk_level'),
      placeholder: t('select_risk_level'),
      items: riskLevelOptions,
      required: true
    },
    {
      name: 'permitLocation',
      type: 'select',
      label: t('location'),
      placeholder: t('select_location'),
      type2: 'location',
      items: locationOptions
    },
    {
      name: 'startDate',
      type: 'date',
      label: t('start_date'),
      required: true
    },
    {
      name: 'endDate',
      type: 'date',
      label: t('end_date'),
      required: true
    },
    {
      name: 'safetyRequirements',
      type: 'text',
      label: t('safety_requirements'),
      placeholder: t('enter_safety_requirements'),
      multiple: true
    },
    {
      name: 'equipmentNeeded',
      type: 'text',
      label: t('equipment_needed'),
      placeholder: t('enter_equipment_needed'),
      multiple: true
    },
    {
      name: 'hazardsIdentified',
      type: 'text',
      label: t('hazards_identified'),
      placeholder: t('enter_hazards_identified'),
      multiple: true
    },
    {
      name: 'controlMeasures',
      type: 'text',
      label: t('control_measures'),
      placeholder: t('enter_control_measures'),
      multiple: true
    },
    {
      name: 'emergencyProcedures',
      type: 'text',
      label: t('emergency_procedures'),
      placeholder: t('enter_emergency_procedures'),
      multiple: true
    },
    {
      name: 'ppeRequired',
      type: 'text',
      label: t('ppe_required'),
      placeholder: t('enter_ppe_required'),
      multiple: true
    },
    {
      name: 'specialInstructions',
      type: 'text',
      label: t('special_instructions'),
      placeholder: t('enter_special_instructions'),
      multiple: true
    }
  ];

  const defaultShape = {
    title: Yup.string().required(t('required_permit_title')),
    permitType: Yup.object().required(t('required_permit_type')).nullable(),
    riskLevel: Yup.object().required(t('required_risk_level')).nullable(),
    startDate: Yup.date().required(t('required_start_date')),
    endDate: Yup.date()
      .required(t('required_end_date'))
      .min(Yup.ref('startDate'), t('end_date_after_start'))
  };

  const onQueryChange = (event) => {
    onSearchQueryChange<Permit>(event, criteria, setCriteria, [
      'title',
      'description'
    ]);
  };

  const debouncedQueryChange = useMemo(() => debounce(onQueryChange, 1300), []);

  const onFilterChange = (newFilters: FilterField[]) => {
    const newCriteria = { ...criteria };
    newCriteria.filterFields = newFilters;
    setCriteria(newCriteria);
  };

  const renderAddModal = () => (
    <Dialog
      fullWidth
      maxWidth="md"
      open={openAddModal}
      onClose={() => setOpenAddModal(false)}
    >
      <DialogTitle
        sx={{
          p: 3
        }}
      >
        <Typography variant="h4" gutterBottom>
          {t('create_permit')}
        </Typography>
        <Typography variant="subtitle2">
          {t('create_permit_description')}
        </Typography>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          p: 3
        }}
      >
        <Box>
          <Form
            fields={defaultFields}
            validation={Yup.object().shape(defaultShape)}
            submitText={t('create')}
            values={{}}
            onChange={({ field, e }) => {}}
            onSubmit={async (values) => {
              let formattedValues = formatValues(values);
              formattedValues.permitType = values.permitType?.value;
              formattedValues.riskLevel = values.riskLevel?.value;
              return new Promise<void>((resolve, rej) => {
                dispatch(addPermit(formattedValues))
                  .then(onCreationSuccess)
                  .catch(onCreationFailure)
                  .finally(resolve);
              });
            }}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );

  const renderUpdateModal = () => (
    <Dialog
      fullWidth
      maxWidth="md"
      open={openUpdateModal}
      onClose={() => setOpenUpdateModal(false)}
    >
      <DialogTitle
        sx={{
          p: 3
        }}
      >
        <Typography variant="h4" gutterBottom>
          {t('edit_permit')}
        </Typography>
        <Typography variant="subtitle2">
          {t('edit_permit_description')}
        </Typography>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          p: 3
        }}
      >
        <Box>
          <Form
            fields={defaultFields}
            validation={Yup.object().shape(defaultShape)}
            submitText={t('save')}
            values={{
              ...currentPermit,
              permitType: permitTypeOptions.find(
                (opt) => opt.value === currentPermit?.permitType
              ),
              riskLevel: riskLevelOptions.find(
                (opt) => opt.value === currentPermit?.riskLevel
              ),
              permitLocation: locationOptions.find(
                (opt) => opt.value === currentPermit?.permitLocation?.id
              )
            }}
            onChange={({ field, e }) => {}}
            onSubmit={async (values) => {
              let formattedValues = formatValues(values);
              formattedValues.permitType = values.permitType?.value;
              formattedValues.riskLevel = values.riskLevel?.value;
              return new Promise<void>((resolve, rej) => {
                dispatch(editPermit(currentPermit.id, formattedValues))
                  .then(onEditSuccess)
                  .catch(onEditFailure)
                  .finally(resolve);
              });
            }}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );

  if (!hasViewPermission(PermissionEntity.PERMITS)) {
    return <PermissionErrorMessage message={t('no_view_permission')} />;
  }

  return (
    <>
      <Helmet>
        <title>{t('permit_management')}</title>
      </Helmet>
      <Grid
        container
        justifyContent="center"
        alignItems="stretch"
        spacing={1}
        paddingX={4}
      >
        <Grid item xs={12}>
          <Card
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SearchInput onChange={debouncedQueryChange} />
              <IconButton onClick={() => setOpenFilterDrawer(true)}>
                <FilterAltTwoToneIcon />
              </IconButton>
            </Box>
            {hasCreatePermission(PermissionEntity.PERMITS) && (
              <Button
                startIcon={<AddTwoToneIcon />}
                variant="contained"
                onClick={() => setOpenAddModal(true)}
              >
                {t('create_permit')}
              </Button>
            )}
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Box sx={{ height: 500, width: '100%' }}>
              {permits.content.length === 0 && !loadingGet ? (
                <NoRowsMessageWrapper
                  message={t('no_permits_message')}
                  action={
                    hasCreatePermission(PermissionEntity.PERMITS)
                      ? t('create_permit')
                      : ''
                  }
                />
              ) : (
                <CustomDataGrid
                  apiRef={apiRef}
                  columns={columns}
                  rows={permits.content}
                  loading={loadingGet}
                  components={{
                    Toolbar: GridToolbar
                  }}
                  onRowClick={(params) => handleOpenDetails(params.row.id)}
                  initialState={{
                    columns: {
                      columnVisibilityModel: {}
                    }
                  }}
                  onPageSizeChange={onPageSizeChange}
                  onPageChange={onPageChange}
                  rowCount={permits.totalElements}
                  page={criteria.pageNum}
                  pageSize={criteria.pageSize}
                />
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>
      <Drawer
        anchor="right"
        open={openDrawer}
        onClose={handleCloseDetails}
        PaperProps={{ sx: { width: { xs: '100%', md: '50%' } } }}
      >
        <PermitDetails
          permit={currentPermit}
          onEdit={handleOpenUpdate}
          onDelete={() => setOpenDelete(true)}
          onClose={handleCloseDetails}
        />
      </Drawer>
      <Drawer
        anchor="right"
        open={openFilterDrawer}
        onClose={() => setOpenFilterDrawer(false)}
        PaperProps={{ sx: { width: { xs: '100%', md: '30%' } } }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            {t('filters')}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <EnumFilter
            filterFields={criteria.filterFields}
            onChange={onFilterChange}
            completeOptions={[
              'DRAFT',
              'PENDING_APPROVAL',
              'APPROVED',
              'REJECTED',
              'ACTIVE',
              'EXPIRED',
              'COMPLETED',
              'CANCELLED'
            ]}
            fieldName="status"
            icon={<CircleTwoToneIcon />}
          />
        </Box>
      </Drawer>
      {renderAddModal()}
      {renderUpdateModal()}
      <ConfirmDialog
        open={openDelete}
        onCancel={() => {
          setOpenDelete(false);
        }}
        onConfirm={() => handleDelete(currentPermit?.id)}
        confirmText={t('delete')}
        question={t('confirm_delete_permit')}
      />
    </>
  );
}

export default PermitManagement;
