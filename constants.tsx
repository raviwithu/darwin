import React from 'react';
import { ElementType } from './types';
import { 
  DatabaseIcon, ServerIcon, NetworkIcon, BoxIcon, WebIcon, MobileIcon, UserIcon, ApiGatewayIcon, 
  MessageQueueIcon, CacheIcon, TextIcon, CdnIcon, AuthIcon, SearchIcon, ObjectStorageIcon,
  ECUIcon, CANBusIcon, LINBusIcon, FlexRayIcon, EthernetIcon, GatewayIcon, SensorIcon, ActuatorIcon,
  ApplicationLayerIcon, SystemLayerIcon, BootLayerIcon, HardwareLayerIcon,
  DockerIcon, KubernetesIcon, AWSServiceIcon,
  RichOSContainerIcon, MCUContainerIcon, CloudContainerIcon, AWSInstanceIcon,
  ModuleIcon, ServiceIcon, ProcessIcon, DriverIcon, FirmwareIcon, ComponentIcon
} from './components/Icons';

export const ELEMENT_DIMENSIONS = {
  width: 160,
  height: 60,
};

export interface ElementConfig {
  icon: React.ReactNode;
  color: string;
  textColor: string;
  defaultName: string;
  description: string;
  defaultWidth?: number;
  defaultHeight?: number;
}

// Helper function to check if an element type is a container
export const isContainer = (type: ElementType): boolean => {
  return [
    ElementType.RichOSContainer,
    ElementType.MCUContainer,
    ElementType.CloudContainer,
    ElementType.AWSInstance
  ].includes(type);
};

// Helper function to check if an element type can have sub-components
export const isExpandable = (type: ElementType): boolean => {
  return [
    ElementType.ApplicationLayer,
    ElementType.SystemLayer,
    ElementType.BootLayer,
    ElementType.HardwareLayer,
    ElementType.Microservice,
    ElementType.Docker,
    ElementType.Kubernetes
  ].includes(type);
};

export const ELEMENT_CONFIG: Record<ElementType, ElementConfig> = {
  [ElementType.User]: {
    icon: <UserIcon />,
    color: 'bg-gray-100 border-gray-300',
    textColor: 'text-gray-800',
    defaultName: 'User',
    description: 'Represents an end-user of the system, like a customer or administrator.',
  },
  [ElementType.WebClient]: {
    icon: <WebIcon />,
    color: 'bg-pink-100 border-pink-300',
    textColor: 'text-pink-800',
    defaultName: 'Web Client',
    description: 'A client application running in a web browser, like a React or Angular SPA.',
  },
  [ElementType.MobileClient]: {
    icon: <MobileIcon />,
    color: 'bg-yellow-100 border-yellow-300',
    textColor: 'text-yellow-800',
    defaultName: 'Mobile Client',
    description: 'A native client application running on a mobile device like iOS or Android.',
  },
  [ElementType.ApiGateway]: {
    icon: <ApiGatewayIcon />,
    color: 'bg-teal-100 border-teal-300',
    textColor: 'text-teal-800',
    defaultName: 'API Gateway',
    description: 'A single entry point for all client requests, routing them to the appropriate microservice.',
  },
  [ElementType.LoadBalancer]: {
    icon: <NetworkIcon />,
    color: 'bg-green-100 border-green-300',
    textColor: 'text-green-800',
    defaultName: 'Load Balancer',
    description: 'Distributes incoming network traffic across multiple backend servers.',
  },
  [ElementType.CDN]: {
    icon: <CdnIcon />,
    color: 'bg-sky-100 border-sky-300',
    textColor: 'text-sky-800',
    defaultName: 'CDN',
    description: 'A Content Delivery Network for caching static assets close to users.',
  },
  [ElementType.Microservice]: {
    icon: <ServerIcon />,
    color: 'bg-blue-100 border-blue-300',
    textColor: 'text-blue-800',
    defaultName: 'Microservice',
    description: 'A small, independent service that handles a specific business capability.',
  },
  [ElementType.AuthService]: {
    icon: <AuthIcon />,
    color: 'bg-slate-100 border-slate-300',
    textColor: 'text-slate-800',
    defaultName: 'Auth Service',
    description: 'Handles user authentication, authorization, and session management.',
  },
  [ElementType.MessageQueue]: {
    icon: <MessageQueueIcon />,
    color: 'bg-orange-100 border-orange-300',
    textColor: 'text-orange-800',
    defaultName: 'Message Queue',
    description: 'An asynchronous communication buffer between different services (e.g., RabbitMQ, Kafka).',
  },
  [ElementType.Cache]: {
    icon: <CacheIcon />,
    color: 'bg-indigo-100 border-indigo-300',
    textColor: 'text-indigo-800',
    defaultName: 'Cache',
    description: 'An in-memory data store for fast data retrieval (e.g., Redis, Memcached).',
  },
  [ElementType.Database]: {
    icon: <DatabaseIcon />,
    color: 'bg-purple-100 border-purple-300',
    textColor: 'text-purple-800',
    defaultName: 'Database',
    description: 'A persistent data store, either SQL or NoSQL (e.g., PostgreSQL, MongoDB).',
  },
  [ElementType.Search]: {
    icon: <SearchIcon />,
    color: 'bg-amber-100 border-amber-300',
    textColor: 'text-amber-800',
    defaultName: 'Search Service',
    description: 'A dedicated service for providing fast, full-text search (e.g., Elasticsearch).',
  },
  [ElementType.ObjectStorage]: {
    icon: <ObjectStorageIcon />,
    color: 'bg-zinc-100 border-zinc-300',
    textColor: 'text-zinc-800',
    defaultName: 'Object Storage',
    description: 'A storage for large, unstructured data like images, videos, and backups (e.g., AWS S3).',
  },
  [ElementType.TextBox]: {
    icon: <TextIcon />,
    color: 'bg-transparent border-gray-500',
    textColor: 'text-gray-800',
    defaultName: 'Your text here...',
    description: 'A free-form text box for annotations, labels, and notes on your diagram.',
    defaultWidth: 160,
    defaultHeight: 80,
  },
  [ElementType.Custom]: {
    icon: <BoxIcon />,
    color: 'bg-gray-200 border-gray-400',
    textColor: 'text-gray-800',
    defaultName: 'Custom Element',
    description: 'A generic, customizable block for representing any other component in your system.',
  },
  // Automotive Components
  [ElementType.ECU]: {
    icon: <ECUIcon />,
    color: 'bg-red-100 border-red-300',
    textColor: 'text-red-800',
    defaultName: 'ECU',
    description: 'Electronic Control Unit - manages specific vehicle functions like engine, transmission, or braking.',
  },
  [ElementType.CANBus]: {
    icon: <CANBusIcon />,
    color: 'bg-orange-100 border-orange-300',
    textColor: 'text-orange-800',
    defaultName: 'CAN Bus',
    description: 'Controller Area Network - vehicle communication protocol for ECU interconnection.',
    defaultWidth: 200,
    defaultHeight: 40,
  },
  [ElementType.LINBus]: {
    icon: <LINBusIcon />,
    color: 'bg-yellow-100 border-yellow-300',
    textColor: 'text-yellow-800',
    defaultName: 'LIN Bus',
    description: 'Local Interconnect Network - low-cost communication protocol for simple sensors/actuators.',
    defaultWidth: 180,
    defaultHeight: 40,
  },
  [ElementType.FlexRay]: {
    icon: <FlexRayIcon />,
    color: 'bg-purple-100 border-purple-300',
    textColor: 'text-purple-800',
    defaultName: 'FlexRay',
    description: 'High-speed deterministic protocol for safety-critical automotive applications.',
    defaultWidth: 200,
    defaultHeight: 40,
  },
  [ElementType.Ethernet]: {
    icon: <EthernetIcon />,
    color: 'bg-blue-100 border-blue-300',
    textColor: 'text-blue-800',
    defaultName: 'Automotive Ethernet',
    description: 'High-bandwidth network for ADAS, infotainment, and backbone connectivity.',
  },
  [ElementType.Gateway]: {
    icon: <GatewayIcon />,
    color: 'bg-teal-100 border-teal-300',
    textColor: 'text-teal-800',
    defaultName: 'Gateway ECU',
    description: 'Central gateway for routing messages between different vehicle networks.',
  },
  [ElementType.Sensor]: {
    icon: <SensorIcon />,
    color: 'bg-green-100 border-green-300',
    textColor: 'text-green-800',
    defaultName: 'Sensor',
    description: 'Vehicle sensor (radar, lidar, camera, temperature, pressure, etc.).',
    defaultWidth: 120,
    defaultHeight: 60,
  },
  [ElementType.Actuator]: {
    icon: <ActuatorIcon />,
    color: 'bg-indigo-100 border-indigo-300',
    textColor: 'text-indigo-800',
    defaultName: 'Actuator',
    description: 'Mechanical device controlled by ECU (motor, valve, pump, etc.).',
    defaultWidth: 120,
    defaultHeight: 60,
  },
  // System Layers
  [ElementType.ApplicationLayer]: {
    icon: <ApplicationLayerIcon />,
    color: 'bg-cyan-100 border-cyan-300',
    textColor: 'text-cyan-800',
    defaultName: 'Application Layer',
    description: 'Software application layer for user-facing features and business logic.',
    defaultWidth: 320,
    defaultHeight: 80,
  },
  [ElementType.SystemLayer]: {
    icon: <SystemLayerIcon />,
    color: 'bg-emerald-100 border-emerald-300',
    textColor: 'text-emerald-800',
    defaultName: 'System Layer',
    description: 'Operating system, middleware, and system services layer.',
    defaultWidth: 320,
    defaultHeight: 80,
  },
  [ElementType.BootLayer]: {
    icon: <BootLayerIcon />,
    color: 'bg-amber-100 border-amber-300',
    textColor: 'text-amber-800',
    defaultName: 'Boot Layer',
    description: 'Bootloader and firmware initialization layer.',
    defaultWidth: 320,
    defaultHeight: 80,
  },
  [ElementType.HardwareLayer]: {
    icon: <HardwareLayerIcon />,
    color: 'bg-stone-100 border-stone-300',
    textColor: 'text-stone-800',
    defaultName: 'Hardware Layer',
    description: 'Physical hardware components and interfaces.',
    defaultWidth: 320,
    defaultHeight: 80,
  },
  // Cloud Components
  [ElementType.Docker]: {
    icon: <DockerIcon />,
    color: 'bg-sky-100 border-sky-300',
    textColor: 'text-sky-800',
    defaultName: 'Docker Container',
    description: 'Containerized application or service running in Docker.',
  },
  [ElementType.Kubernetes]: {
    icon: <KubernetesIcon />,
    color: 'bg-violet-100 border-violet-300',
    textColor: 'text-violet-800',
    defaultName: 'Kubernetes',
    description: 'Container orchestration platform for managing microservices.',
  },
  [ElementType.AWSService]: {
    icon: <AWSServiceIcon />,
    color: 'bg-orange-100 border-orange-300',
    textColor: 'text-orange-800',
    defaultName: 'AWS Service',
    description: 'Amazon Web Services cloud service (EC2, S3, Lambda, etc.).',
  },
  // Container Components  
  [ElementType.RichOSContainer]: {
    icon: <RichOSContainerIcon />,
    color: 'bg-gradient-to-b from-blue-50 to-blue-100 border-blue-400 border-dashed',
    textColor: 'text-blue-900',
    defaultName: 'Rich OS System',
    description: 'Container for Rich OS components with application, system, boot, and hardware layers.',
    defaultWidth: 400,
    defaultHeight: 500,
  },
  [ElementType.MCUContainer]: {
    icon: <MCUContainerIcon />,
    color: 'bg-gradient-to-b from-green-50 to-green-100 border-green-400 border-dashed',
    textColor: 'text-green-900',
    defaultName: 'MCU System',
    description: 'Container for MCU-based components with application, boot, and hardware layers.',
    defaultWidth: 350,
    defaultHeight: 400,
  },
  [ElementType.CloudContainer]: {
    icon: <CloudContainerIcon />,
    color: 'bg-gradient-to-b from-purple-50 to-purple-100 border-purple-400 border-dashed',
    textColor: 'text-purple-900',
    defaultName: 'Cloud Infrastructure',
    description: 'Container for cloud components including microservices, Docker, and Kubernetes.',
    defaultWidth: 450,
    defaultHeight: 400,
  },
  [ElementType.AWSInstance]: {
    icon: <AWSInstanceIcon />,
    color: 'bg-gradient-to-b from-orange-50 to-orange-100 border-orange-400 border-dashed',
    textColor: 'text-orange-900',
    defaultName: 'AWS Instance',
    description: 'AWS EC2 instance container that can host multiple services and applications.',
    defaultWidth: 500,
    defaultHeight: 350,
  },
  // Sub-components
  [ElementType.Module]: {
    icon: <ModuleIcon />,
    color: 'bg-blue-50 border-blue-300',
    textColor: 'text-blue-700',
    defaultName: 'Module',
    description: 'Software module or component within a layer.',
    defaultWidth: 100,
    defaultHeight: 50,
  },
  [ElementType.Service]: {
    icon: <ServiceIcon />,
    color: 'bg-green-50 border-green-300',
    textColor: 'text-green-700',
    defaultName: 'Service',
    description: 'System service or daemon process.',
    defaultWidth: 100,
    defaultHeight: 50,
  },
  [ElementType.Process]: {
    icon: <ProcessIcon />,
    color: 'bg-purple-50 border-purple-300',
    textColor: 'text-purple-700',
    defaultName: 'Process',
    description: 'Running process or task.',
    defaultWidth: 100,
    defaultHeight: 50,
  },
  [ElementType.Driver]: {
    icon: <DriverIcon />,
    color: 'bg-red-50 border-red-300',
    textColor: 'text-red-700',
    defaultName: 'Driver',
    description: 'Hardware driver or kernel module.',
    defaultWidth: 100,
    defaultHeight: 50,
  },
  [ElementType.Firmware]: {
    icon: <FirmwareIcon />,
    color: 'bg-gray-50 border-gray-300',
    textColor: 'text-gray-700',
    defaultName: 'Firmware',
    description: 'Low-level firmware component.',
    defaultWidth: 100,
    defaultHeight: 50,
  },
  [ElementType.Component]: {
    icon: <ComponentIcon />,
    color: 'bg-indigo-50 border-indigo-300',
    textColor: 'text-indigo-700',
    defaultName: 'Component',
    description: 'Generic sub-component.',
    defaultWidth: 100,
    defaultHeight: 50,
  },
};
