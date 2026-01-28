# API Contract: Notification Settings

**Feature**: 003-ncr-email-notification
**Base Path**: `/api/settings/notifications`

---

## Endpoints

### GET /api/settings/notifications

Retrieve current notification settings for NCR emails.

**Authentication**: Required
**Authorization**: Admin only

#### Request

```
GET /api/settings/notifications
```

No request body.

#### Response

**200 OK**

```json
{
  "finance_team_emails": ["finance1@company.com", "finance2@company.com"],
  "procurement_team_emails": ["procurement@company.com"],
  "updated_at": "2026-01-28T10:30:00Z",
  "updated_by": {
    "id": "uuid",
    "username": "admin",
    "full_name": "System Admin"
  }
}
```

**401 Unauthorized**

```json
{
  "statusCode": 401,
  "statusMessage": "Unauthorized",
  "data": {
    "code": "NOT_AUTHENTICATED",
    "message": "You must be logged in to access this resource"
  }
}
```

**403 Forbidden**

```json
{
  "statusCode": 403,
  "statusMessage": "Forbidden",
  "data": {
    "code": "ADMIN_REQUIRED",
    "message": "Only administrators can access notification settings"
  }
}
```

---

### PUT /api/settings/notifications

Update notification settings for NCR emails.

**Authentication**: Required
**Authorization**: Admin only

#### Request

```
PUT /api/settings/notifications
Content-Type: application/json

{
  "finance_team_emails": ["finance1@company.com", "finance2@company.com"],
  "procurement_team_emails": ["procurement@company.com"]
}
```

**Request Body Schema (Zod)**

```typescript
const updateSchema = z.object({
  finance_team_emails: z.array(z.string().email()).default([]),
  procurement_team_emails: z.array(z.string().email()).default([]),
});
```

#### Response

**200 OK**

```json
{
  "message": "Notification settings updated successfully",
  "settings": {
    "finance_team_emails": ["finance1@company.com", "finance2@company.com"],
    "procurement_team_emails": ["procurement@company.com"],
    "updated_at": "2026-01-28T10:30:00Z",
    "updated_by": {
      "id": "uuid",
      "username": "admin",
      "full_name": "System Admin"
    }
  }
}
```

**400 Bad Request** (Validation Error)

```json
{
  "statusCode": 400,
  "statusMessage": "Bad Request",
  "data": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "path": ["finance_team_emails", 0],
        "message": "Invalid email"
      }
    ]
  }
}
```

**401 Unauthorized**

```json
{
  "statusCode": 401,
  "statusMessage": "Unauthorized",
  "data": {
    "code": "NOT_AUTHENTICATED",
    "message": "You must be logged in to access this resource"
  }
}
```

**403 Forbidden**

```json
{
  "statusCode": 403,
  "statusMessage": "Forbidden",
  "data": {
    "code": "ADMIN_REQUIRED",
    "message": "Only administrators can modify notification settings"
  }
}
```

---

## TypeScript Types

```typescript
// Request types
interface UpdateNotificationSettingsRequest {
  finance_team_emails: string[];
  procurement_team_emails: string[];
}

// Response types
interface NotificationSettingsResponse {
  finance_team_emails: string[];
  procurement_team_emails: string[];
  updated_at: string;
  updated_by: {
    id: string;
    username: string;
    full_name: string | null;
  };
}

interface UpdateNotificationSettingsResponse {
  message: string;
  settings: NotificationSettingsResponse;
}
```

---

## Composable Usage

```typescript
// app/composables/useNotificationSettings.ts

export function useNotificationSettings() {
  const settings = ref<NotificationSettingsResponse | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchSettings() {
    isLoading.value = true;
    error.value = null;
    try {
      const { data } = await useApi<NotificationSettingsResponse>("/api/settings/notifications");
      settings.value = data.value;
    } catch (err) {
      error.value = getErrorMessage(err);
    } finally {
      isLoading.value = false;
    }
  }

  async function updateSettings(data: UpdateNotificationSettingsRequest) {
    isLoading.value = true;
    error.value = null;
    try {
      const { data: response } = await useApi<UpdateNotificationSettingsResponse>(
        "/api/settings/notifications",
        { method: "PUT", body: data }
      );
      settings.value = response.value?.settings ?? null;
      return { success: true };
    } catch (err) {
      error.value = getErrorMessage(err);
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  }

  return {
    settings,
    isLoading,
    error,
    fetchSettings,
    updateSettings,
  };
}
```
