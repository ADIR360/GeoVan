# GeoVAN Quick Start Guide

This guide will help you get the GeoVAN system up and running in minutes. GeoVAN is an enterprise-grade VANET (Vehicular Ad-hoc Network) platform with real-time tracking, security validation, and analytics.

## 🚀 Prerequisites

Before you begin, ensure you have the following installed:

- **Docker**: 20.10+ with Docker Compose
- **Git**: Latest version
- **Make** (optional, for convenience commands)
- **4GB+ RAM** available for all services
- **10GB+ disk space** for data storage

### Quick Prerequisites Check

```bash
# Check Docker version
docker --version
docker-compose --version

# Check Git version
git --version

# Check available memory (Linux/macOS)
free -h  # Linux
vm_stat   # macOS
```

## 📥 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/geovan.git
cd geovan
```

### 2. Set Environment Variables

Create a `.env` file in the root directory:

```bash
# Copy the example environment file
cp .env.example .env

# Edit the file with your configuration
nano .env
```

**Important**: Change the default passwords in production!

```bash
# Database
POSTGRES_PASSWORD=your_secure_password
REDIS_PASSWORD=your_secure_password
RABBITMQ_PASSWORD=your_secure_password

# Security
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars
ENCRYPTION_KEY=your_32_byte_base64_encoded_key

# API Keys (if using external services)
MAPBOX_TOKEN=your_mapbox_token
WEATHER_API_KEY=your_weather_api_key
```

### 3. Generate SSL Certificates (Optional)

For production use, generate SSL certificates:

```bash
# Create certificates directory
mkdir -p config/nginx/ssl

# Generate self-signed certificate (development only)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout config/nginx/ssl/nginx.key \
  -out config/nginx/ssl/nginx.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

## 🚀 Quick Start

### Option 1: Start Everything (Recommended)

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### Option 2: Start Core Services Only

```bash
# Start only essential services
docker-compose up -d postgres redis rabbitmq geovan-api geovan-frontend

# Start additional services as needed
docker-compose up -d geovan-tracker geovan-trust
```

### Option 3: Development Mode

```bash
# Start with development configuration
docker-compose -f docker-compose.dev.yml up -d

# Or start individual services for development
docker-compose up -d postgres redis rabbitmq
cargo run --bin geovan-api
cd frontend && npm run dev
```

## 🌐 Access the System

Once all services are running, you can access:

| Service | URL | Default Credentials |
|---------|-----|-------------------|
| **Frontend Dashboard** | http://localhost:3000 | `admin` / `admin123` |
| **API Documentation** | http://localhost:8080/docs | N/A |
| **Grafana** | http://localhost:3000 | `admin` / `admin_password` |
| **Prometheus** | http://localhost:9090 | N/A |
| **RabbitMQ Management** | http://localhost:15672 | `geovan` / `rabbitmq_password` |
| **Kibana** | http://localhost:5601 | N/A |
| **Jaeger** | http://localhost:16686 | N/A |

## 🧪 Test the System

### 1. Check Service Health

```bash
# Check all services are healthy
docker-compose ps

# Check specific service logs
docker-compose logs geovan-api
docker-compose logs geovan-frontend
```

### 2. Test API Endpoints

```bash
# Test health check
curl http://localhost:8080/health

# Test authentication
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 3. Simulate Vehicle Data

```bash
# Start vehicle simulator
docker-compose up -d vehicle-simulator

# Check simulated vehicles
curl http://localhost:8080/api/v1/vehicles
```

### 4. View Real-time Data

1. Open http://localhost:3000 in your browser
2. Login with `admin` / `admin123`
3. Navigate to the Vehicle Map
4. Watch real-time vehicle positions

## 🔧 Configuration

### Database Configuration

The system uses PostgreSQL with TimescaleDB for time-series data:

```bash
# Connect to database
docker exec -it geovan-postgres psql -U geovan -d geovan

# Check tables
\dt

# Check vehicle data
SELECT COUNT(*) FROM vehicle_positions;
```

### Redis Configuration

Redis is used for caching and real-time data:

```bash
# Connect to Redis
docker exec -it geovan-redis redis-cli -a redis_password

# Check keys
KEYS *

# Monitor real-time commands
MONITOR
```

### Message Queue Configuration

RabbitMQ handles message queuing:

```bash
# Access management interface
# Open http://localhost:15672 in browser
# Login: geovan / rabbitmq_password

# Check queues
docker exec -it geovan-rabbitmq rabbitmqctl list_queues
```

## 📊 Monitoring & Logs

### View System Metrics

```bash
# Prometheus metrics
curl http://localhost:8080/metrics

# Service health
curl http://localhost:8080/health
```

### Access Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f geovan-api
docker-compose logs -f geovan-tracker

# Access Kibana for log analysis
# Open http://localhost:5601
```

### Performance Monitoring

```bash
# Check resource usage
docker stats

# Monitor specific containers
docker stats geovan-api geovan-tracker geovan-trust
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Conflicts

```bash
# Check what's using a port
lsof -i :8080
netstat -tulpn | grep :8080

# Stop conflicting services
sudo systemctl stop nginx  # if using port 80/443
```

#### 2. Database Connection Issues

```bash
# Check database status
docker-compose logs postgres

# Restart database
docker-compose restart postgres

# Check database health
docker exec geovan-postgres pg_isready -U geovan
```

#### 3. Memory Issues

```bash
# Check available memory
free -h

# Reduce service replicas
docker-compose up -d --scale geovan-tracker=1 --scale geovan-trust=1
```

#### 4. Service Startup Order

If services fail to start, ensure proper startup order:

```bash
# Start infrastructure first
docker-compose up -d postgres redis rabbitmq

# Wait for health checks
sleep 30

# Start application services
docker-compose up -d geovan-api geovan-frontend
```

### Debug Commands

```bash
# Check service status
docker-compose ps

# View detailed logs
docker-compose logs --tail=100 -f

# Check network connectivity
docker network ls
docker network inspect geovan_geovan-network

# Access service shell
docker exec -it geovan-api /bin/bash
```

## 🔒 Security Configuration

### Production Security

For production deployment:

1. **Change all default passwords**
2. **Use proper SSL certificates**
3. **Configure firewall rules**
4. **Enable authentication for all services**
5. **Use secrets management**

```bash
# Generate secure passwords
openssl rand -base64 32
openssl rand -base64 32

# Update .env file with secure values
nano .env
```

### Network Security

```bash
# Check exposed ports
docker-compose ps
netstat -tulpn | grep -E ':(80|443|8080|3000)'

# Configure firewall (Ubuntu/Debian)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp
sudo ufw allow 3000/tcp
```

## 📈 Scaling

### Horizontal Scaling

```bash
# Scale tracking service
docker-compose up -d --scale geovan-tracker=5

# Scale trust service
docker-compose up -d --scale geovan-trust=3

# Check scaling
docker-compose ps
```

### Load Balancing

The system includes built-in load balancing:

```bash
# Check load balancer configuration
docker-compose config | grep -A 10 nginx

# Monitor traffic
docker exec geovan-nginx nginx -t
```

## 🧹 Maintenance

### Regular Maintenance

```bash
# Update images
docker-compose pull
docker-compose up -d

# Clean up unused resources
docker system prune -f

# Backup database
docker exec geovan-postgres pg_dump -U geovan geovan > backup.sql

# Check disk usage
docker system df
```

### Log Rotation

```bash
# Configure log rotation
docker-compose exec geovan-api logrotate -f /etc/logrotate.conf

# Clean old logs
docker-compose logs --tail=1000 > recent_logs.txt
```

## 📚 Next Steps

### 1. Explore the Dashboard

- Navigate through different sections
- Customize your view
- Set up alerts and notifications

### 2. Configure Integrations

- Set up external data sources
- Configure notification systems
- Integrate with existing infrastructure

### 3. Customize Security

- Implement custom authentication
- Configure role-based access control
- Set up audit logging

### 4. Scale for Production

- Set up monitoring and alerting
- Configure backup and recovery
- Implement high availability

## 🆘 Getting Help

### Documentation

- **API Reference**: http://localhost:8080/docs
- **System Architecture**: See README.md
- **Configuration**: See config/ directory

### Community Support

- **GitHub Issues**: Report bugs and feature requests
- **Discord**: Join our community for real-time help
- **Email**: Contact support@geovan.dev

### Debug Information

When reporting issues, include:

```bash
# System information
docker-compose version
docker version
uname -a

# Service status
docker-compose ps
docker-compose logs --tail=100

# Configuration
cat .env
docker-compose config
```

## 🎉 Congratulations!

You've successfully deployed GeoVAN! The system is now running with:

- ✅ Real-time vehicle tracking
- ✅ Secure message processing
- ✅ Trust scoring and anomaly detection
- ✅ Comprehensive monitoring
- ✅ Scalable architecture

Start exploring the dashboard and customizing the system for your needs!
