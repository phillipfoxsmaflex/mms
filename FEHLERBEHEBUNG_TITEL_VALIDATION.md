# Fehlerbehebung: Validation Error beim Speichern von Work Orders im Kalender

## Problem
Beim Speichern von Work Orders aus dem Kalender (Drag & Drop oder Verschieben) trat folgender Fehler auf:

```
Validation failed for classes [com.grash.model.WorkOrder] during update time for groups [javax.validation.groups.Default, ]
List of constraint violations:
[\n\tConstraintViolationImpl{interpolatedMessage='must not be null', propertyPath=title, rootBeanClass=class com.grash.model.WorkOrder, messageTemplate='{javax.validation.constraints.NotNull.message}'}]\n
```

**HTTP Status**: 500 Internal Server Error

## Ursache
Das Backend-Modell `WorkOrderBase` definiert das Feld `title` als `@NotNull`:

```java
@NotNull
private String title;
```

Beim Batch-Update der Work Orders im Kalender wurde das `title`-Feld zwar im Frontend vorbereitet, aber nicht an das Backend gesendet.

### Betroffene Dateien
1. **Frontend**: `frontend/src/slices/workOrder.ts`
   - In der Funktion `batchUpdateWorkOrderDates` wurde nur `estimatedStartDate` und `dueDate` gesendet
   - Das `title`-Feld fehlte im PATCH Request

2. **Frontend**: `frontend/src/content/own/WorkOrders/Calendar/index.tsx`
   - Das `title`-Feld wurde korrekt aus den Events extrahiert und vorbereitet
   - Die vorbereiteten Daten wurden aber nicht vollständig weitergeleitet

## Lösung

### Geänderte Datei: `frontend/src/slices/workOrder.ts`

**Vor der Änderung:**
```typescript
export const batchUpdateWorkOrderDates =
  (updates: Array<{ id: number; estimatedStartDate: string; dueDate: string }>): AppThunk =>
  async (dispatch) => {
    // ...
    return api.patch<WorkOrder>(`${basePath}/${update.id}`, {
      estimatedStartDate: update.estimatedStartDate,
      dueDate: update.dueDate
    });
    // ...
  };
```

**Nach der Änderung:**
```typescript
export const batchUpdateWorkOrderDates =
  (updates: Array<{ id: number; title: string; estimatedStartDate: string; dueDate: string }>): AppThunk =>
  async (dispatch) => {
    // ...
    return api.patch<WorkOrder>(`${basePath}/${update.id}`, {
      title: update.title,
      estimatedStartDate: update.estimatedStartDate,
      dueDate: update.dueDate
    });
    // ...
  };
```

### Änderungen im Detail

1. **TypeScript Interface aktualisiert**:
   - Der Parameter `updates` wurde erweitert um das Feld `title: string`

2. **PATCH Request erweitert**:
   - Das `title`-Feld wird nun im Request-Body mitgesendet
   - Das erfüllt die Backend-Validierung `@NotNull` für das `title`-Feld

## Testen

1. Anwendung neu kompilieren:
   ```bash
   cd frontend
   npm run build
   ```

2. Anwendung starten

3. Testen:
   - Work Order im Kalender verschieben (Drag & Drop)
   - Work Order von der Liste in den Kalender ziehen
   - "Save Changes" klicken
   - Überprüfen, dass keine Validierungsfehler mehr auftreten

## Ergebnis
✅ Work Orders können nun erfolgreich im Kalender gespeichert werden
✅ Das `title`-Feld wird korrekt an das Backend übermittelt
✅ Die Backend-Validierung wird erfüllt
✅ Keine HTTP 500 Fehler mehr

## Datum
2026-01-07
