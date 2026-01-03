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
import { useEffect, useState, useMemo } from 'react';
import { MapContainer, ImageOverlay, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { renderToStaticMarkup } from 'react-dom/server';
import CloseIcon from '@mui/icons-material/Close';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import SaveIcon from '@mui/icons-material/Save';
import ViewListIcon from '@mui/icons-material/ViewList';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

// Mock Data Types
type AssetStatus = 'OPERATIONAL' | 'DOWN' | 'EMERGENCY_SHUTDOWN' | 'INSPECTION_SCHEDULED' | 'IN_SERVICE';

interface MockAsset {
  id: number;
  name: string;
  status: AssetStatus;
  description: string;
  model?: string;
  serialNumber?: string;
  positionX?: number;
  positionY?: number;
}

interface MockWorkOrder {
  id: number;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'NONE';
  status: string;
  assetId: number;
}

interface MockFloorPlan {
  id: number;
  name: string;
  area: number;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
}

// Mock Data
const MOCK_FLOOR_PLANS: MockFloorPlan[] = [
  {
    id: 1,
    name: 'Ground Floor - Production Area',
    area: 500,
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwMCIgaGVpZ2h0PSI4MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPCEtLSBCYWNrZ3JvdW5kIC0tPgogIDxyZWN0IHdpZHRoPSIxMDAwIiBoZWlnaHQ9IjgwMCIgZmlsbD0iI2Y1ZjVmNSIvPgogIAogIDwhLS0gUm9vbXMgLS0+CiAgPHJlY3QgeD0iNTAiIHk9IjUwIiB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjMiLz4KICA8cmVjdCB4PSI1MDAiIHk9IjUwIiB3aWR0aD0iNDUwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjMiLz4KICA8cmVjdCB4PSI1MCIgeT0iNDAwIiB3aWR0aD0iOTAwIiBoZWlnaHQ9IjM1MCIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjMiLz4KICAKICA8IS0tIERvb3JzIC0tPgogIDxyZWN0IHg9IjQ1MCIgeT0iNTAiIHdpZHRoPSI1MCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzY2NiIvPgogIDxyZWN0IHg9IjQ1MCIgeT0iMzQwIiB3aWR0aD0iNTAiIGhlaWdodD0iMTAiIGZpbGw9IiM2NjYiLz4KICAKICA8IS0tIFJvb20gTGFiZWxzIC0tPgogIDx0ZXh0IHg9IjI1MCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtd2VpZ2h0PSJib2xkIj5Bc3NlbWJseSBBcmVhPC90ZXh0PgogIDx0ZXh0IHg9IjcyNSIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtd2VpZ2h0PSJib2xkIj5RdWFsaXR5IENvbnRyb2w8L3RleHQ+CiAgPHRleHQgeD0iNTAwIiB5PSI1NzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC13ZWlnaHQ9ImJvbGQiPlN0b3JhZ2UgJmFtcDsgU2hpcHBpbmc8L3RleHQ+CiAgCiAgPCEtLSBHcmlkIExpbmVzIC0tPgogIDxsaW5lIHgxPSIwIiB5MT0iMzUwIiB4Mj0iMTAwMCIgeTI9IjM1MCIgc3Ryb2tlPSIjZGRkIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1kYXNoYXJyYXk9IjUsMiIvPgogIDxsaW5lIHgxPSI0NTAiIHkxPSI1MCIgeDI9IjQ1MCIgeTI9IjM1MCIgc3Ryb2tlPSIjZGRkIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1kYXNoYXJyYXk9IjUsMiIvPgo8L3N2Zz4=',
    imageWidth: 1000,
    imageHeight: 800
  },
  {
    id: 2,
    name: 'First Floor - Offices',
    area: 350,
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwMCIgaGVpZ2h0PSI4MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjEwMDAiIGhlaWdodD0iODAwIiBmaWxsPSIjZThlZmY3Ii8+CiAgPHJlY3QgeD0iNTAiIHk9IjUwIiB3aWR0aD0iOTAwIiBoZWlnaHQ9IjcwMCIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjMiLz4KICA8dGV4dCB4PSI1MDAiIHk9IjQwMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjMyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5PZmZpY2UgQXJlYTwvdGV4dD4KPC9zdmc+',
    imageWidth: 1000,
    imageHeight: 800
  }
];

const MOCK_ASSETS: MockAsset[] = [
  {
    id: 1,
    name: 'CNC Machine #1',
    status: 'OPERATIONAL',
    description: 'High-precision CNC milling machine',
    model: 'Haas VF-4',
    serialNumber: 'SN-2023-001',
    positionX: 0.15,
    positionY: 0.25
  },
  {
    id: 2,
    name: 'Welding Robot',
    status: 'OPERATIONAL',
    description: 'Automated welding system',
    model: 'KUKA KR 150',
    serialNumber: 'SN-2023-002',
    positionX: 0.35,
    positionY: 0.35
  },
  {
    id: 3,
    name: 'Hydraulic Press',
    status: 'DOWN',
    description: 'Hydraulic press for metal forming',
    model: 'HPM-500',
    serialNumber: 'SN-2022-015',
    positionX: 0.65,
    positionY: 0.20
  },
  {
    id: 4,
    name: 'Quality Scanner',
    status: 'OPERATIONAL',
    description: '3D scanning system for quality control',
    model: 'FARO Edge',
    serialNumber: 'SN-2023-008',
    positionX: 0.75,
    positionY: 0.30
  },
  {
    id: 5,
    name: 'Conveyor Belt System',
    status: 'INSPECTION_SCHEDULED',
    description: 'Main assembly line conveyor',
    model: 'CONV-2000',
    serialNumber: 'SN-2021-022',
    positionX: 0.50,
    positionY: 0.70
  },
  {
    id: 6,
    name: 'Forklift #3',
    status: 'OPERATIONAL',
    description: 'Electric forklift for material handling',
    model: 'Toyota 8FBE20U',
    serialNumber: 'SN-2022-033',
    positionX: 0.70,
    positionY: 0.80
  },
  {
    id: 7,
    name: 'Air Compressor',
    status: 'IN_SERVICE',
    description: 'Main facility air compressor',
    model: 'Atlas Copco GA55',
    serialNumber: 'SN-2020-005'
    // No position - unmapped asset
  },
  {
    id: 8,
    name: 'Emergency Generator',
    status: 'OPERATIONAL',
    description: 'Backup power generator',
    model: 'Caterpillar C15',
    serialNumber: 'SN-2019-012'
    // No position - unmapped asset
  }
];

const MOCK_WORK_ORDERS: MockWorkOrder[] = [
  {
    id: 1,
    title: 'Hydraulic Press - Oil Leak Repair',
    description: 'Urgent repair needed for hydraulic oil leak',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assetId: 3
  },
  {
    id: 2,
    title: 'Conveyor Belt - Annual Inspection',
    description: 'Scheduled annual safety inspection',
    priority: 'MEDIUM',
    status: 'OPEN',
    assetId: 5
  }
];

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
  asset: MockAsset;
  icon: L.DivIcon;
  isDraggable: boolean;
  onDragEnd: (assetId: number, position: [number, number]) => void;
  onClick: (asset: MockAsset) => void;
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
    iconAnchor: [16, 16]
  });
};

// Create work order icon
const createWorkOrderIcon = (priority: string, theme: any) => {
  const color = priority === 'HIGH' ? theme.palette.error.main : 
                priority === 'MEDIUM' ? theme.palette.warning.main : 
                theme.palette.info.main;

  const iconHtml = renderToStaticMarkup(
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))'
    }}>
      <BuildIcon style={{ color, fontSize: 24 }} />
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: 'custom-wo-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

export default function LocationFloorPlanMapDemo() {
  const theme = useTheme();
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<MockFloorPlan>(MOCK_FLOOR_PLANS[0]);
  const [currentTab, setCurrentTab] = useState<number>(0);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [selectedAsset, setSelectedAsset] = useState<MockAsset | null>(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<MockWorkOrder | null>(null);
  const [pendingPositions, setPendingPositions] = useState<Map<number, [number, number]>>(new Map());

  const handleDragEnd = (assetId: number, position: [number, number]) => {
    setPendingPositions(prev => new Map(prev).set(assetId, position));
  };

  const handleSavePositions = () => {
    if (pendingPositions.size === 0) {
      alert('No changes to save');
      return;
    }

    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      alert(`Successfully saved ${pendingPositions.size} position changes!`);
      setPendingPositions(new Map());
      setSaving(false);
      setEditMode(false);
    }, 1000);
  };

  const getAssetPosition = (asset: MockAsset): [number, number] | null => {
    if (asset.positionX !== null && asset.positionX !== undefined && 
        asset.positionY !== null && asset.positionY !== undefined) {
      const imageWidth = selectedFloorPlan.imageWidth;
      const imageHeight = selectedFloorPlan.imageHeight;
      return [asset.positionY * imageHeight, asset.positionX * imageWidth];
    }
    return null;
  };

  const getMappedAssets = () => {
    return MOCK_ASSETS.filter(asset => {
      const position = getAssetPosition(asset);
      return position !== null;
    });
  };

  const getUnmappedAssets = () => {
    return MOCK_ASSETS.filter(asset => {
      const position = getAssetPosition(asset);
      return position === null;
    });
  };

  const handleAssetClick = (asset: MockAsset) => {
    if (!editMode) {
      setSelectedAsset(asset);
      setSelectedWorkOrder(null);
      setDrawerOpen(true);
    }
  };

  const handleWorkOrderClick = (workOrder: MockWorkOrder) => {
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
    setSelectedFloorPlan(MOCK_FLOOR_PLANS[newValue]);
  };

  const imageWidth = selectedFloorPlan.imageWidth;
  const imageHeight = selectedFloorPlan.imageHeight;
  const imageBounds: L.LatLngBoundsExpression = [[0, 0], [imageHeight, imageWidth]];
  const mappedAssets = getMappedAssets();
  const unmappedAssets = getUnmappedAssets();

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
                color={selectedAsset.status === 'OPERATIONAL' ? 'success' : 
                       selectedAsset.status === 'DOWN' ? 'error' : 'warning'}
                sx={{ mt: 0.5 }}
              />
            </Box>
            
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
                color={selectedWorkOrder.priority === 'HIGH' ? 'error' : 
                       selectedWorkOrder.priority === 'MEDIUM' ? 'warning' : 'info'}
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
          </Stack>
        </Box>
      );
    }
    
    return null;
  };

  return (
    <Box display="flex" gap={2}>
      {/* Main Floor Plan Area */}
      <Box flex={1}>
        <Card>
          <CardContent>
            {/* Demo Badge */}
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                🎯 Digital Twin Floor Plan Demo - Interactive Visualization
              </Typography>
              <Typography variant="caption">
                This is a fully functional demo with mock data. Click on markers to see details, enable Edit Mode to reposition assets.
              </Typography>
            </Alert>

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
                    disabled={saving || pendingPositions.size === 0}
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
            {MOCK_FLOOR_PLANS.length > 1 && (
              <Tabs
                value={currentTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
              >
                {MOCK_FLOOR_PLANS.map((plan, index) => (
                  <Tab 
                    key={plan.id} 
                    label={plan.name} 
                    icon={<BuildIcon />}
                  />
                ))}
              </Tabs>
            )}
            
            {selectedFloorPlan && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    {selectedFloorPlan.name}
                    <Typography component="span" variant="body2" color="text.secondary" ml={1}>
                      ({selectedFloorPlan.area} m²)
                    </Typography>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {mappedAssets.length} assets mapped
                  </Typography>
                </Box>
                
                <Box sx={{ height: 600, width: '100%', position: 'relative', border: '1px solid #ddd', borderRadius: 1 }}>
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
                      url={selectedFloorPlan.imageUrl}
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
                    {!editMode && MOCK_WORK_ORDERS.map((workOrder) => {
                      const asset = MOCK_ASSETS.find(a => a.id === workOrder.assetId);
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
                  These assets need to be positioned on the floor plan
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
                        cursor: 'default',
                        bgcolor: 'background.default'
                      }}
                    >
                      <DragIndicatorIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <ListItemText
                        primary={asset.name}
                        secondary={asset.status}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="caption">
                    {unmappedAssets.length} asset{unmappedAssets.length > 1 ? 's' : ''} waiting to be mapped
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
