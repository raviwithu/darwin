
import { ExampleMeta } from './types';

export const exampleMetas: ExampleMeta[] = [
  {
    name: "Social Media System (Twitter-like)",
    description: "A high-level design for a scalable social media platform focusing on tweets, user feeds, and real-time updates.",
    path: "/examples/social-media.json"
  },
  {
    name: "Video Streaming Service (Netflix-like)",
    description: "A high-level architecture for a video-on-demand platform, covering video ingestion, processing, and delivery via CDN.",
    path: "/examples/video-streaming.json"
  },
  {
    name: "E-commerce Platform (Amazon-like)",
    description: "A comprehensive architecture for a modern e-commerce platform, including product catalogs, user authentication, search, and order processing.",
    path: "/examples/e-commerce.json"
  },
  // Automotive Examples
  {
    name: "Vehicle Network Architecture",
    description: "Modern vehicle E/E architecture showing ECU communication via CAN, LIN, FlexRay, and Ethernet networks.",
    path: "/examples/vehicle-network.json"
  },
  {
    name: "ADAS System Architecture",
    description: "Advanced Driver Assistance System with sensors, ECUs, and actuators for autonomous driving features.",
    path: "/examples/adas-system.json"
  },
  {
    name: "Rich OS System Layers",
    description: "Layered architecture for automotive infotainment systems showing application, system, boot, and hardware layers.",
    path: "/examples/rich-os-layers.json"
  },
  {
    name: "MCU-based ECU Architecture",
    description: "Microcontroller-based ECU architecture for safety-critical systems with application, boot, and hardware layers.",
    path: "/examples/mcu-architecture.json"
  },
  {
    name: "Cloud-Connected Vehicle",
    description: "Architecture showing vehicle connectivity to cloud services using Docker, Kubernetes, and AWS services.",
    path: "/examples/cloud-vehicle.json"
  },
  {
    name: "Automotive Container Architecture",
    description: "Complete automotive system design with container components for Rich OS, MCU, and Cloud infrastructure with nested sub-components.",
    path: "/examples/automotive-container-example.json"
  },
];
