use config::{Config as ConfigSource, Environment, File};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::time::Duration;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ConfigError {
    #[error("Failed to load configuration: {0}")]
    LoadError(#[from] config::ConfigError),
    #[error("Invalid configuration value: {0}")]
    ValidationError(String),
}

pub type Result<T> = std::result::Result<T, ConfigError>;

/// Main configuration structure for the GeoVAN system
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    /// Path to the configuration file
    pub config_path: PathBuf,
    
    /// Application settings
    pub app: AppConfig,
    
    /// Database configuration
    pub database: DatabaseConfig,
    
    /// Redis configuration
    pub redis: RedisConfig,
    
    /// RabbitMQ configuration
    pub rabbitmq: RabbitMQConfig,
    
    /// Security configuration
    pub security: SecurityConfig,
    
    /// API configuration
    pub api: ApiConfig,
    
    /// WebSocket configuration
    pub websocket: WebSocketConfig,
    
    /// Monitoring configuration
    pub monitoring: MonitoringConfig,
    
    /// Performance configuration
    pub performance: PerformanceConfig,
    
    /// Privacy configuration
    pub privacy: PrivacyConfig,
}

/// Application-level configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    /// Application name
    pub name: String,
    
    /// Application version
    pub version: String,
    
    /// Environment (development, staging, production)
    pub environment: String,
    
    /// Log level
    pub log_level: String,
    
    /// Data directory
    pub data_dir: PathBuf,
    
    /// Temporary directory
    pub temp_dir: PathBuf,
}

/// Database configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    /// Database URL
    pub url: String,
    
    /// Maximum connections in pool
    pub max_connections: u32,
    
    /// Connection timeout
    pub connection_timeout: Duration,
    
    /// Query timeout
    pub query_timeout: Duration,
    
    /// Enable SSL
    pub ssl_mode: SslMode,
    
    /// SSL certificate path
    pub ssl_cert: Option<PathBuf>,
    
    /// SSL key path
    pub ssl_key: Option<PathBuf>,
    
    /// SSL CA path
    pub ssl_ca: Option<PathBuf>,
}

/// SSL mode for database connections
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SslMode {
    Disable,
    Allow,
    Prefer,
    Require,
    VerifyCA,
    VerifyFull,
}

/// Redis configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RedisConfig {
    /// Redis URL
    pub url: String,
    
    /// Connection pool size
    pub pool_size: u32,
    
    /// Connection timeout
    pub connection_timeout: Duration,
    
    /// Read timeout
    pub read_timeout: Duration,
    
    /// Write timeout
    pub write_timeout: Duration,
    
    /// Enable TLS
    pub tls: bool,
    
    /// TLS certificate path
    pub tls_cert: Option<PathBuf>,
}

/// RabbitMQ configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RabbitMQConfig {
    /// RabbitMQ URL
    pub url: String,
    
    /// Connection timeout
    pub connection_timeout: Duration,
    
    /// Heartbeat interval
    pub heartbeat: Duration,
    
    /// Channel timeout
    pub channel_timeout: Duration,
    
    /// Enable TLS
    pub tls: bool,
    
    /// TLS certificate path
    pub tls_cert: Option<PathBuf>,
}

/// Security configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityConfig {
    /// JWT secret key
    pub jwt_secret: String,
    
    /// JWT expiration time
    pub jwt_expiry: Duration,
    
    /// Refresh token expiration time
    pub refresh_token_expiry: Duration,
    
    /// Certificate authority bundle path
    pub ca_bundle_path: PathBuf,
    
    /// Encryption key (32 bytes, base64 encoded)
    pub encryption_key: String,
    
    /// Key rotation interval
    pub key_rotation_interval: Duration,
    
    /// Maximum login attempts
    pub max_login_attempts: u32,
    
    /// Account lockout duration
    pub lockout_duration: Duration,
    
    /// Enable rate limiting
    pub rate_limiting: bool,
    
    /// Rate limit requests per minute
    pub rate_limit_per_minute: u32,
    
    /// Enable certificate validation
    pub certificate_validation: bool,
    
    /// Certificate expiry warning threshold
    pub cert_expiry_warning: Duration,
    
    /// OCSP stapling enabled
    pub ocsp_stapling: bool,
    
    /// CRL check interval
    pub crl_check_interval: Duration,
}

/// API configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiConfig {
    /// API host
    pub host: String,
    
    /// API port
    pub port: u16,
    
    /// API base path
    pub base_path: String,
    
    /// CORS origins
    pub cors_origins: Vec<String>,
    
    /// Request timeout
    pub request_timeout: Duration,
    
    /// Maximum request size (bytes)
    pub max_request_size: usize,
    
    /// Enable compression
    pub compression: bool,
    
    /// Enable metrics endpoint
    pub metrics_enabled: bool,
    
    /// Metrics path
    pub metrics_path: String,
}

/// WebSocket configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketConfig {
    /// WebSocket host
    pub host: String,
    
    /// WebSocket port
    pub port: u16,
    
    /// Maximum connections
    pub max_connections: u32,
    
    /// Connection timeout
    pub connection_timeout: Duration,
    
    /// Heartbeat interval
    pub heartbeat_interval: Duration,
    
    /// Enable compression
    pub compression: bool,
}

/// Monitoring configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitoringConfig {
    /// Prometheus port
    pub prometheus_port: u16,
    
    /// Grafana port
    pub grafana_port: u16,
    
    /// Health check interval
    pub health_check_interval: Duration,
    
    /// Metrics collection interval
    pub metrics_interval: Duration,
    
    /// Enable distributed tracing
    pub tracing_enabled: bool,
    
    /// Jaeger endpoint
    pub jaeger_endpoint: Option<String>,
    
    /// Log aggregation endpoint
    pub log_endpoint: Option<String>,
}

/// Performance configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceConfig {
    /// Worker thread count
    pub worker_threads: usize,
    
    /// Maximum concurrent requests
    pub max_concurrent_requests: usize,
    
    /// Cache TTL
    pub cache_ttl: Duration,
    
    /// Database connection pool size
    pub db_pool_size: u32,
    
    /// Redis connection pool size
    pub redis_pool_size: u32,
    
    /// Message queue buffer size
    pub queue_buffer_size: usize,
    
    /// Enable connection pooling
    pub connection_pooling: bool,
    
    /// Enable query caching
    pub query_caching: bool,
}

/// Privacy configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrivacyConfig {
    /// Pseudonym rotation interval
    pub pseudonym_rotation_interval: Duration,
    
    /// Location noise standard deviation (meters)
    pub location_noise_stddev: f64,
    
    /// Data retention period
    pub data_retention_days: u32,
    
    /// Enable data anonymization
    pub anonymization_enabled: bool,
    
    /// Enable differential privacy
    pub differential_privacy: bool,
    
    /// Privacy budget
    pub privacy_budget: f64,
    
    /// Enable zero-knowledge proofs
    pub zero_knowledge_proofs: bool,
}

impl Config {
    /// Load configuration from file and environment variables
    pub fn load() -> Result<Self> {
        let config_path = std::env::var("GEOVAN_CONFIG")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("config/geovan.toml"));
        
        let mut config = ConfigSource::builder()
            .add_source(File::from(config_path.as_path()).required(false))
            .add_source(File::from("config/default.toml").required(false))
            .add_source(Environment::with_prefix("GEOVAN").separator("_"))
            .build()?;
        
        let config: Config = config.try_deserialize()?;
        
        // Validate configuration
        config.validate()?;
        
        Ok(config)
    }
    
    /// Validate configuration values
    fn validate(&self) -> Result<()> {
        // Validate database URL
        if self.database.url.is_empty() {
            return Err(ConfigError::ValidationError("Database URL cannot be empty".to_string()));
        }
        
        // Validate Redis URL
        if self.redis.url.is_empty() {
            return Err(ConfigError::ValidationError("Redis URL cannot be empty".to_string()));
        }
        
        // Validate RabbitMQ URL
        if self.rabbitmq.url.is_empty() {
            return Err(ConfigError::ValidationError("RabbitMQ URL cannot be empty".to_string()));
        }
        
        // Validate JWT secret
        if self.security.jwt_secret.len() < 32 {
            return Err(ConfigError::ValidationError("JWT secret must be at least 32 characters".to_string()));
        }
        
        // Validate encryption key
        if self.security.encryption_key.len() != 44 { // base64 encoded 32 bytes
            return Err(ConfigError::ValidationError("Encryption key must be 32 bytes (base64 encoded)".to_string()));
        }
        
        // Validate ports
        if self.api.port == 0 || self.websocket.port == 0 {
            return Err(ConfigError::ValidationError("Ports cannot be 0".to_string()));
        }
        
        // Validate timeouts
        if self.database.connection_timeout.as_secs() == 0 {
            return Err(ConfigError::ValidationError("Database connection timeout cannot be 0".to_string()));
        }
        
        Ok(())
    }
    
    /// Get configuration for a specific environment
    pub fn for_environment(env: &str) -> Result<Self> {
        let mut config = Self::load()?;
        
        // Override with environment-specific settings
        let env_config_path = format!("config/geovan.{}.toml", env);
        if std::path::Path::new(&env_config_path).exists() {
            let env_config = ConfigSource::builder()
                .add_source(File::from(env_config_path.as_str()))
                .build()?;
            
            let env_config: Config = env_config.try_deserialize()?;
            
            // Merge configurations (environment overrides base)
            config = config.merge(env_config)?;
        }
        
        Ok(config)
    }
    
    /// Merge with another configuration
    fn merge(self, other: Config) -> Result<Self> {
        // This is a simplified merge - in practice, you'd want more sophisticated merging
        Ok(other)
    }
    
    /// Check if running in development mode
    pub fn is_development(&self) -> bool {
        self.app.environment == "development"
    }
    
    /// Check if running in production mode
    pub fn is_production(&self) -> bool {
        self.app.environment == "production"
    }
    
    /// Get database connection string with SSL parameters
    pub fn get_database_url(&self) -> String {
        let mut url = self.database.url.clone();
        
        if let Some(ca_path) = &self.database.ssl_ca {
            url.push_str(&format!("&sslmode={}&sslrootcert={}", 
                self.database.ssl_mode.to_string(), 
                ca_path.display()));
        }
        
        url
    }
}

impl Default for Config {
    fn default() -> Self {
        Self {
            config_path: PathBuf::from("config/geovan.toml"),
            app: AppConfig::default(),
            database: DatabaseConfig::default(),
            redis: RedisConfig::default(),
            rabbitmq: RabbitMQConfig::default(),
            security: SecurityConfig::default(),
            api: ApiConfig::default(),
            websocket: WebSocketConfig::default(),
            monitoring: MonitoringConfig::default(),
            performance: PerformanceConfig::default(),
            privacy: PrivacyConfig::default(),
        }
    }
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            name: "GeoVAN".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            environment: "development".to_string(),
            log_level: "info".to_string(),
            data_dir: PathBuf::from("data"),
            temp_dir: PathBuf::from("tmp"),
        }
    }
}

impl Default for DatabaseConfig {
    fn default() -> Self {
        Self {
            url: "postgresql://localhost:5432/geovan".to_string(),
            max_connections: 10,
            connection_timeout: Duration::from_secs(30),
            query_timeout: Duration::from_secs(60),
            ssl_mode: SslMode::Prefer,
            ssl_cert: None,
            ssl_key: None,
            ssl_ca: None,
        }
    }
}

impl Default for RedisConfig {
    fn default() -> Self {
        Self {
            url: "redis://localhost:6379".to_string(),
            pool_size: 10,
            connection_timeout: Duration::from_secs(5),
            read_timeout: Duration::from_secs(3),
            write_timeout: Duration::from_secs(3),
            tls: false,
            tls_cert: None,
        }
    }
}

impl Default for RabbitMQConfig {
    fn default() -> Self {
        Self {
            url: "amqp://localhost:5672".to_string(),
            connection_timeout: Duration::from_secs(30),
            heartbeat: Duration::from_secs(60),
            channel_timeout: Duration::from_secs(30),
            tls: false,
            tls_cert: None,
        }
    }
}

impl Default for SecurityConfig {
    fn default() -> Self {
        Self {
            jwt_secret: "your-super-secret-jwt-key-change-in-production".to_string(),
            jwt_expiry: Duration::from_secs(3600), // 1 hour
            refresh_token_expiry: Duration::from_secs(604800), // 7 days
            ca_bundle_path: PathBuf::from("/etc/ssl/certs/ca-bundle.crt"),
            encryption_key: "dGVzdC1rZXktZm9yLWRldmVsb3BtZW50LW9ubHk=".to_string(), // base64 encoded
            key_rotation_interval: Duration::from_secs(86400), // 24 hours
            max_login_attempts: 5,
            lockout_duration: Duration::from_secs(900), // 15 minutes
            rate_limiting: true,
            rate_limit_per_minute: 1000,
            certificate_validation: true,
            cert_expiry_warning: Duration::from_secs(2592000), // 30 days
            ocsp_stapling: true,
            crl_check_interval: Duration::from_secs(3600), // 1 hour
        }
    }
}

impl Default for ApiConfig {
    fn default() -> Self {
        Self {
            host: "127.0.0.1".to_string(),
            port: 8080,
            base_path: "/api/v1".to_string(),
            cors_origins: vec!["http://localhost:3000".to_string()],
            request_timeout: Duration::from_secs(30),
            max_request_size: 10 * 1024 * 1024, // 10MB
            compression: true,
            metrics_enabled: true,
            metrics_path: "/metrics".to_string(),
        }
    }
}

impl Default for WebSocketConfig {
    fn default() -> Self {
        Self {
            host: "127.0.0.1".to_string(),
            port: 8081,
            max_connections: 10000,
            connection_timeout: Duration::from_secs(30),
            heartbeat_interval: Duration::from_secs(30),
            compression: true,
        }
    }
}

impl Default for MonitoringConfig {
    fn default() -> Self {
        Self {
            prometheus_port: 9090,
            grafana_port: 3000,
            health_check_interval: Duration::from_secs(30),
            metrics_interval: Duration::from_secs(15),
            tracing_enabled: false,
            jaeger_endpoint: None,
            log_endpoint: None,
        }
    }
}

impl Default for PerformanceConfig {
    fn default() -> Self {
        Self {
            worker_threads: num_cpus::get(),
            max_concurrent_requests: 1000,
            cache_ttl: Duration::from_secs(300), // 5 minutes
            db_pool_size: 10,
            redis_pool_size: 10,
            queue_buffer_size: 10000,
            connection_pooling: true,
            query_caching: true,
        }
    }
}

impl Default for PrivacyConfig {
    fn default() -> Self {
        Self {
            pseudonym_rotation_interval: Duration::from_secs(300), // 5 minutes
            location_noise_stddev: 5.0, // 5 meters
            data_retention_days: 90,
            anonymization_enabled: true,
            differential_privacy: false,
            privacy_budget: 1.0,
            zero_knowledge_proofs: false,
        }
    }
}

impl std::fmt::Display for SslMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SslMode::Disable => write!(f, "disable"),
            SslMode::Allow => write!(f, "allow"),
            SslMode::Prefer => write!(f, "prefer"),
            SslMode::Require => write!(f, "require"),
            SslMode::VerifyCA => write!(f, "verify-ca"),
            SslMode::VerifyFull => write!(f, "verify-full"),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_config_default() {
        let config = Config::default();
        assert_eq!(config.app.name, "GeoVAN");
        assert_eq!(config.api.port, 8080);
        assert_eq!(config.websocket.port, 8081);
    }
    
    #[test]
    fn test_ssl_mode_display() {
        assert_eq!(SslMode::Prefer.to_string(), "prefer");
        assert_eq!(SslMode::Require.to_string(), "require");
    }
    
    #[test]
    fn test_config_validation() {
        let mut config = Config::default();
        
        // Test valid configuration
        assert!(config.validate().is_ok());
        
        // Test invalid database URL
        config.database.url = "".to_string();
        assert!(config.validate().is_err());
        
        // Test invalid JWT secret
        config.database.url = "postgresql://localhost:5432/geovan".to_string();
        config.security.jwt_secret = "short".to_string();
        assert!(config.validate().is_err());
    }
}
