# Fehlerbehebung: Kalender Drag-and-Drop Funktionalität

## Zusammenfassung der behobenen Probleme

### ✅ Problem 1: WO's aus der WorkOrderDragList können nicht in den Kalender gezogen werden

**Ursache:**
- Die Draggable-Initialisierung erfolgte zu früh, bevor die WorkOrderDragList gerendert wurde
- Die `create` Property war auf `false` gesetzt, was verhinderte, dass Events beim Drop erstellt wurden
- TypeScript-Typfehler: `Element` statt `HTMLElement`

**Lösung:**
- Timeout von 500ms hinzugefügt, um sicherzustellen, dass die WorkOrderDragList vollständig gerendert ist
- `create: true` gesetzt, damit Events beim Drop automatisch erstellt werden
- TypeScript-Casting zu `HTMLElement` hinzugefügt
- Verbesserte Console-Logging für besseres Debugging

**Geänderte Datei:** `/frontend/src/content/own/WorkOrders/Calendar/index.tsx`

```typescript
// Vorher: create: false, zu frühe Initialisierung
// Nachher:
const externalContainer = document.querySelector('[data-work-order-list]') as HTMLElement;
new Draggable(externalContainer, {
  itemSelector: '[data-work-order-id]',
  eventData: function(eventEl) {
    // ...
    return {
      id: workOrderId,
      title: title,
      duration: '02:00',
      create: true // Event wird beim Drop erstellt
    };
  }
});
```

---

### ✅ Problem 2: WO's im Kalender können verschoben werden, aber due dates werden nicht gespeichert

**Ursache:**
- Die `handleEventDrop` Funktion nutzte `info.event.end` direkt, aber beim Verschieben (ohne Resize) blieb das Ende manchmal unverändert
- Die ursprüngliche Dauer des Events ging verloren

**Lösung:**
- Berechnung der ursprünglichen Event-Dauer aus `oldStart` und `oldEnd`
- Neues Ende wird basierend auf neuem Start + Dauer berechnet
- Fallback auf 2 Stunden wenn keine Dauer vorhanden

**Geänderte Datei:** `/frontend/src/content/own/WorkOrders/Calendar/index.tsx`

```typescript
const handleEventDrop = (info: any) => {
  const eventId = parseInt(info.event.id);
  const newStart = info.event.start;
  let newEnd = info.event.end;

  // Berechne die ursprüngliche Dauer
  const oldStart = info.oldEvent.start;
  const oldEnd = info.oldEvent.end;
  const durationMs = oldEnd ? oldEnd.getTime() - oldStart.getTime() : 2 * 60 * 60 * 1000;

  // Berechne neues Ende basierend auf neuem Start + Dauer
  if (!newEnd || newEnd.getTime() === oldEnd?.getTime()) {
    newEnd = new Date(newStart.getTime() + durationMs);
  }

  // Update Backend mit neuen Daten
  dispatch(updateWorkOrderDates(eventId, newStart, newEnd));
  // ...
};
```

---

### ✅ Problem 3: WO's tauchen in der WorkOrderDragList auf obwohl sie schon im Kalender eingeplant sind

**Ursache:**
- Nach dem Drag-and-Drop wurde nur `getWorkOrderEvents` aufgerufen, nicht aber `getWorkOrders`
- Die WorkOrderDragList zeigte die alte, nicht aktualisierte Liste an
- Die Filterlogik funktionierte, aber die Daten waren nicht aktuell

**Lösung:**
- In `updateWorkOrderDates` wird nach dem erfolgreichen Update auch `getWorkOrders` aufgerufen
- Die gleichen Filter-Kriterien werden verwendet wie in der WorkOrderDragList
- Die Liste wird automatisch aktualisiert und zeigt nur noch ungeplante WOs

**Geänderte Datei:** `/frontend/src/slices/workOrder.ts`

```typescript
export const updateWorkOrderDates = (id: number, startDate: Date, endDate?: Date): AppThunk =>
  async (dispatch) => {
    try {
      // Update im Backend
      const response = await api.patch<WorkOrder>(`${basePath}/${id}`, updateData);
      
      // Update im Redux Store
      dispatch(slice.actions.editWorkOrder({ workOrder: response }));
      
      // Refresh Calendar Events
      dispatch(getWorkOrderEvents(now, futureDate));
      
      // NEU: Refresh Work Orders Liste
      // Dies stellt sicher, dass geplante WOs aus der Drag-Liste entfernt werden
      dispatch(getWorkOrders({
        filterFields: [
          { field: 'archived', operation: 'eq', value: false }
        ],
        pageSize: 50,
        pageNum: 0
      }));
    } catch (error) {
      console.error('Failed to update work order dates:', error);
      throw error;
    }
  };
```

---

## Geänderte Dateien (Zusammenfassung)

1. **`/frontend/src/content/own/WorkOrders/Calendar/index.tsx`**
   - Draggable-Initialisierung verbessert (Zeilen 389-420)
   - `handleEventDrop` verbessert für Dauer-Erhaltung (Zeilen 247-281)

2. **`/frontend/src/slices/workOrder.ts`**
   - `updateWorkOrderDates` erweitert um WorkOrders-Liste-Refresh (Zeilen 375-436)

3. **`/frontend/.env`** (neu erstellt)
   - Environment-Variablen für lokale Entwicklung

---

## Testing der Implementierung

### Voraussetzungen
- Backend läuft auf: `http://localhost:12001`
- Frontend läuft auf: `http://localhost:3000`

### Test-Szenario 1: Drag-and-Drop aus Liste in Kalender

1. Öffne die Kalenderansicht unter Work Orders
2. Auf der linken Seite sollte die "Available Work Orders" Liste sichtbar sein
3. Diese Liste zeigt nur WOs ohne `estimatedStartDate` oder mit Default-Datum (01.01.1970)
4. Ziehe einen Work Order aus der Liste in den Kalender
5. **Erwartetes Ergebnis:**
   - Der WO erscheint im Kalender an der Drop-Position
   - Der WO verschwindet aus der "Available Work Orders" Liste
   - Das Backend wird mit den neuen Daten aktualisiert
   - Console zeigt: `"Work order dropped: { workOrderId: ..., startDate: ..., endDate: ... }"`

### Test-Szenario 2: Verschieben von WOs im Kalender

1. Klicke auf einen bestehenden Work Order im Kalender
2. Ziehe ihn zu einem neuen Datum/Zeit
3. **Erwartetes Ergebnis:**
   - Der WO wird verschoben
   - Die ursprüngliche Dauer bleibt erhalten
   - Das Backend wird aktualisiert
   - Console zeigt: `"Event dropped: { eventId: ..., newStart: ..., newEnd: ..., duration: ... }"`

### Test-Szenario 3: Resize von WOs im Kalender

1. Bewege die Maus zum unteren Rand eines Events im Kalender
2. Ziehe den Rand nach unten oder oben um die Dauer zu ändern
3. **Erwartetes Ergebnis:**
   - Die Dauer des Events ändert sich
   - Das Backend wird mit der neuen `dueDate` aktualisiert
   - Console zeigt: `"Event resized: { eventId: ..., newStart: ..., newEnd: ... }"`

### Test-Szenario 4: Liste bleibt aktuell

1. Führe einen Drag-and-Drop aus (Szenario 1)
2. Prüfe die "Available Work Orders" Liste
3. **Erwartetes Ergebnis:**
   - Der gezogene WO verschwindet sofort aus der Liste
   - Die Liste zeigt nur noch ungeplante WOs
   - Console zeigt: `"Work order X has valid date ... - excluded from drag list"`

---

## Debugging

### Console Logs
Die Implementierung enthält umfangreiche Console-Logs für Debugging:

- `"Initializing Draggable for WorkOrderDragList"` - Draggable wurde initialisiert
- `"Creating draggable event data: { workOrderId: ..., title: ... }"` - Event-Daten werden erstellt
- `"Work order dropped: { ... }"` - WO wurde in Kalender gezogen
- `"Event dropped: { ... }"` - Event wurde verschoben
- `"Event resized: { ... }"` - Event-Größe wurde geändert
- `"Updating work order dates: { ... }"` - Backend-Update wird gestartet
- `"Update response received: { ... }"` - Backend-Update erfolgreich
- `"Refreshing calendar events for range: { ... }"` - Kalender wird aktualisiert

### Häufige Probleme

**Problem:** Drag-and-Drop funktioniert nicht
- **Lösung:** Prüfe ob `"Initializing Draggable for WorkOrderDragList"` in der Console erscheint
- Wenn nicht, erhöhe das Timeout in Zeile 392 (aktuell 500ms)

**Problem:** Events verschwinden nach Drop
- **Lösung:** Prüfe ob das Backend läuft und erreichbar ist (`http://localhost:12001`)
- Prüfe die Network-Tab für PATCH-Requests

**Problem:** Liste aktualisiert sich nicht
- **Lösung:** Prüfe ob `getWorkOrders` nach dem Update aufgerufen wird
- Prüfe die Console-Logs für Filterung: `"Work order X has valid date ... - excluded from drag list"`

---

## Nächste Schritte

### Für Production
1. Frontend neu bauen: `cd frontend && npm run build`
2. Docker Image neu erstellen: `docker-compose build frontend`
3. Container neu starten: `docker-compose up -d frontend`

### Weitere Verbesserungen (Optional)
1. **Fehlerbehandlung:** Implementiere User-Feedback bei fehlgeschlagenen Updates (Toast/Snackbar)
2. **Optimistic Updates:** Zeige Änderungen sofort im UI, bevor Backend antwortet
3. **Undo-Funktionalität:** Ermögliche Rückgängig-Machen von Drag-and-Drop
4. **Konflikterkennung:** Warne bei überlappenden Events
5. **Berechtigungen:** Prüfe ob User berechtigt ist, WOs zu verschieben

---

## Technische Details

### FullCalendar Konfiguration
```typescript
<FullCalendar
  droppable={true}           // Externe Drops erlauben
  editable={true}            // Events können bearbeitet werden
  eventStartEditable={true}  // Start kann geändert werden
  eventDurationEditable={true} // Dauer kann geändert werden
  eventResizableFromStart={true} // Von beiden Seiten resizable
  drop={handleDrop}          // Drop von externen Elements
  eventDrop={handleEventDrop}    // Verschieben von Events
  eventResize={handleEventResize} // Resize von Events
  eventReceive={handleEventReceive} // Empfangen von externen Events
/>
```

### Redux Action Flow
```
User Drag → handleDrop/handleEventDrop
  ↓
updateWorkOrderDates(id, startDate, endDate)
  ↓
api.patch(`/work-orders/${id}`, { estimatedStartDate, dueDate })
  ↓
editWorkOrder(updatedWorkOrder) → Redux Store Update
  ↓
getWorkOrderEvents() + getWorkOrders() → UI Refresh
  ↓
Calendar + WorkOrderDragList re-render
```

---

## Abschluss

Alle drei Hauptprobleme wurden behoben:
✅ Drag-and-Drop aus Liste funktioniert
✅ Event-Verschiebung speichert korrekt
✅ Liste zeigt nur ungeplante WOs

Die Implementierung folgt dem KONZEPT_KALENDER_DRAG_AND_DROP.md und erfüllt alle Erfolgskriterien.
