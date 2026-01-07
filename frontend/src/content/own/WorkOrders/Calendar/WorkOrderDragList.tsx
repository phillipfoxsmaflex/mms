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
import { WorkOrderBaseMiniDTO } from 'src/models/owns/workOrderBase';
import { getWorkOrdersMini } from 'src/slices/workOrder';
import { Priority } from 'src/models/owns/workOrder';
import PriorityWrapper from '../../components/PriorityWrapper';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import RefreshIcon from '@mui/icons-material/Refresh';

const WorkOrderDragList = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useDispatch();
  const { workOrdersMini, loadingGet } = useSelector((state) => state.workOrders);

  const [isLoading, setIsLoading] = React.useState(true);
  const [showAll, setShowAll] = React.useState(false);

  React.useEffect(() => {
    const fetchWorkOrders = async () => {
      try {
        setIsLoading(true);
        // Fetch work orders that don't have estimatedStartDate (unplanned work orders)
        await dispatch(getWorkOrdersMini({
          filterFields: [
            {
              field: 'estimatedStartDate',
              operation: 'nu',
              value: null
            },
            {
              field: 'archived',
              operation: 'eq',
              value: false
            }
          ],
          pageSize: 50,
          pageNum: 0
        }));
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkOrders();
  }, [dispatch]);

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

  const handleDragStart = (event: React.DragEvent<HTMLLIElement>, workOrder: WorkOrderBaseMiniDTO) => {
    event.dataTransfer.setData('text/plain', workOrder.id.toString());
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleRefresh = () => {
    setIsLoading(true);
    dispatch(getWorkOrdersMini({
      filterFields: [
        {
          field: 'estimatedStartDate',
          operation: 'nu',
          value: null
        },
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

  // Filter work orders based on showAll setting
  const filteredWorkOrders = showAll 
    ? workOrdersMini.content
    : workOrdersMini.content.slice(0, 10);

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
    <Card sx={{ p: 2, mb: 2, height: '100%', overflow: 'auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" gutterBottom>
          {t('available_work_orders')}
        </Typography>
        <IconButton onClick={handleRefresh} disabled={isLoading}>
          <RefreshIcon />
        </IconButton>
      </Box>
      
      {workOrdersMini.content.length === 0 ? (
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
                  draggable
                  onDragStart={(e) => handleDragStart(e, workOrder)}
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
          
          {workOrdersMini.content.length > 10 && (
            <Box mt={2} textAlign="center">
              <Tooltip title={showAll ? t('show_less') : t('show_more')}>
                <IconButton onClick={handleToggleShowAll} size="small">
                  {showAll ? t('show_less') : `${t('show_more')} (${workOrdersMini.content.length - 10}+)`}
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