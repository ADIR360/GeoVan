use thiserror::Error;
use std::io;

/// Main error type for the GeoVAN system
#[derive(Error, Debug)]
pub enum GeoVANError {
    // Configuration errors
    #[error("Configuration error: {0}")]
    Config(#[from] crate::config::ConfigError),
    
    // Database errors
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    
    // Redis errors
    #[error("Redis error: {0}")]
    Redis(#[from] redis::RedisError),
    
    // RabbitMQ errors
    #[error("RabbitMQ error: {0}")]
    RabbitMQ(#[from] lapin::Error),
    
    // Security errors
    #[error("Security error: {0}")]
    Security(#[from] SecurityError),
    
    // Authentication errors
    #[error("Authentication error: {0}")]
    Authentication(#[from] AuthenticationError),
    
    // Authorization errors
    #[error("Authorization error: {0}")]
    Authorization(#[from] AuthorizationError),
    
    // Validation errors
    #[error("Validation error: {0}")]
    Validation(#[from] ValidationError),
    
    // Serialization errors
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
    
    // Protocol buffer errors
    #[error("Protocol buffer error: {0}")]
    Protobuf(#[from] prost::DecodeError),
    
    // Cryptographic errors
    #[error("Cryptographic error: {0}")]
    Cryptographic(#[from] CryptographicError),
    
    // Network errors
    #[error("Network error: {0}")]
    Network(#[from] NetworkError),
    
    // Rate limiting errors
    #[error("Rate limit exceeded: {0}")]
    RateLimit(String),
    
    // Timeout errors
    #[error("Operation timed out: {0}")]
    Timeout(String),
    
    // Resource errors
    #[error("Resource error: {0}")]
    Resource(#[from] ResourceError),
    
    // Business logic errors
    #[error("Business logic error: {0}")]
    BusinessLogic(#[from] BusinessLogicError),
    
    // External service errors
    #[error("External service error: {0}")]
    ExternalService(#[from] ExternalServiceError),
    
    // IO errors
    #[error("IO error: {0}")]
    Io(#[from] io::Error),
    
    // Generic errors
    #[error("Generic error: {0}")]
    Generic(String),
    
    // Unknown errors
    #[error("Unknown error occurred")]
    Unknown,
}

/// Security-related errors
#[derive(Error, Debug)]
pub enum SecurityError {
    #[error("Invalid signature: {0}")]
    InvalidSignature(String),
    
    #[error("Certificate validation failed: {0}")]
    CertificateValidation(String),
    
    #[error("Certificate expired: {0}")]
    CertificateExpired(String),
    
    #[error("Certificate revoked: {0}")]
    CertificateRevoked(String),
    
    #[error("Invalid certificate chain: {0}")]
    InvalidCertificateChain(String),
    
    #[error("Encryption failed: {0}")]
    EncryptionFailed(String),
    
    #[error("Decryption failed: {0}")]
    DecryptionFailed(String),
    
    #[error("Hash verification failed: {0}")]
    HashVerificationFailed(String),
    
    #[error("Replay attack detected: {0}")]
    ReplayAttack(String),
    
    #[error("Invalid nonce: {0}")]
    InvalidNonce(String),
    
    #[error("Key not found: {0}")]
    KeyNotFound(String),
    
    #[error("Invalid key format: {0}")]
    InvalidKeyFormat(String),
    
    #[error("Trust score too low: {0}")]
    TrustScoreTooLow(f32),
    
    #[error("Anomaly detected: {0}")]
    AnomalyDetected(String),
    
    #[error("Threat detected: {0}")]
    ThreatDetected(String),
}

/// Authentication errors
#[derive(Error, Debug)]
pub enum AuthenticationError {
    #[error("Invalid credentials")]
    InvalidCredentials,
    
    #[error("User not found: {0}")]
    UserNotFound(String),
    
    #[error("Account locked: {0}")]
    AccountLocked(String),
    
    #[error("Token expired: {0}")]
    TokenExpired(String),
    
    #[error("Invalid token: {0}")]
    InvalidToken(String),
    
    #[error("Token refresh failed: {0}")]
    TokenRefreshFailed(String),
    
    #[error("Too many login attempts")]
    TooManyLoginAttempts,
    
    #[error("Password too weak: {0}")]
    PasswordTooWeak(String),
    
    #[error("Two-factor authentication required")]
    TwoFactorRequired,
    
    #[error("Two-factor authentication failed")]
    TwoFactorFailed,
}

/// Authorization errors
#[derive(Error, Debug)]
pub enum AuthorizationError {
    #[error("Insufficient permissions: {0}")]
    InsufficientPermissions(String),
    
    #[error("Role required: {0}")]
    RoleRequired(String),
    
    #[error("Resource access denied: {0}")]
    ResourceAccessDenied(String),
    
    #[error("Operation not allowed: {0}")]
    OperationNotAllowed(String),
    
    #[error("Scope required: {0}")]
    ScopeRequired(String),
    
    #[error("API key invalid: {0}")]
    ApiKeyInvalid(String),
    
    #[error("Rate limit exceeded for user: {0}")]
    UserRateLimitExceeded(String),
}

/// Validation errors
#[derive(Error, Debug)]
pub enum ValidationError {
    #[error("Field validation failed: {field} - {message}")]
    FieldValidation { field: String, message: String },
    
    #[error("Required field missing: {0}")]
    RequiredFieldMissing(String),
    
    #[error("Invalid format: {field} - {format}")]
    InvalidFormat { field: String, format: String },
    
    #[error("Value out of range: {field} - {value} (min: {min}, max: {max})")]
    ValueOutOfRange { field: String, value: String, min: String, max: String },
    
    #[error("Invalid enum value: {field} - {value}")]
    InvalidEnumValue { field: String, value: String },
    
    #[error("String too long: {field} - {length} (max: {max})")]
    StringTooLong { field: String, length: usize, max: usize },
    
    #[error("String too short: {field} - {length} (min: {min})")]
    StringTooShort { field: String, length: usize, min: usize },
    
    #[error("Invalid email format: {0}")]
    InvalidEmail(String),
    
    #[error("Invalid URL format: {0}")]
    InvalidUrl(String),
    
    #[error("Invalid phone format: {0}")]
    InvalidPhone(String),
    
    #[error("Invalid UUID format: {0}")]
    InvalidUuid(String),
    
    #[error("Invalid date format: {0}")]
    InvalidDate(String),
    
    #[error("Invalid JSON format: {0}")]
    InvalidJson(String),
}

/// Cryptographic errors
#[derive(Error, Debug)]
pub enum CryptographicError {
    #[error("Key generation failed: {0}")]
    KeyGenerationFailed(String),
    
    #[error("Key import failed: {0}")]
    KeyImportFailed(String),
    
    #[error("Key export failed: {0}")]
    KeyExportFailed(String),
    
    #[error("Signing failed: {0}")]
    SigningFailed(String),
    
    #[error("Verification failed: {0}")]
    VerificationFailed(String),
    
    #[error("Random number generation failed: {0}")]
    RandomGenerationFailed(String),
    
    #[error("Hash computation failed: {0}")]
    HashComputationFailed(String),
    
    #[error("Invalid algorithm: {0}")]
    InvalidAlgorithm(String),
    
    #[error("Key size too small: {0}")]
    KeySizeTooSmall(usize),
    
    #[error("Key size too large: {0}")]
    KeySizeTooLarge(usize),
}

/// Network errors
#[derive(Error, Debug)]
pub enum NetworkError {
    #[error("Connection failed: {0}")]
    ConnectionFailed(String),
    
    #[error("Connection timeout: {0}")]
    ConnectionTimeout(String),
    
    #[error("Connection closed: {0}")]
    ConnectionClosed(String),
    
    #[error("Network unreachable: {0}")]
    NetworkUnreachable(String),
    
    #[error("Host unreachable: {0}")]
    HostUnreachable(String),
    
    #[error("DNS resolution failed: {0}")]
    DnsResolutionFailed(String),
    
    #[error("TLS handshake failed: {0}")]
    TlsHandshakeFailed(String),
    
    #[error("Certificate verification failed: {0}")]
    CertificateVerificationFailed(String),
    
    #[error("Protocol error: {0}")]
    ProtocolError(String),
    
    #[error("Message too large: {0}")]
    MessageTooLarge(usize),
    
    #[error("Invalid message format: {0}")]
    InvalidMessageFormat(String),
}

/// Resource errors
#[derive(Error, Debug)]
pub enum ResourceError {
    #[error("Resource not found: {0}")]
    NotFound(String),
    
    #[error("Resource already exists: {0}")]
    AlreadyExists(String),
    
    #[error("Resource in use: {0}")]
    InUse(String),
    
    #[error("Resource exhausted: {0}")]
    Exhausted(String),
    
    #[error("Resource locked: {0}")]
    Locked(String),
    
    #[error("Resource corrupted: {0}")]
    Corrupted(String),
    
    #[error("Resource access denied: {0}")]
    AccessDenied(String),
    
    #[error("Resource timeout: {0}")]
    Timeout(String),
    
    #[error("Resource unavailable: {0}")]
    Unavailable(String),
}

/// Business logic errors
#[derive(Error, Debug)]
pub enum BusinessLogicError {
    #[error("Invalid state transition: {from} -> {to}")]
    InvalidStateTransition { from: String, to: String },
    
    #[error("Business rule violation: {0}")]
    BusinessRuleViolation(String),
    
    #[error("Constraint violation: {0}")]
    ConstraintViolation(String),
    
    #[error("Workflow error: {0}")]
    WorkflowError(String),
    
    #[error("Validation rule failed: {0}")]
    ValidationRuleFailed(String),
    
    #[error("Business process error: {0}")]
    BusinessProcessError(String),
    
    #[error("Domain error: {0}")]
    DomainError(String),
}

/// External service errors
#[derive(Error, Debug)]
pub enum ExternalServiceError {
    #[error("Service unavailable: {0}")]
    ServiceUnavailable(String),
    
    #[error("Service timeout: {0}")]
    ServiceTimeout(String),
    
    #[error("Service error: {0}")]
    ServiceError(String),
    
    #[error("Authentication failed: {0}")]
    AuthenticationFailed(String),
    
    #[error("Authorization failed: {0}")]
    AuthorizationFailed(String),
    
    #[error("Rate limit exceeded: {0}")]
    RateLimitExceeded(String),
    
    #[error("Quota exceeded: {0}")]
    QuotaExceeded(String),
    
    #[error("Invalid response: {0}")]
    InvalidResponse(String),
    
    #[error("Network error: {0}")]
    NetworkError(String),
}

/// Result type for GeoVAN operations
pub type Result<T> = std::result::Result<T, GeoVANError>;

/// Extension trait for converting other error types to GeoVANError
pub trait IntoGeoVANError<T> {
    fn into_geovan_error(self) -> Result<T>;
}

impl<T, E> IntoGeoVANError<T> for std::result::Result<T, E>
where
    E: std::error::Error + Send + Sync + 'static,
{
    fn into_geovan_error(self) -> Result<T> {
        self.map_err(|e| GeoVANError::Generic(e.to_string()))
    }
}

/// Helper functions for common error patterns
impl GeoVANError {
    /// Create a generic error with a message
    pub fn generic(message: impl Into<String>) -> Self {
        Self::Generic(message.into())
    }
    
    /// Create a validation error for a field
    pub fn field_validation(field: impl Into<String>, message: impl Into<String>) -> Self {
        Self::Validation(ValidationError::FieldValidation {
            field: field.into(),
            message: message.into(),
        })
    }
    
    /// Create a business logic error
    pub fn business_logic(message: impl Into<String>) -> Self {
        Self::BusinessLogic(BusinessLogicError::BusinessRuleViolation(message.into()))
    }
    
    /// Check if the error is a security-related error
    pub fn is_security_error(&self) -> bool {
        matches!(self, Self::Security(_) | Self::Authentication(_) | Self::Authorization(_))
    }
    
    /// Check if the error is a network-related error
    pub fn is_network_error(&self) -> bool {
        matches!(self, Self::Network(_) | Self::ExternalService(_))
    }
    
    /// Check if the error is recoverable
    pub fn is_recoverable(&self) -> bool {
        matches!(
            self,
            Self::Timeout(_) | Self::RateLimit(_) | Self::Resource(ResourceError::Timeout(_))
        )
    }
    
    /// Get the error code for API responses
    pub fn error_code(&self) -> &'static str {
        match self {
            Self::Config(_) => "CONFIG_ERROR",
            Self::Database(_) => "DATABASE_ERROR",
            Self::Redis(_) => "REDIS_ERROR",
            Self::RabbitMQ(_) => "RABBITMQ_ERROR",
            Self::Security(_) => "SECURITY_ERROR",
            Self::Authentication(_) => "AUTHENTICATION_ERROR",
            Self::Authorization(_) => "AUTHORIZATION_ERROR",
            Self::Validation(_) => "VALIDATION_ERROR",
            Self::Serialization(_) => "SERIALIZATION_ERROR",
            Self::Protobuf(_) => "PROTOBUF_ERROR",
            Self::Cryptographic(_) => "CRYPTOGRAPHIC_ERROR",
            Self::Network(_) => "NETWORK_ERROR",
            Self::RateLimit(_) => "RATE_LIMIT_ERROR",
            Self::Timeout(_) => "TIMEOUT_ERROR",
            Self::Resource(_) => "RESOURCE_ERROR",
            Self::BusinessLogic(_) => "BUSINESS_LOGIC_ERROR",
            Self::ExternalService(_) => "EXTERNAL_SERVICE_ERROR",
            Self::Io(_) => "IO_ERROR",
            Self::Generic(_) => "GENERIC_ERROR",
            Self::Unknown => "UNKNOWN_ERROR",
        }
    }
    
    /// Get the HTTP status code for the error
    pub fn http_status_code(&self) -> u16 {
        match self {
            Self::Config(_) => 500,
            Self::Database(_) => 503,
            Self::Redis(_) => 503,
            Self::RabbitMQ(_) => 503,
            Self::Security(_) => 403,
            Self::Authentication(_) => 401,
            Self::Authorization(_) => 403,
            Self::Validation(_) => 400,
            Self::Serialization(_) => 400,
            Self::Protobuf(_) => 400,
            Self::Cryptographic(_) => 403,
            Self::Network(_) => 503,
            Self::RateLimit(_) => 429,
            Self::Timeout(_) => 408,
            Self::Resource(ResourceError::NotFound(_)) => 404,
            Self::Resource(ResourceError::AlreadyExists(_)) => 409,
            Self::Resource(ResourceError::InUse(_)) => 423,
            Self::Resource(ResourceError::Exhausted(_)) => 507,
            Self::Resource(ResourceError::Locked(_)) => 423,
            Self::Resource(ResourceError::Corrupted(_)) => 500,
            Self::Resource(ResourceError::AccessDenied(_)) => 403,
            Self::Resource(ResourceError::Timeout(_)) => 408,
            Self::Resource(ResourceError::Unavailable(_)) => 503,
            Self::BusinessLogic(_) => 422,
            Self::ExternalService(_) => 502,
            Self::Io(_) => 500,
            Self::Generic(_) => 500,
            Self::Unknown => 500,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_error_code() {
        let error = GeoVANError::Validation(ValidationError::RequiredFieldMissing("test".to_string()));
        assert_eq!(error.error_code(), "VALIDATION_ERROR");
    }
    
    #[test]
    fn test_http_status_code() {
        let error = GeoVANError::Authentication(AuthenticationError::InvalidCredentials);
        assert_eq!(error.http_status_code(), 401);
    }
    
    #[test]
    fn test_is_security_error() {
        let error = GeoVANError::Security(SecurityError::InvalidSignature("test".to_string()));
        assert!(error.is_security_error());
        
        let error = GeoVANError::Generic("test".to_string());
        assert!(!error.is_security_error());
    }
    
    #[test]
    fn test_is_recoverable() {
        let error = GeoVANError::Timeout("test".to_string());
        assert!(error.is_recoverable());
        
        let error = GeoVANError::Generic("test".to_string());
        assert!(!error.is_recoverable());
    }
}
