# Fehlerbehebung: 2 Stunden Zeitverschiebung nach dem Speichern im Kalender

## Problem
Nach dem Verschieben und Speichern von Work Orders im Kalender wurden diese 2 Stunden später angezeigt als ursprünglich platziert.

**Beispiel:**
- Benutzer platziert Work Order um **14:00 Uhr** im Kalender
- Nach dem Speichern und Neuladen wird sie um **16:00 Uhr** angezeigt

## Ursache: Zeitzonen-Konvertierung

### Das Problem mit `toISOString()`

JavaScript's `Date.toISOString()` Methode konvertiert **immer** von lokaler Zeit zu UTC:

```javascript
// Deutschland: UTC+1 (Winterzeit) oder UTC+2 (Sommerzeit)
const localDate = new Date('2026-01-07T14:00:00'); // 14:00 lokale Zeit
console.log(localDate.toISOString()); 
// → "2026-01-07T13:00:00.000Z" (bei UTC+1)
// → "2026-01-07T12:00:00.000Z" (bei UTC+2)
```

### Was passierte:

1. **Benutzer platziert Event:** 14:00 Uhr (lokale Zeit, Deutschland)
2. **FullCalendar gibt zurück:** JavaScript `Date` Objekt mit 14:00 Uhr lokal
3. **Frontend sendet:** `start.toISOString()` → **12:00 UTC** (bei UTC+2)
4. **Backend speichert:** 12:00 (ohne Zeitzonen-Info)
5. **Backend gibt zurück:** "2026-01-07T12:00:00" (ohne 'Z')
6. **Frontend interpretiert:** Als lokale Zeit → **12:00 lokale Zeit**
7. **Oder:** Als UTC → wird zu 14:00 lokal konvertiert (richtig!)

Das Problem war, dass durch die Verwendung von `toISOString()` die Zeit zu UTC konvertiert wurde, das Backend sie aber möglicherweise als lokale Zeit behandelte, was zu einer doppelten Konvertierung führte.

## Lösung

### Neue Hilfsfunktion: `formatDateForBackend`

Statt `toISOString()` zu verwenden, erstellen wir eine Funktion, die die **lokalen Zeit-Werte beibehält**:

```typescript
const formatDateForBackend = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  // ISO Format OHNE Zeitzone-Konvertierung
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};
```

### Vorher vs. Nachher

**Vorher:**
```typescript
return {
  id: id,
  title: title,
  estimatedStartDate: start.toISOString(),  // ❌ Konvertiert zu UTC
  dueDate: end.toISOString()                // ❌ Konvertiert zu UTC
};
```

**Nachher:**
```typescript
return {
  id: id,
  title: title,
  estimatedStartDate: formatDateForBackend(start),  // ✅ Behält lokale Zeit
  dueDate: formatDateForBackend(end)                // ✅ Behält lokale Zeit
};
```

### Beispiel-Ausgabe

**Mit `toISOString()` (FALSCH):**
```
Lokale Zeit: 14:00:00
Gesendet: 2026-01-07T12:00:00.000Z (UTC)
Backend speichert: 12:00
Angezeigt: 12:00 (2 Stunden Verschiebung!)
```

**Mit `formatDateForBackend()` (RICHTIG):**
```
Lokale Zeit: 14:00:00
Gesendet: 2026-01-07T14:00:00 (ohne Zeitzone)
Backend speichert: 14:00
Angezeigt: 14:00 (korrekt!)
```

## Debug-Logging

Zusätzliche Logging-Ausgaben wurden hinzugefügt:

```typescript
console.log('Event times before formatting:', {
  id,
  startLocal: start.toString(),
  startISO: start.toISOString(),
  endLocal: end.toString(),
  endISO: end.toISOString()
});
```

Dies hilft beim Debuggen von Zeitzonenproblemen in der Browser-Konsole.

## Testen

### Test 1: Neue Work Order platzieren
1. Öffnen Sie den Kalender
2. Ziehen Sie eine Work Order auf **14:00 Uhr**
3. Klicken Sie auf "Save Changes"
4. **Erwartetes Ergebnis:** Work Order bleibt bei **14:00 Uhr** ✅

### Test 2: Bestehende Work Order verschieben
1. Verschieben Sie eine Work Order auf **10:30 Uhr**
2. Klicken Sie auf "Save Changes"
3. **Erwartetes Ergebnis:** Work Order bleibt bei **10:30 Uhr** ✅

### Test 3: Nach Seiten-Reload
1. Platzieren Sie Work Order um **16:00 Uhr**
2. Speichern Sie
3. Laden Sie die Seite neu (F5)
4. **Erwartetes Ergebnis:** Work Order ist immer noch bei **16:00 Uhr** ✅

## Browser-Konsole prüfen

Nach dem Speichern sollten Sie in der Browser-Konsole sehen:

```
Event times before formatting: {
  id: 123,
  startLocal: "Tue Jan 07 2026 14:00:00 GMT+0100 (MEZ)",
  startISO: "2026-01-07T13:00:00.000Z",
  endLocal: "Tue Jan 07 2026 16:00:00 GMT+0100 (MEZ)",
  endISO: "2026-01-07T15:00:00.000Z"
}

Batch update prepared: [
  {
    id: 123,
    title: "Work Order Title",
    estimatedStartDate: "2026-01-07T14:00:00",  // ← Lokale Zeit erhalten!
    dueDate: "2026-01-07T16:00:00"              // ← Lokale Zeit erhalten!
  }
]
```

## Betroffene Dateien

### `frontend/src/content/own/WorkOrders/Calendar/index.tsx`

1. **Hinzugefügt:** `formatDateForBackend()` Hilfsfunktion
2. **Geändert:** Verwendung von `formatDateForBackend()` statt `toISOString()`
3. **Hinzugefügt:** Debug-Logging für Zeitwerte

## Technische Hintergründe

### JavaScript Date und Zeitzonen

JavaScript `Date` Objekte speichern intern **immer UTC**:
- `new Date()` erstellt ein Date mit der aktuellen Zeit in UTC
- Getter wie `getHours()` geben lokale Zeit zurück
- `toISOString()` gibt UTC zurück
- `toString()` gibt lokale Zeit mit Zeitzone zurück

### Best Practices

**Option 1: Arbeiten mit lokaler Zeit (unsere Lösung)**
- Frontend und Backend arbeiten mit lokaler Zeit OHNE Zeitzonen-Info
- Einfach, aber nicht ideal für internationale Anwendungen

**Option 2: Konsequent UTC verwenden**
- Frontend sendet immer UTC (mit 'Z')
- Backend speichert UTC
- Frontend konvertiert beim Anzeigen zu lokaler Zeit
- FullCalendar mit `timeZone: 'UTC'` konfigurieren

**Option 3: Explizite Zeitzonen**
- Jedes Event hat eine Zeitzone (z.B. 'Europe/Berlin')
- Komplexer, aber am flexibelsten

Für diese Anwendung ist **Option 1** ausreichend, da alle Benutzer vermutlich in der gleichen Zeitzone arbeiten.

## Alternative: FullCalendar timeZone Einstellung

Falls das Problem weiterhin besteht, kann man FullCalendar explizit konfigurieren:

```typescript
<FullCalendar
  timeZone="local"  // oder "UTC"
  // ... andere Props
/>
```

## Datum
2026-01-07

## Status
✅ Behoben - Bitte testen und Feedback geben
