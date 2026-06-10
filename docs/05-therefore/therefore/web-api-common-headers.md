# Therefore™ Web API — Common Headers

> Extracted from Swagger (Therefore 2020). These headers apply to most POST endpoints.

## Authentication Headers

### `UseToken`
- **Value**: `1`
- **Purpose**: When set to `1`, Basic HTTP credentials are interpreted as username/token (not username/password).
- **Usage**: Use with tokens obtained from `GetConnectionToken` or `GetConnectionTokenFromADFSToken`.
- **Note**: Omit this header entirely (don't set to `0`) when using normal username/password authentication.

### `Therefore-Auth-Codepage`
- **Purpose**: Specifies the code page used to encode Basic HTTP credentials (username and password).
- **When needed**: If client-side encoding is not compatible with US-ASCII, or if non-ASCII characters (e.g., `èéàùìçò`) appear in username or password.

## Tenant Header

### `TenantName`
- **Purpose**: Specifies the tenant name when connecting to a multi-tenant system.
- **Single-tenant**: Can be omitted or set to `default`.
- **Path variant**: Some endpoints use `/{tenant}/` as a path parameter instead.

## Localization Headers

### `Accept-Language`
- **Example**: `de-DE`, `en-US`
- **Purpose (dual)**:
  1. **Format/parse** decimal, date, and datetime values on the server.
  2. **Multilanguage** Therefore feature — category names etc. are returned in the specified language.
- **Reference**: [MDN Accept-Language](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language)

## Timezone Headers

### `The-Timezone-Microsoft`
- **Purpose**: Client timezone in Microsoft standard format for processing datetime index values.
- **Example**: `W. Europe Standard Time`
- **Reference**: [Microsoft Time Zone Index Values](https://support.microsoft.com/en-gb/help/973627/microsoft-time-zone-index-values)

### `The-Timezone-IANA`
- **Purpose**: Client timezone in IANA standard format (alternative to Microsoft format).
- **Example**: `Europe/Vienna`
- **Reference**: [IANA Time Zones](https://www.iana.org/time-zones)

## Client Type Header

### `The-Client-Type`
- **Purpose**: Specifies the client type used to connect to Therefore Server.
- **Default**: `6` (Custom Application) if not specified.
- **Known values**: Typically leave at default unless instructed otherwise.

## Authentication Flow

### Basic Auth (Username/Password)
```
Authorization: Basic base64(username:password)
# Do NOT include UseToken header
```

### Token Auth
```
# Step 1: Get token
POST /GetConnectionToken
Authorization: Basic base64(username:password)

# Step 2: Use token for subsequent requests
Authorization: Basic base64(username:token)
UseToken: 1
```

### ADFS Token Auth
```
# Step 1: Get token from ADFS token
POST /GetConnectionTokenFromADFSToken
Body: { "ADFSToken": "..." }

# Step 2: Use token
Authorization: Basic base64(username:token)
UseToken: 1
```

## Base URLs

- **User Auth (REST)**: `https://<server>:<port>/theservice/v0001/restun/`
- **Windows Auth (REST)**: `https://<server>:<port>/theservice/v0001/restwin/`
- **Therefore Online**: `https://<tenant>.thereforeonline.com/theservice/v0001/restun/`
