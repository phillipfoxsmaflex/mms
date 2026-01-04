import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Drawer,
  IconButton,
  Typography,
  Stack,
  Link,
  Divider,
  useTheme,
  Button,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Alert,
  Tooltip,
  Tab,
  Tabs
} from '@mui/material';
import { useEffect, useState, useMemo, useContext } from 'react';
import { MapContainer, ImageOverlay, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useDispatch, useSelector } from '../../../store';
import { getAssetsByLocation } from '../../../slices/asset';
import { getWorkOrdersByLocation } from '../../../slices/workOrder';
import { getFloorPlans } from '../../../slices/floorPlan';
import { renderToStaticMarkup } from 'react-dom/server';
import CloseIcon from '@mui/icons-material/Close';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import ViewListIcon from '@mui/icons-material/ViewList';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useNavigate } from 'react-router-dom';
import { AssetDTO, AssetStatus } from '../../../models/owns/asset';
import WorkOrder from '../../../models/owns/workOrder';
import { CustomSnackBarContext } from '../../../contexts/CustomSnackBarContext';
import axios from '../../../utils/axios';

interface LocationFloorPlanMapProps {
  locationId: number;
}

// Helper component to handle map bounds resizing
function MapBoundsHandler({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds);
    }
  }, [map, bounds]);
  
  return null;
}

// Draggable Marker Component
interface DraggableMarkerProps {
  position: [number, number];
  asset: AssetDTO;
  icon: L.DivIcon;
  isDraggable: boolean;
  onDragEnd: (assetId: number, position: [number, number]) => void;
  onClick: (asset: AssetDTO) => void;
}

function DraggableMarker({ position, asset, icon, isDraggable, onDragEnd, onClick }: DraggableMarkerProps) {
  const [markerPosition, setMarkerPosition] = useState<[number, number]>(position);
  
  const eventHandlers = useMemo(
    () => ({
      dragend(e: L.DragEndEvent) {
        const marker = e.target;
        const pos = marker.getLatLng();
        const newPosition: [number, number] = [pos.lat, pos.lng];
        setMarkerPosition(newPosition);
        onDragEnd(asset.id, newPosition);
      },
      click() {
        onClick(asset);
      }
    }),
    [asset, onDragEnd, onClick]
  );
  
  return (
    <Marker
      position={markerPosition}
      icon={icon}
      draggable={isDraggable}
      eventHandlers={eventHandlers}
    >
      <Popup>
        <Box sx={{ minWidth: 150 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            {asset.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Status: {asset.status}
          </Typography>
          {isDraggable && (
            <Typography variant="caption" display="block" color="primary" sx={{ mt: 0.5 }}>
              Drag to reposition
            </Typography>
          )}
        </Box>
      </Popup>
    </Marker>
  );
}

// Create custom icon with MUI components
const createCustomIcon = (status: AssetStatus, theme: any) => {
  const getIconComponent = () => {
    switch (status) {
      case 'OPERATIONAL':
        return <CheckCircleIcon style={{ color: theme.palette.success.main, fontSize: 32 }} />;
      case 'DOWN':
      case 'EMERGENCY_SHUTDOWN':
        return <ErrorIcon style={{ color: theme.palette.error.main, fontSize: 32 }} />;
      case 'INSPECTION_SCHEDULED':
        return <WarningIcon style={{ color: theme.palette.warning.main, fontSize: 32 }} />;
      default:
        return <BuildIcon style={{ color: theme.palette.primary.main, fontSize: 32 }} />;
    }
  };

  const iconHtml = renderToStaticMarkup(
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))'
    }}>
      {getIconComponent()}
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

// Create custom work order icon
const createWorkOrderIcon = (priority: string, theme: any) => {
  const getColor = () => {
    switch (priority) {
      case 'HIGH':
      case 'CRITICAL':
        return theme.palette.error.main;
      case 'MEDIUM':
        return theme.palette.warning.main;
      default:
        return theme.palette.info.main;
    }
  };

  const iconHtml = renderToStaticMarkup(
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))'
    }}>
      <BuildIcon style={{ color: getColor(), fontSize: 32 }} />
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

export default function LocationFloorPlanMap({ locationId }: LocationFloorPlanMapProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const { showSnackBar } = useContext(CustomSnackBarContext);
  
  // State
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<any>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetDTO | null>(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [unmappedAssets, setUnmappedAssets] = useState<AssetDTO[]>([]);
  const [pendingPositions, setPendingPositions] = useState<Map<number, [number, number]>>(new Map());
  const [saving, setSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  
  const { assetsByLocation, loadingGet: loadingAssets } = useSelector((state) => state.assets);
  const { workOrdersByLocation, loadingGet: loadingWorkOrders } = useSelector((state) => state.workOrders);
  const { floorPlansByLocation } = useSelector((state) => state.floorPlans);

  const locationAssets: AssetDTO[] = assetsByLocation[locationId] ?? [];
  const locationWorkOrders: WorkOrder[] = workOrdersByLocation[locationId] ?? [];
  const floorPlans = floorPlansByLocation[locationId] ?? [];

  useEffect(() => {
    dispatch(getAssetsByLocation(locationId));
    dispatch(getWorkOrdersByLocation(locationId));
    dispatch(getFloorPlans(locationId));
  }, [dispatch, locationId]);

  useEffect(() => {
    if (floorPlans.length > 0) {
      const sortedFloorPlans = [...floorPlans].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      if (!selectedFloorPlan) {
        setSelectedFloorPlan(sortedFloorPlans[0]);
        setCurrentTab(0);
      }
    }
  }, [floorPlans]);

  // Fetch unmapped assets when entering edit mode
  useEffect(() => {
    if (editMode && selectedFloorPlan) {
      fetchUnmappedAssets();
    }
  }, [editMode, selectedFloorPlan, locationId]);

  const fetchUnmappedAssets = async () => {
    try {
      const response = await axios.get(`/locations/${locationId}/assets/unmapped`);
      setUnmappedAssets(response.data);
    } catch (error: any) {
      console.error('Failed to fetch unmapped assets:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: errorMessage,
        data: error.response?.data
      });
      showSnackBar(`Failed to load unmapped assets: ${errorMessage}`, 'error');
    }
  };

  const handleDragEnd = (assetId: number, position: [number, number]) => {
    setPendingPositions(prev => new Map(prev).set(assetId, position));
  };

  const handleSavePositions = async () => {
    if (pendingPositions.size === 0 && unmappedAssets.length === 0) {
      showSnackBar('No changes to save', 'success');
      return;
    }

    setSaving(true);
    const imageWidth = selectedFloorPlan?.imageWidth || 1000;
    const imageHeight = selectedFloorPlan?.imageHeight || 800;

    try {
      const updates = Array.from(pendingPositions.entries()).map(async ([assetId, [y, x]]) => {
        await axios.patch(`/assets/${assetId}/position`, {
          floorPlanId: selectedFloorPlan.id,
          positionX: x / imageWidth,
          positionY: y / imageHeight
        });
      });

      await Promise.all(updates);
      
      showSnackBar('Positions saved successfully', 'success');
      setPendingPositions(new Map());
      
      // Refresh data
      dispatch(getAssetsByLocation(locationId));
      fetchUnmappedAssets();
      setEditMode(false);
    } catch (error) {
      console.error('Failed to save positions:', error);
      showSnackBar('Failed to save positions', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getAssetPosition = (asset: AssetDTO): [number, number] | null => {
    if (!selectedFloorPlan || !asset.floorPlan || asset.floorPlan.id !== selectedFloorPlan.id) {
      return null;
    }
    
    const imageWidth = selectedFloorPlan.imageWidth || 1000;
    const imageHeight = selectedFloorPlan.imageHeight || 800;
    
    if (asset.positionX !== null && asset.positionX !== undefined && 
        asset.positionY !== null && asset.positionY !== undefined) {
      return [asset.positionY * imageHeight, asset.positionX * imageWidth];
    }
    
    return null;
  };

  const getMappedAssets = () => {
    return locationAssets.filter(asset => {
      const position = getAssetPosition(asset);
      return position !== null;
    });
  };

  const handleAssetClick = (asset: AssetDTO) => {
    if (!editMode) {
      setSelectedAsset(asset);
      setSelectedWorkOrder(null);
      setDrawerOpen(true);
    }
  };

  const handleWorkOrderClick = (workOrder: WorkOrder) => {
    if (!editMode) {
      setSelectedWorkOrder(workOrder);
      setSelectedAsset(null);
      setDrawerOpen(true);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => {
      setSelectedAsset(null);
      setSelectedWorkOrder(null);
    }, 300);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    const sortedFloorPlans = [...floorPlans].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    setSelectedFloorPlan(sortedFloorPlans[newValue]);
  };

  // Use floor plan dimensions or default
  const imageWidth = selectedFloorPlan?.imageWidth || 1000;
  const imageHeight = selectedFloorPlan?.imageHeight || 800;
  const floorPlanImage = selectedFloorPlan?.image?.url || 
    `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iJHtpbWFnZVdpZHRofSIgaGVpZ2h0PSIke2ltYWdlSGVpZ2h0fSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iJHtpbWFnZVdpZHRofSIgaGVpZ2h0PSIke2ltYWdlSGVpZ2h0fSIgZmlsbD0iI2Y1ZjVmNSIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5GbG9vciBQbGFuIFBsYWNlaG9sZGVyPC90ZXh0Pgo8L3N2Zz4=`;

  const imageBounds: L.LatLngBoundsExpression = [[0, 0], [imageHeight, imageWidth]];

  const renderDrawerContent = () => {
    if (selectedAsset) {
      return (
        <Box sx={{ width: 400, p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4">Asset Details</Typography>
            <IconButton onClick={closeDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          {selectedAsset.image && (
            <Box mb={2}>
              <img 
                src={selectedAsset.image.url} 
                alt={selectedAsset.name}
                style={{ width: '100%', borderRadius: 8 }}
              />
            </Box>
          )}
          
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Name</Typography>
              <Typography variant="h6">{selectedAsset.name}</Typography>
            </Box>
            
            {selectedAsset.description && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                <Typography variant="body1">{selectedAsset.description}</Typography>
              </Box>
            )}
            
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Status</Typography>
              <Chip 
                label={selectedAsset.status}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>
            
            {selectedAsset.location && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                <Typography variant="body1">{selectedAsset.location.name}</Typography>
              </Box>
            )}
            
            {selectedAsset.model && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Model</Typography>
                <Typography variant="body1">{selectedAsset.model}</Typography>
              </Box>
            )}
            
            {selectedAsset.serialNumber && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Serial Number</Typography>
                <Typography variant="body1">{selectedAsset.serialNumber}</Typography>
              </Box>
            )}
            
            <Box mt={2}>
              <Link
                component="button"
                variant="h6"
                onClick={() => {
                  navigate(`/app/assets/${selectedAsset.id}`);
                  closeDrawer();
                }}
              >
                View Full Details →
              </Link>
            </Box>
          </Stack>
        </Box>
      );
    }
    
    if (selectedWorkOrder) {
      return (
        <Box sx={{ width: 400, p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4">Work Order Details</Typography>
            <IconButton onClick={closeDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Title</Typography>
              <Typography variant="h6">{selectedWorkOrder.title}</Typography>
            </Box>
            
            {selectedWorkOrder.description && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                <Typography variant="body1">{selectedWorkOrder.description}</Typography>
              </Box>
            )}
            
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
              <Chip 
                label={selectedWorkOrder.priority}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>
            
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Status</Typography>
              <Chip 
                label={selectedWorkOrder.status}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>
            
            <Box mt={2}>
              <Link
                component="button"
                variant="h6"
                onClick={() => {
                  navigate(`/app/work-orders/${selectedWorkOrder.id}`);
                  closeDrawer();
                }}
              >
                View Full Details →
              </Link>
            </Box>
          </Stack>
        </Box>
      );
    }
    
    return null;
  };

  if (loadingAssets || loadingWorkOrders) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (floorPlans.length === 0) {
    return (
      <Card>
        <CardContent>
          <Stack alignItems="center" spacing={2} py={4}>
            <BuildIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
            <Typography variant="h5" color="text.secondary">
              No Floor Plans Available
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Upload a floor plan to start visualizing assets and work orders on the map.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  const sortedFloorPlans = useMemo(() => {
    return [...floorPlans].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [floorPlans]);

  const mappedAssets = getMappedAssets();

  return (
    <Box display="flex" gap={2}>
      {/* Main Floor Plan Area */}
      <Box flex={1}>
        <Card>
          <CardContent>
            {/* Header with Edit Mode Toggle */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5">Floor Plan</Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                {editMode && pendingPositions.size > 0 && (
                  <Chip 
                    label={`${pendingPositions.size} unsaved changes`}
                    color="warning"
                    size="small"
                  />
                )}
                <FormControlLabel
                  control={
                    <Switch
                      checked={editMode}
                      onChange={(e) => setEditMode(e.target.checked)}
                      disabled={saving}
                    />
                  }
                  label="Edit Mode"
                />
                {editMode && (
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                    onClick={handleSavePositions}
                    disabled={saving || (pendingPositions.size === 0)}
                  >
                    {saving ? 'Saving...' : 'Save Positions'}
                  </Button>
                )}
              </Stack>
            </Box>

            {editMode && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Drag and drop assets to reposition them on the floor plan. Click "Save Positions" when done.
              </Alert>
            )}

            {/* Multi-Floor Tabs */}
            {floorPlans.length > 1 && (
              <Tabs
                value={currentTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
              >
                {sortedFloorPlans.map((plan, index) => (
                  <Tab 
                    key={plan.id} 
                    label={plan.name} 
                    icon={plan.image ? undefined : <BuildIcon />}
                  />
                ))}
              </Tabs>
            )}
            
            {selectedFloorPlan && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    {selectedFloorPlan.name}
                    {selectedFloorPlan.area && (
                      <Typography component="span" variant="body2" color="text.secondary" ml={1}>
                        ({selectedFloorPlan.area} m²)
                      </Typography>
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {mappedAssets.length} assets mapped
                  </Typography>
                </Box>
                
                <Box sx={{ height: 600, width: '100%', position: 'relative' }}>
                  <MapContainer
                    center={[imageHeight / 2, imageWidth / 2]}
                    zoom={0}
                    crs={L.CRS.Simple}
                    style={{ height: '100%', width: '100%', background: '#f5f5f5' }}
                    scrollWheelZoom={true}
                    minZoom={-2}
                    maxZoom={2}
                    key={`map-${selectedFloorPlan.id}`}
                  >
                    <MapBoundsHandler bounds={imageBounds} />
                    
                    <ImageOverlay
                      url={floorPlanImage}
                      bounds={imageBounds}
                    />
                    
                    {/* Mapped Asset Markers with Drag Support */}
                    {mappedAssets.map((asset) => {
                      const position = getAssetPosition(asset);
                      if (!position) return null;
                      
                      return (
                        <DraggableMarker
                          key={`asset-${asset.id}`}
                          position={position}
                          asset={asset}
                          icon={createCustomIcon(asset.status, theme)}
                          isDraggable={editMode}
                          onDragEnd={handleDragEnd}
                          onClick={handleAssetClick}
                        />
                      );
                    })}
                    
                    {/* Work Order Markers (only in view mode) */}
                    {!editMode && locationWorkOrders.filter(wo => wo.asset?.floorPlan?.id === selectedFloorPlan.id).map((workOrder) => {
                      const asset = locationAssets.find(a => a.id === workOrder.asset?.id);
                      if (!asset) return null;
                      const position = getAssetPosition(asset);
                      if (!position) return null;
                      
                      return (
                        <Marker
                          key={`wo-${workOrder.id}`}
                          position={[position[0] + 30, position[1]]}
                          icon={createWorkOrderIcon(workOrder.priority, theme)}
                          eventHandlers={{
                            click: () => handleWorkOrderClick(workOrder)
                          }}
                        >
                          <Popup>
                            <Box sx={{ minWidth: 150 }}>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {workOrder.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Priority: {workOrder.priority}
                              </Typography>
                            </Box>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </Box>
                
                <Box mt={2}>
                  <Typography variant="caption" color="text.secondary">
                    {editMode 
                      ? 'Drag markers to reposition assets. Click Save to persist changes.' 
                      : 'Click on markers to view details. Use mouse wheel to zoom and drag to pan.'
                    }
                  </Typography>
                </Box>
                
                {/* Legend */}
                <Box mt={2} display="flex" gap={2} flexWrap="wrap">
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircleIcon style={{ color: theme.palette.success.main, fontSize: 20 }} />
                    <Typography variant="caption">Operational</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <ErrorIcon style={{ color: theme.palette.error.main, fontSize: 20 }} />
                    <Typography variant="caption">Down/Emergency</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <WarningIcon style={{ color: theme.palette.warning.main, fontSize: 20 }} />
                    <Typography variant="caption">Inspection Scheduled</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <BuildIcon style={{ color: theme.palette.primary.main, fontSize: 20 }} />
                    <Typography variant="caption">Other / Work Order</Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Unmapped Assets Sidebar (only in edit mode) */}
      {editMode && selectedFloorPlan && (
        <Card sx={{ width: 300, flexShrink: 0 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <ViewListIcon />
              <Typography variant="h6">Unmapped Assets</Typography>
            </Box>
            
            {unmappedAssets.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" py={4}>
                All assets are mapped to floor plans
              </Typography>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Drag assets from this list onto the floor plan to position them
                </Typography>
                <List dense>
                  {unmappedAssets.map((asset) => (
                    <ListItem
                      key={asset.id}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        cursor: 'grab',
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      <DragIndicatorIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <ListItemText
                        primary={asset.name}
                        secondary={asset.status}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                      <Chip size="small" label={createCustomIcon(asset.status, theme)} />
                    </ListItem>
                  ))}
                </List>
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="caption">
                    Note: Drag & drop from sidebar will be implemented in a future update. 
                    For now, use the API to assign assets to floor plans.
                  </Typography>
                </Alert>
              </>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Drawer for detailed information */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={closeDrawer}
      >
        {renderDrawerContent()}
      </Drawer>
    </Box>
  );
}
