import { Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { RiskLevel } from '../../../../models/owns/permit';

interface RiskLevelBadgeProps {
  riskLevel: RiskLevel;
}

const riskColors: Record<RiskLevel, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'error',
  CRITICAL: 'error'
};

function RiskLevelBadge({ riskLevel }: RiskLevelBadgeProps) {
  const { t }: { t: any } = useTranslation();

  if (!riskLevel) {
    return null;
  }

  return (
    <Chip
      label={t(riskLevel.toLowerCase())}
      color={riskColors[riskLevel] || 'default'}
      size="small"
      variant={riskLevel === 'CRITICAL' ? 'filled' : 'outlined'}
    />
  );
}

export default RiskLevelBadge;
