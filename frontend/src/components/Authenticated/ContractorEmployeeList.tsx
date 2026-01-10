import React, { useEffect, useState, useMemo } from 'react';
import { debounce } from '@mui/material';
import { useSelector } from 'react-redux';
import { useDispatch, RootState } from 'src/store';
import {
  getContractorEmployees,
  deleteContractorEmployee,
  getContractorEmployeesByVendor
} from 'src/slices/contractorEmployee';
import { ContractorEmployee } from 'src/models/owns/contractorEmployee';
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
  Chip,
  TextField,
  InputAdornment
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { SearchCriteria } from 'src/models/owns/page';
import { checkEmployeeInstructionValid } from 'src/slices/safetyInstruction';

const ContractorEmployeeList: React.FC<{ vendorId?: number }> = ({ vendorId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  
  const { contractorEmployees, loadingGet } = useSelector((state: RootState) => state.contractorEmployees);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [instructionStatus, setInstructionStatus] = useState<Record<number, boolean>>({});
  
  useEffect(() => {
    if (vendorId) {
      dispatch(getContractorEmployeesByVendor(vendorId));
    } else {
      const criteria: SearchCriteria = {
        pageNum: page,
        pageSize: rowsPerPage,
        sortField: 'createdAt',
        direction: 'DESC',
        filterFields: searchQuery ? [
          { field: 'firstName', value: searchQuery, operation: 'cn' },
          { field: 'lastName', value: searchQuery, operation: 'cn' },
          { field: 'email', value: searchQuery, operation: 'cn' },
          { field: 'position', value: searchQuery, operation: 'cn' }
        ] : []
      };
      dispatch(getContractorEmployees(criteria));
    }
  }, [dispatch, page, rowsPerPage, vendorId, searchQuery]);

  useEffect(() => {
    // Check instruction validity for all employees
    contractorEmployees.content.forEach(employee => {
      dispatch(checkEmployeeInstructionValid(employee.id)).then((result) => {
        const isValid = result as unknown as boolean;
        setInstructionStatus(prev => ({ ...prev, [employee.id]: isValid }));
      });
    });
  }, [contractorEmployees.content, dispatch]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  const debouncedSearchChange = useMemo(
    () => debounce(handleSearchChange, 500),
    []
  );

  const handleDelete = (id: number) => {
    if (window.confirm('Sind Sie sicher, dass Sie diesen Mitarbeiter löschen möchten?')) {
      dispatch(deleteContractorEmployee(id));
    }
  };

  const handleEdit = (id: number) => {
    navigate(`/contractor-employees/${id}/edit`);
  };

  const handleAdd = () => {
    navigate('/app/contractors/employees/create');
  };

  const getInstructionStatusColor = (isValid: boolean) => {
    return isValid ? 'success' : 'error';
  };

  const getInstructionStatusText = (isValid: boolean) => {
    return isValid ? 'Gültig' : 'Ungültig/Abgelaufen';
  };

  return (
    <Card>
      <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
        <Typography variant="h3">Mitarbeiter von Auftragnehmern</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Neuen Mitarbeiter hinzufügen
        </Button>
      </Box>
      
      <Box p={2}>
        <TextField
          fullWidth
          label="Suche"
          variant="outlined"
          placeholder="Nach Name, E-Mail oder Position suchen..."
          value={searchQuery}
          onChange={debouncedSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          size="small"
        />
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
                  <TableCell>Name</TableCell>
                  <TableCell>E-Mail</TableCell>
                  <TableCell>Telefon</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Sicherheitsunterweisung</TableCell>
                  <TableCell>Aktionen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contractorEmployees.content.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Keine Mitarbeiter gefunden
                    </TableCell>
                  </TableRow>
                ) : (
                  contractorEmployees.content.map((employee: ContractorEmployee) => (
                    <TableRow key={employee.id}>
                      <TableCell>{employee.firstName} {employee.lastName}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.phone}</TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>
                        <Chip
                          label={getInstructionStatusText(instructionStatus[employee.id] || false)}
                          color={getInstructionStatusColor(instructionStatus[employee.id] || false)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(employee.id)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(employee.id)}
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
            count={contractorEmployees.totalElements}
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

export default ContractorEmployeeList;