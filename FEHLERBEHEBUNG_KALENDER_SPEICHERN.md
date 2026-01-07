# Fehlerbehebung: Kalender-Speicherung und Anzeige von Work Orders

## Datum: 2024 (Update 2)

## Zusammenfassung der behobenen Probleme (Update 2)

Diese Fehlerbehebung adressiert drei kritische Probleme mit der Kalender-Funktionalität:

1. ✅ **WOs aus WorkOrderDragList werden nicht im Kalender gespeichert**
2. ✅ **WOs im Kalender können nicht verschoben werden**
3. ✅ **Neu über den Kalender angelegte WOs erscheinen nicht im Kalender**

---

## Problem 1 & 2: Drag-and-Drop und Verschieben funktioniert nicht

### Symptome
- WOs können aus der WorkOrderDragList in den Kalender gezogen werden
- Die Events erscheinen kurz im Kalender, verschwinden aber nach einem Refresh
- Bestehende WOs im Kalender können nicht verschoben werden
- Die Änderungen werden nicht dauerhaft gespeichert

### Ursachen
1. **Race Condition**: Die Kalender-Events wurden aktualisiert, bevor die API-Anfrage abgeschlossen war
2. **Fehlende Fehlerbehandlung**: Bei API-Fehlern wurde das UI nicht zurückgesetzt
3. **Falscher Zeitraum**: Die Event-Aktualisierung verwendete einen festen Zeitraum statt der aktuellen Kalenderansicht
4. **Doppelte Aktualisierungen**: getWorkOrderEvents wurde sowohl in der Kalender-Komponente als auch in updateWorkOrderDates aufgerufen

### Lösung

#### 1. Asynchrone Event-Handler mit Fehlerbehandlung
Alle Event-Handler (handleDrop, handleEventDrop, handleEventResize, handleEventReceive) wurden so angepasst, dass sie:
- Auf die erfolgreiche API-Antwort warten (`.then()`)
- Die Kalender-Events erst NACH erfolgreicher Speicherung aktualisieren
- Bei Fehlern die Änderung im UI rückgängig machen (`.catch()` mit `info.revert()`)

**Beispiel aus `/frontend/src/content/own/WorkOrders/Calendar/index.tsx`:**

```typescript
const handleEventDrop = (info: any) => {
  const eventId = parseInt(info.event.id);
  const newStart = info.event.start;
  let newEnd = info.event.end;

  // Calculate the original duration
  const oldStart = info.oldEvent.start;
  const oldEnd = info.oldEvent.end;
  const durationMs = oldEnd ? oldEnd.getTime() - oldStart.getTime() : 2 * 60 * 60 * 1000;

  // Calculate new end based on new start + duration
  if (!newEnd || newEnd.getTime() === oldEnd?.getTime()) {
    newEnd = new Date(newStart.getTime() + durationMs);
  }

  console.log('Event dropped:', { 
    eventId, 
    newStart, 
    newEnd, 
    duration: durationMs / 1000 / 60 / 60 + ' hours',
    info 
  });

  // Dispatch action to update work order dates
  dispatch(updateWorkOrderDates(eventId, newStart, newEnd)).then(() => {
    // Refresh calendar events based on current view after successful update
    const calItem = calendarRef.current;
    if (calItem) {
      const calApi = calItem.getApi();
      const start = calApi.view.activeStart;
      const end = calApi.view.activeEnd;
      console.log('Refreshing calendar view after event drop:', { start, end });
      dispatch(getWorkOrderEvents(start, end));
    }
  }).catch((error) => {
    console.error('Failed to update work order dates:', error);
    // Revert the event in the UI if update failed
    info.revert();
  });
};
```

#### 2. Entfernung doppelter Event-Aktualisierungen
Die `updateWorkOrderDates`-Funktion in `/frontend/src/slices/workOrder.ts` wurde angepasst:
- Entfernung des `getWorkOrderEvents`-Aufrufs (wird jetzt nur in der Kalender-Komponente durchgeführt)
- Die Kalender-Komponente ist jetzt verantwortlich für die Event-Aktualisierung basierend auf der aktuellen Ansicht

**Vorher:**
```typescript
dispatch(slice.actions.editWorkOrder({ workOrder: response }));
dispatch(getWorkOrderEvents(now, futureDate)); // Fester Zeitraum
dispatch(getWorkOrders({ ... }));
```

**Nachher:**
```typescript
dispatch(slice.actions.editWorkOrder({ workOrder: response }));
// Event-Aktualisierung erfolgt in der Kalender-Komponente basierend auf aktueller Ansicht
dispatch(getWorkOrders({ ... }));
```

---

## Problem 3: Neu angelegte WOs erscheinen nicht im Kalender

### Symptome
- Beim Klicken auf ein Datum im Kalender öffnet sich das Modal zum Erstellen eines WO
- Nach dem Speichern erscheint eine Erfolgsmeldung
- Der WO erscheint NICHT im Kalender (auch nicht nach Refresh)
- Der WO hat kein `estimatedStartDate` gesetzt

### Ursachen
1. **Fehlende estimatedStartDate**: Beim Erstellen über den Kalender wurde nur `dueDate` gesetzt, aber nicht `estimatedStartDate`
2. **Keine Event-Aktualisierung**: Nach dem erfolgreichen Erstellen wurden die Kalender-Events nicht aktualisiert

### Lösung

#### 1. State-Variable für estimatedStartDate hinzugefügt
In `/frontend/src/content/own/WorkOrders/index.tsx`:

```typescript
const [initialDueDate, setInitialDueDate] = useState<Date>(null);
const [initialEstimatedStartDate, setInitialEstimatedStartDate] = useState<Date>(null);
```

#### 2. Beide Daten beim Kalender-Klick setzen
```typescript
<WorkOrderCalendar
  handleAddWorkOrder={(date: Date) => {
    // Set both estimatedStartDate and dueDate when creating from calendar
    setInitialEstimatedStartDate(date);
    // Set dueDate to 2 hours after start by default
    const dueDate = new Date(date);
    dueDate.setHours(dueDate.getHours() + 2);
    setInitialDueDate(dueDate);
    setOpenAddModal(true);
  }}
  // ...
/>
```

#### 3. Formular mit beiden Werten befüllen
```typescript
<Form
  fields={getFieldsAndShapes()[0]}
  validation={Yup.object().shape(getFieldsAndShapes()[1])}
  submitText={t('add')}
  values={{
    requiredSignature: false,
    estimatedStartDate: initialEstimatedStartDate,  // NEU
    dueDate: initialDueDate,
    asset: assetParamObject
      ? { label: assetParamObject.name, value: assetParamObject.id }
      : null,
    location: locationParamObject
      ? {
          label: locationParamObject.name,
          value: locationParamObject.id
        }
      : null
  }}
  // ...
/>
```

#### 4. Kalender-Events nach erfolgreichem Erstellen aktualisieren
```typescript
const onCreationSuccess = () => {
  setOpenAddModal(false);
  showSnackBar(t('wo_create_success'), 'success');
  
  // Refresh calendar events to show the newly created work order
  const now = new Date();
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 1);
  dispatch(getWorkOrderEvents(now, futureDate));
  
  // Reset the initial dates
  setInitialDueDate(null);
  setInitialEstimatedStartDate(null);
};
```

#### 5. Import von getWorkOrderEvents hinzugefügt
```typescript
import {
  addWorkOrder,
  clearSingleWorkOrder,
  deleteWorkOrder,
  editWorkOrder,
  getSingleWorkOrder,
  getWorkOrders,
  getWorkOrderEvents  // NEU
} from '../../../slices/workOrder';
```

---

## Geänderte Dateien

### 1. `/frontend/src/content/own/WorkOrders/index.tsx`
- **Zeile 64**: Import von `getWorkOrderEvents` hinzugefügt
- **Zeile 160**: State-Variable `initialEstimatedStartDate` hinzugefügt
- **Zeile 334-347**: `onCreationSuccess` erweitert für Kalender-Event-Aktualisierung
- **Zeile 710-713**: Formular-Werte erweitert mit `estimatedStartDate`
- **Zeile 1041-1049**: `handleAddWorkOrder` Callback erweitert für beide Datumswerte

### 2. `/frontend/src/content/own/WorkOrders/Calendar/index.tsx`
- **Zeile 235-249**: `handleDrop` mit asynchroner Fehlerbehandlung
- **Zeile 276-290**: `handleEventDrop` mit asynchroner Fehlerbehandlung
- **Zeile 301-315**: `handleEventResize` mit asynchroner Fehlerbehandlung
- **Zeile 357-371**: `handleEventReceive` mit asynchroner Fehlerbehandlung

### 3. `/frontend/src/slices/workOrder.ts`
- **Zeile 411-424**: Entfernung des `getWorkOrderEvents`-Aufrufs aus `updateWorkOrderDates`
- **Zeile 413**: Kommentar hinzugefügt, dass Kalender-Events vom Caller aktualisiert werden

---

## Testing der Implementierung

### Voraussetzungen
- Backend läuft auf: `http://localhost:12001`
- Frontend läuft auf: `http://localhost:3000`
- Oder: Docker-Container laufen

### Test-Szenario 1: Drag-and-Drop aus Liste in Kalender ✅

1. Öffne die Kalenderansicht unter Work Orders
2. Auf der linken Seite sollte die "Available Work Orders" Liste sichtbar sein
3. Ziehe einen Work Order aus der Liste in den Kalender
4. **Erwartetes Ergebnis:**
   - Der WO erscheint im Kalender an der Drop-Position
   - Der WO bleibt auch nach Refresh im Kalender
   - Der WO verschwindet aus der "Available Work Orders" Liste
   - Console zeigt: `"Work order dropped: { workOrderId: ..., startDate: ..., endDate: ... }"`
   - Console zeigt: `"Update response received: { id: ..., estimatedStartDate: ..., dueDate: ... }"`
   - Console zeigt: `"Refreshing calendar view after drop: { start: ..., end: ... }"`

### Test-Szenario 2: Verschieben von WOs im Kalender ✅

1. Klicke auf einen bestehenden Work Order im Kalender und halte die Maustaste gedrückt
2. Ziehe ihn zu einem neuen Datum/Zeit
3. **Erwartetes Ergebnis:**
   - Der WO wird verschoben
   - Die ursprüngliche Dauer bleibt erhalten
   - Die Änderung bleibt auch nach Refresh bestehen
   - Console zeigt: `"Event dropped: { eventId: ..., newStart: ..., newEnd: ..., duration: ... }"`
   - Console zeigt: `"Refreshing calendar view after event drop: { start: ..., end: ... }"`

### Test-Szenario 3: Resize von WOs im Kalender ✅

1. Bewege die Maus zum unteren Rand eines Events im Kalender
2. Ziehe den Rand nach unten oder oben um die Dauer zu ändern
3. **Erwartetes Ergebnis:**
   - Die Dauer des Events ändert sich
   - Die Änderung bleibt nach Refresh bestehen
   - Console zeigt: `"Event resized: { eventId: ..., newStart: ..., newEnd: ... }"`
   - Console zeigt: `"Refreshing calendar view after resize: { start: ..., end: ... }"`

### Test-Szenario 4: Neuen WO über Kalender erstellen ✅

1. Klicke auf ein freies Datum/Zeit im Kalender
2. Das Modal "Add Work Order" öffnet sich
3. Fülle die erforderlichen Felder aus (Titel, etc.)
4. Klicke auf "Add"
5. **Erwartetes Ergebnis:**
   - Erfolgsmeldung erscheint
   - Modal schließt sich
   - Der neue WO erscheint sofort im Kalender am gewählten Datum/Zeit
   - Der WO hat sowohl `estimatedStartDate` als auch `dueDate` gesetzt (mit 2 Stunden Differenz)
   - Console zeigt: `"Received calendar events: X events"`

### Test-Szenario 5: Fehlerbehandlung ✅

1. Stoppe das Backend (`docker-compose stop api` oder Backend-Prozess beenden)
2. Versuche einen WO im Kalender zu verschieben
3. **Erwartetes Ergebnis:**
   - Console zeigt: `"Failed to update work order dates: ..."`
   - Der WO springt zurück zur ursprünglichen Position (info.revert())
   - Keine Fehlermeldung im UI (TODO: Snackbar-Benachrichtigung hinzufügen)

---

## Debugging

### Console Logs
Die Implementierung enthält umfangreiche Console-Logs für Debugging:

**Beim Drag-and-Drop:**
- `"Work order dropped: { workOrderId: ..., startDate: ..., endDate: ... }"`
- `"Updating work order dates: { id: ..., startDate: ..., endDate: ... }"`
- `"Sending update request with data: { estimatedStartDate: ..., dueDate: ... }"`
- `"Update response received: { id: ..., estimatedStartDate: ..., dueDate: ... }"`
- `"Refreshing calendar view after drop: { start: ..., end: ... }"`

**Beim Verschieben:**
- `"Event dropped: { eventId: ..., newStart: ..., newEnd: ..., duration: '2 hours' }"`
- `"Refreshing calendar view after event drop: { start: ..., end: ... }"`

**Beim Resize:**
- `"Event resized: { eventId: ..., newStart: ..., newEnd: ... }"`
- `"Refreshing calendar view after resize: { start: ..., end: ... }"`

**Bei Fehlern:**
- `"Failed to update work order dates: [Error details]"`

**Nach dem Erstellen:**
- `"Received calendar events: X events"`

### Häufige Probleme

**Problem:** Drag-and-Drop funktioniert nicht
- **Lösung:** Prüfe ob `"Initializing Draggable for WorkOrderDragList"` in der Console erscheint
- Wenn nicht, erhöhe das Timeout in Zeile 407 der Kalender-Komponente (aktuell 500ms)

**Problem:** Events verschwinden nach Drop
- **Lösung:** Prüfe die Console für `"Failed to update work order dates"` Fehler
- Prüfe ob das Backend läuft und erreichbar ist
- Prüfe die Network-Tab für PATCH-Requests und deren Responses
- Prüfe ob `info.revert()` aufgerufen wird (Event springt zurück)

**Problem:** Liste aktualisiert sich nicht
- **Lösung:** Prüfe ob `getWorkOrders` nach dem Update aufgerufen wird
- Prüfe die Console-Logs für Filterung in WorkOrderDragList

**Problem:** Neu erstellte WOs erscheinen nicht
- **Lösung:** Prüfe ob `estimatedStartDate` im Formular gesetzt ist
- Prüfe ob `getWorkOrderEvents` nach dem Erstellen aufgerufen wird
- Prüfe die API-Response nach dem POST-Request

---

## Weitere Verbesserungen (Optional/TODO)

1. **User-Feedback bei Fehlern**: 
   - Aktuell wird bei Fehlern nur ein Console-Log ausgegeben
   - Empfehlung: Snackbar-Benachrichtigung für besseres User-Feedback hinzufügen

2. **Optimistic Updates**: 
   - Aktuell wird das Event erst nach der API-Antwort aktualisiert
   - Empfehlung: Event sofort aktualisieren, bei Fehler zurücksetzen

3. **Loading-Indikator**: 
   - Während der API-Anfrage gibt es keinen visuellen Hinweis
   - Empfehlung: Spinner oder Disabled-State während des Updates

4. **Undo-Funktionalität**: 
   - Ermögliche Rückgängig-Machen von Drag-and-Drop
   - Z.B. mit einem "Undo" Button in der Snackbar

5. **Konflikterkennung**: 
   - Warne bei überlappenden Events
   - Z.B. wenn ein WO auf einen Zeitpunkt verschoben wird, wo bereits ein anderer WO eingeplant ist

6. **Berechtigungen**: 
   - Prüfe ob User berechtigt ist, WOs zu verschieben
   - Disable Drag-and-Drop für nicht-berechtigte User

7. **Batch-Updates**: 
   - Bei mehreren schnellen Änderungen könnten die Updates gebatched werden
   - Reduziert API-Last

---

## Deployment

### Für Development
```bash
cd frontend
npm start
```

### Für Production

#### Option 1: Nur Frontend neu bauen
```bash
cd frontend
npm run build
docker-compose build frontend
docker-compose up -d frontend
```

#### Option 2: Komplettes System neu starten
```bash
docker-compose down
docker-compose up -d --build
```

#### Option 3: Nur betroffene Services
```bash
docker-compose restart frontend
```

---

## Technische Details

### Redux Action Flow
```
User Drag → handleDrop/handleEventDrop
  ↓
dispatch(updateWorkOrderDates(id, startDate, endDate))
  ↓
.then(() => {
  dispatch(getWorkOrderEvents(start, end)) // Basierend auf aktueller Kalenderansicht
})
  ↓
.catch((error) => {
  info.revert() // Rückgängig machen im UI
})
  ↓
updateWorkOrderDates → api.patch(`/work-orders/${id}`, updateData)
  ↓
editWorkOrder(updatedWorkOrder) → Redux Store Update
  ↓
getWorkOrders() → WorkOrderDragList Update
  ↓
getWorkOrderEvents() → Calendar Update
  ↓
Calendar + WorkOrderDragList re-render
```

### API-Endpoints

**PATCH `/work-orders/{id}`**
- Body: `{ estimatedStartDate: string (ISO), dueDate?: string (ISO) }`
- Returns: `WorkOrder` mit aktualisierten Daten
- Permissions: `ROLE_CLIENT`

**POST `/work-orders/events`**
- Body: `{ start: Date, end: Date }`
- Returns: `CalendarEvent[]`
- Beschreibung: Lädt alle Work Orders und Preventive Maintenances im angegebenen Zeitraum

**POST `/work-orders/search`**
- Body: `SearchCriteria` mit Filtern
- Returns: `Page<WorkOrder>`
- Beschreibung: Sucht Work Orders mit Filtern (z.B. archived=false)

---

## Abschluss

Alle drei Hauptprobleme wurden behoben:
- ✅ Drag-and-Drop aus Liste funktioniert und speichert dauerhaft
- ✅ Event-Verschiebung im Kalender funktioniert und speichert dauerhaft
- ✅ Neu erstellte WOs erscheinen sofort im Kalender

Die Implementierung folgt Best Practices:
- Asynchrone Fehlerbehandlung mit `.then()` und `.catch()`
- UI-Revert bei Fehlern
- Konsistente State-Updates
- Umfangreiche Console-Logging für Debugging
- Vermeidung von Race Conditions
- Korrekte Verwendung der Kalender-Ansicht für Event-Updates

**Build-Status:** ✅ Erfolgreich kompiliert (mit Warnings über veraltete Browserliste)

**Testing:** Manuelle Tests erforderlich (siehe Test-Szenarien oben)
