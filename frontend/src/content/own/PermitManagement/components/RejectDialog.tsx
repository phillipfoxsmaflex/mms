import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

interface RejectDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
  message: string;
}

function RejectDialog({ open, onClose, onConfirm, title, message }: RejectDialogProps) {
  const { t }: { t: any } = useTranslation();
  const [reason, setReason] = useState<string>('');

  const handleConfirm = () => {
    onConfirm(reason);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {message}
        </Typography>
        <TextField
          autoFocus
          fullWidth
          multiline
          rows={4}
          label={t('reason')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('enter_reason')}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t('cancel')}</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={!reason.trim()}
        >
          {t('confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default RejectDialog;
