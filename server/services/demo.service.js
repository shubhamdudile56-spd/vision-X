/**
 * Simulated ("DEMO") analysis payloads.
 *
 * These are hard-coded and clearly labelled so a presentation can never be
 * mistaken for a real model inference. Every payload carries a DEMO banner in
 * its description and the API tags the response with `mode: "DEMO"`.
 */
import { randomUUID } from 'node:crypto';

export const DEMO_SCENES = {
  industrial: {
    key: 'industrial',
    label: 'Industrial Facility & Equipment',
    data: {
      scene_category: 'Industrial Facility & Equipment',
      scene_description:
        'A simulated high-definition industrial room containing structural piping, pressure valves, and motor pumps.',
      severity_score: 0.15,
      summary:
        'Simulated inspection of a pump house. Both identified assets report nominal condition with no fatigue or thermal damage.',
      detected_objects: [
        {
          object_name: 'Pressure Relief Valve',
          category: 'Industrial Inspection',
          confidence: 96.5,
          risk_score: 0.12,
          recommended_action: 'No action required. Continue routine pressure logging on the next shift.',
          bounding_box: { x_min: 15, y_min: 20, x_max: 45, y_max: 60 },
          insight: 'Valve operating within normal pressure thresholds. No physical fatigue detected.'
        },
        {
          object_name: 'Electric Induction Motor',
          category: 'Industrial Inspection',
          confidence: 91.2,
          risk_score: 0.18,
          recommended_action: 'Schedule a thermal-imaging check during the next planned maintenance window.',
          bounding_box: { x_min: 55, y_min: 35, x_max: 88, y_max: 80 },
          insight: 'Motor casing intact. Zero thermal discoloration detected.'
        }
      ]
    }
  },
  safety: {
    key: 'safety',
    label: 'Workplace Safety & EHS',
    data: {
      scene_category: 'Construction Site & Safety Compliance',
      scene_description:
        'A simulated active construction floor with scaffolding, stacked material, and two workers inside a marked exclusion zone.',
      severity_score: 0.62,
      summary:
        'Simulated EHS walkthrough. Two compliance violations were detected: a worker without head protection and material obstructing an egress path.',
      detected_objects: [
        {
          object_name: 'Worker Without Hard Hat',
          category: 'Safety & EHS',
          confidence: 94.0,
          risk_score: 0.85,
          recommended_action: 'Stop work for this individual and issue replacement PPE before re-entry.',
          bounding_box: { x_min: 30, y_min: 28, x_max: 46, y_max: 82 },
          insight: 'Worker inside the exclusion zone without head protection. Immediate fall-risk exposure.'
        },
        {
          object_name: 'Blocked Fire Exit Route',
          category: 'Safety & EHS',
          confidence: 89.7,
          risk_score: 0.78,
          recommended_action: 'Clear the egress path immediately and re-brief the crew on material staging zones.',
          bounding_box: { x_min: 60, y_min: 45, x_max: 95, y_max: 92 },
          insight: 'Stacked material obstructs the marked exit corridor. Evacuation time is materially reduced.'
        },
        {
          object_name: 'Steel Scaffolding Frame',
          category: 'Industrial Inspection',
          confidence: 88.3,
          risk_score: 0.3,
          recommended_action: 'Verify guardrail installation and inspect for corrosion at the base plates.',
          bounding_box: { x_min: 5, y_min: 10, x_max: 30, y_max: 90 },
          insight: 'Scaffold uprights appear plumb. Minor surface oxidation visible on the lower rail.'
        }
      ]
    }
  },
  retail: {
    key: 'retail',
    label: 'Retail Inventory & Counting',
    data: {
      scene_category: 'Retail Shelf & Inventory',
      scene_description:
        'A simulated retail aisle with three stocked shelving units and a partial gap on the middle shelf facing.',
      severity_score: 0.22,
      summary:
        'Simulated shelf audit. Shelf 2 shows a facing gap consistent with a stock-out event; shelves 1 and 3 are fully stocked.',
      detected_objects: [
        {
          object_name: 'Shelf Unit 1 (Stocked)',
          category: 'General Object',
          confidence: 93.4,
          risk_score: 0.08,
          recommended_action: 'No action required.',
          bounding_box: { x_min: 4, y_min: 18, x_max: 32, y_max: 88 },
          insight: 'All facings present and price-labelled. Planogram compliance is intact.'
        },
        {
          object_name: 'Shelf Unit 2 (Stock Gap)',
          category: 'General Object',
          confidence: 90.1,
          risk_score: 0.31,
          recommended_action: 'Trigger a replenishment task for the empty facing before end of day.',
          bounding_box: { x_min: 36, y_min: 18, x_max: 64, y_max: 88 },
          insight: 'Approximately 40% of the middle facing is empty, indicating a stock-out.'
        },
        {
          object_name: 'Shelf Unit 3 (Stocked)',
          category: 'General Object',
          confidence: 92.0,
          risk_score: 0.08,
          recommended_action: 'No action required.',
          bounding_box: { x_min: 68, y_min: 18, x_max: 96, y_max: 88 },
          insight: 'Full facing depth with consistent product alignment.'
        }
      ]
    }
  },
  document: {
    key: 'document',
    label: 'Technical Document & OCR',
    data: {
      scene_category: 'Technical Document & Equipment Tag',
      scene_description:
        'A simulated close-up of an equipment nameplate and an adjacent printed inspection form with handwritten entries.',
      severity_score: 0.28,
      summary:
        'Simulated OCR pass over a nameplate photograph. Serial number and pressure rating were read; the inspection form has two unsigned rows.',
      detected_objects: [
        {
          object_name: 'Equipment Serial Plate',
          category: 'Document & OCR',
          confidence: 95.8,
          risk_score: 0.15,
          recommended_action: 'Cross-check the serial number against the asset register before sign-off.',
          bounding_box: { x_min: 8, y_min: 12, x_max: 62, y_max: 48 },
          insight: 'Serial tag, model line, and maximum working pressure are legible and internally consistent.'
        },
        {
          object_name: 'Inspection Form (Unsigned Rows)',
          category: 'Document & OCR',
          confidence: 87.2,
          risk_score: 0.44,
          recommended_action: 'Route the form back to the technician for signature before archiving.',
          bounding_box: { x_min: 8, y_min: 55, x_max: 92, y_max: 94 },
          insight: 'Two completed inspection rows carry no technician signature or date stamp.'
        }
      ]
    }
  }
};

export const DEFAULT_DEMO_SCENE = DEMO_SCENES.industrial;

/** Rotates through the demo library so repeated demo runs feel varied. */
export function pickDemoScene(sceneKey) {
  if (sceneKey && DEMO_SCENES[sceneKey]) return DEMO_SCENES[sceneKey];
  const keys = Object.keys(DEMO_SCENES);
  return DEMO_SCENES[keys[Math.floor(Math.random() * keys.length)]];
}

/** Full API-shaped demo response for a given scene. */
export function buildDemoResponse(sceneKey) {
  const scene = pickDemoScene(sceneKey);
  return {
    scan_id: null,
    mode: 'DEMO',
    is_simulated: true,
    demo_notice: '[DEMO / SIMULATED MODE] Results are pre-recorded and were not produced by a live AI model.',
    demo_scene: scene.label,
    analyzed_at: new Date().toISOString(),
    model: 'simulated-dataset',
    ...scene.data
  };
}

/** Local id used for demo rows that are stored in the database. */
export function demoLocalId() {
  return `demo-${randomUUID()}`;
}

export default { DEMO_SCENES, buildDemoResponse, pickDemoScene, demoLocalId };
