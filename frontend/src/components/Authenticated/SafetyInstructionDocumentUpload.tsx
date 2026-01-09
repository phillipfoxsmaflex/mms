import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, Paper, Button, CircularProgress, Alert, LinearProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSelector } from 'react-redux';
import { useDispatch } from 'src/store';
import { addFiles } from 'src/slices/file';

interface SafetyInstructionDocumentUploadProps {
  onDocumentUpload: (fileId: string, fileUrl: string) => void;
  existingDocument?: { id: string; url: string; name: string };
}

const SafetyInstructionDocumentUpload: React.FC<SafetyInstructionDocumentUploadProps> = ({ 
  onDocumentUpload, 
  existingDocument 
}) => {
  const dispatch = useDispatch();
  const [uploadedFile, setUploadedFile] = useState<{ id: string; url: string; name: string } | null>(
    existingDocument || null
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    // Validate file type
    const validTypes = ['application/pdf', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      setError('Bitte laden Sie nur PDF-Dokumente oder Videos (MP4, WebM) hoch.');
      return;
    }
    
    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError('Die Datei ist zu groß. Maximale Größe: 50MB');
      return;
    }
    
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);
    
    // Dispatch upload
    dispatch(addFiles([file], 'OTHER'))
      .then((response: any) => {
        clearInterval(progressInterval);
        setUploadProgress(100);
        setTimeout(() => {
          setUploadedFile({
            id: response.id,
            url: response.url,
            name: file.name
          });
          onDocumentUpload(response.id, response.url);
          setIsUploading(false);
        }, 300);
      })
      .catch((err: any) => {
        clearInterval(progressInterval);
        setIsUploading(false);
        setError('Fehler beim Hochladen der Datei: ' + err.message);
      });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'video/mp4': ['.mp4'],
      'video/webm': ['.webm']
    },
    maxFiles: 1
  });

  const handleRemoveFile = () => {
    setUploadedFile(null);
    onDocumentUpload('', '');
  };

  const getFileTypeIcon = (fileName: string) => {
    if (fileName.endsWith('.pdf')) {
      return <InsertDriveFileIcon color="error" fontSize="large" />;
    } else if (fileName.endsWith('.mp4') || fileName.endsWith('.webm')) {
      return <InsertDriveFileIcon color="primary" fontSize="large" />;
    }
    return <InsertDriveFileIcon fontSize="large" />;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Unterweisungsmaterial hochladen
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {!uploadedFile && !isUploading && (
        <Paper
          {...getRootProps()}
          sx={{
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragActive ? '#f5f5f5' : 'background.paper',
            border: isDragActive ? '2px dashed #3f51b5' : '2px dashed #ccc',
            transition: 'all 0.3s'
          }}
        >
          <input {...getInputProps()} />
          <CloudUploadIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="body1">
            {isDragActive 
              ? 'Datei hier ablegen...' 
              : 'Ziehen Sie eine Datei hierher oder klicken Sie zum Auswählen'}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Unterstützte Formate: PDF, MP4, WebM (max. 50MB)
          </Typography>
        </Paper>
      )}
      
      {isUploading && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" gutterBottom>
            Datei wird hochgeladen...
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={uploadProgress}
            sx={{ mt: 2, height: 8, borderRadius: 4 }}
          />
          <Typography variant="body2" sx={{ mt: 1 }}>
            {uploadProgress}%
          </Typography>
        </Paper>
      )}
      
      {uploadedFile && (
        <Paper sx={{ p: 3, mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center">
            <Box mr={2}>
              {getFileTypeIcon(uploadedFile.name)}
            </Box>
            <Box>
              <Typography variant="body1" noWrap sx={{ maxWidth: 300 }}>
                {uploadedFile.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {uploadedFile.url}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleRemoveFile}
          >
            Entfernen
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default SafetyInstructionDocumentUpload;