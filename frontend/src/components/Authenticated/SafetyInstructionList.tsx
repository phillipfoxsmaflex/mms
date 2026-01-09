import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch, RootState } from 'src/store';
import {
  getSafetyInstructions,
  deleteSafetyInstruction,
  getSafetyInstructionsByVendor
} from 'src/slices/safetyInstruction';
import { SafetyInstruction } from 'src/models/owns/safetyInstruction';
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  TablePagination,
  CircularProgress,
  Box,
  Typography,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { SearchCriteria } from 'src/models/owns/page';

const SafetyInstructionList: React.FC<{ vendorId?: number }> = ({ vendorId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { safetyInstructions, loadingGet } = useSelector((state: RootState) => state.safetyInstructions);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  useEffect(() => {
    if (vendorId) {
      dispatch(getSafetyInstructionsByVendor(vendorId));
    } else {
      const criteria: SearchCriteria = {
        pageNum: page,
        pageSize: rowsPerPage,
        sortField: 'createdAt',
        direction: 'DESC',
        filterFields: []
      };
      dispatch(getSafetyInstructions(criteria));
    }
  }, [dispatch, page, rowsPerPage, vendorId]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Sind Sie sicher, dass Sie diese Sicherheitsunterweisung löschen möchten?')) {
      dispatch(deleteSafetyInstruction(id));
    }
  };

  const handleEdit = (id: number) => {
    navigate(`/safety-instructions/${id}/edit`);
  };

  const handleAdd = () => {
    navigate('/app/safety-instructions/create');
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: de });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (completed: boolean, expirationDate: string) => {
    if (!completed) return 'warning';
    
    const expiration = new Date(expirationDate);
    const now = new Date();
    const diffDays = Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'error';
    if (diffDays < 30) return 'warning';
    return 'success';
  };

  const getStatusText = (completed: boolean, expirationDate: string) => {
    if (!completed) return 'Nicht abgeschlossen';
    
    const expiration = new Date(expirationDate);
    const now = new Date();
    const diffDays = Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Abgelaufen';
    if (diffDays < 30) return `Läuft ab in ${diffDays} Tagen`;
    return 'Aktiv';
  };

  return (
    <Card>
      <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
        <Typography variant="h3">Sicherheitsunterweisungen</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Neue Unterweisung
        </Button>
      </Box>
      
      {loadingGet ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Titel</TableCell>
                  <TableCell>Typ</TableCell>
                  <TableCell>Mitarbeiter</TableCell>
                  <TableCell>Standort</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Gültig bis</TableCell>
                  <TableCell>Aktionen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {safetyInstructions.content.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Keine Sicherheitsunterweisungen gefunden
                    </TableCell>
                  </TableRow>
                ) : (
                  safetyInstructions.content.map((instruction: SafetyInstruction) => (
                    <TableRow key={instruction.id}>
                      <TableCell>{instruction.title}</TableCell>
                      <TableCell>{instruction.type}</TableCell>
                      <TableCell>{instruction.employeeId}</TableCell>
                      <TableCell>{instruction.locationId}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusText(instruction.completed, instruction.expirationDate)}
                          color={getStatusColor(instruction.completed, instruction.expirationDate)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(instruction.expirationDate)}</TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(instruction.id)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(instruction.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={safetyInstructions.totalElements}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Zeilen pro Seite:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} von ${count}`}
          />
        </>
      )}
    </Card>
  );
};

export default SafetyInstructionList;