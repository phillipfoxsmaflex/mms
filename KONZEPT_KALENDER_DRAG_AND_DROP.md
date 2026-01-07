# Konzept für Drag-and-Drop und Verschiebung von Arbeitsaufträgen im Kalender

## Problemstellung
Aktuell können in der mms App Arbeitsaufträge nur durch Klick auf den Kalender erstellt werden. Bereits bestehende Arbeitsaufträge erscheinen nicht in der Kalenderansicht und können nicht per Drag-and-Drop platziert oder verschoben werden.

## Zielsetzung
1. Bestehende Arbeitsaufträge sollen in der Kalenderansicht sichtbar sein
2. Arbeitsaufträge sollen per Drag-and-Drop aus einer Liste in den Kalender gezogen werden können
3. Bereits platzierte Arbeitsaufträge sollen per Klick verschoben werden können
4. Änderungen sollen persistent gespeichert werden

## Analyse der aktuellen Architektur

### Aktuelle Komponenten
1. **FullCalendar Integration**: Die App nutzt `@fullcalendar/react` mit Plugins für DayGrid, TimeGrid, Interaction und List
2. **Datenmodelle**: 
   - `WorkOrder` und `WorkOrderBase` für Arbeitsaufträge
   - `CalendarEvent` für Kalenderereignisse
3. **State Management**: Redux wird für Kalender- und Arbeitsauftragsdaten genutzt
4. **API Integration**: Es gibt bereits eine API-Schnittstelle für Kalenderereignisse

### Aktuelle Funktionalität
- Kalender zeigt Ereignisse an, die aus Arbeitsaufträgen generiert werden
- Neue Arbeitsaufträge können durch Klick auf ein Datum erstellt werden
- Arbeitsaufträge haben Start- und Enddaten, Prioritäten und andere Metadaten

## Technische Umsetzung

### 1. Sichtbarkeit bestehender Arbeitsaufträge
**Problem**: Arbeitsaufträge erscheinen nicht in der Kalenderansicht

**Lösung**: 
- Die Funktion `getWorkOrderEvents` lädt bereits Kalenderereignisse, aber diese werden nicht korrekt angezeigt
- Wir müssen sicherstellen, dass die `events`-Eigenschaft des Kalenders korrekt mit den Arbeitsauftragsdaten gefüllt wird
- Die `getEventFromWO`-Funktion muss überprüft und ggf. erweitert werden

### 2. Drag-and-Drop Funktionalität
**Problem**: Arbeitsaufträge können nicht per Drag-and-Drop in den Kalender gezogen werden

**Lösung**: 
- **Quellliste für Drag-and-Drop**: Eine separate Liste mit verfügbaren Arbeitsaufträgen erstellen
- **FullCalendar Konfiguration**: 
  - `droppable: true` ist bereits gesetzt
  - `drop`-Callback implementieren
  - `eventReceive`-Callback für das Empfangen von Events
- **Datenfluss**: 
  - Arbeitsaufträge aus der Liste → Kalenderereignisse
  - Bei Drop: Arbeitsauftragsdaten mit neuem Datum aktualisieren

### 3. Verschiebung von Arbeitsaufträgen per Klick
**Problem**: Arbeitsaufträge können nicht per Klick verschoben werden

**Lösung**: 
- **Event Resizing**: FullCalendar unterstützt bereits `eventResizableFromStart` und `eventResizableFromEnd`
- **Event Drag-and-Drop**: FullCalendar unterstützt bereits `editable: true` und `eventStartEditable`, `eventDurationEditable`
- **Callbacks implementieren**:
  - `eventDrop`: Wird aufgerufen, wenn ein Event verschoben wird
  - `eventResize`: Wird aufgerufen, wenn ein Event in der Größe geändert wird
- **API Integration**: Änderungen an das Backend senden

### 4. Backend-Integration
**Problem**: Änderungen müssen persistent gespeichert werden

**Lösung**: 
- **API Endpunkte erweitern/nutzen**:
  - `PATCH /work-orders/{id}` für Updates
  - `POST /work-orders/{id}/change-dates` für Datumänderungen
- **Redux Actions erweitern**:
  - `updateWorkOrderDates` Action erstellen
  - API-Aufrufe in Thunks integrieren

## Implementierungsschritte

### Phase 1: Vorbereitung und Datenanalyse
1. **Datenstruktur analysieren**: Verstehen, wie Arbeitsaufträge und Kalenderereignisse miteinander verbunden sind
2. **API Endpunkte prüfen**: Bestehende Endpunkte für Arbeitsauftrags-Updates identifizieren
3. **UI-Komponenten identifizieren**: Wo soll die Drag-and-Drop-Liste platziert werden?

### Phase 2: Drag-and-Drop Implementierung
1. **Arbeitsauftragsliste erstellen**:
   - Komponente für verfügbare Arbeitsaufträge
   - Filterfunktion für nicht platzierte Aufträge
   - Drag-and-Drop-Fähigkeit mit `draggable: true`

2. **FullCalendar erweitern**:
   - `drop`-Callback implementieren
   - Event-Erstellung bei Drop
   - Arbeitsauftragsdaten mit neuem Datum aktualisieren

### Phase 3: Event-Verschiebung implementieren
1. **FullCalendar Konfiguration**:
   - `editable: true` setzen
   - `eventDrop` und `eventResize` Callbacks implementieren
   - Benutzerfeedback bei Änderungen

2. **Backend-Integration**:
   - API-Aufrufe für Datumänderungen
   - Fehlerbehandlung und Rollback
   - Optimistische UI-Updates

### Phase 4: UI/UX Verbesserungen
1. **Visuelles Feedback**:
   - Drag-and-Drop-Indikatoren
   - Ladeanimationen
   - Erfolg/Misserfolg-Meldungen

2. **Zugänglichkeit**:
   - Tastatursteuerung
   - Screenreader-Unterstützung
   - Kontrast und Lesbarkeit

## Technische Details

### FullCalendar Konfiguration
```typescript
<FullCalendar
  // ... bestehende Props
  editable={true}
  droppable={true}
  eventStartEditable={true}
  eventDurationEditable={true}
  eventResizableFromStart={true}
  eventDrop={handleEventDrop}
  eventResize={handleEventResize}
  drop={handleDrop}
  eventReceive={handleEventReceive}
/>
```

### Drag-and-Drop Callbacks
```typescript
const handleDrop = (info: any) => {
  // Arbeitsauftragsdaten extrahieren
  const workOrderId = info.draggedEl.dataset.workOrderId;
  const newDate = info.date;
  
  // API-Aufruf zum Aktualisieren des Arbeitsauftrags
  dispatch(updateWorkOrderDates(workOrderId, newDate));
  
  // Event im Kalender erstellen
  // ...
};

const handleEventDrop = (info: any) => {
  // Event-Daten extrahieren
  const eventId = info.event.id;
  const newStart = info.event.start;
  const newEnd = info.event.end;
  
  // API-Aufruf zum Aktualisieren
  dispatch(updateWorkOrderDates(eventId, newStart, newEnd));
};
```

### Redux Actions
```typescript
export const updateWorkOrderDates =
  (id: number, startDate: Date, endDate?: Date): AppThunk =>
  async (dispatch) => {
    try {
      // Optimistisches Update
      const updateData = {
        estimatedStartDate: startDate.toISOString(),
        ...(endDate && { dueDate: endDate.toISOString() })
      };
      
      const response = await api.patch<WorkOrder>(
        `${basePath}/${id}`,
        updateData
      );
      
      dispatch(slice.actions.editWorkOrder({ workOrder: response }));
      dispatch(getWorkOrderEvents(new Date(), new Date()));
    } catch (error) {
      // Fehlerbehandlung
      console.error('Failed to update work order dates:', error);
      // Rollback oder Benachrichtigung
    }
  };
```

## Risiken und Herausforderungen

1. **Datenkonsistenz**: Sicherstellen, dass Kalenderereignisse und Arbeitsauftragsdaten synchron bleiben
2. **Performance**: Bei vielen Arbeitsaufträgen könnte die Drag-and-Drop-Funktionalität langsam werden
3. **Konflikte**: Mehrere Benutzer könnten gleichzeitig denselben Arbeitsauftrag bearbeiten
4. **Berechtigungen**: Nicht alle Benutzer sollten Arbeitsaufträge verschieben dürfen

## Erfolgskriterien

1. ✅ Arbeitsaufträge erscheinen in der Kalenderansicht
2. ✅ Arbeitsaufträge können per Drag-and-Drop aus einer Liste in den Kalender gezogen werden
3. ✅ Arbeitsaufträge können per Klick im Kalender verschoben werden
4. ✅ Änderungen werden persistent im Backend gespeichert
5. ✅ Benutzer erhalten visuelles Feedback über den Erfolg/Misserfolg von Operationen
6. ✅ Die Anwendung bleibt performant auch bei vielen Arbeitsaufträgen

## Nächste Schritte

1. **Implementierung vorbereiten**: Entwicklungs- und Testumgebung einrichten
2. **Phase 1 starten**: Datenanalyse und API-Prüfung
3. **UI-Komponenten entwerfen**: Mockups für die Drag-and-Drop-Liste erstellen
4. **Backend-API prüfen**: Bestehende Endpunkte testen und ggf. erweitern

Dieses Konzept dient als Grundlage für die schrittweise Umsetzung der Drag-and-Drop-Funktionalität und Event-Verschiebung im mms Kalender.