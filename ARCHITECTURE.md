# GeoVAN System Architecture

This document provides a comprehensive overview of the GeoVAN system architecture, including detailed diagrams, component descriptions, and design decisions.

## 🏗️ System Overview

GeoVAN is a microservices-based VANET platform designed for high performance, security, and scalability. The system processes real-time vehicle data with cryptographic validation, trust scoring, and anomaly detection.

## 🔄 High-Level Architecture

```mermaid
graph TB
    subgraph "Vehicle Layer"
        V1[Vehicle 1] 
        V2[Vehicle 2]
        VN[Vehicle N]
        GPS[GPS Module]
        OBD[OBD-II]
        SENSORS[Vehicle Sensors]
    end
    
    subgraph "Communication Layer"
        DSRC[DSRC/WiFi]
        CELL[4G/5G]
        SAT[Satellite]
        RSU[RSU Node]
    end
    
    subgraph "Edge Layer"
        EDGE[Edge Gateway]
        LB[Load Balancer]
        API[API Gateway]
    end
    
    subgraph "Core Services"
        TRACK[Tracking Service]
        TRUST[Trust Service]
        ANALYTICS[Analytics Service]
        ALERTS[Alert Service]
        AUTH[Auth Service]
    end
    
    subgraph "Data Layer"
        CACHE[Redis Cache]
        DB[(PostgreSQL + TimescaleDB)]
        QUEUE[RabbitMQ]
        TS[(Time Series DB)]
    end
    
    subgraph "Frontend"
        WEB[Web Dashboard]
        MOBILE[Mobile App]
        API_CLIENT[API Clients]
    end
    
    subgraph "Monitoring"
        PROM[Prometheus]
        GRAF[Grafana]
        ELK[ELK Stack]
        JAEGER[Jaeger]
    end
    
    V1 --> DSRC
    V2 --> CELL
    VN --> SAT
    GPS --> V1
    OBD --> V1
    SENSORS --> V1
    
    DSRC --> RSU
    CELL --> EDGE
    SAT --> EDGE
    RSU --> LB
    
    LB --> API
    API --> AUTH
    API --> TRACK
    API --> TRUST
    API --> ANALYTICS
    API --> ALERTS
    
    TRACK --> CACHE
    TRUST --> DB
    ANALYTICS --> TS
    ALERTS --> QUEUE
    
    TRACK --> WEB
    TRUST --> WEB
    ANALYTICS --> WEB
    ALERTS --> WEB
    
    TRACK --> PROM
    TRUST --> PROM
    ANALYTICS --> PROM
    ALERTS --> PROM
```

## 🔐 Security Architecture

### Cryptographic Flow

```mermaid
sequenceDiagram
    participant V as Vehicle
    participant RSU as RSU Node
    participant API as API Gateway
    participant AUTH as Auth Service
    participant TRACK as Tracking Service
    participant TRUST as Trust Service
    participant DB as Database
    
    V->>V: Generate Position Data
    V->>V: Create Message Hash
    V->>V: Sign with ECDSA
    V->>V: Encrypt Sensitive Data
    V->>RSU: Send Encrypted Message
    
    RSU->>RSU: Validate Certificate
    RSU->>API: Forward Message
    API->>AUTH: Validate Certificate Chain
    AUTH->>API: Certificate Status
    
    alt Valid Certificate
        API->>TRACK: Decrypt & Validate
        TRACK->>TRACK: Verify Signature
        TRACK->>TRACK: Check Replay Protection
        TRACK->>TRUST: Position + Metadata
        TRUST->>TRUST: Compute Trust Score
        TRUST->>DB: Store + Update Trust
        TRUST->>TRACK: Trust Result
        TRACK->>DB: Store Position
    else Invalid Certificate
        API->>TRACK: Reject Message
        TRACK->>DB: Log Security Event
    end
```

### Trust Scoring Algorithm

```mermaid
graph TD
    A[Vehicle Position] --> B[Certificate Validation]
    A --> C[Behavioral Analysis]
    A --> D[Sensor Consistency]
    A --> E[Proximity Analysis]
    A --> F[Historical Trust]
    
    B --> G[Certificate Score]
    C --> H[Behavior Score]
    D --> I[Sensor Score]
    E --> J[Proximity Score]
    F --> K[History Score]
    
    G --> L[Weighted Trust Calculation]
    H --> L
    I --> L
    J --> L
    K --> L
    
    L --> M[Overall Trust Score]
    M --> N{Score > Threshold?}
    N -->|Yes| O[Trusted Vehicle]
    N -->|No| P[Untrusted Vehicle]
    
    O --> Q[Process Message]
    P --> R[Flag for Review]
```

## 📊 Data Flow Architecture

### Real-time Message Processing

```mermaid
graph LR
    subgraph "Input Layer"
        A[Vehicle Messages]
        B[RSU Messages]
        C[Edge Messages]
    end
    
    subgraph "Processing Layer"
        D[Message Validator]
        E[Security Checker]
        F[Trust Computer]
        G[Anomaly Detector]
    end
    
    subgraph "Output Layer"
        H[Real-time Updates]
        I[Analytics Data]
        J[Alert System]
        K[Storage]
    end
    
    A --> D
    B --> D
    C --> D
    
    D --> E
    E --> F
    F --> G
    
    G --> H
    G --> I
    G --> J
    G --> K
```

### Database Schema

```mermaid
erDiagram
    VEHICLES {
        uuid id PK
        string certificate_id
        string rsu_id
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }
    
    VEHICLE_POSITIONS {
        uuid id PK
        uuid vehicle_id FK
        double lat
        double lon
        double alt
        float accuracy_horizontal
        float accuracy_vertical
        float hdop
        float vdop
        float tdop
        uint32 satellites_used
        uint32 satellites_visible
        timestamp recorded_at
        uint64 sequence
        uint64 epoch
    }
    
    VEHICLE_VELOCITIES {
        uuid id PK
        uuid vehicle_id FK
        float vx
        float vy
        float vz
        float speed
        float speed_accuracy
        float acceleration
        float deceleration
        timestamp recorded_at
    }
    
    SENSOR_READINGS {
        uuid id PK
        uuid vehicle_id FK
        enum sensor_type
        float value
        float accuracy
        timestamp recorded_at
        string unit
        bool is_calibrated
    }
    
    TRUST_SCORES {
        uuid id PK
        uuid vehicle_id FK
        float overall_score
        float behavior_score
        float certificate_score
        float history_score
        float proximity_score
        float sensor_score
        float anomaly_score
        timestamp computed_at
        timestamp next_update
    }
    
    TRUST_FACTORS {
        uuid id PK
        uuid trust_score_id FK
        string name
        float weight
        float score
        string description
        timestamp calculated_at
    }
    
    ANOMALIES {
        uuid id PK
        uuid vehicle_id FK
        enum anomaly_type
        float severity
        jsonb details
        timestamp detected_at
        bool resolved
        timestamp resolved_at
    }
    
    ALERTS {
        uuid id PK
        enum alert_type
        enum severity
        string title
        string description
        uuid vehicle_id FK
        jsonb location
        timestamp created_at
        bool acknowledged
        string acknowledged_by
        timestamp acknowledged_at
    }
    
    VEHICLES ||--o{ VEHICLE_POSITIONS : "has many"
    VEHICLES ||--o{ VEHICLE_VELOCITIES : "has many"
    VEHICLES ||--o{ SENSOR_READINGS : "has many"
    VEHICLES ||--o{ TRUST_SCORES : "has one"
    VEHICLES ||--o{ ANOMALIES : "has many"
    VEHICLES ||--o{ ALERTS : "has many"
    TRUST_SCORES ||--o{ TRUST_FACTORS : "has many"
```

## 🚀 Performance Architecture

### Scalability Design

```mermaid
graph TB
    subgraph "Load Balancer"
        LB1[HAProxy Primary]
        LB2[HAProxy Secondary]
    end
    
    subgraph "API Layer"
        API1[API Instance 1]
        API2[API Instance 2]
        APIN[API Instance N]
    end
    
    subgraph "Service Layer"
        TRACK1[Tracker 1]
        TRACK2[Tracker 2]
        TRACKN[Tracker N]
        
        TRUST1[Trust 1]
        TRUST2[Trust 2]
        TRUSTN[Trust N]
        
        ANALYTICS1[Analytics 1]
        ANALYTICS2[Analytics 2]
    end
    
    subgraph "Data Layer"
        DB1[(Primary DB)]
        DB2[(Replica DB)]
        DB3[(Replica DB)]
        
        REDIS1[Redis Primary]
        REDIS2[Redis Replica]
        REDIS3[Redis Replica]
        
        RABBIT1[RabbitMQ 1]
        RABBIT2[RabbitMQ 2]
        RABBIT3[RabbitMQ 3]
    end
    
    LB1 --> API1
    LB1 --> API2
    LB1 --> APIN
    
    API1 --> TRACK1
    API2 --> TRACK2
    APIN --> TRACKN
    
    API1 --> TRUST1
    API2 --> TRUST2
    APIN --> TRUSTN
    
    API1 --> ANALYTICS1
    API2 --> ANALYTICS2
    
    TRACK1 --> DB1
    TRACK2 --> DB2
    TRACKN --> DB3
    
    TRUST1 --> REDIS1
    TRUST2 --> REDIS2
    TRUSTN --> REDIS3
    
    ANALYTICS1 --> RABBIT1
    ANALYTICS2 --> RABBIT2
```

### Caching Strategy

```mermaid
graph TD
    A[Request] --> B{Check Redis Cache}
    B -->|Hit| C[Return Cached Data]
    B -->|Miss| D[Query Database]
    D --> E[Process Data]
    E --> F[Store in Cache]
    F --> G[Return Data]
    
    C --> H[Update Cache TTL]
    G --> H
    
    subgraph "Cache Layers"
        I[L1: Memory Cache]
        J[L2: Redis Cache]
        K[L3: Database]
    end
    
    H --> I
    I --> J
    J --> K
```

## 🔒 Security Implementation

### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth Service
    participant D as Database
    participant R as Redis
    
    U->>F: Login Request
    F->>A: POST /auth/login
    A->>D: Validate Credentials
    D->>A: User Data
    A->>A: Generate JWT
    A->>A: Generate Refresh Token
    A->>R: Store Refresh Token
    A->>F: JWT + Refresh Token
    F->>U: Store Tokens
    
    Note over U,F: Subsequent Requests
    U->>F: API Request
    F->>A: Validate JWT
    A->>F: Token Valid
    F->>U: Response
```

### Certificate Validation

```mermaid
graph TD
    A[Certificate Received] --> B[Parse X.509]
    B --> C[Extract Public Key]
    C --> D[Check Expiry]
    D --> E{Expired?}
    E -->|Yes| F[Reject Certificate]
    E -->|No| G[Validate Chain]
    G --> H[Check Revocation]
    H --> I{Revoked?}
    I -->|Yes| J[Reject Certificate]
    I -->|No| K[Validate Signature]
    K --> L{Valid?}
    L -->|Yes| M[Accept Certificate]
    L -->|No| N[Reject Certificate]
```

## 📈 Monitoring & Observability

### Metrics Collection

```mermaid
graph TB
    subgraph "Application Metrics"
        A[Request Count]
        B[Response Time]
        C[Error Rate]
        D[Active Connections]
    end
    
    subgraph "Business Metrics"
        E[Vehicle Count]
        F[Message Rate]
        G[Trust Scores]
        H[Anomaly Rate]
    end
    
    subgraph "Infrastructure Metrics"
        I[CPU Usage]
        J[Memory Usage]
        K[Disk Usage]
        L[Network I/O]
    end
    
    A --> M[Prometheus]
    B --> M
    C --> M
    D --> M
    E --> M
    F --> M
    G --> M
    H --> M
    I --> M
    J --> M
    K --> M
    L --> M
    
    M --> N[Grafana Dashboards]
    M --> O[Alert Manager]
    M --> P[Time Series DB]
```

### Logging Architecture

```mermaid
graph LR
    subgraph "Application Logs"
        A[API Logs]
        B[Service Logs]
        C[Error Logs]
    end
    
    subgraph "Infrastructure Logs"
        D[Container Logs]
        E[System Logs]
        F[Network Logs]
    end
    
    A --> G[Logstash]
    B --> G
    C --> G
    D --> G
    E --> G
    F --> G
    
    G --> H[Elasticsearch]
    H --> I[Kibana]
    H --> J[Log Analysis]
```

## 🌐 Network Architecture

### Network Topology

```mermaid
graph TB
    subgraph "Public Internet"
        INTERNET[Internet]
    end
    
    subgraph "DMZ"
        NGINX[Nginx Load Balancer]
        FIREWALL[Firewall]
    end
    
    subgraph "Application Layer"
        API[API Gateway]
        FRONTEND[Frontend]
    end
    
    subgraph "Service Layer"
        SERVICES[Microservices]
    end
    
    subgraph "Data Layer"
        DATABASE[Database Cluster]
        CACHE[Cache Cluster]
        QUEUE[Message Queue]
    end
    
    INTERNET --> FIREWALL
    FIREWALL --> NGINX
    NGINX --> API
    NGINX --> FRONTEND
    API --> SERVICES
    SERVICES --> DATABASE
    SERVICES --> CACHE
    SERVICES --> QUEUE
```

### Load Balancing Strategy

```mermaid
graph TD
    A[Client Request] --> B[Load Balancer]
    B --> C{Request Type?}
    
    C -->|API| D[API Gateway]
    C -->|Static| E[CDN/Static Files]
    C -->|WebSocket| F[WebSocket Load Balancer]
    
    D --> G{Service Type?}
    G -->|Tracking| H[Tracking Service Pool]
    G -->|Trust| I[Trust Service Pool]
    G -->|Analytics| J[Analytics Service Pool]
    
    H --> K[Database]
    I --> L[Cache]
    J --> M[Message Queue]
    
    E --> N[Static Content]
    F --> O[WebSocket Service]
```

## 🔄 Deployment Architecture

### Container Orchestration

```mermaid
graph TB
    subgraph "Kubernetes Cluster"
        subgraph "Control Plane"
            MASTER[Master Node]
        end
        
        subgraph "Worker Nodes"
            WORKER1[Worker Node 1]
            WORKER2[Worker Node 2]
            WORKER3[Worker Node 3]
        end
        
        subgraph "Services"
            API[API Service]
            TRACKER[Tracker Service]
            TRUST[Trust Service]
            ANALYTICS[Analytics Service]
        end
        
        subgraph "Data"
            POSTGRES[PostgreSQL StatefulSet]
            REDIS[Redis StatefulSet]
            RABBITMQ[RabbitMQ StatefulSet]
        end
    end
    
    MASTER --> WORKER1
    MASTER --> WORKER2
    MASTER --> WORKER3
    
    WORKER1 --> API
    WORKER2 --> TRACKER
    WORKER3 --> TRUST
    WORKER2 --> ANALYTICS
    
    API --> POSTGRES
    TRACKER --> REDIS
    TRUST --> POSTGRES
    ANALYTICS --> RABBITMQ
```

### CI/CD Pipeline

```mermaid
graph LR
    A[Code Commit] --> B[GitHub]
    B --> C[GitHub Actions]
    C --> D[Run Tests]
    D --> E{Tests Pass?}
    E -->|No| F[Fail Build]
    E -->|Yes| G[Build Images]
    G --> H[Security Scan]
    H --> I{Scan Pass?}
    I -->|No| J[Fail Build]
    I -->|Yes| K[Push to Registry]
    K --> L[Deploy to Staging]
    L --> M{Staging Tests?}
    M -->|No| N[Rollback]
    M -->|Yes| O[Deploy to Production]
```

## 📊 Data Processing Pipeline

### Stream Processing

```mermaid
graph LR
    subgraph "Input Sources"
        A[Vehicle Messages]
        B[Sensor Data]
        C[Network Events]
    end
    
    subgraph "Processing Engine"
        D[Message Parser]
        E[Data Validator]
        F[Trust Computer]
        G[Anomaly Detector]
        H[Aggregator]
    end
    
    subgraph "Output Sinks"
        I[Real-time Dashboard]
        J[Analytics Database]
        K[Alert System]
        L[External APIs]
    end
    
    A --> D
    B --> D
    C --> D
    
    D --> E
    E --> F
    F --> G
    G --> H
    
    H --> I
    H --> J
    H --> K
    H --> L
```

### Batch Processing

```mermaid
graph TD
    A[Raw Data] --> B[Data Lake]
    B --> C[ETL Process]
    C --> D[Data Warehouse]
    D --> E[Analytics Engine]
    E --> F[Reports]
    E --> G[ML Models]
    E --> H[Business Intelligence]
    
    subgraph "Scheduled Jobs"
        I[Daily Aggregation]
        J[Weekly Reports]
        K[Monthly Analytics]
    end
    
    D --> I
    D --> J
    D --> K
```

## 🔧 Configuration Management

### Environment Configuration

```mermaid
graph TD
    A[Configuration Files] --> B[Environment Variables]
    B --> C[Config Service]
    C --> D[Service Discovery]
    
    subgraph "Configuration Sources"
        E[Local Files]
        F[Environment Variables]
        G[Secrets Manager]
        H[Configuration Service]
    end
    
    E --> C
    F --> C
    G --> C
    H --> C
    
    C --> I[Service Configuration]
    C --> J[Feature Flags]
    C --> K[Runtime Settings]
```

## 🚀 Performance Optimization

### Database Optimization

```mermaid
graph TD
    A[Query] --> B{Check Cache}
    B -->|Hit| C[Return Result]
    B -->|Miss| D[Execute Query]
    
    D --> E{Use Index?}
    E -->|Yes| F[Index Scan]
    E -->|No| G[Table Scan]
    
    F --> H[Return Result]
    G --> H
    
    H --> I[Update Cache]
    I --> J[Return to Client]
    
    subgraph "Optimization Strategies"
        K[Connection Pooling]
        L[Query Optimization]
        M[Indexing Strategy]
        N[Partitioning]
    end
```

### Caching Strategy

```mermaid
graph TB
    A[Request] --> B[L1: Memory Cache]
    B -->|Hit| C[Return Data]
    B -->|Miss| D[L2: Redis Cache]
    
    D -->|Hit| E[Return Data]
    D -->|Miss| F[L3: Database]
    
    F --> G[Process Data]
    G --> H[Update All Caches]
    H --> I[Return Data]
    
    subgraph "Cache Invalidation"
        J[TTL-based]
        K[Event-based]
        L[Manual]
    end
```

## 🔒 Security Hardening

### Network Security

```mermaid
graph TB
    A[External Request] --> B[WAF]
    B --> C[DDoS Protection]
    C --> D[Rate Limiting]
    D --> E[Authentication]
    E --> F[Authorization]
    F --> G[API Gateway]
    
    subgraph "Security Layers"
        H[Network Layer]
        I[Transport Layer]
        J[Application Layer]
        K[Data Layer]
    end
    
    G --> H
    H --> I
    I --> J
    J --> K
```

### Data Protection

```mermaid
graph TD
    A[Sensitive Data] --> B[Encryption at Rest]
    B --> C[Encryption in Transit]
    C --> D[Access Control]
    D --> E[Audit Logging]
    
    subgraph "Protection Methods"
        F[AES-256 Encryption]
        G[TLS 1.3]
        H[Role-based Access]
        I[Data Masking]
    end
    
    E --> F
    E --> G
    E --> H
    E --> I
```

## 📈 Scalability Patterns

### Horizontal Scaling

```mermaid
graph TB
    A[Load Balancer] --> B[Service Instance 1]
    A --> C[Service Instance 2]
    A --> D[Service Instance N]
    
    B --> E[Database Cluster]
    C --> E
    D --> E
    
    subgraph "Scaling Triggers"
        F[CPU Usage > 80%]
        G[Memory Usage > 80%]
        H[Response Time > 500ms]
        I[Queue Length > 1000]
    end
    
    F --> J[Scale Up]
    G --> J
    H --> J
    I --> J
```

### Auto-scaling

```mermaid
graph TD
    A[Monitor Metrics] --> B{Threshold Exceeded?}
    B -->|No| A
    B -->|Yes| C[Scale Decision]
    
    C --> D{Scale Up or Down?}
    D -->|Up| E[Add Instances]
    D -->|Down| F[Remove Instances]
    
    E --> G[Update Load Balancer]
    F --> G
    
    G --> H[Monitor Performance]
    H --> A
```

This architecture provides a robust, scalable, and secure foundation for the GeoVAN system, enabling it to handle thousands of vehicles with sub-millisecond latency while maintaining cryptographic integrity and privacy protection.
