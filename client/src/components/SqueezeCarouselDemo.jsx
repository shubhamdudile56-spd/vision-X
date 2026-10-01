import React from "react";
import { SqueezeCarousel } from "./ui/carousel-squeeze.jsx";

const settings = {
  height: 320,
  gap: 16,
  slatGap: 8,
  slatWidth: 8,
  radius: 6,
  duration: 1000,
  hoverGrow: true,
  autoplay: false,
  interval: 6000,
  controls: true,
  accent: "#06b6d4",
  accentForeground: "#042f2e",
};

const mark = (text) => (
  <span className="text-sm font-medium tracking-tight text-white">{text}</span>
);

const slides = [
  {
    id: "industrial",
    title: "Industrial & Surface Inspection",
    description: "Detect cracks, corrosion, spalling, and alignment issues instantly on the manufacturing floor.",
    action: "View Industrial Cases",
    overlay: mark("Industrial"),
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",
    imageAlt: "Industrial factory setting with machinery",
  },
  {
    id: "safety",
    title: "Workplace Safety & EHS",
    description: "Ensure PPE compliance, monitor egress routes, and spot trip hazards before accidents happen.",
    action: "Explore EHS",
    overlay: mark("Safety"),
    image: "https://images.unsplash.com/photo-1504307651254-35680f356f58?w=800&q=80",
    imageAlt: "Construction workers with helmets and safety gear",
  },
  {
    id: "retail",
    title: "Retail & Inventory",
    description: "Automate shelf counts, identify stock gaps, and verify planogram compliance across all aisles.",
    action: "See Retail Demo",
    overlay: mark("Retail"),
    image: "https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=800&q=80",
    imageAlt: "Supermarket aisle with stocked shelves",
  },
  {
    id: "documents",
    title: "Document & OCR",
    description: "Extract text from serial tags, schematics, and printed forms with high-confidence OCR.",
    action: "Test OCR",
    overlay: mark("Documents"),
    image: "https://images.unsplash.com/photo-1568667256549-094345857637?w=800&q=80",
    imageAlt: "Close up of blueprints and schematics",
  },
];

export default function SqueezeCarouselDemo(props) {
  const options = { ...settings, ...props };

  return (
    <div className="w-full">
      <SqueezeCarousel slides={slides} label="VisionX Use Cases" {...options} />
    </div>
  );
}
