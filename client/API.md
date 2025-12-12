# AccuBooks API Documentation

Complete API reference for the AccuBooks platform.

## Base URL

```
Development: http://localhost:3001/api/v1
Production: https://api.accubooks.com/v1
```

## Authentication

AccuBooks uses JWT (JSON Web Token) authentication.

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 3600
    }
  }
}
```

### Refresh Token

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Logout

```http
POST /auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## Users

### Get Users

```http
GET /users?page=1&limit=10&search=john
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-123",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

### Create User

```http
POST /users
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "user",
  "password": "password123"
}
```

### Update User

```http
PUT /users/{userId}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane.smith@example.com"
}
```

### Delete User

```http
DELETE /users/{userId}
Authorization: Bearer {accessToken}
```

## Customers

### Get Customers

```http
GET /customers?page=1&limit=10&search=company
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "cust-123",
        "name": "Acme Corporation",
        "email": "billing@acme.com",
        "phone": "555-123-4567",
        "address": {
          "street": "123 Business St",
          "city": "Business City",
          "state": "BC",
          "zip": "12345"
        },
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

### Create Customer

```http
POST /customers
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "New Company",
  "email": "contact@newcompany.com",
  "phone": "555-987-6543",
  "address": {
    "street": "456 New St",
    "city": "New City",
    "state": "NC",
    "zip": "67890"
  }
}
```

## Invoices

### Get Invoices

```http
GET /invoices?page=1&limit=10&status=pending&customerId=cust-123
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": "inv-123",
        "number": "INV-001",
        "customerId": "cust-123",
        "customerName": "Acme Corporation",
        "amount": 1000.00,
        "status": "pending",
        "dueDate": "2024-02-01T00:00:00Z",
        "items": [
          {
            "id": "item-1",
            "description": "Consulting Services",
            "quantity": 10,
            "price": 100.00,
            "total": 1000.00
          }
        ],
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

### Create Invoice

```http
POST /invoices
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "customerId": "cust-123",
  "dueDate": "2024-02-01T00:00:00Z",
  "items": [
    {
      "description": "Web Development",
      "quantity": 40,
      "price": 150.00
    }
  ]
}
```

## Products

### Get Products

```http
GET /products?page=1&limit=10&category=services
Authorization: Bearer {accessToken}
```

### Create Product

```http
POST /products
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "Web Design Package",
  "description": "Complete web design services",
  "price": 2500.00,
  "category": "services",
  "sku": "WEB-001"
}
```

## Reports

### Get Financial Reports

```http
GET /reports/financial?period=monthly&year=2024&month=1
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "2024-01",
    "revenue": 50000.00,
    "expenses": 30000.00,
    "profit": 20000.00,
    "invoices": {
      "total": 50,
      "paid": 40,
      "pending": 10
    },
    "customers": {
      "new": 5,
      "active": 100,
      "total": 150
    }
  }
}
```

### Generate Report

```http
POST /reports/generate
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "type": "financial",
  "period": "monthly",
  "format": "pdf",
  "email": "admin@company.com"
}
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

### Common Error Codes

- **400 BAD_REQUEST** - Invalid request data
- **401 UNAUTHORIZED** - Authentication required
- **403 FORBIDDEN** - Insufficient permissions
- **404 NOT_FOUND** - Resource not found
- **422 VALIDATION_ERROR** - Input validation failed
- **429 RATE_LIMIT_EXCEEDED** - Too many requests
- **500 INTERNAL_ERROR** - Server error

## Rate Limiting

API requests are rate limited:

- **Standard users**: 100 requests per minute
- **Premium users**: 500 requests per minute
- **Enterprise users**: 2000 requests per minute

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination:

```http
GET /invoices?page=2&limit=20
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `sort` (string): Sort field (default: createdAt)
- `order` (string): Sort order (asc|desc, default: desc)

## Search and Filtering

Most list endpoints support search and filtering:

```http
GET /invoices?search=acme&status=pending&dateFrom=2024-01-01&dateTo=2024-01-31
```

## Webhooks

AccuBooks supports webhooks for real-time notifications:

### Create Webhook

```http
POST /webhooks
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["invoice.created", "invoice.paid", "customer.created"],
  "secret": "your-webhook-secret"
}
```

### Webhook Events

- `invoice.created` - New invoice created
- `invoice.paid` - Invoice marked as paid
- `invoice.overdue` - Invoice is overdue
- `customer.created` - New customer created
- `customer.updated` - Customer information updated

## SDK Examples

### JavaScript/TypeScript

```typescript
import { AccuBooksAPI } from '@accubooks/sdk';

const api = new AccuBooksAPI({
  baseURL: 'https://api.accubooks.com/v1',
  apiKey: 'your-api-key'
});

// Get invoices
const invoices = await api.invoices.list({ page: 1, limit: 10 });

// Create invoice
const invoice = await api.invoices.create({
  customerId: 'cust-123',
  items: [
    { description: 'Service', quantity: 1, price: 1000 }
  ]
});
```

### Python

```python
from accubooks_sdk import AccuBooksAPI

api = AccuBooksAPI(
    base_url='https://api.accubooks.com/v1',
    api_key='your-api-key'
)

# Get invoices
invoices = api.invoices.list(page=1, limit=10)

# Create invoice
invoice = api.invoices.create(
    customer_id='cust-123',
    items=[
        {'description': 'Service', 'quantity': 1, 'price': 1000}
    ]
)
```

## Testing

### Test Environment

Use the test environment for development:

```bash
# Test API base URL
https://api-test.accubooks.com/v1

# Test credentials
Email: test@accubooks.com
Password: test-password-123
```

### Postman Collection

Download our Postman collection for API testing:

[AccuBooks API Postman Collection](https://docs.accubooks.com/postman-collection)

## Support

- **API Documentation**: https://docs.accubooks.com/api
- **SDK Documentation**: https://docs.accubooks.com/sdk
- **Support Email**: api-support@accubooks.com
- **Status Page**: https://status.accubooks.com

---

Last updated: 2025-12-12
