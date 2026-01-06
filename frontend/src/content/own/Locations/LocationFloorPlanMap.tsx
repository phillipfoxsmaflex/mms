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
import { useNavigate } from 'react-router-dom';
import { AssetDTO, AssetStatus } from '../../../models/owns/asset';
import WorkOrder from '../../../models/owns/workOrder';
import { CustomSnackBarContext } from '../../../contexts/CustomSnackBarContext';
import axios from '../../../utils/axios';
import { PermissionEntity } from '../../../models/owns/role';
import useAuth from '../../../hooks/useAuth';

interface LocationFloorPlanMapProps {
  locationId: number;
  statusFilter?: AssetStatus[];
  workOrderFilter?: string;
  searchText?: string;
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
const createCustomIcon = (status: AssetStatus, theme: any, needsPositioning: boolean = false, assetName: string = '') => {
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
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
    }}>
      {/* Asset Name Label */}
      {assetName && (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          color: '#333',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 'bold',
          marginBottom: '4px',
          whiteSpace: 'nowrap',
          boxShadow: '0px 1px 3px rgba(0,0,0,0.3)',
          border: '1px solid rgba(0,0,0,0.1)'
        }}>
          {assetName}
        </div>
      )}
      {/* Icon */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))',
        border: needsPositioning ? `3px solid ${theme.palette.warning.main}` : 'none',
        borderRadius: '50%',
        padding: needsPositioning ? '2px' : '0',
        backgroundColor: needsPositioning ? 'rgba(255, 152, 0, 0.2)' : 'transparent',
        animation: needsPositioning ? 'pulse 2s infinite' : 'none'
      }}>
        {getIconComponent()}
      </div>
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker-icon',
    iconSize: needsPositioning ? [120, 60] : [120, 50],
    iconAnchor: needsPositioning ? [60, 60] : [60, 50],
    popupAnchor: [0, -50]
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

export default function LocationFloorPlanMap({ locationId, statusFilter = [], workOrderFilter = '', searchText = '' }: LocationFloorPlanMapProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const { showSnackBar } = useContext(CustomSnackBarContext);
  const { hasEditPermission } = useAuth();
  
  // State
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<any>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetDTO | null>(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [pendingPositions, setPendingPositions] = useState<Map<number, [number, number]>>(new Map());
  const [saving, setSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [loadedImageDimensions, setLoadedImageDimensions] = useState<{ width: number; height: number } | null>(null);
  
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

  // Load image dimensions dynamically when floor plan changes
  useEffect(() => {
    if (!selectedFloorPlan?.image?.url) {
      setLoadedImageDimensions(null);
      return;
    }

    // If dimensions are already stored in DB, use them
    if (selectedFloorPlan.imageWidth && selectedFloorPlan.imageHeight) {
      setLoadedImageDimensions({
        width: selectedFloorPlan.imageWidth,
        height: selectedFloorPlan.imageHeight
      });
      return;
    }

    // Otherwise, load image and extract natural dimensions
    const img = new Image();
    img.onload = () => {
      const dimensions = {
        width: img.naturalWidth,
        height: img.naturalHeight
      };
      setLoadedImageDimensions(dimensions);

      // Optional: Save dimensions to backend for future use
      if (selectedFloorPlan?.id && typeof selectedFloorPlan.id === 'number') {
        console.log('Saving floor plan dimensions for ID:', selectedFloorPlan.id, dimensions);
        console.log('Selected floor plan:', selectedFloorPlan);
        axios.patch(`/floor-plans/${selectedFloorPlan.id}`, {
          imageWidth: dimensions.width,
          imageHeight: dimensions.height
        }).then(() => {
          console.log('Successfully saved floor plan dimensions');
        }).catch(err => {
          console.error('Failed to save image dimensions for floor plan ID:', selectedFloorPlan.id);
          console.error('Error details:', {
            status: err.response?.status,
            statusText: err.response?.statusText,
            data: err.response?.data,
            url: err.config?.url,
            requestData: { imageWidth: dimensions.width, imageHeight: dimensions.height }
          });
          
          // If floor plan not found, refresh the floor plan data
          if (err.response?.status === 404) {
            console.warn('Floor plan not found in backend, refreshing floor plan data...');
            dispatch(getFloorPlans(locationId));
          }
        });
      } else {
        console.warn('Floor plan ID not found or invalid, cannot save dimensions. Floor plan:', selectedFloorPlan);
      }
    };
    img.onerror = () => {
      console.error('Failed to load floor plan image');
      // Fallback to default dimensions
      setLoadedImageDimensions({ width: 1000, height: 800 });
    };
    img.src = selectedFloorPlan.image.url;
  }, [selectedFloorPlan]);

  const handleDragEnd = (assetId: number, position: [number, number]) => {
    setPendingPositions(prev => new Map(prev).set(assetId, position));
  };

  const handleSavePositions = async () => {
    if (pendingPositions.size === 0) {
      showSnackBar('No changes to save', 'info');
      return;
    }

    if (!selectedFloorPlan?.id) {
      console.error('Cannot save positions: No floor plan selected');
      showSnackBar('Cannot save positions: No floor plan selected', 'error');
      return;
    }

    setSaving(true);
    // Use loaded dimensions if available, fallback to DB values, then defaults
    const imageWidth = loadedImageDimensions?.width || selectedFloorPlan?.imageWidth || 1000;
    const imageHeight = loadedImageDimensions?.height || selectedFloorPlan?.imageHeight || 800;

    try {
      console.log('Saving positions for floor plan ID:', selectedFloorPlan.id);
      console.log('Pending positions:', Array.from(pendingPositions.entries()));
      
      const updates = Array.from(pendingPositions.entries()).map(async ([assetId, [y, x]]) => {
        // Use dedicated position PATCH endpoint with positionX, positionY, floorPlanId
        console.log(`Updating asset ${assetId} position:`, { 
          floorPlanId: selectedFloorPlan.id, 
          positionX: x / imageWidth, 
          positionY: y / imageHeight 
        });
        
        try {
          const requestData = {
            floorPlanId: selectedFloorPlan.id,
            positionX: x / imageWidth,
            positionY: y / imageHeight
          };
          console.log(`Sending PATCH request for asset ${assetId}:`, {
            url: `/assets/${assetId}/position`,
            data: requestData,
            baseURL: axios.defaults.baseURL
          });
          
          const response = await axios.patch(`/assets/${assetId}/position`, requestData);
          console.log(`Successfully updated asset ${assetId} position`, response.data);
        } catch (err) {
          console.error(`Failed to update asset ${assetId} position:`, {
            assetId,
            status: err.response?.status,
            statusText: err.response?.statusText,
            data: err.response?.data,
            url: err.config?.url,
            baseURL: err.config?.baseURL,
            fullError: err
          });
          
          // If asset not found, note it but continue with other assets
          if (err.response?.status === 404) {
            console.warn(`Asset ${assetId} not found in backend, skipping...`);
            // Don't throw, just log and continue
          } else {
            throw err;
          }
        }
      });

      await Promise.all(updates);
      
      showSnackBar('Positions saved successfully', 'success');
      setPendingPositions(new Map());
      
      // Refresh data
      console.log('Reloading assets after save...');
      await dispatch(getAssetsByLocation(locationId));
      console.log('Assets reloaded, staying in edit mode temporarily');
      
      // Don't exit edit mode immediately - let user verify positions
      // setEditMode(false);
    } catch (error) {
      console.error('Failed to save positions:', error);
      showSnackBar('Failed to save positions', 'error');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Get asset position - with direct placement support
   * - If asset has floorPlan AND position: use actual position
   * - If asset has floorPlan but NO position (new/unmapped): use default position
   * - If asset has NO floorPlan: return null (not for this floor plan)
   */
  const getAssetPosition = (asset: AssetDTO): [number, number] | null => {
    // Use loaded dimensions if available, fallback to DB values, then defaults
    const imageWidth = loadedImageDimensions?.width || selectedFloorPlan?.imageWidth || 1000;
    const imageHeight = loadedImageDimensions?.height || selectedFloorPlan?.imageHeight || 800;
    
    // If asset is already mapped to THIS floor plan with coordinates
    if (selectedFloorPlan && asset.floorPlan?.id === selectedFloorPlan.id) {
      if (asset.positionX !== null && asset.positionX !== undefined && 
          asset.positionY !== null && asset.positionY !== undefined) {
        // Has position: use it
        const position: [number, number] = [asset.positionY * imageHeight, asset.positionX * imageWidth];
        console.log(`Asset ${asset.id} (${asset.name}) has position:`, {
          positionX: asset.positionX,
          positionY: asset.positionY,
          calculated: position,
          imageWidth,
          imageHeight
        });
        return position;
      } else {
        // Mapped to this floor plan but no position yet: use default position (top-left)
        console.log(`Asset ${asset.id} (${asset.name}) mapped to floor plan but no position, using default`);
        return [50, 50];
      }
    }
    
    // In Edit Mode: Show ALL location assets without a floor plan at default position
    if (editMode && selectedFloorPlan && !asset.floorPlan) {
      console.log(`Asset ${asset.id} (${asset.name}) not mapped, showing in edit mode at default position`);
      return [50, 50];
    }
    
    console.log(`Asset ${asset.id} (${asset.name}) not displayed:`, {
      hasFloorPlan: !!asset.floorPlan,
      floorPlanId: asset.floorPlan?.id,
      selectedFloorPlanId: selectedFloorPlan?.id,
      editMode
    });
    return null;
  };

  /**
   * Check if asset needs positioning (has no valid coordinates)
   */
  const isUnpositionedAsset = (asset: AssetDTO): boolean => {
    return (
      asset.positionX === null || 
      asset.positionX === undefined || 
      asset.positionY === null || 
      asset.positionY === undefined
    );
  };

  /**
   * Get all assets that should be displayed on the current floor plan
   */
  const getDisplayedAssets = () => {
    if (!selectedFloorPlan) return [];
    
    return locationAssets.filter(asset => {
      const position = getAssetPosition(asset);
      if (position === null) return false;
      
      // Apply status filter
      if (statusFilter.length > 0 && !statusFilter.includes(asset.status)) {
        return false;
      }
      
      // Apply search text filter
      if (searchText && !asset.name.toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }
      
      // Apply work order filter
      if (workOrderFilter) {
        const assetWorkOrders = locationWorkOrders.filter(wo => wo.asset?.id === asset.id);
        
        if (workOrderFilter === 'with-wo' && assetWorkOrders.length === 0) {
          return false;
        }
        
        if (workOrderFilter === 'without-wo' && assetWorkOrders.length > 0) {
          return false;
        }
        
        if (workOrderFilter === 'pending') {
          const hasPendingWO = assetWorkOrders.some(wo => 
            wo.status === 'OPEN' || wo.status === 'IN_PROGRESS' || wo.status === 'ON_HOLD'
          );
          if (!hasPendingWO) {
            return false;
          }
        }
      }
      
      return true;
    });
  };

  // Get the currently displayed assets for the selected floor plan
  const mappedAssets = getDisplayedAssets();

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

  // Use dynamically loaded dimensions, fallback to DB values, then defaults
  const imageWidth = loadedImageDimensions?.width || selectedFloorPlan?.imageWidth || 1000;
  const imageHeight = loadedImageDimensions?.height || selectedFloorPlan?.imageHeight || 800;
  const floorPlanImage = selectedFloorPlan?.image?.url || 
    `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iJHtpbWFnZVdpZHRofSIgaGVpZ2h0PSIke2ltYWdlSGVpZ2h0fSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iJHtpbWFnZVdpZHRofSIgaGVpZ2h0PSIke2ltYWdlSGVpZ2h0fSIgZmlsbD0iI2Y1ZjVmNSIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5GbG9vciBQbGFuIFBsYWNlaG9sZGVyPC90ZXh0Pgo8L3N2Zz4=`;

  // Bounds based on actual image dimensions (1:1 pixel mapping)
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
                  navigate(`/app/assets/${selectedAsset.id}/details`);
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

  const displayedAssets = getDisplayedAssets();

  return (
    <Box display="flex" gap={2}>
      {/* Main Floor Plan Area */}
      <Box flex={1}>
        <Card>
          {/* Header with Edit Mode Toggle - Keep normal padding */}
          <CardContent sx={{ pb: 0 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5">Floor Plan</Typography>
              {hasEditPermission(PermissionEntity.FLOOR_PLANS, null) && (
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
              )}
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
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
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
            )}
          </CardContent>

          {/* Map Container - Full width without padding for maximum space */}
          {selectedFloorPlan && (
            <Box sx={{ 
              height: 'calc(100vh - 280px)', 
              minHeight: 700,
              width: '100%', 
              position: 'relative' 
            }}>
                  {!loadedImageDimensions ? (
                    <Box 
                      display="flex" 
                      alignItems="center" 
                      justifyContent="center" 
                      height="100%" 
                      bgcolor="#f5f5f5"
                    >
                      <CircularProgress />
                    </Box>
                  ) : (
                    <MapContainer
                      center={[imageHeight / 2, imageWidth / 2]}
                      zoom={0}
                      crs={L.CRS.Simple}
                      style={{ height: '100%', width: '100%', background: '#f5f5f5' }}
                      scrollWheelZoom={true}
                      minZoom={-3}
                      maxZoom={3}
                      key={`map-${selectedFloorPlan.id}-${loadedImageDimensions.width}-${loadedImageDimensions.height}`}
                    >
                      <MapBoundsHandler bounds={imageBounds} />
                    
                    <ImageOverlay
                      url={floorPlanImage}
                      bounds={imageBounds}
                    />
                    
                    {/* Asset Markers with Drag Support (Direct Placement Model) */}
                    {displayedAssets.map((asset) => {
                      const position = getAssetPosition(asset);
                      if (!position) return null;
                      
                      // Check if this asset needs positioning (unplaced)
                      const needsPositioning = isUnpositionedAsset(asset) || !asset.floorPlan;
                      
                      return (
                        <DraggableMarker
                          key={`asset-${asset.id}`}
                          position={position}
                          asset={asset}
                          icon={createCustomIcon(asset.status, theme, needsPositioning, asset.name)}
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
                  )}
            </Box>
          )}
          
          {/* Instructions Footer */}
          {selectedFloorPlan && (
            <CardContent sx={{ pt: 1, pb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {editMode 
                  ? 'Drag markers to reposition assets. Assets with orange borders need positioning. Click Save to persist changes.' 
                  : 'Click on markers to view details. Use mouse wheel to zoom and drag to pan.'
                }
              </Typography>
              
              {/* Edit Mode Info */}
              {editMode && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="caption">
                    <strong>Direct Placement Mode:</strong> All location assets without a position appear at the top-left 
                    with an orange border. Simply drag them to their correct position on the floor plan and click Save.
                  </Typography>
                </Alert>
              )}
              
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
            </CardContent>
          )}
        </Card>
      </Box>
      
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
