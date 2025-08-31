cmake_minimum_required(VERSION 3.16)
project(GeoVAN VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find required packages
find_package(PkgConfig REQUIRED)
find_package(Protobuf REQUIRED)
find_package(PahoMqttCpp REQUIRED)

# Include directories
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/src)
include_directories(${Protobuf_INCLUDE_DIRS})

# Generate protobuf files
protobuf_generate_cpp(PROTO_SRCS PROTO_HDRS proto/geovan.proto)

# Create vehicle agent executable
add_executable(vehicle_agent 
    src/vehicle_agent.cpp
    ${PROTO_SRCS}
    ${PROTO_HDRS}
)

# Link libraries
target_link_libraries(vehicle_agent 
    ${Protobuf_LIBRARIES}
    PahoMqttCpp::paho-mqttpp3
    PahoMqttCpp::paho-mqtt3a
    pthread
    ssl
    crypto
)

# Set compiler flags
target_compile_options(vehicle_agent PRIVATE -Wall -Wextra)

# Install target
install(TARGETS vehicle_agent DESTINATION bin)
install(FILES ${CMAKE_CURRENT_SOURCE_DIR}/proto/geovan.proto DESTINATION share/geovan)

# Print status
message(STATUS "Protobuf found: ${Protobuf_FOUND}")
message(STATUS "PahoMqttCpp found: ${PahoMqttCpp_FOUND}")
message(STATUS "Protobuf libraries: ${Protobuf_LIBRARIES}")
message(STATUS "Protobuf include dirs: ${Protobuf_INCLUDE_DIRS}")
