import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch, RootState } from 'src/store';
import {
  getContractorCalendarEntries,
  getContractorCalendarEntriesByVendor,
  getContractorCalendarEntriesByDateRange
} from 'src/slices/contractorCalendar';
import { ContractorCalendarEntry } from 'src/models/owns/contractorCalendarEntry';
import {
  Card,
  Box,
  Typography,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { Calendar, momentLocalizer, Views, DateLocalizer } from 'react-big-calendar';
import { View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useNavigate, useLocation } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import { SearchCriteria } from 'src/models/owns/page';

const localizer: DateLocalizer = momentLocalizer(moment);

const ContractorCalendar: React.FC<{ vendorId?: number }> = ({ vendorId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're in create mode
  const isCreateMode = location.pathname.endsWith('/create');
  
  const { contractorCalendarEntries, loadingGet } = useSelector((state: RootState) => state.contractorCalendar);
  
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<ContractorCalendarEntry | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  
  useEffect(() => {
    const startOfMonth = moment(date).startOf('month').toISOString();
    const endOfMonth = moment(date).endOf('month').toISOString();
    
    if (vendorId) {
      dispatch(getContractorCalendarEntriesByVendor(vendorId));
    } else {
      dispatch(getContractorCalendarEntriesByDateRange(startOfMonth, endOfMonth));
    }
  }, [dispatch, date, vendorId]);

  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  const handleSelectEvent = (event: ContractorCalendarEntry) => {
    setSelectedEvent(event);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleAddEvent = () => {
    navigate('/app/contractors/calendar/create');
  };

  const eventStyleGetter = (event: ContractorCalendarEntry) => {
    let backgroundColor = '#3174ad';
    
    switch (event.status) {
      case 'COMPLETED':
        backgroundColor = '#4caf50';
        break;
      case 'IN_PROGRESS':
        backgroundColor = '#ff9800';
        break;
      case 'CANCELLED':
        backgroundColor = '#f44336';
        break;
      case 'PLANNED':
      default:
        backgroundColor = '#2196f3';
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Abgeschlossen';
      case 'IN_PROGRESS': return 'In Bearbeitung';
      case 'CANCELLED': return 'Abgesagt';
      case 'PLANNED':
      default: return 'Geplant';
    }
  };

  return (
    <Card>
      <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
        <Typography variant="h3">
          {isCreateMode ? 'Neuen Kalendereintrag erstellen' : 'Auftragnehmer-Kalender'}
        </Typography>
        {!isCreateMode && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddEvent}
          >
            Neuen Termin hinzufügen
          </Button>
        )}
      </Box>
      
      {isCreateMode ? (
        <Box p={4} textAlign="center">
          <Typography variant="body1" paragraph>
            Die Erstellungsfunktion für Kalendereinträge wird bald verfügbar sein.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Bitte verwenden Sie vorerst die bestehende Kalenderansicht.
          </Typography>
          <Box mt={3}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/app/contractors/calendar')}
            >
              Zurück zum Kalender
            </Button>
          </Box>
        </Box>
      ) : loadingGet ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Box p={2}>
          <Box height={600}>
            <Calendar
              localizer={localizer}
              events={contractorCalendarEntries.content}
              startAccessor="startTime"
              endAccessor="endTime"
              titleAccessor="description"
              view={view}
              date={date}
              onView={handleViewChange}
              onNavigate={handleNavigate}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              style={{ height: '100%' }}
              messages={
                {
                  next: 'Nächster',
                  previous: 'Vorheriger',
                  today: 'Heute',
                  month: 'Monat',
                  week: 'Woche',
                  day: 'Tag',
                  agenda: 'Agenda',
                  date: 'Datum',
                  time: 'Zeit',
                  event: 'Termin',
                  noEventsInRange: 'Keine Termine in diesem Zeitraum',
                  showMore: (total) => `+${total} weitere`
                }
              }
            />
          </Box>
        </Box>
      )}
      
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        {selectedEvent && (
          <>
            <DialogTitle>Termindetails</DialogTitle>
            <DialogContent>
              <Box mt={2}>
                <Typography variant="h6">{selectedEvent.description}</Typography>
                <Box mt={1}>
                  <Typography variant="subtitle1">
                    <strong>Datum:</strong> {moment(selectedEvent.startTime).format('DD.MM.YYYY HH:mm')} - {moment(selectedEvent.endTime).format('HH:mm')}
                  </Typography>
                </Box>
                <Box mt={1}>
                  <Typography variant="subtitle1">
                    <strong>Status:</strong> {getStatusText(selectedEvent.status)}
                  </Typography>
                </Box>
                <Box mt={1}>
                  <Typography variant="subtitle1">
                    <strong>Standort:</strong> {selectedEvent.locationDetails}
                  </Typography>
                </Box>
                <Box mt={1}>
                  <Typography variant="subtitle1">
                    <strong>Mitarbeiter:</strong> {selectedEvent.employeeId}
                  </Typography>
                </Box>
                <Box mt={1}>
                  <Typography variant="subtitle1">
                    <strong>Betreuer:</strong> {selectedEvent.supervisorId}
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} color="primary">
                Schließen
              </Button>
              <Button 
                onClick={() => navigate(`/contractor-calendar/${selectedEvent.id}/edit`)} 
                color="primary"
                variant="contained"
              >
                Bearbeiten
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Card>
  );
};

export default ContractorCalendar;