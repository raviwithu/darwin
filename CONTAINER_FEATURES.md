# Container Features Documentation

## Overview

The Darwin HLD tool now supports container components that allow you to organize and group related components together. This is particularly useful for automotive system design where you need to represent complex hierarchical systems.

## Container Types

### 1. Rich OS Container
- **Purpose**: For complete Rich OS systems like infotainment or ADAS
- **Default Size**: 400x500px
- **Use Case**: Contains Application, System, Boot, and Hardware layers

### 2. MCU Container  
- **Purpose**: For microcontroller-based embedded systems
- **Default Size**: 350x400px
- **Use Case**: Contains simplified layers for resource-constrained systems

### 3. Cloud Infrastructure
- **Purpose**: For cloud-based services and infrastructure
- **Default Size**: 450x400px
- **Use Case**: Contains microservices, Docker containers, Kubernetes pods

### 4. AWS Instance
- **Purpose**: For AWS EC2 instances and cloud deployments
- **Default Size**: 500x350px
- **Use Case**: Contains AWS services and applications

## Key Features

### 1. Auto-Layout
When dropping components into containers:
- **Layer components** (Application, System, Boot, Hardware) automatically stack vertically with proper spacing
- **Other components** arrange in a grid layout
- First component positions at top-left with padding

### 2. Drag & Drop
- Drop components directly onto containers to make them children
- Components automatically position themselves inside containers
- Visual indicator shows "Drop components here" for empty containers

### 3. Parent-Child Relationships
- Components inside containers maintain parent-child relationships
- Moving a container moves all its children
- Deleting a container deletes all its children

### 4. Selection & Editing
- All components (including those inside containers) are individually selectable
- Components can be moved, resized, renamed, and deleted
- Connections can be made between any components

### 5. Sub-Components
New smaller components for detailed architecture:
- **Module**: Software modules within layers
- **Service**: System services or daemons
- **Process**: Running processes
- **Driver**: Hardware drivers
- **Firmware**: Low-level firmware
- **Component**: Generic sub-components

## Usage Guide

### Basic Container Usage
1. Open the component drawer
2. Select "Containers" category
3. Drag or click to add a container
4. Drop components into the container

### Creating Layered Architecture
1. Add a Rich OS Container
2. Drop Application Layer into it
3. Drop System Layer (auto-positions below Application)
4. Drop Boot Layer (auto-positions below System)
5. Drop Hardware Layer (auto-positions at bottom)

### Adding Sub-Components
1. Select "Sub-Components" category
2. Drop modules, services, etc. onto layer components
3. Sub-components can be added to make architecture more detailed

### Best Practices
1. Use containers to group related components
2. Leverage auto-layout for clean organization
3. Add sub-components for detailed views
4. Use different container types for different system parts
5. Connect containers to show system communication

## Example Architectures

### Automotive Infotainment System
```
Rich OS Container
├── Application Layer
│   ├── HMI Module
│   ├── Navigation Module
│   └── Media Player Module
├── System Layer
│   └── Middleware Services
├── Boot Layer
│   └── Secure Boot
└── Hardware Layer
    └── SoC Platform
```

### Engine Control Unit
```
MCU Container
├── Application Layer
│   └── Control Logic
├── Boot Layer
│   └── Bootloader
└── Hardware Layer
    └── MCU Hardware
```

### Cloud Services
```
Cloud Infrastructure
├── Telematics Service
├── OTA Update Service
├── Fleet Management
└── Data Analytics
```

## Tips
- Containers can be resized to fit more components
- Use consistent spacing with auto-layout
- Layer components expand to show sub-components
- Connect containers to show communication protocols
- Save complex architectures as examples for reuse