import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  CircularProgress
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { TreeView, TreeItem } from '@mui/lab';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import DownloadIcon from '@mui/icons-material/Download';
import { useDispatch, useSelector } from '../../../store';
import {
  getDocumentTree,
  createDocument,
  deleteDocument as deleteDocumentAction,
  downloadDocument
} from '../../../slices/document';
import { Document } from '../../../models/owns/document';
import useAuth from '../../../hooks/useAuth';
import { PermissionEntity } from '../../../models/owns/role';

interface DocumentManagerProps {
  entityType: 'LOCATION' | 'ASSET' | 'WORK_ORDER';
  entityId: number;
}

const DocumentManager = ({ entityType, entityId }: DocumentManagerProps) => {
  const { t }: { t: any } = useTranslation();
  const dispatch = useDispatch();
  const { hasCreatePermission, hasDeletePermission } = useAuth();
  
  const [openCreateFolder, setOpenCreateFolder] = useState(false);
  const [openUploadFile, setOpenUploadFile] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileDescription, setFileDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);
  
  const { documentsByEntity, loadingGet } = useSelector((state) => state.documents);
  const key = `${entityType}-${entityId}`;
  const documents = documentsByEntity[key] || [];

  useEffect(() => {
    dispatch(getDocumentTree(entityType, entityId));
  }, [entityType, entityId, dispatch]);

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    
    try {
      await dispatch(
        createDocument(
          entityType,
          entityId,
          {
            name: folderName,
            parentDocumentId: selectedParentId,
            isFolder: true
          }
        )
      );
      setFolderName('');
      setSelectedParentId(null);
      setOpenCreateFolder(false);
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const handleUploadFile = async () => {
    if (!fileName.trim() || !selectedFile) return;
    
    try {
      await dispatch(
        createDocument(
          entityType,
          entityId,
          {
            name: fileName,
            description: fileDescription,
            parentDocumentId: selectedParentId,
            isFolder: false
          },
          selectedFile
        )
      );
      setFileName('');
      setFileDescription('');
      setSelectedFile(null);
      setSelectedParentId(null);
      setOpenUploadFile(false);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm(t('confirm_delete_document'))) {
      dispatch(deleteDocumentAction(id, entityType, entityId));
    }
  };

  const handleDownload = async (id: number) => {
    try {
      await downloadDocument(id);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleNodeToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds);
  };

  const renderTree = (nodes: Document[]) => {
    return nodes.map((node) => {
      // Create Audit object for permission checks
      const documentAudit = {
        id: node.id,
        createdAt: node.createdAt,
        createdBy: node.createdById || 0,
        updatedAt: node.updatedAt,
        updatedBy: node.createdById || 0
      };
      
      return (
        <TreeItem
          key={node.id}
          nodeId={String(node.id)}
          label={
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {node.isFolder ? (
                  <FolderIcon sx={{ mr: 1, color: 'primary.main' }} />
                ) : (
                  <InsertDriveFileIcon sx={{ mr: 1, color: 'text.secondary' }} />
                )}
                <Typography variant="body2">{node.name}</Typography>
              </Box>
              <Box>
                {!node.isFolder && (
                  <Tooltip title={t('download')}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(node.id);
                      }}
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {hasDeletePermission(PermissionEntity.FILES, documentAudit) && (
                <Tooltip title={t('delete')}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(node.id);
                    }}
                  >
                    <DeleteTwoToneIcon fontSize="small" color="error" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        }
        onClick={() => {
          if (node.isFolder) {
            setSelectedParentId(node.id);
          }
        }}
      >
        {node.children && node.children.length > 0
          ? renderTree(node.children)
          : null}
      </TreeItem>
      );
    });
  };

  if (loadingGet) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 4
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ px: 4 }}>
      <Card sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}
        >
          <Typography variant="h6">{t('documents')}</Typography>
          {hasCreatePermission(PermissionEntity.FILES) && (
            <Box>
              <Button
                startIcon={<CreateNewFolderIcon />}
                onClick={() => setOpenCreateFolder(true)}
                sx={{ mr: 1 }}
              >
                {t('new_folder')}
              </Button>
              <Button
                startIcon={<UploadFileIcon />}
                variant="contained"
                onClick={() => setOpenUploadFile(true)}
              >
                {t('upload_file')}
              </Button>
            </Box>
          )}
        </Box>

        {documents.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            {t('no_documents_yet')}
          </Typography>
        ) : (
          <TreeView
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpandIcon={<ChevronRightIcon />}
            expanded={expanded}
            onNodeToggle={handleNodeToggle}
          >
            {renderTree(documents)}
          </TreeView>
        )}
      </Card>

      {/* Create Folder Dialog */}
      <Dialog
        open={openCreateFolder}
        onClose={() => setOpenCreateFolder(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('create_new_folder')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('folder_name')}
            fullWidth
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateFolder(false)}>
            {t('cancel')}
          </Button>
          <Button
            onClick={handleCreateFolder}
            variant="contained"
            disabled={!folderName.trim()}
          >
            {t('create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload File Dialog */}
      <Dialog
        open={openUploadFile}
        onClose={() => setOpenUploadFile(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('upload_file')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('file_name')}
            fullWidth
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label={t('description')}
            fullWidth
            multiline
            rows={3}
            value={fileDescription}
            onChange={(e) => setFileDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button variant="outlined" component="label" fullWidth>
            {selectedFile ? selectedFile.name : t('choose_file')}
            <input
              type="file"
              hidden
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                  if (!fileName) {
                    setFileName(e.target.files[0].name);
                  }
                }
              }}
            />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUploadFile(false)}>
            {t('cancel')}
          </Button>
          <Button
            onClick={handleUploadFile}
            variant="contained"
            disabled={!fileName.trim() || !selectedFile}
          >
            {t('upload')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentManager;
