//! Core types and traits for the GeoVAN system
//!
//! This module defines the fundamental data structures, traits, and types
//! used throughout the system for vehicle tracking, security, and analytics.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use uuid::Uuid;
use chrono::{DateTime, Utc};

// Re-export common types
pub use uuid::Uuid as VehicleId;
pub type Timestamp = u64;
pub type TrustScore = f32;
pub type AnomalyScore = f32;

/// Vehicle position in 3D space with accuracy metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    /// Latitude in WGS84 (degrees)
    pub lat: f64,
    
    /// Longitude in WGS84 (degrees)
    pub lon: f64,
    
    /// Altitude above sea level (meters)
    pub alt: Option<f64>,
    
    /// Horizontal accuracy (meters, 95% confidence)
    pub accuracy_horizontal: Option<f32>,
    
    /// Vertical accuracy (meters, 95% confidence)
    pub accuracy_vertical: Option<f32>,
    
    /// Horizontal dilution of precision
    pub hdop: Option<f32>,
    
    /// Vertical dilution of precision
    pub vdop: Option<f32>,
    
    /// Time dilution of precision
    pub tdop: Option<f32>,
    
    /// Number of satellites used for positioning
    pub satellites_used: Option<u32>,
    
    /// Total satellites visible
    pub satellites_visible: Option<u32>,
}

/// 3D velocity vector with accuracy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Velocity {
    /// Velocity in X direction (m/s)
    pub vx: f32,
    
    /// Velocity in Y direction (m/s)
    pub vy: f32,
    
    /// Velocity in Z direction (m/s)
    pub vz: f32,
    
    /// Total speed magnitude (m/s)
    pub speed: f32,
    
    /// Speed measurement accuracy (m/s)
    pub speed_accuracy: Option<f32>,
    
    /// Acceleration magnitude (m/s²)
    pub acceleration: Option<f32>,
    
    /// Deceleration magnitude (m/s²)
    pub deceleration: Option<f32>,
}

/// Vehicle metadata and capabilities
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VehicleMetadata {
    /// Vehicle manufacturer
    pub make: Option<String>,
    
    /// Vehicle model
    pub model: Option<String>,
    
    /// Manufacturing year
    pub year: Option<String>,
    
    /// Vehicle Identification Number (encrypted)
    pub vin: Option<String>,
    
    /// Vehicle classification
    pub vehicle_type: VehicleType,
    
    /// Vehicle size category
    pub size: VehicleSize,
    
    /// Vehicle features (ABS, ESC, etc.)
    pub features: Vec<String>,
    
    /// Safety and compliance certifications
    pub certifications: Vec<String>,
    
    /// Fuel type
    pub fuel_type: Option<FuelType>,
    
    /// Fuel efficiency (L/100km or mpg)
    pub fuel_efficiency: Option<f32>,
    
    /// Emission standard
    pub emission_standard: Option<EuroEmissionStandard>,
    
    /// Safety features
    pub safety_features: Vec<SafetyFeature>,
    
    /// Number of airbags
    pub airbag_count: Option<u32>,
    
    /// Whether vehicle is autonomous capable
    pub autonomous_capable: bool,
    
    /// Autonomous driving level
    pub autonomous_level: AutonomousLevel,
}

/// Vehicle type classification
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum VehicleType {
    Unknown = 0,
    PassengerCar = 1,
    Truck = 2,
    Bus = 3,
    Motorcycle = 4,
    EmergencyVehicle = 5,
    PublicTransport = 6,
    DeliveryVan = 7,
    Taxi = 8,
    RideShare = 9,
    Government = 10,
    Military = 11,
    Construction = 12,
    Agricultural = 13,
    Recreational = 14,
}

/// Vehicle size categories
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum VehicleSize {
    Micro = 0,      // Smart car, small motorcycle
    Small = 1,      // Compact car, large motorcycle
    Medium = 2,     // Sedan, small SUV
    Large = 3,      // Large SUV, pickup truck
    ExtraLarge = 4, // Bus, large truck
    Oversized = 5,  // Oversized load, special transport
}

/// Fuel type enumeration
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum FuelType {
    Gasoline = 0,
    Diesel = 1,
    Electric = 2,
    Hybrid = 3,
    PluginHybrid = 4,
    Hydrogen = 5,
    NaturalGas = 6,
    Biofuel = 7,
}

/// Euro emission standards
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum EuroEmissionStandard {
    Euro1 = 0,
    Euro2 = 1,
    Euro3 = 2,
    Euro4 = 3,
    Euro5 = 4,
    Euro6 = 5,
    Euro7 = 6,
    ZeroEmission = 7,
}

/// Safety features
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SafetyFeature {
    Abs = 0,                    // Anti-lock Braking System
    Esc = 1,                    // Electronic Stability Control
    Tcs = 2,                    // Traction Control System
    Blis = 3,                   // Blind Spot Information System
    Ldw = 4,                    // Lane Departure Warning
    Fcw = 5,                    // Forward Collision Warning
    Aeb = 6,                    // Autonomous Emergency Braking
    Bsm = 7,                    // Blind Spot Monitoring
    Rcta = 8,                   // Rear Cross Traffic Alert
    ParkingSensors = 9,         // Parking sensors
    BackupCamera = 10,          // Backup camera
    SurroundView = 11,          // 360-degree camera system
}

/// Autonomous driving levels
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AutonomousLevel {
    Level0 = 0,                 // No automation
    Level1 = 1,                 // Driver assistance
    Level2 = 2,                 // Partial automation
    Level3 = 3,                 // Conditional automation
    Level4 = 4,                 // High automation
    Level5 = 5,                 // Full automation
}

/// Sensor reading with metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SensorReading {
    /// Sensor type
    pub sensor_type: SensorType,
    
    /// Sensor value
    pub value: f32,
    
    /// Measurement accuracy
    pub accuracy: Option<f32>,
    
    /// When reading was taken
    pub timestamp: DateTime<Utc>,
    
    /// Unit of measurement
    pub unit: String,
    
    /// Minimum expected value
    pub min_value: Option<f32>,
    
    /// Maximum expected value
    pub max_value: Option<f32>,
    
    /// Whether sensor is calibrated
    pub is_calibrated: bool,
    
    /// Last calibration date
    pub calibration_date: Option<u64>,
}

/// Sensor types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SensorType {
    Gps = 0,                     // Global Positioning System
    Accelerometer = 1,           // 3-axis accelerometer
    Gyroscope = 2,               // 3-axis gyroscope
    Magnetometer = 3,            // 3-axis magnetometer
    Temperature = 4,             // Temperature sensor
    Humidity = 5,                // Humidity sensor
    Pressure = 6,                // Barometric pressure
    FuelLevel = 7,               // Fuel level sensor
    EngineRpm = 8,               // Engine revolutions per minute
    EngineTemp = 9,              // Engine temperature
    OilPressure = 10,            // Oil pressure
    TirePressure = 11,           // Tire pressure monitoring
    BrakePressure = 12,          // Brake system pressure
    SteeringAngle = 13,          // Steering wheel angle
    WheelSpeed = 14,             // Individual wheel speed
    BatteryVoltage = 15,         // Battery voltage
    BatteryTemp = 16,            // Battery temperature
    ChargingStatus = 17,         // Electric vehicle charging status
    RangeEstimate = 18,          // Estimated remaining range
}

/// Vehicle capability
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Capability {
    /// Capability name
    pub name: String,
    
    /// Capability version
    pub version: String,
    
    /// Whether capability is enabled
    pub enabled: bool,
    
    /// Capability parameters
    pub parameters: Vec<String>,
    
    /// Last capability update
    pub last_update: u64,
}

/// Trust metrics with detailed scoring
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrustMetrics {
    /// Overall trust score (0.0 - 1.0)
    pub overall_score: TrustScore,
    
    /// Behavioral trust based on movement patterns
    pub behavior_score: TrustScore,
    
    /// Certificate validity and chain trust
    pub certificate_score: TrustScore,
    
    /// Historical trust based on past behavior
    pub history_score: TrustScore,
    
    /// Trust based on proximity to other trusted vehicles
    pub proximity_score: TrustScore,
    
    /// Trust based on sensor data consistency
    pub sensor_score: TrustScore,
    
    /// Detailed trust breakdown
    pub factors: Vec<TrustFactor>,
    
    /// Trust flags and warnings
    pub flags: Vec<String>,
    
    /// Last trust computation
    pub last_update: u64,
    
    /// Next scheduled trust update
    pub next_update: u64,
    
    /// Anomaly detection score (0.0 = normal, 1.0 = highly anomalous)
    pub anomaly_score: AnomalyScore,
    
    /// Detected anomalies
    pub anomalies: Vec<AnomalyType>,
    
    /// Total anomaly count in last 24 hours
    pub anomaly_count: u32,
}

/// Trust factors contributing to overall score
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrustFactor {
    /// Factor name
    pub name: String,
    
    /// Weight in overall calculation
    pub weight: f32,
    
    /// Individual factor score
    pub score: TrustScore,
    
    /// Factor description
    pub description: String,
    
    /// Last calculation timestamp
    pub last_calculation: u64,
}

/// Anomaly types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AnomalyType {
    None = 0,                     // No anomalies detected
    SpeedViolation = 1,           // Speed exceeds limits
    RapidAcceleration = 2,        // Unusual acceleration
    RapidDeceleration = 3,        // Unusual deceleration
    ErraticMovement = 4,          // Erratic driving pattern
    PositionJump = 5,             // Unrealistic position change
    SensorInconsistency = 6,      // Sensor data inconsistency
    CertificateExpired = 7,       // Expired certificate
    SignatureInvalid = 8,         // Invalid cryptographic signature
    ReplayAttempt = 9,            // Potential replay attack
    FrequencyViolation = 10,      // Message frequency violation
    LocationAnomaly = 11,         // Location-based anomaly
    BehaviorChange = 12,          // Sudden behavior change
}

/// Security flags and status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityFlags {
    /// Certificate is valid and not expired
    pub certificate_valid: bool,
    
    /// Cryptographic signature is valid
    pub signature_valid: bool,
    
    /// Message is not a replay
    pub not_replay: bool,
    
    /// Message rate is within limits
    pub rate_limit_ok: bool,
    
    /// Location is geographically plausible
    pub location_plausible: bool,
    
    /// Timestamp is recent and valid
    pub timestamp_fresh: bool,
    
    /// Pseudonym is valid for current epoch
    pub pseudonym_valid: bool,
    
    /// Security warnings
    pub warnings: Vec<SecurityWarning>,
    
    /// Overall threat level (0-10)
    pub threat_level: u32,
    
    /// Description of current threats
    pub threat_description: String,
}

/// Security warnings
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SecurityWarning {
    NoWarnings = 0,               // No security warnings
    CertificateExpiring = 1,      // Certificate expiring soon
    HighMessageRate = 2,          // Unusually high message rate
    SuspiciousLocation = 3,       // Suspicious location pattern
    BehaviorAnomaly = 4,          // Behavioral anomaly detected
    NetworkAnomaly = 5,           // Network traffic anomaly
    AuthenticationFailure = 6,    // Authentication failure
    AuthorizationViolation = 7,   // Authorization violation
    DataIntegrityIssue = 8,       // Data integrity issue
    PrivacyViolation = 9,         // Privacy violation detected
}

/// Network information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkInfo {
    /// Network type (DSRC, 4G, 5G, WiFi)
    pub network_type: String,
    
    /// Network identifier
    pub network_id: String,
    
    /// Signal strength (dBm)
    pub signal_strength: Option<f32>,
    
    /// Network latency (ms)
    pub latency: Option<f32>,
    
    /// Available bandwidth (Mbps)
    pub bandwidth: Option<f32>,
    
    /// Whether connection is encrypted
    pub encrypted: bool,
    
    /// Type of encryption used
    pub encryption_type: Option<String>,
    
    /// Number of retry attempts
    pub retry_count: u32,
    
    /// Last network change timestamp
    pub last_network_change: u64,
}

/// Emergency vehicle types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum EmergencyType {
    NotEmergency = 0,             // Not an emergency vehicle
    Police = 1,                   // Police vehicle
    Fire = 2,                     // Fire truck
    Ambulance = 3,                // Ambulance
    Rescue = 4,                   // Rescue vehicle
    Military = 5,                 // Military vehicle
    Government = 6,               // Government emergency vehicle
    CivilDefense = 7,             // Civil defense vehicle
}

/// Complete vehicle position message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VehiclePosition {
    /// Ephemeral pseudonym (rotates every 5 minutes)
    pub vehicle_id: VehicleId,
    
    /// X.509 certificate identifier for PKI validation
    pub certificate_id: Option<String>,
    
    /// Roadside Unit identifier that received the message
    pub rsu_id: Option<String>,
    
    /// Enhanced 3D positioning with accuracy metrics
    pub position: Position,
    
    /// 3D velocity vector (m/s)
    pub velocity: Option<Velocity>,
    
    /// Heading in degrees from true north
    pub heading: Option<f32>,
    
    /// Speed measurement accuracy (m/s)
    pub speed_accuracy: Option<f32>,
    
    /// Precise timestamp
    pub timestamp: DateTime<Utc>,
    
    /// Monotonic sequence number for replay protection
    pub sequence: u64,
    
    /// Epoch number for pseudonym rotation
    pub epoch: u64,
    
    /// Vehicle metadata and capabilities
    pub metadata: Option<VehicleMetadata>,
    
    /// Sensor readings
    pub sensors: Vec<SensorReading>,
    
    /// Vehicle capabilities
    pub capabilities: Vec<Capability>,
    
    /// Trust and security metrics
    pub trust: Option<TrustMetrics>,
    
    /// Security flags and status
    pub security: Option<SecurityFlags>,
    
    /// Network and routing information
    pub network: Option<NetworkInfo>,
    
    /// Route waypoints
    pub route_waypoints: Vec<String>,
    
    /// Whether this is an emergency vehicle
    pub emergency_vehicle: bool,
    
    /// Emergency vehicle type
    pub emergency_type: EmergencyType,
    
    /// Priority level
    pub priority_level: u32,
}

/// Vehicle cluster for traffic analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VehicleCluster {
    /// Cluster center position
    pub center: Position,
    
    /// Number of vehicles in cluster
    pub count: u32,
    
    /// Average speed of cluster
    pub avg_speed: f32,
    
    /// Vehicle density (vehicles/km²)
    pub density: f32,
    
    /// IDs of vehicles in cluster
    pub vehicle_ids: Vec<VehicleId>,
    
    /// Type of cluster
    pub cluster_type: ClusterType,
    
    /// Cluster radius (meters)
    pub radius: f32,
    
    /// When cluster formed
    pub formation_time: u64,
    
    /// Last cluster update
    pub last_update: u64,
}

/// Cluster types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ClusterType {
    TrafficJam = 0,               // Traffic jam cluster
    Convoy = 1,                   // Vehicle convoy
    Parking = 2,                  // Parking cluster
    Intersection = 3,             // Intersection waiting
    TollBooth = 4,                // Toll booth queue
    AccidentScene = 5,            // Accident scene
    Construction = 6,             // Construction zone
    SpecialEvent = 7,             // Special event traffic
}

/// Trust score update
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrustScoreUpdate {
    /// Vehicle identifier
    pub vehicle_id: VehicleId,
    
    /// Trust score (0.0 - 1.0)
    pub score: TrustScore,
    
    /// Reason for score change
    pub reason: String,
    
    /// When score was computed
    pub timestamp: DateTime<Utc>,
    
    /// Factors contributing to score
    pub factors: Vec<String>,
    
    /// Previous trust score
    pub previous_score: TrustScore,
    
    /// Score change from previous
    pub change: f32,
}

/// System status message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemStatus {
    /// Service identifier
    pub service_id: String,
    
    /// Current service status
    pub status: ServiceStatus,
    
    /// Service version
    pub version: String,
    
    /// Service uptime in seconds
    pub uptime: u64,
    
    /// CPU usage percentage
    pub cpu_usage: f32,
    
    /// Memory usage percentage
    pub memory_usage: f32,
    
    /// Disk usage percentage
    pub disk_usage: f32,
    
    /// Active connection types
    pub active_connections: Vec<String>,
    
    /// Recent errors
    pub errors: Vec<String>,
    
    /// Status timestamp
    pub timestamp: DateTime<Utc>,
}

/// Service status enumeration
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ServiceStatus {
    Unknown = 0,                  // Status unknown
    Starting = 1,                 // Service starting
    Running = 2,                  // Service running normally
    Degraded = 3,                 // Service degraded
    Stopping = 4,                 // Service stopping
    Stopped = 5,                  // Service stopped
    Error = 6,                    // Service in error state
    Maintenance = 7,              // Service in maintenance mode
}

/// Alert message for security and system events
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Alert {
    /// Unique alert identifier
    pub alert_id: String,
    
    /// Type of alert
    pub alert_type: AlertType,
    
    /// Alert severity level
    pub severity: AlertSeverity,
    
    /// Alert title
    pub title: String,
    
    /// Alert description
    pub description: String,
    
    /// Related vehicle (if applicable)
    pub vehicle_id: Option<VehicleId>,
    
    /// Alert location
    pub location: Option<Position>,
    
    /// When alert was generated
    pub timestamp: DateTime<Utc>,
    
    /// Alert tags for categorization
    pub tags: Vec<String>,
    
    /// Whether alert has been acknowledged
    pub acknowledged: bool,
    
    /// Who acknowledged the alert
    pub acknowledged_by: Option<String>,
    
    /// When alert was acknowledged
    pub acknowledged_at: Option<u64>,
}

/// Alert types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AlertType {
    Security = 0,                 // Security-related alert
    Traffic = 1,                  // Traffic-related alert
    System = 2,                   // System-related alert
    Maintenance = 3,              // Maintenance-related alert
    Emergency = 4,                // Emergency alert
    Weather = 5,                  // Weather-related alert
    Infrastructure = 6,           // Infrastructure-related alert
    Compliance = 7,               // Compliance-related alert
}

/// Alert severity levels
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AlertSeverity {
    Info = 0,                     // Informational alert
    Low = 1,                      // Low priority alert
    Medium = 2,                   // Medium priority alert
    High = 3,                     // High priority alert
    Critical = 4,                 // Critical alert
    Emergency = 5,                // Emergency alert
}

/// Core traits for the system
pub trait Identifiable {
    fn id(&self) -> &VehicleId;
}

pub trait Timestamped {
    fn timestamp(&self) -> &DateTime<Utc>;
}

pub trait Trusted {
    fn trust_score(&self) -> TrustScore;
    fn is_trusted(&self, threshold: TrustScore) -> bool;
}

pub trait Validatable {
    fn validate(&self) -> Result<(), String>;
}

// Implement traits for core types
impl Identifiable for VehiclePosition {
    fn id(&self) -> &VehicleId {
        &self.vehicle_id
    }
}

impl Timestamped for VehiclePosition {
    fn timestamp(&self) -> &DateTime<Utc> {
        &self.timestamp
    }
}

impl Trusted for VehiclePosition {
    fn trust_score(&self) -> TrustScore {
        self.trust.as_ref().map(|t| t.overall_score).unwrap_or(0.0)
    }
    
    fn is_trusted(&self, threshold: TrustScore) -> bool {
        self.trust_score() >= threshold
    }
}

impl Validatable for VehiclePosition {
    fn validate(&self) -> Result<(), String> {
        // Validate position coordinates
        if self.position.lat < -90.0 || self.position.lat > 90.0 {
            return Err("Invalid latitude".to_string());
        }
        if self.position.lon < -180.0 || self.position.lon > 180.0 {
            return Err("Invalid longitude".to_string());
        }
        
        // Validate sequence number
        if self.sequence == 0 {
            return Err("Sequence number cannot be 0".to_string());
        }
        
        // Validate timestamp (not too far in future or past)
        let now = Utc::now();
        let diff = now.signed_duration_since(self.timestamp);
        if diff.num_seconds().abs() > 86400 { // 24 hours
            return Err("Timestamp too far from current time".to_string());
        }
        
        Ok(())
    }
}

/// Utility functions for core types
pub mod utils {
    use super::*;
    use std::collections::HashMap;
    
    /// Calculate distance between two positions using Haversine formula
    pub fn calculate_distance(pos1: &Position, pos2: &Position) -> f64 {
        let lat1 = pos1.lat.to_radians();
        let lon1 = pos1.lon.to_radians();
        let lat2 = pos2.lat.to_radians();
        let lon2 = pos2.lon.to_radians();
        
        let dlat = lat2 - lat1;
        let dlon = lon2 - lon1;
        
        let a = (dlat / 2.0).sin().powi(2) + 
                lat1.cos() * lat2.cos() * (dlon / 2.0).sin().powi(2);
        let c = 2.0 * a.sqrt().asin();
        
        // Earth radius in meters
        6_371_000.0 * c
    }
    
    /// Calculate bearing between two positions
    pub fn calculate_bearing(pos1: &Position, pos2: &Position) -> f32 {
        let lat1 = pos1.lat.to_radians();
        let lon1 = pos1.lon.to_radians();
        let lat2 = pos2.lat.to_radians();
        let lon2 = pos2.lon.to_radians();
        
        let dlon = lon2 - lon1;
        let y = dlon.sin() * lat2.cos();
        let x = lat1.cos() * lat2.sin() - lat1.sin() * lat2.cos() * dlon.cos();
        
        let bearing = y.atan2(x).to_degrees();
        if bearing < 0.0 {
            bearing + 360.0
        } else {
            bearing
        }
    }
    
    /// Check if a position is within a bounding box
    pub fn is_within_bounds(
        position: &Position,
        min_lat: f64,
        max_lat: f64,
        min_lon: f64,
        max_lon: f64,
    ) -> bool {
        position.lat >= min_lat && position.lat <= max_lat &&
        position.lon >= min_lon && position.lon <= max_lon
    }
    
    /// Generate a new vehicle ID
    pub fn generate_vehicle_id() -> VehicleId {
        Uuid::new_v4()
    }
    
    /// Get current timestamp in milliseconds
    pub fn current_timestamp_ms() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or(Duration::from_secs(0))
            .as_millis() as u64
    }
    
    /// Get current epoch number
    pub fn current_epoch() -> u64 {
        current_timestamp_ms() / 300_000 // 5 minutes in milliseconds
    }
    
    /// Check if a trust score indicates a trusted vehicle
    pub fn is_trusted(score: TrustScore, threshold: TrustScore) -> bool {
        score >= threshold
    }
    
    /// Normalize a trust score to 0.0-1.0 range
    pub fn normalize_trust_score(score: TrustScore) -> TrustScore {
        score.max(0.0).min(1.0)
    }
    
    /// Calculate weighted average of trust scores
    pub fn weighted_trust_average(scores: &[(TrustScore, f32)]) -> TrustScore {
        if scores.is_empty() {
            return 0.0;
        }
        
        let total_weight: f32 = scores.iter().map(|(_, weight)| weight).sum();
        if total_weight == 0.0 {
            return 0.0;
        }
        
        let weighted_sum: f32 = scores.iter().map(|(score, weight)| score * weight).sum();
        weighted_sum / total_weight
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_position_validation() {
        let mut pos = VehiclePosition {
            vehicle_id: Uuid::new_v4(),
            certificate_id: None,
            rsu_id: None,
            position: Position {
                lat: 40.7128,
                lon: -74.0060,
                alt: None,
                accuracy_horizontal: None,
                accuracy_vertical: None,
                hdop: None,
                vdop: None,
                tdop: None,
                satellites_used: None,
                satellites_visible: None,
            },
            velocity: None,
            heading: None,
            speed_accuracy: None,
            timestamp: Utc::now(),
            sequence: 1,
            epoch: 1,
            metadata: None,
            sensors: vec![],
            capabilities: vec![],
            trust: None,
            security: None,
            network: None,
            route_waypoints: vec![],
            emergency_vehicle: false,
            emergency_type: EmergencyType::NotEmergency,
            priority_level: 0,
        };
        
        assert!(pos.validate().is_ok());
        
        // Test invalid latitude
        pos.position.lat = 100.0;
        assert!(pos.validate().is_err());
        
        // Test invalid longitude
        pos.position.lat = 40.7128;
        pos.position.lon = 200.0;
        assert!(pos.validate().is_err());
        
        // Test invalid sequence
        pos.position.lon = -74.0060;
        pos.sequence = 0;
        assert!(pos.validate().is_err());
    }
    
    #[test]
    fn test_distance_calculation() {
        let pos1 = Position {
            lat: 40.7128,
            lon: -74.0060,
            alt: None,
            accuracy_horizontal: None,
            accuracy_vertical: None,
            hdop: None,
            vdop: None,
            tdop: None,
            satellites_used: None,
            satellites_visible: None,
        };
        
        let pos2 = Position {
            lat: 34.0522,
            lon: -118.2437,
            alt: None,
            accuracy_horizontal: None,
            accuracy_vertical: None,
            hdop: None,
            vdop: None,
            tdop: None,
            satellites_used: None,
            satellites_visible: None,
        };
        
        let distance = utils::calculate_distance(&pos1, &pos2);
        assert!(distance > 0.0);
        assert!(distance < 5_000_000.0); // Should be less than 5000 km
    }
    
    #[test]
    fn test_trust_score_utils() {
        assert!(utils::is_trusted(0.8, 0.7));
        assert!(!utils::is_trusted(0.6, 0.7));
        
        assert_eq!(utils::normalize_trust_score(1.5), 1.0);
        assert_eq!(utils::normalize_trust_score(-0.5), 0.0);
        assert_eq!(utils::normalize_trust_score(0.7), 0.7);
        
        let scores = vec![(0.8, 0.6), (0.6, 0.4)];
        let avg = utils::weighted_trust_average(&scores);
        assert!((avg - 0.72).abs() < 0.01);
    }
}
