# Bug Fix: IndexOutOfBoundsException in NotificationService

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
