import { useEffect, useRef, useState, useCallback, useContext } from 'react';
import frLocale from '@fullcalendar/core/locales/fr';
import enLocale from '@fullcalendar/core/locales/en-gb';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  styled,
  useMediaQuery,
  useTheme
} from '@mui/material';

import type { View } from 'src/models/calendar';
import { useDispatch, useSelector } from 'src/store';
import { selectEvent } from 'src/slices/calendar';
import WorkOrder, { Priority } from 'src/models/owns/workOrder';
import { CalendarEvent, getWorkOrderEvents, batchUpdateWorkOrderDates } from 'src/slices/workOrder';
import Actions from './Actions';
import i18n from 'i18next';
import PreventiveMaintenance from 'src/models/owns/preventiveMaintenance';
import { usePrevious } from '../../../../hooks/usePrevious';
import { supportedLanguages } from '../../../../i18n/i18n';
import WorkOrderDragList from './WorkOrderDragList';
import { CustomSnackBarContext } from 'src/contexts/CustomSnackBarContext';
import { formatDateForBackend } from 'src/utils/dateUtils';

const FullCalendarWrapper = styled(Box)(
  ({ theme }) => `
    padding: ${theme.spacing(3)};
    position: relative;
    
    & .fc-license-message {
      display: none;
    }
    .fc {
      .fc-daygrid-day,.fc-timegrid-slot{
        cursor: pointer;
      }
      .fc-col-header-cell {
        padding: ${theme.spacing(1)};
        background: ${theme.colors.alpha.black[5]};
      }

      .fc-scrollgrid {
        border: 2px solid ${theme.colors.alpha.black[10]};
        border-right-width: 1px;
        border-bottom-width: 1px;
      }

      .fc-cell-shaded,
      .fc-list-day-cushion {
        background: ${theme.colors.alpha.black[5]};
      }

      .fc-list-event-graphic {
        padding-right: ${theme.spacing(1)};
      }

      .fc-theme-standard td, .fc-theme-standard th,
      .fc-col-header-cell {
        border: 1px solid ${theme.colors.alpha.black[10]};
      }

      .fc-event {
        padding: ${theme.spacing(0.1)} ${theme.spacing(0.3)};
      }

      .fc-list-day-side-text {
        font-weight: normal;
        color: ${theme.colors.alpha.black[70]};
      }

      .fc-list-event:hover td,
      td.fc-daygrid-day.fc-day-today {
        background-color: ${theme.colors.primary.lighter};
      }

      td.fc-daygrid-day:hover,
      .fc-highlight {
        background: ${theme.colors.alpha.black[10]};
      }

      .fc-daygrid-dot-event:hover, 
      .fc-daygrid-dot-event.fc-event-mirror {
        background: ${theme.colors.primary.lighter};
      }

      .fc-daygrid-day-number {
        padding: ${theme.spacing(1)};
        font-weight: bold;
      }

      .fc-list-sticky .fc-list-day > * {
        background: ${theme.colors.alpha.black[5]} !important;
      }

      .fc-cell-shaded, 
      .fc-list-day-cushion {
        background: ${theme.colors.alpha.black[10]} !important;
        color: ${theme.colors.alpha.black[70]} !important;
      }

      &.fc-theme-standard td, 
      &.fc-theme-standard th,
      &.fc-theme-standard .fc-list {
        border-color: ${theme.colors.alpha.black[30]};
      }
    }
`
);

interface Event {
  id: string;
  allDay: boolean;
  color?: string;
  description: string;
  end: Date;
  start: Date;
  title: string;
  extendedProps: { type: string };
}

interface OwnProps {
  handleAddWorkOrder: (date: Date) => void;
  handleOpenDetails: (id: number, type: string) => void;
}

function ApplicationsCalendar({
  handleAddWorkOrder,
  handleOpenDetails
}: OwnProps) {
  const theme = useTheme();
  const { showSnackBar } = useContext(CustomSnackBarContext);

  const calendarRef = useRef<FullCalendar | null>(null);
  const draggableRef = useRef<Draggable | null>(null);
  const mobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const { calendar, loadingGet, workOrders } = useSelector((state) => state.workOrders);
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<View>('timeGridWeek');
  const getLanguage = i18n.language;
  
  // Batch-Update State
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const viewsOrder: View[] = [
    'dayGridMonth',
    'timeGridWeek',
    'listWeek',
    'timeGridDay'
  ];
  const previousView = usePrevious(view);
  const getColor = (priority: Priority) => {
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
        break;
    }
  };
  const getEventFromWO = (
    eventPayload: CalendarEvent<WorkOrder | PreventiveMaintenance>
  ): Event => {
    // Calculate proper start and end dates for the event
    const startDate = new Date(eventPayload.date);
    const endDate = new Date(eventPayload.date);
    
    // Add duration based on estimatedDuration if available
    if (eventPayload.event.estimatedDuration) {
      endDate.setHours(startDate.getHours() + eventPayload.event.estimatedDuration);
    } else {
      // Default 2-hour duration if no estimatedDuration is set
      endDate.setHours(startDate.getHours() + 2);
    }
    
    return {
      id: eventPayload.event.id.toString(),
      allDay: false,
      color: getColor(eventPayload.event.priority),
      description: eventPayload.event?.description,
      end: endDate,
      start: startDate,
      title: eventPayload.event.title,
      extendedProps: { type: eventPayload.type }
    };
  };

  // Mark calendar as changed (for batch-update)
  const markAsChanged = useCallback(() => {
    console.log('Calendar marked as changed');
    setHasUnsavedChanges(true);
  }, []);

  // Drag and Drop handlers (now local only, no backend calls)
  const handleDrop = (info: any) => {
    // This handler is called when dropping without create: true
    // We don't use it since we have create: true in Draggable config
    console.log('handleDrop called (not used with create: true)', info);
  };

  const handleEventDrop = (info: any) => {
    // Event was moved within the calendar - keep it local
    console.log('Event moved locally:', {
      id: info.event.id,
      newStart: info.event.start,
      newEnd: info.event.end
    });
    
    // Mark as changed for batch-update
    markAsChanged();
  };

  const handleEventResize = (info: any) => {
    // Event was resized - keep it local
    console.log('Event resized locally:', {
      id: info.event.id,
      newStart: info.event.start,
      newEnd: info.event.end
    });
    
    // Mark as changed for batch-update
    markAsChanged();
  };

  const handleEventReceive = (info: any) => {
    // Work order was dragged from list into calendar - keep it local
    console.log('Work order received locally:', {
      id: info.event.id,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end
    });
    
    // Mark as changed for batch-update
    markAsChanged();
  };

  // Save all changes to backend
  const handleSave = async () => {
    if (!hasUnsavedChanges || isSaving) return;
    
    setIsSaving(true);
    console.log('Saving all calendar changes...');
    
    try {
      const calApi = calendarRef.current?.getApi();
      if (!calApi) {
        throw new Error('Calendar API not available');
      }

      // Get all events from calendar
      const allEvents = calApi.getEvents();
      console.log('Found', allEvents.length, 'events in calendar');
      
      // Log all events for debugging
      allEvents.forEach((event, index) => {
        console.log(`Event ${index}:`, {
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
          allDay: event.allDay
        });
      });

      // Prepare batch update with validation
      const updates = allEvents
        .filter(event => {
          // Validate event has required data
          const id = parseInt(event.id);
          if (!event.id || isNaN(id)) {
            console.warn('Skipping event with invalid ID:', event.id, event);
            return false;
          }
          if (!event.start) {
            console.warn('Skipping event without start date:', event);
            return false;
          }
          if (!event.title) {
            console.warn('Skipping event without title:', event);
            return false;
          }
          return true;
        })
        .map(event => {
          const id = parseInt(event.id);
          const start = event.start;
          const title = event.title;
          
          // Calculate end date
          let end = event.end;
          if (!end) {
            // Default: 2 hours after start
            end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
          }
          
          console.log('Event times before formatting:', {
            id,
            startLocal: start.toString(),
            startISO: start.toISOString(),
            endLocal: end.toString(),
            endISO: end.toISOString()
          });
          
          return {
            id: id,
            title: title,
            estimatedStartDate: formatDateForBackend(start),
            dueDate: formatDateForBackend(end)
          };
        });

      console.log('Batch update prepared:', updates);
      console.log('Number of valid updates:', updates.length);

      if (updates.length === 0) {
        throw new Error('No valid events to update');
      }

      // Send batch update to backend
      console.log('Sending batch update to backend...');
      await dispatch(batchUpdateWorkOrderDates(updates));
      console.log('Batch update completed successfully');

      // Reload calendar events to show updated data
      const start = calApi.view.activeStart;
      const end = calApi.view.activeEnd;
      console.log('Reloading calendar events...');
      await dispatch(getWorkOrderEvents(start, end));

      // Success!
      setHasUnsavedChanges(false);
      showSnackBar('Changes saved successfully', 'success');
      console.log('All changes saved successfully');

    } catch (error) {
      console.error('Failed to save changes:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      showSnackBar('Failed to save changes. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel all changes and reload from backend
  const handleCancel = () => {
    if (!hasUnsavedChanges) return;

    if (window.confirm('Discard all unsaved changes?')) {
      console.log('Canceling changes, reloading from backend...');
      
      // Reload calendar events from backend
      const calApi = calendarRef.current?.getApi();
      if (calApi) {
        const start = calApi.view.activeStart;
        const end = calApi.view.activeEnd;
        dispatch(getWorkOrderEvents(start, end));
      }

      setHasUnsavedChanges(false);
      showSnackBar('Changes discarded', 'info');
    }
  };

  const handleDateToday = (): void => {
    const calItem = calendarRef.current;

    if (calItem) {
      const calApi = calItem.getApi();

      calApi.today();
      setDate(calApi.getDate());
    }
  };
  // Load calendar events when view or date changes
  useEffect(() => {
    const calItem = calendarRef.current;
    if (!calItem) {
      console.log('Calendar ref not ready yet');
      return;
    }
    
    const newView = calItem.getApi().view;
    if (
      previousView &&
      previousView !== view &&
      viewsOrder.findIndex((v) => v === previousView) <
        viewsOrder.findIndex((v) => v === view)
    ) {
      return;
    }
    const start = newView.activeStart;
    const end = newView.activeEnd;
    console.log('Loading calendar events for view:', { start, end, view });
    dispatch(getWorkOrderEvents(start, end));
  }, [date, view, dispatch, previousView]);

  // Initial load of calendar events when component mounts
  useEffect(() => {
    console.log('Initial calendar load triggered');
    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // Load 1 month ahead
    dispatch(getWorkOrderEvents(now, endDate));
  }, [dispatch]);

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
        return ''; // Some browsers require a return value
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Set up external drag-and-drop for FullCalendar
  useEffect(() => {
    // Small delay to ensure WorkOrderDragList is rendered
    const timer = setTimeout(() => {
      const externalContainer = document.querySelector('[data-work-order-list]') as HTMLElement;
      
      if (externalContainer) {
        console.log('(Re)initializing Draggable for WorkOrderDragList...');
        
        // Destroy previous Draggable instance if it exists
        if (draggableRef.current) {
          console.log('Destroying previous Draggable instance');
          draggableRef.current.destroy();
        }
        
        // Create new Draggable instance
        draggableRef.current = new Draggable(externalContainer, {
          itemSelector: '[data-work-order-id]',
          eventData: function(eventEl) {
            const workOrderId = eventEl.getAttribute('data-work-order-id');
            const title = eventEl.querySelector('.MuiListItemText-primary')?.textContent || 'Work Order';
            
            console.log('Creating draggable event data:', { workOrderId, title });
            
            return {
              id: workOrderId,
              title: title,
              duration: '02:00', // Default 2-hour duration
              create: true // Create event on drop
            };
          }
        });
        
        console.log('Draggable initialized successfully');
      } else {
        console.warn('WorkOrderDragList container not found for Draggable initialization');
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      // Cleanup: destroy Draggable on unmount
      if (draggableRef.current) {
        console.log('Cleaning up Draggable instance');
        draggableRef.current.destroy();
        draggableRef.current = null;
      }
    };
  }, [workOrders.content]); // Re-initialize when work orders change

  const changeView = (changedView: View): void => {
    const calItem = calendarRef.current;

    if (calItem) {
      const calApi = calItem.getApi();

      calApi.changeView(changedView);
      setView(changedView);
    }
  };

  const handleDatePrev = (): void => {
    const calItem = calendarRef.current;

    if (calItem) {
      const calApi = calItem.getApi();

      calApi.prev();
      setDate(calApi.getDate());
    }
  };

  const handleDateNext = (): void => {
    const calItem = calendarRef.current;

    if (calItem) {
      const calApi = calItem.getApi();

      calApi.next();
      setDate(calApi.getDate());
    }
  };

  const handleEventSelect = (arg: any): void => {
    dispatch(selectEvent(arg.event.id));
  };

  return (
    <Grid item xs={12}>
      <Box p={3}>
        <Actions
          date={date}
          onNext={handleDateNext}
          onPrevious={handleDatePrev}
          onToday={handleDateToday}
          changeView={changeView}
          view={view}
        />
      </Box>
      
      {/* Save/Cancel buttons and Unsaved Changes indicator */}
      {hasUnsavedChanges && (
        <Box px={3} pb={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={isSaving}
              startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            
            <Box
              sx={{
                px: 2,
                py: 0.5,
                borderRadius: 1,
                bgcolor: 'warning.light',
                color: 'warning.dark',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              Unsaved Changes
            </Box>
          </Stack>
        </Box>
      )}
      
      <Divider />
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <WorkOrderDragList />
        </Grid>
        <Grid item xs={12} md={8}>
          <FullCalendarWrapper>
            {loadingGet && (
              <Stack position="absolute" top={'45%'} left={'45%'} zIndex={10}>
                <CircularProgress size={64} />
              </Stack>
            )}
            <FullCalendar
              allDayMaintainDuration
              initialDate={date}
              initialView={view}
              locale={
                supportedLanguages.find(({ code }) => code === getLanguage)
                  .calendarLocale
              }
              droppable
              editable={true}
              eventStartEditable={true}
              eventDurationEditable={true}
              eventResizableFromStart={true}
              eventDisplay="block"
              eventClick={(arg) =>
                handleOpenDetails(
                  Number(arg.event.id),
                  arg.event.extendedProps.type
                )
              }
              dateClick={(event) => handleAddWorkOrder(event.date)}
              dayMaxEventRows={4}
              events={calendar.events.map((eventPayload) =>
                getEventFromWO(eventPayload)
              )}
              headerToolbar={false}
              height={660}
              ref={calendarRef}
              rerenderDelay={10}
              weekends
              drop={handleDrop}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              eventReceive={handleEventReceive}
              plugins={[
                dayGridPlugin,
                timeGridPlugin,
                interactionPlugin,
                listPlugin
              ]}
            />
          </FullCalendarWrapper>
        </Grid>
      </Grid>
    </Grid>
  );
}

export default ApplicationsCalendar;