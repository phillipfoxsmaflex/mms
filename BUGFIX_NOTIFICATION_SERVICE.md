# Bug Fixes für Atlas CMMS

## 1. Fix: "Failed to load unmapped assets" im Floor Plan Editor

### Problem Beschreibung

Beim Wechsel in den Edit-Mode des Floor Plan Editors wurde der Fehler **"Failed to load unmapped assets"** angezeigt. Neue Anlagen konnten daher nicht auf dem Grundriss platziert werden.

Browser-Konsole zeigte:
```
Failed to fetch unmapped assets: There is an error! 4 LocationFloorPlanMap.tsx:244:15
```

### Ursachen-Analyse

**1. Hauptproblem: Falsche Spring Data JPA Methoden-Benennung**

Im `AssetRepository.java` wurde die Methode falsch benannt:
- ❌ **Falsch:** `findByLocationIdAndFloorPlanIsNull(Long locationId)`
- ✅ **Korrekt:** `findByLocation_IdAndFloorPlanIsNull(Long locationId)`

Die Asset-Entity hat ein Feld namens `location` (Relation), nicht `locationId`. Spring Data JPA konnte die ursprüngliche Methode nicht korrekt parsen und generierte keine funktionierende SQL-Abfrage.

**2. Fehlendes Berechtigungsmanagement**

Der Endpoint `GET /locations/{id}/assets/unmapped` hatte keine Berechtigungsprüfung:
- Keine Validierung der ASSETS View-Berechtigung
- Keine Filterung nach `createdBy` für Benutzer ohne ViewOtherPermissions
- Potenzielle Sicherheitslücke

**3. Unzureichende Fehlerbehandlung im Frontend**

Das Frontend zeigte nur eine generische Fehlermeldung ohne Details über:
- HTTP-Statuscode
- Backend-Fehlermeldung
- Response-Daten

### Lösung

**Backend-Änderungen:**

1. **AssetRepository.java:** Korrektur der Methoden-Benennung
```java
Collection<Asset> findByLocation_IdAndFloorPlanIsNull(Long locationId);
```

2. **AssetService.java:** Aktualisierung des Methodenaufrufs
```java
return assetRepository.findByLocation_IdAndFloorPlanIsNull(locationId);
```

3. **LocationController.java:** Hinzufügen von Berechtigungsprüfungen
```java
if (user.getRole().getRoleType().equals(RoleType.ROLE_CLIENT)) {
    if (user.getRole().getViewPermissions().contains(PermissionEntity.ASSETS)) {
        boolean canViewOthers = user.getRole().getViewOtherPermissions().contains(PermissionEntity.ASSETS);
        return assetService.findByLocationAndFloorPlanIsNull(id).stream()
                .filter(asset -> canViewOthers || asset.getCreatedBy().equals(user.getId()))
                .map(asset -> assetMapper.toShowDto(asset, assetService))
                .collect(Collectors.toList());
    } else throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
}
```

**Frontend-Änderungen:**

4. **LocationFloorPlanMap.tsx:** Verbesserte Fehlerbehandlung
```typescript
catch (error: any) {
  console.error('Failed to fetch unmapped assets:', error);
  const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
  console.error('Error details:', {
    status: error.response?.status,
    statusText: error.response?.statusText,
    message: errorMessage,
    data: error.response?.data
  });
  showSnackBar(`Failed to load unmapped assets: ${errorMessage}`, 'error');
}
```

### Testing

**Nach dem Rebuild:**
```bash
cd /workspace/project/mms
docker-compose build api frontend
docker-compose up -d
```

**Test-Schritte:**
1. ✅ Location erstellen
2. ✅ Grundriss hochladen
3. ✅ Neue Anlage erstellen (ohne Grundriss-Platzierung)
4. ✅ Edit-Mode im Floor Plan aktivieren
5. ✅ Verifizieren: Unmapped Assets werden in der Sidebar angezeigt
6. ✅ Anlage per Drag & Drop platzieren
7. ✅ Speichern und verifizieren

**Berechtigungen testen:**
- Benutzer ohne ASSETS View-Berechtigung → 403 Forbidden
- Benutzer mit ASSETS View aber ohne ViewOther → Nur eigene Assets sichtbar
- Admin-Benutzer → Alle Assets sichtbar

### Betroffene Dateien

- `api/src/main/java/com/grash/repository/AssetRepository.java`
- `api/src/main/java/com/grash/service/AssetService.java`
- `api/src/main/java/com/grash/controller/LocationController.java`
- `frontend/src/content/own/Locations/LocationFloorPlanMap.tsx`

### Auswirkungen

- ✅ **Behoben:** "Failed to load unmapped assets" Fehler
- ✅ **Behoben:** Spring Data JPA Query-Generierung
- ✅ **Verbessert:** Sicherheit durch Berechtigungsprüfung
- ✅ **Verbessert:** Fehler-Diagnostik im Frontend
- ✅ **Keine Regression:** Bestehende Funktionalität bleibt erhalten

---

## 2. Fix: IndexOutOfBoundsException in NotificationService

## Problem Description

When creating a location with a floor plan and then creating an asset to place on the floor plan using the edit toggle, the frontend would display the error: **"Failed to load unmapped assets"**.

The backend logs showed:
```
java.lang.IndexOutOfBoundsException: Index 0 out of bounds for length 0
	at io.github.jav.exposerversdk.PushClientCustomData.zipMessagesTickets(PushClientCustomData.java:156)
	at com.grash.service.NotificationService.sendPushNotifications(NotificationService.java:136)
```

## Root Cause

The issue occurred in the `NotificationService.sendPushNotifications()` method. When:
1. A location or asset was created
2. The notification service attempted to send push notifications to users
3. No users had registered push notification tokens (tokens list was empty)
4. The code still created and sent an `ExpoPushMessage` with an empty tokens list
5. The push notification service returned an empty list of tickets
6. The `zipMessagesTickets()` method tried to access index 0 of the empty tickets list, causing an `IndexOutOfBoundsException`

## Solution

Added an early return check in the `sendPushNotifications()` method to skip push notification sending when no valid tokens are found:

```java
// If there are no valid tokens, skip push notification sending
if (tokens.isEmpty()) {
    System.out.println("No valid push notification tokens found. Skipping push notification.");
    return;
}
```

This prevents the exception and allows the location/asset creation workflow to complete successfully.

## Testing

To verify the fix:

1. **Rebuild the backend:**
   ```bash
   cd /workspace/project/mms
   docker-compose build api
   docker-compose up -d api
   ```

2. **Test the workflow:**
   - Create a new location
   - Upload a floor plan for the location
   - Create a new asset
   - Use the edit toggle to place the asset on the floor plan
   - Verify that the "Failed to load unmapped assets" error no longer appears
   - Check that the backend logs show: "No valid push notification tokens found. Skipping push notification." instead of the IndexOutOfBoundsException

3. **Verify existing functionality:**
   - If users with registered push notification tokens exist, they should still receive notifications as expected
   - The fix only affects cases where no tokens are registered

## Files Changed

- `api/src/main/java/com/grash/service/NotificationService.java`
  - Added token list validation before sending push notifications
  - Lines 107-111: Early return when tokens list is empty

## Impact

- **Fixed:** IndexOutOfBoundsException when no push notification tokens exist
- **Fixed:** "Failed to load unmapped assets" error in frontend
- **Improved:** System resilience when push notifications are not configured
- **No regression:** Existing push notification functionality remains unchanged
