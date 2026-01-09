import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  useTheme,
  Alert,
  AlertTitle,
  ListItemIcon,
  IconButton,
  Tooltip
} from '@mui/material';
import { useDispatch, useSelector } from 'src/store';
import { WorkOrderBaseMiniDTO, WorkOrderBase } from 'src/models/owns/workOrderBase';
import { getWorkOrdersMini, getWorkOrders } from 'src/slices/workOrder';
import { Priority } from 'src/models/owns/workOrder';
import PriorityWrapper from '../../components/PriorityWrapper';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import RefreshIcon from '@mui/icons-material/Refresh';

const WorkOrderDragList = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useDispatch();
  const { workOrders, loadingGet } = useSelector((state) => state.workOrders);

  const [isLoading, setIsLoading] = React.useState(true);
  const [showAll, setShowAll] = React.useState(false);

  React.useEffect(() => {
    const fetchWorkOrders = async () => {
      try {
        setIsLoading(true);
        // Fetch work orders that don't have estimatedStartDate or have default date (unplanned work orders)
        // Default date is 01.01.1970 which has timestamp 0
        const defaultDate = new Date('1970-01-01T00:00:00Z').toISOString();
        
        await dispatch(getWorkOrders({
          filterFields: [
            {
              field: 'archived',
              operation: 'eq',
              value: false
            }
          ],
          // We'll filter the results client-side to handle the default date case
          pageSize: 50,
          pageNum: 0
        }));
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkOrders();
  }, [dispatch]);

  // Refresh the list when work orders are updated (e.g., after drag-and-drop)
  React.useEffect(() => {
    // This will trigger a re-render when workOrders change
  }, [workOrders.content]);

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'HIGH':
        return theme.colors.error.main;
      case 'MEDIUM':
        return theme.colors.warning.main;
      case 'LOW':
        return theme.colors.info.main;
      case 'NONE':
        return theme.colors.primary.main;
      default:
        return theme.colors.primary.main;
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    dispatch(getWorkOrders({
      filterFields: [
        {
          field: 'archived',
          operation: 'eq',
          value: false
        }
      ],
      pageSize: 50,
      pageNum: 0
    })).finally(() => setIsLoading(false));
  };

  const handleToggleShowAll = () => {
    setShowAll(!showAll);
  };

  // Filter work orders to show only unplanned ones (no dueDate or default date)
  const unplannedWorkOrders = workOrders.content.filter(workOrder => {
    // Check if dueDate is null, undefined, empty, or the default date 01.01.1970
    if (!workOrder.dueDate) {
      console.log(`Work order ${workOrder.id} has no dueDate - included in drag list`);
      return true;
    }
    
    try {
      const dueDate = new Date(workOrder.dueDate);
      const defaultDate = new Date('1970-01-01T00:00:00Z');
      
      // Consider as unplanned if it's the default date
      if (dueDate.getTime() === defaultDate.getTime()) {
        console.log(`Work order ${workOrder.id} has default date 01.01.1970 - included in drag list`);
        return true;
      } else {
        console.log(`Work order ${workOrder.id} has valid dueDate ${workOrder.dueDate} - excluded from drag list`);
        return false;
      }
    } catch (error) {
      // If date parsing fails, consider it as unplanned
      console.warn('Failed to parse dueDate:', workOrder.dueDate);
      return true;
    }
  });

  console.log(`Total work orders: ${workOrders.content.length}, Unplanned: ${unplannedWorkOrders.length}`);

  // Filter work orders based on showAll setting
  const filteredWorkOrders = showAll 
    ? unplannedWorkOrders
    : unplannedWorkOrders.slice(0, 10);

  if (isLoading) {
    return (
      <Card sx={{ p: 2, mb: 2, height: '100%' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" gutterBottom>
            {t('available_work_orders')}
          </Typography>
          <IconButton onClick={handleRefresh} disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
        </Box>
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={24} />
        </Box>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {t('loading_work_orders')}
        </Typography>
      </Card>
    );
  }

  return (
    <Card sx={{ p: 2, mb: 2, height: '100%', overflow: 'auto' }} data-work-order-list>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" gutterBottom>
          {t('available_work_orders')}
        </Typography>
        <IconButton onClick={handleRefresh} disabled={isLoading}>
          <RefreshIcon />
        </IconButton>
      </Box>
      
      {unplannedWorkOrders.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          <AlertTitle>{t('no_available_work_orders')}</AlertTitle>
          {t('all_work_orders_scheduled')}
        </Alert>
      ) : (
        <>
          <Box mb={2}>
            <Typography variant="caption" color="text.secondary">
              {t('drag_drop_instructions')}
            </Typography>
          </Box>
          
          <List dense>
            {filteredWorkOrders.map((workOrder, index) => (
              <React.Fragment key={workOrder.id}>
                <ListItem
                  data-work-order-id={workOrder.id}
                  sx={{
                    cursor: 'grab',
                    '&:hover': {
                      backgroundColor: theme.colors.alpha.black[5]
                    },
                    '&:active': {
                      cursor: 'grabbing'
                    },
                    borderLeft: `4px solid ${getPriorityColor(workOrder.priority)}`,
                    mb: 0.5,
                    borderRadius: '4px'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: '36px' }}>
                    <DragIndicatorIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary={workOrder.title}
                    secondary={
                      <Box display="flex" alignItems="center">
                        <PriorityWrapper priority={workOrder.priority} />
                        <Typography variant="body2" color="text.secondary" ml={1}>
                          {t('due_date')}: {new Date(workOrder.dueDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < filteredWorkOrders.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
          
          {unplannedWorkOrders.length > 10 && (
            <Box mt={2} textAlign="center">
              <Tooltip title={showAll ? t('show_less') : t('show_more')}>
                <IconButton onClick={handleToggleShowAll} size="small">
                  {showAll ? t('show_less') : `${t('show_more')} (${unplannedWorkOrders.length - 10}+)`}
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </>
      )}
    </Card>
  );
};

export default WorkOrderDragList;