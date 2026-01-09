import React, { useRef, useState, useEffect } from 'react';
import { Box, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  onSignatureSave: (signatureData: string, signatureName: string) => void;
  open: boolean;
  onClose: () => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSignatureSave, open, onClose }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [signatureName, setSignatureName] = useState('');

  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
  };

  const saveSignature = () => {
    if (sigCanvas.current && signatureName.trim()) {
      const signatureData = sigCanvas.current.toDataURL();
      onSignatureSave(signatureData, signatureName);
      clearSignature();
      setSignatureName('');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Elektronische Signatur</DialogTitle>
      <DialogContent>
        <Box mt={2} mb={2}>
          <Typography variant="body1" gutterBottom>
            Bitte unterschreiben Sie mit der Maus oder dem Touchscreen:
          </Typography>
          <Box 
            border={1} 
            borderColor="grey.300" 
            borderRadius={1} 
            p={1} 
            mb={2}
          >
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{ 
                width: '100%',
                height: 200,
                className: 'sigCanvas'
              }}
              backgroundColor="#f5f5f5"
              penColor="black"
            />
          </Box>
          <Box mb={2}>
            <Typography variant="body1" gutterBottom>
              Ihr Name (wie er auf der Signatur erscheinen soll):
            </Typography>
            <input
              type="text"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              style={{ 
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
              placeholder="Ihr vollständiger Name"
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={clearSignature} color="secondary">
          Löschen
        </Button>
        <Button onClick={onClose} color="primary">
          Abbrechen
        </Button>
        <Button 
          onClick={saveSignature} 
          color="primary" 
          variant="contained"
          disabled={!signatureName.trim()}
        >
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SignaturePad;