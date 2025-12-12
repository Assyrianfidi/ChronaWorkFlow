# Architecture Guide

Complete architectural overview of the AccuBooks platform.

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│                 │    │                 │    │                 │
│ React + TS      │◄──►│ Node.js + Express│◄──►│ PostgreSQL      │
│ Vite            │    │ JWT Auth        │    │ Redis Cache     │
│ Tailwind CSS    │    │ REST API        │    │ File Storage    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN           │    │   Queue         │    │   Monitoring    │
│                 │    │                 │    │                 │
│ CloudFlare      │    │ Bull Queue      │    │ Sentry          │
│ Static Assets   │    │ Background Jobs │    │ Analytics       │
│ Global Cache    │    │ Email Service   │    │ Logging         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Frontend Architecture

#### Component Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI primitives
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Card/
│   │   └── Modal/
│   ├── forms/           # Form components
│   │   ├── InvoiceForm/
│   │   ├── CustomerForm/
│   │   └── ProductForm/
│   ├── charts/          # Chart components
│   │   ├── LineChart/
│   │   ├── BarChart/
│   │   └── PieChart/
│   ├── layout/          # Layout components
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   └── Footer/
│   └── features/        # Feature-specific components
│       ├── Dashboard/
│       ├── Invoices/
│       └── Customers/
├── pages/               # Page-level components
│   ├── Dashboard/
│   ├── Invoices/
│   ├── Customers/
│   └── Settings/
├── hooks/               # Custom React hooks
│   ├── useAuth.ts
│   ├── useApi.ts
│   └── useLocalStorage.ts
├── utils/               # Utility functions
│   ├── api.ts
│   ├── auth.ts
│   ├── format.ts
│   └── validation.ts
├── types/               # TypeScript definitions
│   ├── api.ts
│   ├── user.ts
│   └── invoice.ts
├── store/               # State management
│   ├── context/
│   └── reducers/
└── styles/              # Global styles
    ├── globals.css
    └── components.css
```

#### Design Patterns

**1. Atomic Design**
- **Atoms**: Basic UI elements (Button, Input, Icon)
- **Molecules**: Simple components (SearchBox, FormField)
- **Organisms**: Complex components (Header, DataTable)
- **Templates**: Page layouts
- **Pages**: Complete pages

**2. Container/Presentational Pattern**
```typescript
// Container Component
const InvoiceListContainer = () => {
  const { invoices, loading, error } = useInvoices();
  
  return (
    <InvoiceListPresentational
      invoices={invoices}
      loading={loading}
      error={error}
    />
  );
};

// Presentational Component
const InvoiceListPresentational = ({ invoices, loading, error }) => {
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <div>
      {invoices.map(invoice => (
        <InvoiceCard key={invoice.id} invoice={invoice} />
      ))}
    </div>
  );
};
```

**3. Custom Hooks Pattern**
```typescript
// Custom hook for API calls
const useApi = <T>(url: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get(url);
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};
```

### State Management

#### Context API Pattern

```typescript
// Auth Context
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    setUser(response.data.user);
    localStorage.setItem('token', response.data.token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### Local State Management

```typescript
// Component state with useReducer
interface InvoiceState {
  invoices: Invoice[];
  filter: string;
  loading: boolean;
}

type InvoiceAction =
  | { type: 'SET_INVOICES'; payload: Invoice[] }
  | { type: 'SET_FILTER'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean };

const invoiceReducer = (state: InvoiceState, action: InvoiceAction): InvoiceState => {
  switch (action.type) {
    case 'SET_INVOICES':
      return { ...state, invoices: action.payload };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};
```

## 🌐 API Architecture

### RESTful API Design

#### Endpoint Structure

```
/api/v1/
├── auth/
│   ├── POST /login
│   ├── POST /logout
│   └── POST /refresh
├── users/
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   ├── PUT /:id
│   └── DELETE /:id
├── invoices/
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   ├── PUT /:id
│   ├── DELETE /:id
│   └── POST /:id/send
├── customers/
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   ├── PUT /:id
│   └── DELETE /:id
└── reports/
    ├── GET /financial
    ├── GET /sales
    └── POST /generate
```

#### Response Format

```typescript
// Success Response
interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    pagination?: PaginationMeta;
    timestamp: string;
  };
}

// Error Response
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
```

### Authentication & Authorization

#### JWT Implementation

```typescript
// JWT Token Structure
interface JwtPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin' | 'manager';
  permissions: string[];
  iat: number;
  exp: number;
}

// Token Refresh Flow
const refreshAccessToken = async (refreshToken: string) => {
  const response = await api.post('/auth/refresh', { refreshToken });
  return response.data.accessToken;
};
```

#### Role-Based Access Control

```typescript
// Permission System
const permissions = {
  'user': ['read:own', 'write:own'],
  'manager': ['read:own', 'write:own', 'read:team', 'write:team'],
  'admin': ['read:all', 'write:all', 'delete:all', 'manage:users']
};

// Middleware for route protection
const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user.permissions.includes(permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

## 🗄️ Database Architecture

### Schema Design

#### Core Tables

```sql
-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Customers Table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Invoices Table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  customer_id UUID REFERENCES customers(id),
  number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Invoice Items Table
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id),
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL
);
```

#### Indexing Strategy

```sql
-- Performance Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);
CREATE INDEX idx_customers_user_id ON customers(user_id);

-- Full-text Search Index
CREATE INDEX idx_customers_search ON customers USING gin(to_tsvector('english', name || ' ' || email));
```

### Data Migration Strategy

```typescript
// Migration Example
export const up = async (knex: Knex) => {
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').references('id').inTable('users');
    table.string('action').notNullable();
    table.jsonb('old_values');
    table.jsonb('new_values');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

export const down = async (knex: Knex) => {
  await knex.schema.dropTable('audit_logs');
};
```

## 🔒 Security Architecture

### Security Layers

**1. Application Security**
- Input validation and sanitization
- XSS protection with Content Security Policy
- CSRF protection with tokens
- SQL injection prevention with parameterized queries

**2. Authentication Security**
- JWT tokens with short expiration
- Refresh token rotation
- Password hashing with bcrypt
- Multi-factor authentication support

**3. Infrastructure Security**
- SSL/TLS encryption
- Firewall configuration
- DDoS protection
- Security headers

### Security Implementation

```typescript
// Security Middleware
const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true,
  }),
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests
  }),
];
```

## ⚡ Performance Architecture

### Frontend Performance

#### Code Splitting

```typescript
// Route-based code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Customers = lazy(() => import('./pages/Customers'));

// Component-based code splitting
const HeavyChart = lazy(() => import('./components/HeavyChart'));
```

#### Caching Strategy

```typescript
// Service Worker for Caching
const CACHE_NAME = 'accubooks-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});
```

### Backend Performance

#### Database Optimization

```typescript
// Connection Pooling
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000,
});

// Query Optimization
const getInvoices = async (userId: string, page: number, limit: number) => {
  const offset = (page - 1) * limit;
  const query = `
    SELECT i.*, c.name as customer_name
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
    WHERE i.user_id = $1
    ORDER BY i.created_at DESC
    LIMIT $2 OFFSET $3
  `;
  return pool.query(query, [userId, limit, offset]);
};
```

#### Caching Layer

```typescript
// Redis Caching
const redis = require('redis');
const client = redis.createClient();

const getCachedData = async (key: string) => {
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
};

const setCachedData = async (key: string, data: any, ttl = 3600) => {
  await client.setex(key, ttl, JSON.stringify(data));
};
```

## 🔍 Monitoring Architecture

### Application Monitoring

#### Error Tracking

```typescript
// Sentry Integration
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Error Handling Middleware
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  Sentry.captureException(err);
  res.status(500).json({ error: 'Internal server error' });
};
```

#### Performance Monitoring

```typescript
// Performance Metrics
const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
    
    // Send to monitoring service
    analytics.track('api_request', {
      method: req.method,
      path: req.path,
      duration,
      status: res.statusCode,
    });
  });
  
  next();
};
```

### Infrastructure Monitoring

#### Health Checks

```typescript
// Health Check Endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabaseHealth(),
      redis: await checkRedisHealth(),
      external: await checkExternalServices(),
    },
  };
  
  const isHealthy = Object.values(health.services).every(service => service.status === 'ok');
  res.status(isHealthy ? 200 : 503).json(health);
});
```

## 🚀 Scalability Architecture

### Horizontal Scaling

#### Load Balancing

```nginx
# nginx.conf
upstream app_servers {
    server app1:3000;
    server app2:3000;
    server app3:3000;
}

server {
    listen 80;
    server_name app.accubooks.com;
    
    location / {
        proxy_pass http://app_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### Microservices Architecture

```typescript
// Service Communication
const invoiceService = {
  create: async (data: InvoiceData) => {
    const response = await fetch('http://invoice-service/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};

// Event-Driven Architecture
const eventBus = {
  publish: async (event: Event) => {
    await redis.publish('events', JSON.stringify(event));
  },
  
  subscribe: async (handler: (event: Event) => void) => {
    const subscriber = redis.duplicate();
    subscriber.subscribe('events');
    subscriber.on('message', (channel, message) => {
      handler(JSON.parse(message));
    });
  },
};
```

## 📋 Architecture Decisions

### Key Decisions

1. **React + TypeScript**: Chosen for type safety and developer experience
2. **Vite**: Selected for fast development and optimized builds
3. **PostgreSQL**: Chosen for reliability and advanced features
4. **JWT Authentication**: Implemented for stateless authentication
5. **REST API**: Chosen for simplicity and broad compatibility
6. **Context API**: Used for state management to avoid external dependencies
7. **Tailwind CSS**: Selected for rapid UI development
8. **Vercel Deployment**: Chosen for seamless deployment and scaling

### Trade-offs

| Decision | Pros | Cons |
|----------|------|------|
| TypeScript | Type safety, better IDE support | Learning curve, build time |
| Context API | No external dependencies | Performance with large state |
| REST API | Simple, widely supported | Less efficient than GraphQL |
| PostgreSQL | Reliable, feature-rich | More complex than NoSQL |

## 🔄 Future Architecture

### Planned Improvements

1. **GraphQL Migration**: Move to GraphQL for more efficient data fetching
2. **Microservices**: Split into microservices for better scalability
3. **Event Sourcing**: Implement event sourcing for audit trail
4. **CQRS**: Separate read and write operations
5. **Server Components**: Adopt React Server Components
6. **Edge Computing**: Deploy to edge locations for better performance

### Technology Roadmap

- **Q1 2024**: GraphQL implementation
- **Q2 2024**: Microservices migration
- **Q3 2024**: Event sourcing architecture
- **Q4 2024**: Edge computing deployment

---

Last updated: 2025-12-12
