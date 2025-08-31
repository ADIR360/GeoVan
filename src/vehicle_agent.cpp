#include <iostream>
#include <chrono>
#include <thread>
#include <fstream>
#include <sstream>
#include <vector>
#include <string>
#include <random>
#include <mqtt/async_client.h>
#include "geovan.pb.h"

class VehicleAgent {
private:
    std::string client_id_;
    std::string broker_url_;
    std::string topic_;
    mqtt::async_client* client_;
    std::vector<std::pair<double, double>> route_;
    size_t current_route_index_;
    uint32_t sequence_;
    std::random_device rd_;
    std::mt19937 gen_;
    std::uniform_real_distribution<> speed_dist_;
    std::uniform_real_distribution<> heading_noise_;

public:
    VehicleAgent(const std::string& client_id, const std::string& broker_url, const std::string& topic)
        : client_id_(client_id), broker_url_(broker_url), topic_(topic), 
          current_route_index_(0), sequence_(0), gen_(rd_()),
          speed_dist_(8.0, 15.0), heading_noise_(-5.0, 5.0) {
        
        // Initialize with a simple route (you can load from CSV later)
        route_ = {
            {28.7041, 77.1025},  // Delhi
            {28.6139, 77.2090},  // Delhi
            {28.7041, 77.1025},  // Back to start
        };
        
        client_ = new mqtt::async_client(broker_url_, client_id_);
    }

    ~VehicleAgent() {
        if (client_) {
            delete client_;
        }
    }

    bool connect() {
        try {
            mqtt::connect_options conn_opts;
            conn_opts.set_keep_alive_interval(20);
            conn_opts.set_clean_session(true);

            std::cout << "Connecting to MQTT broker at " << broker_url_ << std::endl;
            mqtt::token_ptr conntok = client_->connect(conn_opts);
            conntok->wait();
            std::cout << "Connected to MQTT broker" << std::endl;
            return true;
        }
        catch (const mqtt::exception& exc) {
            std::cerr << "Error connecting to MQTT broker: " << exc.what() << std::endl;
            return false;
        }
    }

    void disconnect() {
        try {
            client_->disconnect()->wait();
            std::cout << "Disconnected from MQTT broker" << std::endl;
        }
        catch (const mqtt::exception& exc) {
            std::cerr << "Error disconnecting: " << exc.what() << std::endl;
        }
    }

    void loadRouteFromCSV(const std::string& filename) {
        std::ifstream file(filename);
        if (!file.is_open()) {
            std::cerr << "Could not open route file: " << filename << std::endl;
            return;
        }

        route_.clear();
        std::string line;
        while (std::getline(file, line)) {
            std::stringstream ss(line);
            std::string lat_str, lon_str;
            if (std::getline(ss, lat_str, ',') && std::getline(ss, lon_str, ',')) {
                try {
                    double lat = std::stod(lat_str);
                    double lon = std::stod(lon_str);
                    route_.push_back({lat, lon});
                } catch (const std::exception& e) {
                    std::cerr << "Error parsing line: " << line << std::endl;
                }
            }
        }
        std::cout << "Loaded " << route_.size() << " route points" << std::endl;
    }

    void publishPosition() {
        if (route_.empty()) {
            std::cerr << "No route loaded" << std::endl;
            return;
        }

        try {
            // Create position message
            geovan::VehiclePosition pos;
            pos.set_id(client_id_);
            
            // Get current position from route
            auto& current_pos = route_[current_route_index_];
            pos.mutable_pos()->set_lat(current_pos.first);
            pos.mutable_pos()->set_lon(current_pos.second);
            
            // Add some realistic movement
            double speed = speed_dist_(gen_);
            pos.set_speed(speed);
            
            // Calculate heading to next point
            double heading = calculateHeadingToNextPoint();
            heading += heading_noise_(gen_);  // Add some noise
            if (heading < 0) heading += 360.0;
            if (heading >= 360) heading -= 360.0;
            pos.set_heading(heading);
            
            // Set timestamp
            auto now = std::chrono::system_clock::now();
            auto timestamp = std::chrono::duration_cast<std::chrono::milliseconds>(
                now.time_since_epoch()).count();
            pos.set_timestamp(timestamp);
            
            // Set sequence number
            pos.set_seq(sequence_++);

            // Serialize to string
            std::string payload;
            if (!pos.SerializeToString(&payload)) {
                std::cerr << "Failed to serialize protobuf message" << std::endl;
                return;
            }

            // Publish to MQTT
            mqtt::message_ptr pubmsg = mqtt::make_message(topic_, payload);
            client_->publish(pubmsg)->wait();
            
            std::cout << "Published position: " << current_pos.first << ", " << current_pos.second 
                      << " (speed: " << speed << " m/s, heading: " << heading << "°)" << std::endl;

            // Move to next route point
            current_route_index_ = (current_route_index_ + 1) % route_.size();

        } catch (const mqtt::exception& exc) {
            std::cerr << "Error publishing message: " << exc.what() << std::endl;
        }
    }

private:
    double calculateHeadingToNextPoint() {
        if (route_.size() < 2) return 0.0;
        
        size_t next_index = (current_route_index_ + 1) % route_.size();
        auto& current = route_[current_route_index_];
        auto& next = route_[next_index];
        
        // Simple bearing calculation
        double dlat = next.first - current.first;
        double dlon = next.second - current.second;
        
        double bearing = atan2(dlon, dlat) * 180.0 / M_PI;
        if (bearing < 0) bearing += 360.0;
        
        return bearing;
    }
};

int main(int argc, char* argv[]) {
    std::string client_id = "vehicle-001";
    std::string broker_url = "tcp://localhost:1883";
    std::string topic = "geovan/positions";
    std::string route_file = "";
    int publish_interval_ms = 2000;  // 2 seconds

    // Parse command line arguments
    for (int i = 1; i < argc; i++) {
        std::string arg = argv[i];
        if (arg == "--id" && i + 1 < argc) {
            client_id = argv[++i];
        } else if (arg == "--broker" && i + 1 < argc) {
            broker_url = argv[++i];
        } else if (arg == "--topic" && i + 1 < argc) {
            topic = argv[++i];
        } else if (arg == "--route" && i + 1 < argc) {
            route_file = argv[++i];
        } else if (arg == "--interval" && i + 1 < argc) {
            publish_interval_ms = std::stoi(argv[++i]);
        } else if (arg == "--help") {
            std::cout << "Usage: " << argv[0] << " [options]\n"
                      << "Options:\n"
                      << "  --id <vehicle_id>        Vehicle identifier (default: vehicle-001)\n"
                      << "  --broker <url>           MQTT broker URL (default: tcp://localhost:1883)\n"
                      << "  --topic <topic>          MQTT topic (default: geovan/positions)\n"
                      << "  --route <file>           CSV file with lat,lon route points\n"
                      << "  --interval <ms>          Publish interval in milliseconds (default: 2000)\n"
                      << "  --help                   Show this help message\n";
            return 0;
        }
    }

    std::cout << "GeoVAN Vehicle Agent\n"
              << "Client ID: " << client_id << "\n"
              << "Broker: " << broker_url << "\n"
              << "Topic: " << topic << "\n"
              << "Interval: " << publish_interval_ms << "ms\n";

    VehicleAgent agent(client_id, broker_url, topic);
    
    if (!agent.connect()) {
        std::cerr << "Failed to connect to MQTT broker. Exiting." << std::endl;
        return 1;
    }

    // Load route if specified
    if (!route_file.empty()) {
        agent.loadRouteFromCSV(route_file);
    }

    std::cout << "Starting position publishing loop. Press Ctrl+C to stop." << std::endl;

    try {
        while (true) {
            agent.publishPosition();
            std::this_thread::sleep_for(std::chrono::milliseconds(publish_interval_ms));
        }
    } catch (const std::exception& e) {
        std::cerr << "Error in main loop: " << e.what() << std::endl;
    }

    agent.disconnect();
    return 0;
}
