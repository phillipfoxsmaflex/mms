# Fehlerbehebung: Drag & Drop funktioniert erst beim zweiten Anfassen

## Problem
Beim Drag & Drop von Work Orders aus der Liste in den Kalender funktionierte das Verschieben erst beim zweiten Anfassen. Beim ersten Versuch ließ sich die Work Order nicht verschieben.

## Ursache
Es gab zwei konkurrierende Drag-and-Drop-Systeme, die parallel liefen:

1. **Native HTML5 Drag-and-Drop** in `WorkOrderDragList.tsx`
   - Verwendete `draggable={true}` und `onDragStart` Handler
   
2. **FullCalendar Draggable** in `index.tsx`
   - Wurde nur einmal beim Komponenten-Mount initialisiert
   - Erkannte keine Änderungen an der Work Order Liste
   - Neu hinzugefügte oder geänderte Work Orders wurden nicht als draggable erkannt

### Spezifisches Problem
Das FullCalendar Draggable wurde in einem `useEffect` mit **leerem Dependency Array** (`[]`) initialisiert:

```typescript
useEffect(() => {
  // Initialisierung...
  new Draggable(externalContainer, { ... });
}, []); // ← Leeres Dependency Array = nur einmal beim Mount
```

Das bedeutete:
- Beim ersten Laden wurden die Work Orders erkannt
- Bei späteren Änderungen (neue WOs, Refresh, etc.) wurde das Draggable nicht neu initialisiert
- Die neuen Elemente waren nicht "draggable"
- Erst nach einem Reload oder Re-Render wurden sie erkannt

## Lösung

### 1. Entfernung des nativen HTML5 Drag & Drop (`WorkOrderDragList.tsx`)

**Entfernt:**
```typescript
const handleDragStart = (event: React.DragEvent<HTMLLIElement>, workOrder: WorkOrderBaseMiniDTO) => {
  event.dataTransfer.setData('text/plain', workOrder.id.toString());
  event.dataTransfer.setData('workOrderId', workOrder.id.toString());
  event.dataTransfer.effectAllowed = 'move';
};
```

```typescript
<ListItem
  draggable  // ← ENTFERNT
  onDragStart={(e) => handleDragStart(e, workOrder)}  // ← ENTFERNT
  data-work-order-id={workOrder.id}
  // ...
>
```

### 2. Verbesserung des FullCalendar Draggable (`index.tsx`)

**Hinzugefügt:**
- `draggableRef` zur Speicherung der Draggable-Instanz
- `workOrders` aus Redux State
- Dependency auf `workOrders.content` im useEffect

**Vor der Änderung:**
```typescript
const calendarRef = useRef<FullCalendar | null>(null);
const { calendar, loadingGet } = useSelector((state) => state.workOrders);

useEffect(() => {
  const timer = setTimeout(() => {
    new Draggable(externalContainer, { ... });
  }, 500);
  return () => clearTimeout(timer);
}, []); // ← Nur beim Mount
```

**Nach der Änderung:**
```typescript
const calendarRef = useRef<FullCalendar | null>(null);
const draggableRef = useRef<Draggable | null>(null);  // ← NEU
const { calendar, loadingGet, workOrders } = useSelector((state) => state.workOrders);  // ← workOrders hinzugefügt

useEffect(() => {
  const timer = setTimeout(() => {
    // Destroy previous instance
    if (draggableRef.current) {
      console.log('Destroying previous Draggable instance');
      draggableRef.current.destroy();
    }
    
    // Create new instance
    draggableRef.current = new Draggable(externalContainer, { ... });
    console.log('Draggable initialized successfully');
  }, 300);  // ← Schnelleres Timeout (300ms statt 500ms)

  return () => {
    clearTimeout(timer);
    // Cleanup on unmount
    if (draggableRef.current) {
      draggableRef.current.destroy();
      draggableRef.current = null;
    }
  };
}, [workOrders.content]); // ← Re-initialisiert bei Änderungen!
```

## Vorteile der Lösung

✅ **Keine Konflikte mehr**: Nur noch ein Drag-and-Drop-System (FullCalendar Draggable)
✅ **Immer aktuell**: Draggable wird bei jeder Änderung der Work Order Liste neu initialisiert
✅ **Sofort funktionsfähig**: Work Orders sind beim ersten Anfassen bereits draggable
✅ **Sauberes Cleanup**: Alte Instanzen werden ordnungsgemäß zerstört
✅ **Schnellere Initialisierung**: Timeout auf 300ms reduziert (statt 500ms)

## Testing

1. Anwendung neu starten
2. Work Order Liste öffnen im Kalender
3. Work Order beim **ersten Anfassen** in den Kalender ziehen
   - ✅ Sollte sofort funktionieren (kein zweiter Versuch mehr nötig)
4. Work Order Liste aktualisieren (Refresh Button)
5. Neu geladene Work Orders erneut testen
   - ✅ Sollten ebenfalls sofort draggable sein

## Betroffene Dateien

### `frontend/src/content/own/WorkOrders/Calendar/WorkOrderDragList.tsx`
- Entfernung von `handleDragStart` Funktion
- Entfernung von `draggable` und `onDragStart` Props vom `ListItem`

### `frontend/src/content/own/WorkOrders/Calendar/index.tsx`
- Hinzufügung von `draggableRef`
- Hinzufügung von `workOrders` aus Redux State
- Verbesserung des Draggable-Initialisierungs-useEffect
- Dependency auf `workOrders.content`
- Ordnungsgemäßes Cleanup mit `destroy()`

## Technische Details

### FullCalendar Draggable API
Die `Draggable` Klasse von FullCalendar bietet:
- `new Draggable(container, options)` - Erstellt eine Instanz
- `instance.destroy()` - Zerstört die Instanz und gibt Ressourcen frei

### Wichtige Konzepte
1. **Singleton Pattern**: Nur eine Draggable-Instanz pro Container
2. **Cleanup**: Alte Instanzen müssen zerstört werden, bevor neue erstellt werden
3. **Reaktivität**: useEffect Dependencies sorgen für Re-Initialisierung bei Änderungen

## Datum
2026-01-07
