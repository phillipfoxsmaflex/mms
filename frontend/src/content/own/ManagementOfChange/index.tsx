import { Helmet } from 'react-helmet-async';
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
  Chip
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { IField } from '../type';
import * as React from 'react';
import { useContext, useEffect, useState } from 'react';
import { TitleContext } from '../../../contexts/TitleContext';
import {
  addMoc,
  deleteMoc,
  editMoc,
  getMocs,
  approveMoc,
  rejectMoc
} from '../../../slices/managementOfChange';
import { getPermits } from '../../../slices/permit';
import { SearchCriteria } from '../../../models/owns/page';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDispatch, useSelector } from '../../../store';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import { GridEnrichedColDef } from '@mui/x-data-grid/models/colDef/gridColDef';
import CustomDataGrid from '../components/CustomDatagrid';
import {
  GridActionsCellItem,
  GridRenderCellParams,
  GridRowParams,
  GridValueGetterParams
} from '@mui/x-data-grid';
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import Form from '../components/form';
import * as Yup from 'yup';
import { isNumeric } from '../../../utils/validators';
import { useNavigate, useParams } from 'react-router-dom';
import { formatSelect } from '../../../utils/formatters';
import { CustomSnackBarContext } from 'src/contexts/CustomSnackBarContext';
import { CompanySettingsContext } from '../../../contexts/CompanySettingsContext';
import { useGridApiRef } from '@mui/x-data-grid-pro';
import useAuth from '../../../hooks/useAuth';
import { PermissionEntity } from '../../../models/owns/role';
import PermissionErrorMessage from '../components/PermissionErrorMessage';
import NoRowsMessageWrapper from '../components/NoRowsMessageWrapper';
import { ManagementOfChange, MocStatus, ChangeType } from '../../../models/owns/managementOfChange';
import CheckCircleTwoToneIcon from '@mui/icons-material/CheckCircleTwoTone';
import CancelTwoToneIcon from '@mui/icons-material/CancelTwoTone';

function MocManagement() {
  const { t }: { t: any } = useTranslation();
  const dispatch = useDispatch();
  const { showSnackBar } = useContext(CustomSnackBarContext);
  const { getFormattedDate } = useContext(CompanySettingsContext);
  const [openDelete, setOpenDelete] = useState<boolean>(false);
  const [openReject, setOpenReject] = useState<boolean>(false);

  const { mocs, loadingGet } = useSelector(
    (state) => state.managementOfChange
  );
  const { permits } = useSelector((state) => state.permits);

  const apiRef = useGridApiRef();
  const [openAddModal, setOpenAddModal] = useState<boolean>(false);
  const [openUpdateModal, setOpenUpdateModal] = useState<boolean>(false);
  const { setTitle } = useContext(TitleContext);
  const { mocId } = useParams();
  const {
    hasViewPermission,
    hasEditPermission,
    hasCreatePermission,
    hasDeletePermission
  } = useAuth();
  const [currentMoc, setCurrentMoc] = useState<ManagementOfChange>();
  const navigate = useNavigate();

  const handleOpenUpdate = () => {
    setOpenUpdateModal(true);
  };

  const changeCurrentMoc = (id: number) => {
    setCurrentMoc(mocs.find((moc) => moc.id === id));
  };

  const handleDelete = (id: number) => {
    dispatch(deleteMoc(id)).then(onDeleteSuccess).catch(onDeleteFailure);
    setOpenDelete(false);
  };

  const onCreationSuccess = () => {
    setOpenAddModal(false);
    showSnackBar(t('moc_create_success'), 'success');
  };
  const onCreationFailure = (err) =>
    showSnackBar(t('moc_create_failure'), 'error');
  const onEditSuccess = () => {
    setOpenUpdateModal(false);
    showSnackBar(t('changes_saved_success'), 'success');
  };
  const onEditFailure = (err) =>
    showSnackBar(t('moc_edit_failure'), 'error');
  const onDeleteSuccess = () => {
    showSnackBar(t('moc_delete_success'), 'success');
  };
  const onDeleteFailure = (err) =>
    showSnackBar(t('moc_delete_failure'), 'error');

  useEffect(() => {
    setTitle(t('management_of_change'));
    if (hasViewPermission(PermissionEntity.PERMITS)) {
      dispatch(getMocs());
      dispatch(getPermits({
        filterFields: [],
        pageSize: 10,
        pageNum: 0,
        direction: 'DESC'
      }));
    }
  }, []);

  const formatValues = (values) => {
    const newValues = { ...values };
    newValues.permit = formatSelect(newValues.permit);
    return newValues;
  };

  const getStatusColor = (status: MocStatus) => {
    switch (status) {
      case MocStatus.PENDING:
        return 'warning';
      case MocStatus.APPROVED:
        return 'success';
      case MocStatus.REJECTED:
        return 'error';
      default:
        return 'default';
    }
  };

  const handleApprove = (id: number) => {
    dispatch(approveMoc(id))
      .then(() => showSnackBar(t('moc_approved'), 'success'))
      .catch(() => showSnackBar(t('moc_approve_failure'), 'error'));
  };

  const handleReject = (id: number, reason: string) => {
    dispatch(rejectMoc(id, reason))
      .then(() => {
        showSnackBar(t('moc_rejected'), 'success');
        setOpenReject(false);
      })
      .catch(() => showSnackBar(t('moc_reject_failure'), 'error'));
  };

  const columns: GridEnrichedColDef[] = [
    {
      field: 'id',
      headerName: t('id'),
      description: t('id'),
      width: 70
    },
    {
      field: 'title',
      headerName: t('title'),
      description: t('title'),
      flex: 1,
      renderCell: (params: GridRenderCellParams<string>) => (
        <Box sx={{ fontWeight: 'bold' }}>{params.value}</Box>
      )
    },
    {
      field: 'changeType',
      headerName: t('change_type'),
      description: t('change_type'),
      width: 150,
      renderCell: (params: GridRenderCellParams<ChangeType>) => (
        <Typography variant="body2">{t(params.value)}</Typography>
      )
    },
    {
      field: 'status',
      headerName: t('status'),
      description: t('status'),
      width: 130,
      renderCell: (params: GridRenderCellParams<MocStatus>) => (
        <Chip
          label={t(params.value)}
          color={getStatusColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: 'permit',
      headerName: t('permit'),
      description: t('permit'),
      width: 150,
      valueGetter: (params: GridValueGetterParams) =>
        params.value?.title || t('not_assigned')
    },
    {
      field: 'createdAt',
      headerName: t('created_at'),
      description: t('created_at'),
      width: 130,
      valueGetter: (params: GridValueGetterParams<string>) =>
        getFormattedDate(params.value)
    },
    {
      field: 'approvedAt',
      headerName: t('approved_at'),
      description: t('approved_at'),
      width: 130,
      valueGetter: (params: GridValueGetterParams<string>) =>
        params.value ? getFormattedDate(params.value) : '-'
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: t('actions'),
      description: t('actions'),
      width: 180,
      getActions: (params: GridRowParams<ManagementOfChange>) => {
        const actions = [];
        const moc = params.row;

        // Workflow actions based on status
        if (moc.status === MocStatus.PENDING) {
          actions.push(
            <GridActionsCellItem
              key="approve"
              icon={<CheckCircleTwoToneIcon fontSize="small" color="success" />}
              onClick={() => handleApprove(moc.id)}
              label={t('approve')}
            />
          );
          actions.push(
            <GridActionsCellItem
              key="reject"
              icon={<CancelTwoToneIcon fontSize="small" color="error" />}
              onClick={() => {
                setCurrentMoc(moc);
                setOpenReject(true);
              }}
              label={t('reject')}
            />
          );
        }

        // Edit action
        if (
          hasEditPermission(PermissionEntity.PERMITS, moc) &&
          moc.status === MocStatus.PENDING
        ) {
          actions.push(
            <GridActionsCellItem
              key="edit"
              icon={<EditTwoToneIcon fontSize="small" color="primary" />}
              onClick={() => {
                changeCurrentMoc(moc.id);
                handleOpenUpdate();
              }}
              label={t('edit')}
            />
          );
        }

        // Delete action
        if (
          hasDeletePermission(PermissionEntity.PERMITS, moc) &&
          moc.status === MocStatus.PENDING
        ) {
          actions.push(
            <GridActionsCellItem
              key="delete"
              icon={<DeleteTwoToneIcon fontSize="small" color="error" />}
              onClick={() => {
                changeCurrentMoc(moc.id);
                setOpenDelete(true);
              }}
              label={t('delete')}
            />
          );
        }

        return actions;
      }
    }
  ];

  const fields: Array<IField> = [
    {
      name: 'title',
      type: 'text',
      label: t('title'),
      placeholder: t('enter_moc_title'),
      required: true
    },
    {
      name: 'changeType',
      type: 'select',
      label: t('change_type'),
      placeholder: t('select_change_type'),
      items: Object.values(ChangeType).map((type) => ({
        label: t(type),
        value: type
      })),
      required: true
    },
    {
      name: 'permit',
      type: 'select',
      label: t('permit'),
      placeholder: t('select_permit'),
      items: permits.content.map((permit) => ({
        label: permit.title,
        value: permit.id
      }))
    },
    {
      name: 'description',
      type: 'text',
      label: t('description'),
      placeholder: t('enter_description'),
      multiple: true,
      required: true
    },
    {
      name: 'riskAssessment',
      type: 'text',
      label: t('risk_assessment'),
      placeholder: t('enter_risk_assessment'),
      multiple: true,
      required: true
    }
  ];

  const shape = {
    title: Yup.string().required(t('required_title')),
    changeType: Yup.string().required(t('required_change_type')),
    description: Yup.string().required(t('required_description')),
    riskAssessment: Yup.string().required(t('required_risk_assessment'))
  };

  const renderMocAddModal = () => (
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
          {t('add_moc')}
        </Typography>
        <Typography variant="subtitle2">
          {t('add_moc_description')}
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
            fields={fields}
            validation={Yup.object().shape(shape)}
            submitText={t('add')}
            values={{ status: MocStatus.PENDING }}
            onChange={({ field, e }) => {}}
            onSubmit={async (values) => {
              let formattedValues = formatValues(values);
              formattedValues.status = MocStatus.PENDING;
              return new Promise<void>((resolve, rej) => {
                dispatch(addMoc(formattedValues))
                  .then(() => {
                    onCreationSuccess();
                    resolve();
                  })
                  .catch((err) => {
                    onCreationFailure(err);
                    rej(err);
                  });
              });
            }}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );

  const renderMocUpdateModal = () => (
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
          {t('edit_moc')}
        </Typography>
        <Typography variant="subtitle2">
          {t('edit_moc_description')}
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
            fields={fields}
            validation={Yup.object().shape(shape)}
            submitText={t('save')}
            values={{
              ...currentMoc,
              permit: currentMoc?.permit
                ? {
                    label: currentMoc.permit.title,
                    value: currentMoc.permit.id
                  }
                : null
            }}
            onChange={({ field, e }) => {}}
            onSubmit={async (values) => {
              let formattedValues = formatValues(values);
              return new Promise<void>((resolve, rej) => {
                dispatch(editMoc(currentMoc.id, formattedValues))
                  .then(() => {
                    onEditSuccess();
                    resolve();
                  })
                  .catch((err) => {
                    onEditFailure(err);
                    rej(err);
                  });
              });
            }}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );

  const renderRejectModal = () => (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={openReject}
      onClose={() => setOpenReject(false)}
    >
      <DialogTitle>
        <Typography variant="h4">{t('reject_moc')}</Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Form
          fields={[
            {
              name: 'rejectionReason',
              type: 'text',
              label: t('rejection_reason'),
              placeholder: t('enter_rejection_reason'),
              multiple: true,
              required: true
            }
          ]}
          validation={Yup.object().shape({
            rejectionReason: Yup.string().required(t('required_rejection_reason'))
          })}
          submitText={t('reject')}
          values={{ rejectionReason: '' }}
          onChange={({ field, e }) => {}}
          onSubmit={async (values) => {
            return new Promise<void>((resolve, rej) => {
              dispatch(rejectMoc(currentMoc.id, values.rejectionReason))
                .then(() => {
                  showSnackBar(t('moc_rejected'), 'success');
                  setOpenReject(false);
                  resolve();
                })
                .catch((err) => {
                  showSnackBar(t('moc_reject_failure'), 'error');
                  rej(err);
                });
            });
          }}
        />
      </DialogContent>
    </Dialog>
  );

  if (!hasViewPermission(PermissionEntity.PERMITS)) {
    return <PermissionErrorMessage message={t('no_view_permission')} />;
  }

  return (
    <>
      <Helmet>
        <title>{t('management_of_change')}</title>
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
            <Box>
              <Typography variant="h4">{t('management_of_change')}</Typography>
              <Typography variant="subtitle1">
                {t('moc_description')}
              </Typography>
            </Box>
            {hasCreatePermission(PermissionEntity.PERMITS) && (
              <Button
                startIcon={<AddTwoToneIcon />}
                sx={{ mx: 6, my: 1 }}
                variant="contained"
                onClick={() => setOpenAddModal(true)}
              >
                {t('create_moc')}
              </Button>
            )}
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <Box sx={{ width: '95%' }}>
              {loadingGet ? (
                <CircularProgress />
              ) : (
                <CustomDataGrid
                  apiRef={apiRef}
                  columns={columns}
                  rows={mocs}
                  loading={loadingGet}
                  components={{
                    NoRowsOverlay: () => (
                      <NoRowsMessageWrapper
                        message={t('no_mocs')}
                        action={t('create_moc')}
                      />
                    )
                  }}
                  initialState={{
                    columns: {
                      columnVisibilityModel: {}
                    }
                  }}
                />
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>
      {renderMocAddModal()}
      {renderMocUpdateModal()}
      {renderRejectModal()}
      <ConfirmDialog
        open={openDelete}
        onCancel={() => {
          setOpenDelete(false);
        }}
        onConfirm={() => handleDelete(currentMoc?.id)}
        confirmText={t('delete')}
        question={t('confirm_delete_moc')}
      />
    </>
  );
}

export default MocManagement;
