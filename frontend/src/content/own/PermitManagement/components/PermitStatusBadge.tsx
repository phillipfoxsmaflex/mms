import { Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { PermitStatus } from '../../../../models/owns/permit';

interface PermitStatusBadgeProps {
  status: PermitStatus;
}

const statusColors: Record<PermitStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  DRAFT: 'default',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  ACTIVE: 'info',
  EXPIRED: 'error',
  COMPLETED: 'success',
  CANCELLED: 'default'
};

function PermitStatusBadge({ status }: PermitStatusBadgeProps) {
  const { t }: { t: any } = useTranslation();

  if (!status) {
    return null;
  }

  return (
    <Chip
      label={t(status.toLowerCase())}
      color={statusColors[status] || 'default'}
      size="small"
    />
  );
}

export default PermitStatusBadge;
