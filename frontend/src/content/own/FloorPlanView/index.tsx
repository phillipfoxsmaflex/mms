import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Button,
  InputAdornment,
  IconButton,
  Autocomplete
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import { useDispatch, useSelector } from '../../../store';
import { getLocations } from '../../../slices/location';
import { getFloorPlans } from '../../../slices/floorPlan';
import { getAssetsByLocation } from '../../../slices/asset';
import { getWorkOrdersByLocation } from '../../../slices/workOrder';
import LocationFloorPlanMap from '../Locations/LocationFloorPlanMap';
import { AssetStatus } from '../../../models/owns/asset';
import { Helmet } from 'react-helmet-async';

const FloorPlanView = () => {
  const dispatch = useDispatch();
  
  // State
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<AssetStatus[]>([]);
  const [workOrderFilter, setWorkOrderFilter] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [showFilters, setShowFilters] = useState(true);
  
  // Redux state
  const { locations } = useSelector((state) => state.locations);
  const { floorPlansByLocation } = useSelector((state) => state.floorPlans);
  const { assetsByLocation } = useSelector((state) => state.assets);
  
  // Get all locations
  const allLocations = useMemo(() => {
    return locations;
  }, [locations]);
  
  // Load initial data
  useEffect(() => {
    dispatch(getLocations());
  }, [dispatch]);
  
  // Load location-specific data when location is selected
  useEffect(() => {
    if (selectedLocationId) {
      dispatch(getFloorPlans(selectedLocationId));
      dispatch(getAssetsByLocation(selectedLocationId));
      dispatch(getWorkOrdersByLocation(selectedLocationId));
    }
  }, [dispatch, selectedLocationId]);
  
  // Get current location's floor plans
  const currentFloorPlans = useMemo(() => {
    if (!selectedLocationId) return [];
    return floorPlansByLocation[selectedLocationId] || [];
  }, [selectedLocationId, floorPlansByLocation]);
  
  // Get current location's assets for autocomplete
  const currentAssets = useMemo(() => {
    if (!selectedLocationId) return [];
    return assetsByLocation[selectedLocationId] || [];
  }, [selectedLocationId, assetsByLocation]);
  
  // Get unique asset names for autocomplete
  const assetNames = useMemo(() => {
    return currentAssets.map(asset => asset.name).filter((name, index, self) => self.indexOf(name) === index);
  }, [currentAssets]);
  
  // Auto-select first location if none is selected
  useEffect(() => {
    if (!selectedLocationId && allLocations.length > 0) {
      setSelectedLocationId(allLocations[0].id);
    }
  }, [allLocations, selectedLocationId]);
  
  // Asset status options
  const statusOptions: AssetStatus[] = [
    'OPERATIONAL',
    'DOWN',
    'MODERNIZATION',
    'STANDBY',
    'INSPECTION_SCHEDULED',
    'COMMISSIONING',
    'EMERGENCY_SHUTDOWN'
  ];
  
  // Status labels in German
  const statusLabels: Record<AssetStatus, string> = {
    'OPERATIONAL': 'Betriebsbereit',
    'DOWN': 'Ausgefallen',
    'MODERNIZATION': 'Modernisierung',
    'STANDBY': 'Bereitschaft',
    'INSPECTION_SCHEDULED': 'Inspektion geplant',
    'COMMISSIONING': 'Inbetriebnahme',
    'EMERGENCY_SHUTDOWN': 'Notabschaltung'
  };
  
  // Work order filter options
  const workOrderOptions = [
    { value: '', label: 'Alle' },
    { value: 'with-wo', label: 'Mit Arbeitsaufträgen' },
    { value: 'without-wo', label: 'Ohne Arbeitsaufträge' },
    { value: 'pending', label: 'Ausstehend' }
  ];
  
  // Clear all filters
  const handleClearFilters = () => {
    setStatusFilter([]);
    setWorkOrderFilter('');
    setSearchText('');
  };
  
  const hasActiveFilters = statusFilter.length > 0 || workOrderFilter !== '' || searchText !== '';
  
  return (
    <>
      <Helmet>
        <title>Lagepläne - Ansicht</title>
      </Helmet>
      
      <Box
        sx={{
          backgroundColor: 'background.default',
          minHeight: '100%',
          py: 3
        }}
      >
        <Container maxWidth={false}>
          <Grid container spacing={3}>
            {/* Header */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h3" component="h3" gutterBottom>
                  Lagepläne
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<FilterListIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? 'Filter ausblenden' : 'Filter einblenden'}
                </Button>
              </Box>
            </Grid>
            
            {/* Filters */}
            {showFilters && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Grid container spacing={2}>
                      {/* Location Selector */}
                      <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                          <InputLabel>Standort</InputLabel>
                          <Select
                            value={selectedLocationId || ''}
                            onChange={(e) => setSelectedLocationId(Number(e.target.value))}
                            label="Standort"
                          >
                            {allLocations.map((loc) => (
                              <MenuItem key={loc.id} value={loc.id}>
                                {loc.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      {/* Status Filter */}
                      <Grid item xs={12} md={3}>
                        <Autocomplete
                          multiple
                          options={statusOptions}
                          value={statusFilter}
                          onChange={(_, newValue) => setStatusFilter(newValue as AssetStatus[])}
                          getOptionLabel={(option) => statusLabels[option]}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Status Filter"
                              placeholder="Status auswählen..."
                            />
                          )}
                          renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                              <Chip
                                key={option}
                                label={statusLabels[option]}
                                {...getTagProps({ index })}
                                size="small"
                              />
                            ))
                          }
                        />
                      </Grid>
                      
                      {/* Work Order Filter */}
                      <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                          <InputLabel>Arbeitsaufträge</InputLabel>
                          <Select
                            value={workOrderFilter}
                            onChange={(e) => setWorkOrderFilter(e.target.value)}
                            label="Arbeitsaufträge"
                          >
                            {workOrderOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      {/* Search with Autocomplete */}
                      <Grid item xs={12} md={3}>
                        <Autocomplete
                          freeSolo
                          options={assetNames}
                          value={searchText}
                          onInputChange={(_, newValue) => setSearchText(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Suche"
                              placeholder="Asset-Name suchen..."
                              InputProps={{
                                ...params.InputProps,
                                startAdornment: (
                                  <>
                                    <InputAdornment position="start">
                                      <SearchIcon />
                                    </InputAdornment>
                                    {params.InputProps.startAdornment}
                                  </>
                                )
                              }}
                            />
                          )}
                        />
                      </Grid>
                      
                      {/* Active Filters Display */}
                      {hasActiveFilters && (
                        <Grid item xs={12}>
                          <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                            <Typography variant="body2" color="text.secondary">
                              Aktive Filter:
                            </Typography>
                            {statusFilter.map((status) => (
                              <Chip
                                key={status}
                                label={statusLabels[status]}
                                size="small"
                                onDelete={() => setStatusFilter(statusFilter.filter(s => s !== status))}
                              />
                            ))}
                            {workOrderFilter && (
                              <Chip
                                label={workOrderOptions.find(o => o.value === workOrderFilter)?.label}
                                size="small"
                                onDelete={() => setWorkOrderFilter('')}
                              />
                            )}
                            {searchText && (
                              <Chip
                                label={`Suche: "${searchText}"`}
                                size="small"
                                onDelete={() => setSearchText('')}
                              />
                            )}
                            <Button
                              size="small"
                              onClick={handleClearFilters}
                              startIcon={<ClearIcon />}
                            >
                              Alle Filter löschen
                            </Button>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}
            
            {/* Floor Plan Display */}
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ p: 0 }}>
                  {selectedLocationId ? (
                    currentFloorPlans.length > 0 ? (
                      <Box
                        sx={{
                          height: 'calc(100vh - 280px)',
                          minHeight: '600px',
                          position: 'relative'
                        }}
                      >
                        <LocationFloorPlanMap
                          locationId={selectedLocationId}
                          statusFilter={statusFilter}
                          workOrderFilter={workOrderFilter}
                          searchText={searchText}
                        />
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          height: '400px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Typography variant="h5" color="text.secondary">
                          Für diesen Standort sind keine Lagepläne vorhanden
                        </Typography>
                      </Box>
                    )
                  ) : (
                    <Box
                      sx={{
                        height: '400px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography variant="h5" color="text.secondary">
                        Bitte wählen Sie einen Standort aus
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
};

export default FloorPlanView;
