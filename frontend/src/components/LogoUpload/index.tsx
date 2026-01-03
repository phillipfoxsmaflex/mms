
import { useState, useRef, ChangeEvent } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  styled,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloudUploadTwoToneIcon from '@mui/icons-material/CloudUploadTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import CheckCircleTwoToneIcon from '@mui/icons-material/CheckCircleTwoTone';

const LogoPreview = styled('img')(
  ({ theme }) => `
    width: 120px;
    height: 120px;
    object-fit: contain;
    border-radius: ${theme.general.borderRadius};
    border: 1px solid ${theme.colors.alpha.black[10]};
    background-color: ${theme.colors.alpha.white[100]};
    margin-bottom: ${theme.spacing(2)};
  `
);

const UploadButton = styled(Button)(
  ({ theme }) => `
    margin-right: ${theme.spacing(2)};
  `
);

interface LogoUploadProps {
  currentLogo?: string;
  onLogoUpload: (file: File) => Promise<void>;
  onLogoRemove: () => Promise<void>;
  isUploading: boolean;
  uploadSuccess: boolean;
}

function LogoUpload({
  currentLogo,
  onLogoUpload,
  onLogoRemove,
  isUploading,
  uploadSuccess
}: LogoUploadProps) {
  const { t }: { t: any } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Upload the file
      onLogoUpload(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveClick = async () => {
    setPreviewUrl(null);
    await onLogoRemove();
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {t('custom_logo')}
        </Typography>
        <Typography variant="subtitle2" gutterBottom>
          {t('upload_logo_description')}
        </Typography>

        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          {isUploading ? (
            <Box display="flex" alignItems="center" justifyContent="center" minHeight="120px">
              <CircularProgress />
            </Box>
          ) : uploadSuccess ? (
            <Box display="flex" alignItems="center" justifyContent="center" minHeight="120px">
              <CheckCircleTwoToneIcon color="success" sx={{ fontSize: 60 }} />
            </Box>
          ) : previewUrl || currentLogo ? (
            <LogoPreview
              src={previewUrl || currentLogo}
              alt={t('logo_preview')}
            />
          ) : (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              width="120px"
              height="120px"
              borderRadius="4px"
              border="1px dashed #ccc"
              mb={2}
            >
              <CloudUploadTwoToneIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
            </Box>
          )}
        </Box>

        <Box display="flex" alignItems="center" justifyContent="flex-start">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <UploadButton
            variant="contained"
            startIcon={<CloudUploadTwoToneIcon />}
            onClick={handleUploadClick}
            disabled={isUploading}
          >
            {t('upload_logo')}
          </UploadButton>

          {(previewUrl || currentLogo) && (
            <Tooltip title={t('remove_logo')}>
              <IconButton
                color="error"
                onClick={handleRemoveClick}
                disabled={isUploading}
              >
                <DeleteTwoToneIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Box mt={2}>
          <Typography variant="caption" color="text.secondary">
            {t('logo_requirements')}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default LogoUpload;
