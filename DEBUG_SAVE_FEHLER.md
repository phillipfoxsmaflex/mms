# Debug-Anleitung: Save-Fehler beheben

## Problem
Beim Speichern der Kalender-Änderungen kommt der Fehler: "Failed to save changes. Please try again."

## Verbesserte Logging-Implementierung ✅

Ich habe umfangreiches Logging hinzugefügt, um den Fehler zu identifizieren.

### Was wurde hinzugefügt:

**1. In `index.tsx` (handleSave):**
- Logging aller Events vor dem Update
- Validierung der Event-Daten
- Detailliertes Error-Logging mit Response-Daten

**2. In `workOrder.ts` (batchUpdateWorkOrderDates):**
- Logging jedes einzelnen Updates
- Erfolgs-/Fehler-Logging pro Update
- Detaillierte API-Response-Logging

---

## Debugging-Schritte

### Schritt 1: Browser-Console öffnen

**Chrome/Firefox:**
1. Rechtsklick → "Inspect" / "Untersuchen"
2. Tab "Console" wählen
3. Filter auf "All" / "Alle" setzen

### Schritt 2: Drag-and-Drop durchführen

1. Ziehe 1-2 WOs aus der Liste in den Kalender
2. Klicke "Save Changes"

### Schritt 3: Console-Logs analysieren

**Erwartete Logs (bei Erfolg):**
```
Saving all calendar changes...
Found X events in calendar
Event 0: { id: "123", title: "...", start: Date, end: Date, allDay: false }
Event 1: { id: "456", title: "...", start: Date, end: Date, allDay: false }
Batch update prepared: [{...}]
Number of valid updates: X
Sending batch update to backend...
Batch updating work order dates: X work orders
Updates to send: [...]
Preparing update 1/X for WO 123
Sending X update requests...
✓ Update 1 successful for WO 123
✓ Update 2 successful for WO 456
All updates completed successfully, received X responses
Updating Redux store for WO 123
Updating Redux store for WO 456
Refreshing work orders list...
Batch update fully completed
Reloading calendar events...
All changes saved successfully
```

**Bei Fehler suchen nach:**
```
✗ Update 1 failed for WO 123: [Error-Details]
Failed to save changes: [Error]
Error details: { message: "...", response: {...}, status: 400/500 }
```

---

## Häufige Fehlerursachen & Lösungen

### 1. Ungültige Event-IDs

**Symptom:**
```
Skipping event with invalid ID: undefined
Number of valid updates: 0
Error: No valid events to update
```

**Ursache:** Events aus der DragList haben keine numerische ID

**Lösung:**
- Prüfe in der Console welche `id` die Events haben
- Events sollten numerische IDs haben (z.B. "123")
- Bei String-IDs wie "wo-123" muss die Draggable-Config angepasst werden

### 2. Fehlende End-Zeiten

**Symptom:**
```
Event 0: { id: "123", start: Date, end: null, allDay: true }
```

**Ursache:** AllDay-Events in Monatsansicht haben keine End-Zeit

**Lösung:** Bereits implementiert! Der Code berechnet automatisch:
```typescript
if (!end) {
  end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // +2 Stunden
}
```

### 3. Backend-Validierungsfehler

**Symptom:**
```
✗ Update 1 failed for WO 123: { message: "Validation failed", status: 400 }
```

**Mögliche Ursachen:**
- estimatedStartDate muss vor dueDate sein
- Datum ist in der Vergangenheit (falls Backend das prüft)
- Falsches Datumsformat

**Lösung:**
Prüfe in der Console das "Updates to send" JSON:
```json
{
  "id": 123,
  "estimatedStartDate": "2026-01-08T10:00:00.000Z",
  "dueDate": "2026-01-08T12:00:00.000Z"
}
```

**Validiere:**
- ✓ IDs sind Zahlen
- ✓ Datumsformat ist ISO-String
- ✓ dueDate ist nach estimatedStartDate
- ✓ Beide Zeiten sind gültig

### 4. Backend ist nicht erreichbar

**Symptom:**
```
Failed to batch update: Network Error
Error details: { message: "Network Error", response: undefined }
```

**Lösung:**
- Prüfe ob Backend läuft: `docker-compose ps`
- Prüfe Backend-Logs: `docker-compose logs -f api`
- Prüfe URL: sollte `http://localhost:12001` sein

### 5. Authentication-Fehler

**Symptom:**
```
✗ Update 1 failed: { status: 401, message: "Unauthorized" }
```

**Lösung:**
- Session abgelaufen → Neu einloggen
- Token ungültig → Browser-Cache leeren

---

## Network-Tab prüfen

**Chrome/Firefox DevTools → Network Tab:**

1. Filtere nach "work-orders"
2. Suche nach PATCH-Requests
3. Klicke auf fehlgeschlagene Requests (rot)
4. Prüfe:
   - **Request URL:** Sollte `http://localhost:12001/api/work-orders/{id}` sein
   - **Request Method:** PATCH
   - **Status Code:** Sollte 200 sein, bei Fehler 400/500
   - **Request Payload:** JSON mit estimatedStartDate und dueDate
   - **Response:** Error-Message vom Backend

**Beispiel fehlerhafter Request:**
```
URL: http://localhost:12001/api/work-orders/123
Method: PATCH
Status: 400 Bad Request
Response:
{
  "error": "estimatedStartDate must be before dueDate",
  "field": "estimatedStartDate"
}
```

---

## Backend-Logs prüfen

```bash
# Backend-Logs live anzeigen
docker-compose logs -f api

# Nach Fehler suchen
docker-compose logs api | grep -i error

# Letzte 100 Zeilen
docker-compose logs api --tail=100
```

**Suche nach:**
- PATCH /api/work-orders/{id}
- Error-Messages
- Stack-Traces
- Validation-Errors

---

## Schnelle Fixes

### Fix 1: Nur Wochenansicht verwenden (Workaround)

Wenn Monatsansicht Probleme macht:
- Nur Wochenansicht (timeGridWeek) verwenden
- Dort funktioniert Drag-and-Drop besser
- AllDay-Events vermeiden

### Fix 2: Start-Zeit für AllDay-Events setzen

Falls AllDay-Events Probleme machen, ändere in der Draggable-Config:
```typescript
// In index.tsx, Zeile ~435
eventData: function(eventEl) {
  return {
    id: workOrderId,
    title: title,
    duration: '02:00',
    create: true,
    allDay: false  // ← Erzwinge timed events
  };
}
```

### Fix 3: Backend-Validierung deaktivieren (temporär)

Falls Backend zu strikt ist:
- Prüfe WorkOrderPatchDTO Validierungsregeln
- Temporär Validierung lockern für Tests
- Dann wieder einschalten

---

## Test-Szenario

**Minimales Test-Szenario:**

1. **Setup:**
   - Erstelle 1 WO ohne dueDate (in der Drag-Liste)
   - Öffne Wochenansicht (timeGridWeek)

2. **Action:**
   - Ziehe den WO auf Montag 10:00 Uhr
   - Console → Prüfe: `"Work order received locally"`
   - Klicke "Save Changes"

3. **Erwartung (Console):**
   ```
   Saving all calendar changes...
   Found 1 events in calendar
   Event 0: { id: "X", title: "...", start: Mon, end: Mon, allDay: false }
   Batch update prepared: [{id: X, estimatedStartDate: "...", dueDate: "..."}]
   Sending 1 update requests...
   ✓ Update 1 successful for WO X
   All changes saved successfully
   ```

4. **Bei Fehler:**
   - Screenshot der Console machen
   - Network-Tab → Screenshot des fehlgeschlagenen Request
   - Backend-Logs kopieren

---

## Monatsansicht-Problem (Optional)

**Problem:** WOs können nicht in Monatsansicht gezogen werden

**Ursache:** Monatsansicht erstellt allDay-Events, die vom Backend möglicherweise nicht akzeptiert werden

**Workaround:** Nicht implementiert (laut User "nicht schlimm")

**Vollständige Lösung (Optional):**

Ändere Draggable-Config um allDay-Events zu vermeiden:

```typescript
// In index.tsx, Draggable Setup
new Draggable(externalContainer, {
  itemSelector: '[data-work-order-id]',
  eventData: function(eventEl) {
    const workOrderId = eventEl.getAttribute('data-work-order-id');
    const title = eventEl.querySelector('.MuiListItemText-primary')?.textContent || 'Work Order';
    
    return {
      id: workOrderId,
      title: title,
      duration: '02:00',
      create: true,
      allDay: false  // ← Erzwinge timed events auch in Monatsansicht
    };
  }
});
```

Aber auch dann müssen allDay-Drops speziell behandelt werden im `handleEventReceive`.

---

## Zusammenfassung

**Was du jetzt tun solltest:**

1. ✅ **Build deployen:**
   ```bash
   cd /Users/phillipfox/mms
   docker-compose build frontend
   docker-compose up -d frontend
   ```

2. ✅ **Kalender öffnen und testen:**
   - Browser-Console öffnen
   - WO aus Liste in Kalender ziehen (Wochenansicht!)
   - "Save Changes" klicken

3. ✅ **Console-Logs analysieren:**
   - Screenshot machen von allen Logs
   - Besonders wichtig: "Error details" und "✗ Update failed"

4. ✅ **Mir Feedback geben:**
   - Kopiere die relevanten Console-Logs
   - Screenshot vom Network-Tab (fehlgeschlagene Requests)
   - Backend-Logs falls verfügbar

**Dann können wir den genauen Fehler identifizieren und beheben! 🔧**
