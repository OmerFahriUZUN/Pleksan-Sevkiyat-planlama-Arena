# Frontend Project Structure - API Integration

```
shipment-planning-mes-system/
│
├── 📄 API_INTEGRATION_SUMMARY.md      ⭐ START HERE - Overview and next steps
├── 📄 API_INTEGRATION_GUIDE.md        📚 Complete API reference
├── 📄 IMPLEMENTATION_GUIDE.md          🛠️  Practical implementation examples
├── .env.example                        🔧 Environment variables template
│
├── src/
│   ├── services/                       ✨ API Layer (NEW)
│   │   ├── apiClient.ts               🔌 Axios client with auth
│   │   ├── authAPI.ts                 🔐 Login, profile, logout
│   │   ├── shipmentPlansAPI.ts        📦 Shipment CRUD operations
│   │   ├── ordersAPI.ts               🛒 Orders & pending shipments
│   │   ├── productsAPI.ts             🏷️  Products & stock
│   │   ├── customersAPI.ts            👥 Customer data
│   │   ├── vehiclesAPI.ts             🚚 Vehicles & availability
│   │   ├── reportsAPI.ts              📊 Daily/monthly/vehicle reports
│   │   └── index.ts                   📤 Centralized exports
│   │
│   ├── utils/                          🎯 Utilities
│   │   ├── useApi.ts                  🪝 API hooks (NEW)
│   │   │   ├── useApi()               - Fetch with loading/error
│   │   │   ├── usePaginatedApi()      - Pagination support
│   │   │   ├── useApiMutation()       - Create/Update/Delete
│   │   │   └── useApiSearch()         - Debounced search
│   │   ├── mockData.ts                📋 Mock data (keep for fallback)
│   │   ├── helpers.ts                 🧰 Utility functions
│   │   ├── packagingAlgorithm.ts      📦 Packaging logic
│   │   ├── taskAssignment.ts          📝 Task assignment logic
│   │   └── vehiclePlanning.ts         🚗 Vehicle planning logic
│   │
│   ├── pages/                          📄 Components
│   │   ├── DashboardPage.tsx          ✅ Updated with API
│   │   ├── LoginPage.tsx              ✅ Updated with API
│   │   ├── ShipmentPlansPage.tsx      📋 TODO: Use shipmentPlansAPI
│   │   ├── OrdersPage.tsx             📋 TODO: Use ordersAPI
│   │   ├── ProductsPage.tsx           📋 TODO: Use productsAPI
│   │   ├── VehiclePlanningPage.tsx    📋 TODO: Use vehiclesAPI
│   │   ├── ReportsPage.tsx            📋 TODO: Use reportsAPI
│   │   ├── ExecutionPage.tsx          📋 TODO: Use shipmentPlansAPI
│   │   ├── PlanningPage.tsx           📋 TODO: Use shipmentPlansAPI
│   │   └── Loading3DPage.tsx          ✨ Loading state component
│   │
│   ├── store/
│   │   └── useAppStore.ts             🗂️  Zustand store (keep for local state)
│   │
│   ├── types/
│   │   └── index.ts                   📝 TypeScript interfaces
│   │
│   ├── components/                     🧩 Reusable components
│   │   └── ...
│   │
│   ├── App.tsx                         🎯 Main app component
│   ├── main.tsx                        🚀 Entry point
│   └── index.css                       🎨 Styles
│
├── package.json                        📦 Dependencies (added axios)
├── tsconfig.json                       ⚙️  TypeScript config
├── vite.config.ts                      🔧 Vite config
└── index.html                          📄 HTML entry
```

---

## File Relationships

### Data Flow: API → Components

```
┌─────────────────────────────────────┐
│   Backend API Server                │
│   http://localhost:3001/api/v1      │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   src/services/apiClient.ts         │
│   (Axios client with auth)          │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────────┬────────────┬─────────────┬────────────┬──────────────┬────────────┐
        │                 │            │             │            │              │            │
        ↓                 ↓            ↓             ↓            ↓              ↓            ↓
   authAPI          shipment      ordersAPI    productsAPI   customersAPI   vehiclesAPI  reportsAPI
                    PlansAPI
        │                 │            │             │            │              │            │
        └──────┬──────────┴────────────┴─────────────┴────────────┴──────────────┴────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   src/utils/useApi.ts               │
│   (Hooks for components)            │
│ - useApi                            │
│ - usePaginatedApi                   │
│ - useApiMutation                    │
│ - useApiSearch                      │
└──────────────┬──────────────────────┘
               │
     ┌─────────┼─────────┬──────────┬────────────┬────────────┐
     │         │         │          │            │            │
     ↓         ↓         ↓          ↓            ↓            ↓
Dashboard  Login    Shipment    Orders      Products    Vehicles    Reports
 Page      Page     Plans       Page        Page        Planning    Page
                    Page                               Page
```

---

## API Call Sequence

### 1. Authentication Flow
```
1. LoginPage.tsx
   ↓ (user submits credentials)
2. authAPI.login({ email, password })
   ↓ (POST /api/v1/auth/login)
3. Backend validates credentials
   ↓ (returns token + user)
4. apiClient stores token in localStorage
   ↓ (via axios interceptor)
5. User redirected to Dashboard
   ↓ (auth token in localStorage for future requests)
```

### 2. Fetching Data Flow
```
1. Component mounts (e.g., DashboardPage)
   ↓
2. useApi hook called with API function
   ↓
3. useEffect triggers fetchData()
   ↓
4. setState({ loading: true })
   ↓
5. Call shipmentPlansAPI.getAll()
   ↓
6. apiClient adds auth token to request
   ↓
7. axios sends GET /shipment-plans
   ↓
8. Backend returns data
   ↓
9. setState({ data, loading: false })
   ↓
10. Component re-renders with data
```

### 3. Mutation Flow (Create/Update/Delete)
```
1. User submits form (e.g., CreatePlanForm)
   ↓
2. handleSubmit calls execute(formData)
   ↓
3. setState({ loading: true, error: '' })
   ↓
4. Call shipmentPlansAPI.create(data)
   ↓
5. apiClient adds auth token
   ↓
6. axios sends POST /shipment-plans with data
   ↓
7. Backend creates resource
   ↓
8. setState({ data: result, success: true })
   ↓
9. Component shows success message
   ↓
10. Parent component may refetch() to update list
```

---

## Hook Usage Examples

### useApi - Fetch Data
```typescript
const { data, loading, error, refetch } = useApi(
  () => shipmentPlansAPI.getAll()
);
// Returns: { data, loading, error, refetch }
// Auto-fetches on component mount
```

### useApiMutation - Create/Update/Delete
```typescript
const { execute, loading, error, success } = useApiMutation(
  (data) => shipmentPlansAPI.create(data)
);
// Call: const result = await execute(formData)
// Returns: { execute, loading, error, success, data, reset }
```

### usePaginatedApi - Pagination
```typescript
const { items, page, nextPage, prevPage, hasMore } = usePaginatedApi(
  (page, limit) => shipmentPlansAPI.getPage(page, limit)
);
// Manual pagination control
```

### useApiSearch - Search with Debounce
```typescript
const { query, setQuery, results, loading } = useApiSearch(
  (q) => customersAPI.search(q),
  300 // debounce ms
);
// Automatically debounces search queries
```

---

## Integration Checklist for Each Page

For each page you update:

- [ ] Import useApi/useApiMutation hooks
- [ ] Import appropriate API module
- [ ] Remove mock data generation
- [ ] Replace useState with useApi for fetching
- [ ] Replace form handlers with useApiMutation
- [ ] Add error handling with handleApiError
- [ ] Add loading states to UI
- [ ] Test with backend API
- [ ] Verify error messages show correctly
- [ ] Clean up localStorage/auth on logout

---

## Common Implementation Patterns

### 1. Display List
```typescript
const { data: items, loading, error } = useApi(() => api.getAll());
{loading && <Spinner />}
{error && <ErrorAlert>{error}</ErrorAlert>}
{items?.map(item => <ListItem key={item.id} item={item} />)}
```

### 2. Create Form
```typescript
const { execute, loading, error, success } = useApiMutation((data) => api.create(data));
const handleSubmit = async (data) => {
  const result = await execute(data);
  if (result) { refetch(); }
};
```

### 3. Delete Item
```typescript
const { execute: deleteItem } = useApiMutation((id) => api.delete(id));
const handleDelete = async (id) => {
  if (confirm('Delete?')) {
    const result = await deleteItem(id);
    if (result) { refetch(); }
  }
};
```

### 4. Refresh Data
```typescript
const { data, refetch } = useApi(...);
<button onClick={refetch}>Refresh</button>
```

### 5. Dependent Queries
```typescript
const { data: parent } = useApi(() => api.getById(parentId), [parentId]);
const { data: children } = useApi(
  () => parent ? api.getChildren(parent.id) : Promise.resolve([]),
  [parent]
);
```

---

## Testing Pattern

```typescript
// Mock the API
vi.spyOn(shipmentPlansAPI, 'getAll').mockResolvedValue([...]);

// Test component with mocked API
render(<ShipmentPlansPage />);
expect(screen.getByText('SHIP-001')).toBeInTheDocument();
```

---

## Performance Optimization

### 1. Memoize API functions
```typescript
const getPlans = useCallback(() => shipmentPlansAPI.getAll(), []);
const { data } = useApi(getPlans);
```

### 2. Debounce search
```typescript
const { query, setQuery, results } = useApiSearch(api.search, 300);
```

### 3. Lazy load data
```typescript
const [shouldFetch, setShouldFetch] = useState(false);
const { data } = useApi(
  () => api.getHeavyData(),
  shouldFetch ? [] : undefined
);
```

---

## Error Recovery Strategies

### Retry on Error
```typescript
const handleRetry = async () => {
  setError('');
  await refetch();
};
```

### Fallback to Mock Data
```typescript
try {
  const data = await api.getAll();
  return data;
} catch (e) {
  console.warn('Using mock data');
  return generateMockData();
}
```

### Progressive Enhancement
```typescript
const { data = mockData, error } = useApi(api.getAll);
// Component works with both real and mock data
```
