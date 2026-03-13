# Dashboard Module

This module implements the dashboard functionality for the Smart Mill Scale application using Clean Architecture principles.

## Architecture Overview

The dashboard module follows Clean Architecture with clear separation between layers:

```
dashboard/
├── domain/          # Core business logic and entities (innermost layer)
│   ├── entities.go       # Dashboard, Widget, Metric entities
│   ├── repository.go     # Repository interfaces
│   ├── analytics.go      # Analytics entities and interfaces
│   ├── services.go       # Domain services
│   └── errors.go         # Domain errors
│
├── usecase/         # Application business logic
│   ├── interfaces.go           # Use case interfaces
│   ├── dashboard_usecase.go    # Dashboard operations
│   ├── metrics_usecase.go      # Metrics calculation
│   ├── analytics_usecase.go    # Analytics tracking
│   ├── system_health_usecase.go # System health monitoring
│   └── container.go            # Dependency injection container
│
├── repository/      # Data access implementations (to be implemented)
│   ├── sqlite/          # SQLite implementations
│   └── cache/           # Cache implementations
│
└── delivery/        # External interfaces (to be implemented)
    └── http/            # HTTP handlers
```

## Clean Architecture Principles

### 1. **Dependency Rule**
- Dependencies point inward: `delivery → usecase → domain`
- Inner layers never depend on outer layers
- Domain layer has no external dependencies

### 2. **Separation of Concerns**
- **Domain**: Business entities and rules
- **Use Case**: Application-specific business logic
- **Repository**: Data access abstraction
- **Delivery**: HTTP/API handlers

### 3. **Dependency Injection**
- All dependencies injected through constructors
- Interfaces defined in inner layers, implemented in outer layers
- Enables easy testing and flexibility

## Domain Layer

### Entities

#### Dashboard
Core entity representing a user's dashboard configuration.

```go
type Dashboard struct {
    ID          uuid.UUID
    UserID      uuid.UUID
    Role        Role
    Layout      Layout
    Widgets     []Widget
    IsActive    bool
    CreatedAt   time.Time
    UpdatedAt   time.Time
    LastViewed  *time.Time
}
```

#### Widget
Represents individual dashboard widgets.

```go
type Widget struct {
    ID          string
    Type        WidgetType
    Title       string
    Position    WidgetPos
    Config      map[string]interface{}
    RequiredRole Role
    IsVisible   bool
    Refreshable bool
}
```

#### Metric
Represents dashboard metrics and KPIs.

```go
type Metric struct {
    ID       string
    Name     string
    Value    interface{}
    Unit     string
    Trend    *Trend
    Metadata map[string]interface{}
}
```

### Repository Interfaces

Defined in `domain/repository.go`:

- **DashboardRepository**: Dashboard CRUD operations
- **AnalyticsRepository**: Analytics and events tracking
- **CacheRepository**: Caching operations
- **UserRepository**: User data access
- **EventPublisher**: Event publishing

## Use Case Layer

### Dependency Injection

All use cases receive their dependencies through constructors:

```go
type dashboardUseCase struct {
    dashboardRepo  domain.DashboardRepository
    analyticsRepo  domain.AnalyticsRepository
    userRepo       domain.UserRepository
    cacheRepo      domain.CacheRepository
    logger         domain.Logger
    eventPublisher domain.EventPublisher
    cacheTTL       time.Duration
}

func NewDashboardUseCase(
    dashboardRepo domain.DashboardRepository,
    analyticsRepo domain.AnalyticsRepository,
    userRepo domain.UserRepository,
    cacheRepo domain.CacheRepository,
    logger domain.Logger,
    eventPublisher domain.EventPublisher,
    cacheTTL time.Duration,
) DashboardUseCase {
    return &dashboardUseCase{...}
}
```

### Use Cases

#### 1. DashboardUseCase
Handles dashboard operations:
- `GetDashboardData`: Retrieve complete dashboard data
- `CreateDashboard`: Create new dashboard
- `UpdateDashboard`: Update existing dashboard
- `DeleteDashboard`: Delete dashboard
- `AddWidget`, `UpdateWidget`, `RemoveWidget`: Widget management
- `UpdateLayout`: Layout customization
- `RefreshDashboard`: Force refresh

#### 2. MetricsUseCase
Handles metrics calculation:
- `GetMetrics`: Get all metrics for a user
- `GetWeighingMetrics`: Weighing-specific metrics
- `GetSyncMetrics`: Sync status metrics
- `GetUserActivityMetrics`: User activity metrics

#### 3. AnalyticsUseCase
Handles analytics tracking:
- `TrackEvent`: Record analytics events
- `GetRecentActivities`: Get recent user activities
- `GetUsageMetrics`: Calculate usage statistics
- `GetDashboardStats`: Dashboard-specific stats
- `GetPerformanceMetrics`: Performance tracking

#### 4. SystemHealthUseCase
Monitors system health:
- `GetSystemHealth`: Overall system health
- `CheckServiceHealth`: Individual service health
- `GetHealthScore`: Health score calculation

### Container Pattern

The `Container` struct provides centralized dependency management:

```go
container := usecase.NewContainer(
    dashboardRepo,
    analyticsRepo,
    userRepo,
    cacheRepo,
    logger,
    eventPublisher,
    5*time.Minute, // cacheTTL
)

// Access use cases
dashboard := container.Dashboard
metrics := container.Metrics
analytics := container.Analytics
health := container.SystemHealth
```

## Features

### 1. **Role-Based Access Control**
- Dashboards customized per user role
- Widget visibility based on permissions
- Role hierarchy: `ADMIN > SUPERVISOR > TIMBANGAN > GRADING`

### 2. **Caching Strategy**
- Dashboard data cached for performance
- Automatic cache invalidation on updates
- Configurable TTL

### 3. **Analytics Tracking**
- All dashboard interactions tracked
- Usage metrics and statistics
- Performance monitoring

### 4. **Event-Driven Architecture**
- Domain events published for key actions
- Async event handling
- Event subscribers can react to changes

### 5. **Customizable Layouts**
- Flexible grid-based layout
- Widget positioning and sizing
- Per-role default layouts

## Usage Examples

### Creating a Dashboard Use Case

```go
// Setup dependencies
logger := // ... your logger implementation
dashboardRepo := // ... repository implementation
cacheRepo := // ... cache implementation
// ... other dependencies

// Create use case with DI
dashboardUC := usecase.NewDashboardUseCase(
    dashboardRepo,
    analyticsRepo,
    userRepo,
    cacheRepo,
    logger,
    eventPublisher,
    5*time.Minute,
)

// Use the use case
ctx := context.Background()
userID := uuid.New()

data, err := dashboardUC.GetDashboardData(ctx, userID)
if err != nil {
    // handle error
}
```

### Using the Container

```go
// Create container with all dependencies
container := usecase.NewContainer(
    dashboardRepo,
    analyticsRepo,
    userRepo,
    cacheRepo,
    logger,
    eventPublisher,
    5*time.Minute,
)

// Use different use cases
dashboard, _ := container.Dashboard.GetDashboardData(ctx, userID)
metrics, _ := container.Metrics.GetMetrics(ctx, userID, role)
_ = container.Analytics.TrackEvent(ctx, event)
health, _ := container.SystemHealth.GetSystemHealth(ctx)
```

### Adding a Widget

```go
widget := domain.Widget{
    ID:           "widget-123",
    Type:         domain.WidgetMetricCard,
    Title:        "Total Penimbangan",
    Position:     domain.WidgetPos{X: 0, Y: 0, Width: 4, Height: 2},
    Config:       map[string]interface{}{"metric": "total_weighings"},
    RequiredRole: domain.RoleTimbangan,
    IsVisible:    true,
    Refreshable:  true,
}

err := dashboardUC.AddWidget(ctx, userID, widget)
```

### Tracking Analytics

```go
event := &domain.AnalyticsEvent{
    ID:        uuid.New(),
    Type:      domain.EventTypeDashboardView,
    UserID:    userID,
    Role:      domain.RoleAdmin,
    Timestamp: time.Now(),
    Metadata: map[string]interface{}{
        "dashboard_id": dashboardID,
    },
}

err := analyticsUC.TrackEvent(ctx, event)
```

## Next Steps

### 1. Repository Implementation
- [ ] Implement SQLite repository
- [ ] Implement in-memory cache
- [ ] Add repository tests

### 2. HTTP Delivery
- [ ] Create HTTP handlers
- [ ] Add request/response DTOs
- [ ] Implement middleware

### 3. Testing
- [ ] Unit tests for use cases
- [ ] Integration tests
- [ ] Mock repository implementations

### 4. Performance
- [ ] Implement caching strategy
- [ ] Add connection pooling
- [ ] Optimize queries

## Best Practices

1. **Always inject dependencies** - Never create dependencies inside use cases
2. **Use interfaces** - Depend on abstractions, not concrete types
3. **Keep domain pure** - No external dependencies in domain layer
4. **Test with mocks** - Easy to test with injected dependencies
5. **Log important actions** - Use injected logger for tracking
6. **Invalidate cache** - Always invalidate cache on updates
7. **Track analytics** - Track important user actions
8. **Publish events** - Notify other parts of system about changes

## Error Handling

All use cases return domain errors:

```go
if err := dashboard.IsValid(); err != nil {
    return domain.ErrInvalidDashboard
}

if user == nil {
    return domain.ErrUserNotFound
}
```

Domain errors are defined in `domain/errors.go`.

## Contributing

When adding new features:

1. Define entities in `domain/`
2. Define repository interfaces in `domain/repository.go`
3. Create use case interface in `usecase/interfaces.go`
4. Implement use case with dependency injection
5. Add to Container struct
6. Write tests with mocks

## References

- [Clean Architecture by Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Dependency Injection Pattern](https://en.wikipedia.org/wiki/Dependency_injection)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
