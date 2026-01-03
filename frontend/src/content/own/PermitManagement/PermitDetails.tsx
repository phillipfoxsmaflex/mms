import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useContext, useState } from 'react';
import Permit, { PermitStatus } from '../../../models/owns/permit';
import { CompanySettingsContext } from '../../../contexts/CompanySettingsContext';
import useAuth from '../../../hooks/useAuth';
import { PermissionEntity } from '../../../models/owns/role';
import PermitStatusBadge from './components/PermitStatusBadge';
import RiskLevelBadge from './components/RiskLevelBadge';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import SendIcon from '@mui/icons-material/Send';
import { useDispatch } from '../../../store';
import {
  submitPermitForApproval,
  approvePermit,
  rejectPermit,
  activatePermit,
  completePermit,
  cancelPermit
} from '../../../slices/permit';
import { CustomSnackBarContext } from '../../../contexts/CustomSnackBarContext';
import ConfirmDialog from '../components/ConfirmDialog';
import RejectDialog from './components/RejectDialog';

interface PermitDetailsProps {
  permit: Permit;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

function PermitDetails({ permit, onEdit, onDelete, onClose }: PermitDetailsProps) {
  const { t }: { t: any } = useTranslation();
  const { getFormattedDate } = useContext(CompanySettingsContext);
  const { hasEditPermission, hasDeletePermission } = useAuth();
  const dispatch = useDispatch();
  const { showSnackBar } = useContext(CustomSnackBarContext);
  const [currentTab, setCurrentTab] = useState<string>('details');
  const [openRejectDialog, setOpenRejectDialog] = useState<boolean>(false);
  const [openCancelDialog, setOpenCancelDialog] = useState<boolean>(false);
  const [openConfirmAction, setOpenConfirmAction] = useState<{
    open: boolean;
    action: string;
    title: string;
    message: string;
  }>({ open: false, action: '', title: '', message: '' });

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  };

  const handleSubmitForApproval = () => {
    dispatch(submitPermitForApproval(permit.id))
      .then(() => showSnackBar(t('permit_submitted_success'), 'success'))
      .catch(() => showSnackBar(t('permit_submitted_failure'), 'error'));
  };

  const handleApprove = () => {
    dispatch(approvePermit(permit.id))
      .then(() => showSnackBar(t('permit_approved_success'), 'success'))
      .catch(() => showSnackBar(t('permit_approved_failure'), 'error'));
  };

  const handleReject = (reason: string) => {
    dispatch(rejectPermit(permit.id, reason))
      .then(() => showSnackBar(t('permit_rejected_success'), 'success'))
      .catch(() => showSnackBar(t('permit_rejected_failure'), 'error'));
    setOpenRejectDialog(false);
  };

  const handleActivate = () => {
    dispatch(activatePermit(permit.id))
      .then(() => showSnackBar(t('permit_activated_success'), 'success'))
      .catch(() => showSnackBar(t('permit_activated_failure'), 'error'));
  };

  const handleComplete = () => {
    dispatch(completePermit(permit.id))
      .then(() => showSnackBar(t('permit_completed_success'), 'success'))
      .catch(() => showSnackBar(t('permit_completed_failure'), 'error'));
  };

  const handleCancel = (reason: string) => {
    dispatch(cancelPermit(permit.id, reason))
      .then(() => showSnackBar(t('permit_cancelled_success'), 'success'))
      .catch(() => showSnackBar(t('permit_cancelled_failure'), 'error'));
    setOpenCancelDialog(false);
  };

  const renderWorkflowActions = () => {
    const actions = [];

    switch (permit?.status) {
      case 'DRAFT':
        actions.push(
          <Button
            key="submit"
            variant="contained"
            color="primary"
            startIcon={<SendIcon />}
            onClick={handleSubmitForApproval}
          >
            {t('submit_for_approval')}
          </Button>
        );
        break;
      case 'PENDING_APPROVAL':
        actions.push(
          <Button
            key="approve"
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={handleApprove}
          >
            {t('approve')}
          </Button>,
          <Button
            key="reject"
            variant="contained"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => setOpenRejectDialog(true)}
          >
            {t('reject')}
          </Button>
        );
        break;
      case 'APPROVED':
        actions.push(
          <Button
            key="activate"
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={handleActivate}
          >
            {t('activate')}
          </Button>
        );
        break;
      case 'ACTIVE':
        actions.push(
          <Button
            key="complete"
            variant="contained"
            color="success"
            startIcon={<DoneAllIcon />}
            onClick={handleComplete}
          >
            {t('complete')}
          </Button>
        );
        break;
    }

    if (
      permit?.status !== 'COMPLETED' &&
      permit?.status !== 'CANCELLED' &&
      permit?.status !== 'REJECTED'
    ) {
      actions.push(
        <Button
          key="cancel"
          variant="outlined"
          color="error"
          startIcon={<CancelIcon />}
          onClick={() => setOpenCancelDialog(true)}
        >
          {t('cancel')}
        </Button>
      );
    }

    return actions;
  };

  const renderDetailItem = (label: string, value: string | React.ReactNode) => (
    <Grid item xs={12} md={6}>
      <Typography variant="subtitle2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value || '-'}</Typography>
    </Grid>
  );

  const renderDetailsTab = () => (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}>
        {renderDetailItem(t('title'), permit?.title)}
        {renderDetailItem(t('permit_type'), t(permit?.permitType?.toLowerCase() || ''))}
        {renderDetailItem(
          t('status'),
          <PermitStatusBadge status={permit?.status} />
        )}
        {renderDetailItem(
          t('risk_level'),
          <RiskLevelBadge riskLevel={permit?.riskLevel} />
        )}
        {renderDetailItem(t('location'), permit?.permitLocation?.name)}
        {renderDetailItem(t('facility'), permit?.permitLocation?.facility)}
        {renderDetailItem(t('start_date'), getFormattedDate(permit?.startDate))}
        {renderDetailItem(t('end_date'), getFormattedDate(permit?.endDate))}
        {renderDetailItem(t('created_at'), getFormattedDate(permit?.createdAt))}
        {renderDetailItem(t('updated_at'), getFormattedDate(permit?.updatedAt))}
        {permit?.approvedBy && (
          <>
            {renderDetailItem(
              t('approved_by'),
              `${permit.approvedBy.firstName} ${permit.approvedBy.lastName}`
            )}
            {renderDetailItem(t('approved_at'), getFormattedDate(permit?.approvedAt))}
          </>
        )}
        {permit?.completedBy && (
          <>
            {renderDetailItem(
              t('completed_by'),
              `${permit.completedBy.firstName} ${permit.completedBy.lastName}`
            )}
            {renderDetailItem(t('completed_at'), getFormattedDate(permit?.completedAt))}
          </>
        )}
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        {t('description')}
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        {permit?.description || '-'}
      </Typography>

      {permit?.safetyRequirements && (
        <>
          <Typography variant="h6" gutterBottom>
            {t('safety_requirements')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
            {permit.safetyRequirements}
          </Typography>
        </>
      )}

      {permit?.hazardsIdentified && (
        <>
          <Typography variant="h6" gutterBottom>
            {t('hazards_identified')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
            {permit.hazardsIdentified}
          </Typography>
        </>
      )}

      {permit?.controlMeasures && (
        <>
          <Typography variant="h6" gutterBottom>
            {t('control_measures')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
            {permit.controlMeasures}
          </Typography>
        </>
      )}

      {permit?.equipmentNeeded && (
        <>
          <Typography variant="h6" gutterBottom>
            {t('equipment_needed')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
            {permit.equipmentNeeded}
          </Typography>
        </>
      )}

      {permit?.ppeRequired && (
        <>
          <Typography variant="h6" gutterBottom>
            {t('ppe_required')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
            {permit.ppeRequired}
          </Typography>
        </>
      )}

      {permit?.emergencyProcedures && (
        <>
          <Typography variant="h6" gutterBottom>
            {t('emergency_procedures')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
            {permit.emergencyProcedures}
          </Typography>
        </>
      )}

      {permit?.specialInstructions && (
        <>
          <Typography variant="h6" gutterBottom>
            {t('special_instructions')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
            {permit.specialInstructions}
          </Typography>
        </>
      )}

      {permit?.rejectionReason && (
        <>
          <Typography variant="h6" gutterBottom color="error">
            {t('rejection_reason')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }} color="error">
            {permit.rejectionReason}
          </Typography>
        </>
      )}

      {permit?.cancellationReason && (
        <>
          <Typography variant="h6" gutterBottom color="error">
            {t('cancellation_reason')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }} color="error">
            {permit.cancellationReason}
          </Typography>
        </>
      )}
    </Box>
  );

  const renderAssignmentsTab = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t('assigned_users')}
      </Typography>
      {permit?.assignedUsers?.length > 0 ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {permit.assignedUsers.map((user) => (
            <Chip
              key={user.id}
              label={`${user.firstName} ${user.lastName}`}
              variant="outlined"
            />
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('no_assigned_users')}
        </Typography>
      )}

      <Typography variant="h6" gutterBottom>
        {t('teams')}
      </Typography>
      {permit?.teams?.length > 0 ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {permit.teams.map((team) => (
            <Chip key={team.id} label={team.name} variant="outlined" />
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {t('no_teams_assigned')}
        </Typography>
      )}
    </Box>
  );

  const renderFilesTab = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t('attached_files')}
      </Typography>
      {permit?.files?.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {permit.files.map((file) => (
            <Card key={file.id} variant="outlined">
              <CardContent sx={{ py: 1 }}>
                <Typography variant="body2">{file.name}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {t('no_files_attached')}
        </Typography>
      )}
    </Box>
  );

  if (!permit) {
    return null;
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Box>
          <Typography variant="h5">
            {t('permit')} #{permit.customId}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {permit.title}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {hasEditPermission(PermissionEntity.PERMITS, permit) && (
            <IconButton onClick={onEdit}>
              <EditIcon />
            </IconButton>
          )}
          {hasDeletePermission(PermissionEntity.PERMITS, permit) && (
            <IconButton onClick={onDelete} color="error">
              <DeleteIcon />
            </IconButton>
          )}
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ p: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {renderWorkflowActions()}
      </Box>

      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
      >
        <Tab label={t('details')} value="details" />
        <Tab label={t('assignments')} value="assignments" />
        <Tab label={t('files')} value="files" />
      </Tabs>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {currentTab === 'details' && renderDetailsTab()}
        {currentTab === 'assignments' && renderAssignmentsTab()}
        {currentTab === 'files' && renderFilesTab()}
      </Box>

      <RejectDialog
        open={openRejectDialog}
        onClose={() => setOpenRejectDialog(false)}
        onConfirm={handleReject}
        title={t('reject_permit')}
        message={t('reject_permit_message')}
      />

      <RejectDialog
        open={openCancelDialog}
        onClose={() => setOpenCancelDialog(false)}
        onConfirm={handleCancel}
        title={t('cancel_permit')}
        message={t('cancel_permit_message')}
      />
    </Box>
  );
}

export default PermitDetails;
