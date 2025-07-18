
export enum ElementType {
  User = 'USER',
  WebClient = 'WEB_CLIENT',
  MobileClient = 'MOBILE_CLIENT',
  ApiGateway = 'API_GATEWAY',
  LoadBalancer = 'LOAD_BALANCER',
  Microservice = 'MICROSERVICE',
  MessageQueue = 'MESSAGE_QUEUE',
  Cache = 'CACHE',
  Database = 'DATABASE',
  TextBox = 'TEXT_BOX',
  Custom = 'CUSTOM',
  CDN = 'CDN',
  AuthService = 'AUTH_SERVICE',
  Search = 'SEARCH',
  ObjectStorage = 'OBJECT_STORAGE',
  // Automotive Components
  ECU = 'ECU',
  CANBus = 'CAN_BUS',
  LINBus = 'LIN_BUS',
  FlexRay = 'FLEXRAY',
  Ethernet = 'ETHERNET',
  Gateway = 'GATEWAY',
  Sensor = 'SENSOR',
  Actuator = 'ACTUATOR',
  // System Layers
  ApplicationLayer = 'APPLICATION_LAYER',
  SystemLayer = 'SYSTEM_LAYER',
  BootLayer = 'BOOT_LAYER',
  HardwareLayer = 'HARDWARE_LAYER',
  // Cloud Components
  Docker = 'DOCKER',
  Kubernetes = 'KUBERNETES',
  AWSService = 'AWS_SERVICE',
  // Container Components
  RichOSContainer = 'RICH_OS_CONTAINER',
  MCUContainer = 'MCU_CONTAINER',
  CloudContainer = 'CLOUD_CONTAINER',
  AWSInstance = 'AWS_INSTANCE',
  // Sub-components
  Module = 'MODULE',
  Service = 'SERVICE',
  Process = 'PROCESS',
  Driver = 'DRIVER',
  Firmware = 'FIRMWARE',
  Component = 'COMPONENT',
}

export interface ElementData {
  id: string;
  type: ElementType;
  name: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  layer?: string;
  systemType?: 'richOS' | 'mcu' | 'cloud' | 'vehicle';
  parentId?: string;
  children?: string[]; // Array of child element IDs
  isExpandable?: boolean; // For components that can contain sub-components
}

export interface ConnectorData {
  id:string;
  from: string;
  to: string;
  protocol?: 'CAN' | 'LIN' | 'FlexRay' | 'Ethernet' | 'HTTP' | 'TCP' | 'UDP';
  lineStyle?: 'solid' | 'dashed' | 'dotted';
}

export interface Point {
    x: number;
    y: number;
}

/**
 * The standard format for a diagram's data, used for
 * importing, exporting, and loading examples.
 */
export interface DiagramData {
  elements: ElementData[];
  connectors: ConnectorData[];
}

/**
 * Holds metadata for an example diagram displayed in the modal.
 */
export interface ExampleMeta {
  name: string;
  description: string;
  path: string; // The path to the example's JSON file
}
