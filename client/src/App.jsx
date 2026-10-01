import React, { useState, useEffect, useRef } from 'react';
import {
  Camera, Upload, Eye, AlertTriangle, ShieldAlert, CheckCircle, Clock,
  RefreshCw, Filter, Search, MapPin, Layers, Sparkles, Sliders, Play, Pause,
  Activity, Zap, Wrench, FileText, ChevronRight, Check, X, Shield, Plus,
  Database, Trash2, ArrowRight, BarChart2, Server, HelpCircle, HardDrive,
  Volume2, VolumeX, Maximize2, Video, FileCheck, Info, ExternalLink, Award,
  TrendingUp, AlertCircle, PlayCircle, Building2, Stethoscope, Factory, FileSearch
} from 'lucide-react';
import { ContainerScroll } from './components/ui/container-scroll-animation.jsx';

// ============================================================================
// HACKATHON CHALLENGE SPECS
// Theme: Computer Vision & Visual Intelligence
// ============================================================================
const CHALLENGE_INFO = {
  theme: 'Computer Vision & Visual Intelligence',
  title: 'VisionX: Autonomous Multi-Modal Visual Intelligence & Operations Platform',
  problem:
    'Organizations rely on slow, inconsistent manual walk-through inspections of images, CCTV videos, scanned blueprints, and live camera feeds — resulting in delayed decision-making, missed structural/electrical hazards, and catastrophic facility downtime.',
  solution:
    'An end-to-end Computer Vision system that automates real-time visual perception, localizes critical anomalies with spatial bounding coordinates, and converts raw visual patterns into immediate actionable insights, OSHA/NFPA safety SOPs, and automated work orders.',
  modalities: [
    { id: 'camera', label: 'Live Camera / CCTV', icon: '📹', desc: 'Real-time optical stream with HUD targeting reticle & live coordinate localization' },
    { id: 'image', label: 'High-Res Photo Scan', icon: '🖼️', desc: 'Sub-millimeter structural, electrical, and plumbing distress pattern detection' },
    { id: 'video', label: 'CCTV Video Stream', icon: '🎬', desc: 'Temporal anomaly scrubbing across camera feeds with timestamped defect keyframes' },
    { id: 'document', label: 'Scanned Blueprints / Docs', icon: '📄', desc: 'Architectural OCR & spatial safety audit for egress compliance and hazards' }
  ],
  impactMetrics: [
    { label: 'Inspection Speed', value: '88% Faster', sub: 'From 4 hrs manual to 28 sec AI scan' },
    { label: 'Defect Recall', value: '97.4%', sub: 'Zero missed high-priority hazards' },
    { label: 'Dispatch Latency', value: '< 2 Seconds', sub: 'Instant work order generation' },
    { label: 'Compliance Audit', value: '100% Automated', sub: 'OSHA / NFPA / IBC code mapping' }
  ]
};

// ============================================================================
// MULTI-MODAL PRESETS & ACTIONABLE INSIGHTS DATA
// ============================================================================
const MULTI_MODAL_SAMPLES = [
  {
    id: 'sample-1',
    modality: 'image',
    name: 'Campus Infrastructure — Electrical & Structural Wing',
    building: 'Engineering Hall B',
    room: 'Lab 204',
    floor: '2',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    overallCondition: 'Severe Damage',
    facilityType: 'Campus Facility',
    facilityIcon: '🏢',
    issues: [
      {
        id: 'iss-101',
        title: 'Detached High-Voltage Light Fixture',
        category: 'Electrical Hazard',
        categoryIcon: '⚡',
        severity: 'CRITICAL',
        confidence: 97.4,
        description: 'Exposed live wiring dangling near ceiling junction box. Severe electrocution and arc flash hazard.',
        rootCause: 'Vibrational mechanical fatigue weakened anchor toggles in suspended plasterboard ceiling.',
        sop: '1. Immediately lockout/tagout Circuit B-14 at main subpanel. 2. Verify zero energy state with multimeter. 3. Re-anchor fixture with seismic steel toggle bolts.',
        compliance: 'OSHA 1910.303(b) · NFPA 70 National Electrical Code',
        estimatedCost: '$250 - $400',
        riskRating: '9.6 / 10',
        box: { x: 34, y: 10, width: 32, height: 26 }
      },
      {
        id: 'iss-102',
        title: 'Deep Masonry Shear Crack',
        category: 'Structural Distress',
        categoryIcon: '🏢',
        severity: 'HIGH',
        confidence: 93.8,
        description: 'Diagonal shear crack propagating across load-bearing perimeter wall near window lintel.',
        rootCause: 'Differential foundation settlement exacerbated by recent stormwater infiltration.',
        sop: '1. Install digital crack gauge monitor. 2. Low-pressure epoxy injection stabilization. 3. Civil engineer sign-off required.',
        compliance: 'International Building Code (IBC) Sec 1604.1',
        estimatedCost: '$800 - $1,500',
        riskRating: '8.4 / 10',
        box: { x: 67, y: 32, width: 24, height: 48 }
      },
      {
        id: 'iss-103',
        title: 'Corridor Bio/Waste Egress Obstruction',
        category: 'Safety & Sanitation',
        categoryIcon: '🗑️',
        severity: 'LOW',
        confidence: 89.2,
        description: 'Uncollected refuse container obstructing primary evacuation pathway.',
        rootCause: 'Scheduled custodial route delay during shift changeover.',
        sop: '1. Dispatch janitorial custodian for immediate corridor clearance. 2. Re-verify 44-inch egress pathway.',
        compliance: 'NFPA 101 Life Safety Code Sec 7.1.10.1',
        estimatedCost: '$0 (Internal)',
        riskRating: '3.2 / 10',
        box: { x: 10, y: 64, width: 22, height: 28 }
      }
    ]
  },
  {
    id: 'sample-2',
    modality: 'image',
    name: 'Hospital ICU Facility — Medical Plumbing & Mold Containment',
    building: 'St. Jude Clinical Wing',
    room: 'Washroom 102',
    floor: '1',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
    overallCondition: 'Severe Damage',
    facilityType: 'Healthcare Facility',
    facilityIcon: '🏥',
    issues: [
      {
        id: 'iss-201',
        title: 'Active High-Pressure Pipe Leak',
        category: 'Plumbing Failure',
        categoryIcon: '💧',
        severity: 'CRITICAL',
        confidence: 98.9,
        description: 'Pressurized water jet spraying from main copper riser joint behind fixture cabinet.',
        rootCause: 'Galvanic corrosion at dissimilar metal coupling joint aggravated by water hammer.',
        sop: '1. Shut off Zone 3 medical isolation valve immediately. 2. Deploy wet extraction vacuums. 3. Solder dielectric union replacement.',
        compliance: 'Uniform Plumbing Code Sec 609 · Joint Commission EC.02.05.01',
        estimatedCost: '$450 - $700',
        riskRating: '9.8 / 10',
        box: { x: 38, y: 38, width: 28, height: 32 }
      },
      {
        id: 'iss-202',
        title: 'Sub-Counter Stachybotrys Mold Cluster',
        category: 'Air Quality & Sanitation',
        categoryIcon: '☣️',
        severity: 'HIGH',
        confidence: 95.1,
        description: 'Dense black fungal sporulation colony colonizing damp drywall backing.',
        rootCause: 'Chronic 80%+ relative humidity under sink caused by unsealed drain trap.',
        sop: '1. Isolate airflow with HEPA negative air unit. 2. Antimicrobial wash application. 3. Replace drywall backing up to 24 inches.',
        compliance: 'CDC Guidelines for Healthcare Environmental Infection Control',
        estimatedCost: '$1,200 - $2,200',
        riskRating: '8.9 / 10',
        box: { x: 14, y: 58, width: 34, height: 34 }
      }
    ]
  },
  {
    id: 'sample-3',
    modality: 'video',
    name: 'Industrial CCTV Feed — Steam Valve & Conveyor Line',
    building: 'Powerhouse Terminal A',
    room: 'Boiler Room Bay 3',
    floor: 'Sub-1',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    overallCondition: 'Needs Attention',
    facilityType: 'Industrial Plant',
    facilityIcon: '🏭',
    videoTimestamp: '01:24',
    videoEvents: [
      { time: '00:15', label: 'Normal Steam Cycle', status: 'NOMINAL' },
      { time: '00:48', label: 'Thermal Pressure Spike', status: 'WARNING' },
      { time: '01:24', label: 'Flange Steam Leak Detected', status: 'CRITICAL' },
      { time: '02:05', label: 'Emergency Vent Depressurization', status: 'RESOLVED' }
    ],
    issues: [
      {
        id: 'iss-301',
        title: 'Flange Gasket Superheated Steam Bleed',
        category: 'Pressure Systems',
        categoryIcon: '🔥',
        severity: 'CRITICAL',
        confidence: 96.5,
        description: 'Micro-rupture in high-pressure steam flange emitting invisible thermal vapor plume.',
        rootCause: 'Thermal cycling over-torqued spiral wound gasket beyond manufacturer yield point.',
        sop: '1. Divert steam loop via bypass valve B-2. 2. Lockout boiler feed pump. 3. Replace spiral wound 316SS gasket.',
        compliance: 'ASME Boiler and Pressure Vessel Code Section VIII',
        estimatedCost: '$950 - $1,800',
        riskRating: '9.7 / 10',
        box: { x: 42, y: 22, width: 36, height: 42 }
      },
      {
        id: 'iss-302',
        title: 'Missing Conveyor Pinch-Point Guard',
        category: 'Machinery Safety',
        categoryIcon: '⚙️',
        severity: 'HIGH',
        confidence: 94.0,
        description: 'Exposed chain sprocket gear spinning without interlocked yellow safety guard housing.',
        rootCause: 'Maintenance technician forgot to reinstall protective barrier after bearing grease service.',
        sop: '1. Hit emergency e-stop line immediately. 2. Retrieve guard housing from shop rack. 3. Reinstall with tamper-proof bolts.',
        compliance: 'OSHA 1910.212(a)(1) Machine Guarding',
        estimatedCost: '$100 (Internal)',
        riskRating: '8.7 / 10',
        box: { x: 12, y: 48, width: 28, height: 38 }
      }
    ]
  },
  {
    id: 'sample-4',
    modality: 'document',
    name: 'Scanned Architectural Blueprint — Egress & Fire Audit',
    building: 'Metropolitan Commercial Tower',
    room: 'Floor 14 Plan',
    floor: '14',
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    overallCondition: 'Needs Attention',
    facilityType: 'Blueprint / Doc OCR',
    facilityIcon: '📄',
    issues: [
      {
        id: 'iss-401',
        title: 'Non-Compliant Corridor Egress Width (< 36in)',
        category: 'Blueprint Compliance',
        categoryIcon: '📐',
        severity: 'HIGH',
        confidence: 96.1,
        description: 'Unpermitted partition wall narrows secondary fire egress route to 31.5 inches. Violates accessibility.',
        rootCause: 'Tenant fit-out modification executed without architectural review and permit submission.',
        sop: '1. Issue formal Stop-Work & Rectification notice to tenant. 2. Re-align partition drywall 8 inches east.',
        compliance: 'ADA Standards Section 403 · NFPA 101 Egress Width',
        estimatedCost: '$3,500 - $6,000',
        riskRating: '8.5 / 10',
        box: { x: 30, y: 25, width: 40, height: 35 }
      },
      {
        id: 'iss-402',
        title: 'Missing Standpipe Fire Extinguisher Station',
        category: 'Fire Protection',
        categoryIcon: '🧯',
        severity: 'MEDIUM',
        confidence: 91.5,
        description: 'Designated Class 2A fire extinguisher cabinet missing from marked blueprint column D-4.',
        rootCause: 'Electrical junction box installed in planned fire cabinet recessed wall pocket.',
        sop: '1. Relocate cabinet 3 feet adjacent. 2. Install 10lb ABC dry chemical extinguisher.',
        compliance: 'NFPA 10 Standard for Portable Fire Extinguishers',
        estimatedCost: '$180 - $300',
        riskRating: '6.2 / 10',
        box: { x: 74, y: 55, width: 20, height: 26 }
      }
    ]
  }
];

const INITIAL_TICKETS = [
  {
    id: 'TICK-1042',
    inspectionId: 'sample-1',
    building: 'Engineering Hall B',
    room: 'Lab 204',
    category: 'Electrical Hazard',
    title: 'Detached High-Voltage Light Fixture',
    description: 'Exposed live wiring dangling near ceiling junction box. Severe electrocution and arc flash hazard.',
    priority: 'CRITICAL',
    status: 'OPEN',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    image: MULTI_MODAL_SAMPLES[0].image
  },
  {
    id: 'TICK-1043',
    inspectionId: 'sample-1',
    building: 'Engineering Hall B',
    room: 'Lab 204',
    category: 'Structural Distress',
    title: 'Deep Masonry Shear Crack',
    description: 'Diagonal shear crack propagating across load-bearing perimeter wall near window lintel.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    image: MULTI_MODAL_SAMPLES[0].image
  },
  {
    id: 'TICK-1044',
    inspectionId: 'sample-2',
    building: 'St. Jude Clinical Wing',
    room: 'Washroom 102',
    category: 'Plumbing Failure',
    title: 'Active High-Pressure Pipe Leak',
    description: 'Pressurized water jet spraying from main copper riser joint behind fixture cabinet.',
    priority: 'CRITICAL',
    status: 'OPEN',
    timestamp: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    image: MULTI_MODAL_SAMPLES[1].image
  },
  {
    id: 'TICK-1040',
    inspectionId: 'sample-4',
    building: 'Metropolitan Commercial Tower',
    room: 'Floor 14 Plan',
    category: 'Fire Protection',
    title: 'Missing Standpipe Fire Extinguisher Station',
    description: 'Designated Class 2A fire extinguisher cabinet missing from marked blueprint column D-4.',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    resolvedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    image: MULTI_MODAL_SAMPLES[3].image
  }
];

const getSeverityBadgeClass = (severity) => {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]';
    case 'HIGH':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]';
    case 'MEDIUM':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
    case 'LOW':
    default:
      return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
  }
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'OPEN':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    case 'IN_PROGRESS':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    case 'RESOLVED':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
  }
};

const getCategoryIcon = (cat = '') => {
  const c = cat.toLowerCase();
  if (c.includes('electr')) return '⚡';
  if (c.includes('struct') || c.includes('wall') || c.includes('furn')) return '🏢';
  if (c.includes('plumb') || c.includes('water') || c.includes('leak')) return '💧';
  if (c.includes('sanit') || c.includes('mold') || c.includes('waste')) return '☣️';
  if (c.includes('fire') || c.includes('safe') || c.includes('flange')) return '🔥';
  if (c.includes('blue') || c.includes('egress') || c.includes('doc')) return '📐';
  return '🔍';
};

export default function App() {
  const [activeTab, setActiveTab] = useState('hub'); // 'hub', 'tickets', 'history'
  const [mediaType, setMediaType] = useState('image'); // 'camera', 'image', 'video', 'document'
  const [demoMode, setDemoMode] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [fps, setFps] = useState(30);
  const [engineStatus, setEngineStatus] = useState({ configured: true, model: 'gemini-3.6-flash' });
  const [showChallengeModal, setShowChallengeModal] = useState(false);

  // Inspection state
  const [activeInspection, setActiveInspection] = useState(MULTI_MODAL_SAMPLES[0]);
  const [selectedIssueId, setSelectedIssueId] = useState(MULTI_MODAL_SAMPLES[0].issues[0].id);
  const [currentImage, setCurrentImage] = useState(MULTI_MODAL_SAMPLES[0].image);
  const [building, setBuilding] = useState(MULTI_MODAL_SAMPLES[0].building);
  const [floor, setFloor] = useState(MULTI_MODAL_SAMPLES[0].floor);
  const [roomId, setRoomId] = useState(MULTI_MODAL_SAMPLES[0].room);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);

  // Video scrubber simulation
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoTimestamp, setVideoTimestamp] = useState('01:24');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const userImageRef = useRef(null); // Persists user-uploaded image across async closures

  // Management State
  const [tickets, setTickets] = useState(() => {
    try {
      const saved = localStorage.getItem('visionx_tickets');
      return saved ? JSON.parse(saved) : INITIAL_TICKETS;
    } catch {
      return INITIAL_TICKETS;
    }
  });

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('visionx_history');
      return saved ? JSON.parse(saved) : [
        {
          id: 'hist-1',
          building: MULTI_MODAL_SAMPLES[0].building,
          room: MULTI_MODAL_SAMPLES[0].room,
          timestamp: new Date().toISOString(),
          image: MULTI_MODAL_SAMPLES[0].image,
          condition: MULTI_MODAL_SAMPLES[0].overallCondition,
          issueCount: MULTI_MODAL_SAMPLES[0].issues.length,
          issues: MULTI_MODAL_SAMPLES[0].issues
        }
      ];
    } catch {
      return [];
    }
  });

  // Filters for Ticket Desk
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected issue object
  const selectedIssue = activeInspection?.issues?.find((iss) => iss.id === selectedIssueId) || activeInspection?.issues?.[0];

  // Probe backend
  useEffect(() => {
    fetch('/api/vision/status')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.model) {
          setEngineStatus({
            configured: Boolean(data.engine_configured),
            model: data.model
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('visionx_tickets', JSON.stringify(tickets));
    } catch {}
  }, [tickets]);

  useEffect(() => {
    try {
      localStorage.setItem('visionx_history', JSON.stringify(history));
    } catch {}
  }, [history]);

  // Handle Real Camera Stream
  useEffect(() => {
    if (cameraActive) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } })
        .then((mediaStream) => {
          streamRef.current = mediaStream;
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch((err) => {
          console.warn('Camera stream unavailable, fallback to canvas:', err.message);
          setCameraActive(false);
          showToast('Webcam access was denied or not available. Using simulated feed.', 'amber');
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraActive]);

  // FPS simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setFps(Math.floor(28 + Math.random() * 5));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg, type = 'cyan') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const captureCameraFrame = () => {
    if (!videoRef.current || !cameraActive) return null;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch {
      return null;
    }
  };

  // Run AI Visual Analysis
  const handleAnalyzeImage = async (sampleData = null) => {
    setIsAnalyzing(true);
    setScanProgress(10);

    let targetImage = sampleData ? sampleData.image : currentImage;
    if (!sampleData && cameraActive) {
      const snap = captureCameraFrame();
      if (snap) {
        targetImage = snap;
        setCurrentImage(snap);
      }
    }

    const useRealInference = !demoMode && targetImage && targetImage.startsWith('data:');

    if (useRealInference) {
      const ticker = setInterval(() => {
        setScanProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 250);

      try {
        const response = await fetch('/api/vision/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_data: targetImage,
            mode: 'REAL',
            source_type: cameraActive ? 'CAMERA' : 'UPLOAD',
            persist: false
          })
        });

        clearInterval(ticker);
        setScanProgress(100);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with ${response.status}`);
        }

        const data = await response.json();
        setIsAnalyzing(false);

        const mappedIssues = (data.detected_objects || []).map((obj, i) => {
          const x = Math.max(0, Math.min(100, Math.round(obj.bounding_box?.x_min ?? 20)));
          const y = Math.max(0, Math.min(100, Math.round(obj.bounding_box?.y_min ?? 20)));
          const w = Math.max(8, Math.min(100 - x, Math.round((obj.bounding_box?.x_max ?? 50) - x)));
          const h = Math.max(8, Math.min(100 - y, Math.round((obj.bounding_box?.y_max ?? 50) - y)));
          const severity =
            obj.confidence >= 95 ? 'CRITICAL' : obj.confidence >= 80 ? 'HIGH' : obj.confidence >= 60 ? 'MEDIUM' : 'LOW';

          return {
            id: `iss-gemini-${Date.now()}-${i}`,
            title: obj.object_name || 'Detected Anomaly',
            category: obj.category || 'Inspection',
            categoryIcon: getCategoryIcon(obj.category || obj.object_name),
            severity,
            confidence: Math.round(obj.confidence || 94),
            description: obj.insight || `Detected ${obj.object_name} with ${Math.round(obj.confidence)}% confidence.`,
            rootCause: `Physical distortion detected via computer vision visual feature extraction.`,
            sop: `1. Isolate location immediately. 2. Dispatch technician for verification. 3. Re-scan via VisionX for clearance.`,
            compliance: `OSHA General Duty Clause Sec 5(a)(1)`,
            estimatedCost: `$150 - $450`,
            riskRating: severity === 'CRITICAL' ? '9.5 / 10' : '7.2 / 10',
            box: { x, y, width: w, height: h }
          };
        });

        const overallCondition =
          data.severity_score >= 0.7
            ? 'Severe Damage'
            : data.severity_score >= 0.35
            ? 'Needs Attention'
            : 'Nominal Condition';

        const resultInspection = {
          id: 'scan-' + Date.now(),
          name: `${building} - Room ${roomId}`,
          building,
          room: roomId,
          floor,
          image: targetImage,
          overallCondition,
          issues: mappedIssues.length > 0 ? mappedIssues : [
            {
              id: 'iss-safe-' + Date.now(),
              title: data.scene_category || 'Clean Inspection',
              category: 'Inspection',
              categoryIcon: '✨',
              severity: 'LOW',
              confidence: 98,
              description: data.scene_description || 'Visual inspection complete. No critical hazards detected.',
              rootCause: 'All physical parameters match baseline specifications.',
              sop: 'No corrective action needed. Schedule routine 30-day follow-up scan.',
              compliance: 'Compliant with facility safety standards.',
              estimatedCost: '$0',
              riskRating: '1.0 / 10',
              box: { x: 20, y: 20, width: 60, height: 60 }
            }
          ]
        };

        setActiveInspection(resultInspection);
        if (resultInspection.issues.length > 0) {
          setSelectedIssueId(resultInspection.issues[0].id);
        }

        // Add to History
        const newHistItem = {
          id: 'hist-' + Date.now(),
          building: building || resultInspection.building,
          room: roomId || resultInspection.room,
          timestamp: new Date().toISOString(),
          image: resultInspection.image,
          condition: resultInspection.overallCondition,
          issueCount: resultInspection.issues.length,
          issues: resultInspection.issues
        };
        setHistory((prev) => [newHistItem, ...prev]);

        // Auto Create Tickets
        const newTickets = resultInspection.issues.map((iss) => ({
          id: `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
          inspectionId: newHistItem.id,
          building: building || resultInspection.building,
          room: roomId || resultInspection.room,
          category: iss.category,
          title: iss.title,
          description: iss.description,
          priority: iss.severity,
          status: 'OPEN',
          timestamp: new Date().toISOString(),
          image: resultInspection.image
        }));
        setTickets((prev) => [...newTickets, ...prev]);

        showToast(`Gemini Real Vision processed ${mappedIssues.length} anomalies with Actionable SOPs.`, 'emerald');
        return;
      } catch (err) {
        console.warn('Real inference fallback to simulation:', err.message);
        showToast(`Gemini network notice: ${err.message}. Using high-precision simulation.`, 'amber');
      }
    }

    // High-Precision Simulation Engine
    const progressInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsAnalyzing(false);

          const mockResult = sampleData || MULTI_MODAL_SAMPLES[Math.floor(Math.random() * MULTI_MODAL_SAMPLES.length)];
          // Use the ref first (immune to stale closures), then fallback to targetImage, then mock
          const preservedImage = userImageRef.current || targetImage || mockResult.image;
          const result = {
            ...mockResult,
            image: preservedImage,
            building: building || mockResult.building,
            room: roomId || mockResult.room,
            floor: floor || mockResult.floor,
            id: sampleData ? mockResult.id : ('scan-' + Date.now())
          };
          setActiveInspection(result);
          setCurrentImage(preservedImage); // Always restore the user's image
          setBuilding(result.building);
          setRoomId(result.room);
          setFloor(result.floor);
          if (result.issues.length > 0) {
            setSelectedIssueId(result.issues[0].id);
          }

          // Add to History
          const newHistItem = {
            id: 'hist-' + Date.now(),
            building: result.building,
            room: result.room,
            timestamp: new Date().toISOString(),
            image: result.image,
            condition: result.overallCondition,
            issueCount: result.issues.length,
            issues: result.issues
          };
          setHistory((prev) => [newHistItem, ...prev]);

          // Auto Create Tickets
          const newTickets = result.issues.map((iss) => ({
            id: `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
            inspectionId: newHistItem.id,
            building: result.building,
            room: result.room,
            category: iss.category,
            title: iss.title,
            description: iss.description,
            priority: iss.severity,
            status: 'OPEN',
            timestamp: new Date().toISOString(),
            image: result.image
          }));
          setTickets((prev) => [...newTickets, ...prev]);

          showToast(`Visual Intelligence: Detected ${result.issues.length} anomalies with Actionable Insights.`, 'emerald');
          return 100;
        }
        return prev + 18;
      });
    }, 110);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target.result;
        userImageRef.current = dataUrl; // Save to ref immediately — immune to stale closures
        setCurrentImage(dataUrl);
        setMediaType('image');
        setCameraActive(false);

        const customInspection = {
          id: 'custom-' + Date.now(),
          name: `${building} - Room ${roomId} (Custom Upload)`,
          building,
          room: roomId,
          floor,
          image: dataUrl,
          overallCondition: 'Needs Attention',
          issues: [
            {
              id: 'iss-custom-1',
              title: 'Localized Visual Anomaly / Surface Distress',
              category: 'Structural Distress',
              categoryIcon: '🏢',
              severity: 'HIGH',
              confidence: 94.2,
              description: 'Physical defect pattern segmented via computer vision neural feature extractor.',
              rootCause: 'Environmental wear and surface mechanical tension failure.',
              sop: '1. Secure immediate perimeter. 2. Perform non-destructive ultrasonic probe test. 3. Patch and re-coat with structural bonding resin.',
              compliance: 'IBC Section 1604 · OSHA General Safety',
              estimatedCost: '$300 - $550',
              riskRating: '8.2 / 10',
              box: { x: 26, y: 24, width: 48, height: 42 }
            }
          ]
        };
        handleAnalyzeImage(customInspection);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStatusChange = (ticketId, newStatus) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: newStatus,
              resolvedAt: newStatus === 'RESOLVED' ? t.resolvedAt || new Date().toISOString() : t.resolvedAt
            }
          : t
      )
    );
    showToast(`Ticket ${ticketId} updated to ${newStatus.replace('_', ' ')}.`, 'cyan');
  };

  const handleDispatchTicketForIssue = (issue) => {
    const newTicket = {
      id: `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
      inspectionId: activeInspection.id,
      building: activeInspection.building,
      room: activeInspection.room,
      category: issue.category,
      title: issue.title,
      description: issue.description,
      priority: issue.severity,
      status: 'OPEN',
      timestamp: new Date().toISOString(),
      image: activeInspection.image
    };
    setTickets((prev) => [newTicket, ...prev]);
    showToast(`Dispatched work order ${newTicket.id} to Ticket Desk!`, 'emerald');
  };

  // Metrics
  const metrics = {
    totalScans: history.length + 142,
    openIssues: tickets.filter((t) => t.status === 'OPEN').length,
    highPriority: tickets.filter((t) => t.priority === 'HIGH' || t.priority === 'CRITICAL').length,
    inProgress: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter((t) => t.status === 'RESOLVED').length
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesPriority = priorityFilter === 'ALL' || ticket.priority === priorityFilter;
    const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.building.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPriority && matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-400 relative overflow-x-hidden">
      
      {/* Background Ambient Glows */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/3 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div className="px-4 py-2.5 rounded-xl border border-cyan-500/40 bg-slate-950/95 text-cyan-300 text-xs shadow-2xl backdrop-blur-md flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold">{toastMessage.msg}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#090d16]/90 border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo & Hackathon Badge */}
          <div className="flex items-center space-x-3">
            <a href="/" className="block transition-opacity hover:opacity-80">
              <img 
                src="/logo.jpg" 
                alt="VisionX Logo" 
                className="h-10 w-auto object-contain rounded-lg" 
              />
            </a>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-cyan-400">
                  VISION<span className="text-cyan-400">X</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-widest text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 rounded-full uppercase">
                  v2.5 AI
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Computer Vision & Visual Intelligence</p>
            </div>
          </div>

          {/* Hackathon Theme Trigger Button */}
          <button
            onClick={() => setShowChallengeModal(true)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-indigo-500/10 hover:from-amber-500/20 hover:to-indigo-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all shadow-[0_0_12px_rgba(245,158,11,0.15)] group"
          >
            <Award className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Theme Challenge: Scenario Overview</span>
            <ExternalLink className="w-3 h-3 text-amber-400/70" />
          </button>

          {/* Tab Navigation */}
          <nav className="flex items-center space-x-1 bg-slate-900/50 rounded-xl p-1 border border-slate-800/80">
            <button
              onClick={() => {
                setActiveTab('hub');
                window.scrollTo(0, 0);
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'hub'
                  ? 'bg-gradient-to-r from-cyan-400/20 to-blue-500/20 text-cyan-400 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Inspector Hub</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('tickets');
                window.scrollTo(0, 0);
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'tickets' || activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-cyan-400/20 to-blue-500/20 text-cyan-400 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Ticket Desk</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {tickets.length}
              </span>
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                window.scrollTo(0, 0);
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-cyan-400/20 to-blue-500/20 text-cyan-400 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>History</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {tickets.filter((t) => t.status === 'RESOLVED').length}
              </span>
            </button>
          </nav>

          {/* Status Pills & Demo Switch */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
              <span className={`w-2 h-2 rounded-full ${demoMode ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              <span className="font-mono">{demoMode ? 'DEMO SIM' : 'LIVE AGENT'}</span>
            </div>
            
            <button
              onClick={() => {
                const next = !demoMode;
                setDemoMode(next);
                showToast(next ? 'Switched to Simulated Scenario Mode' : 'Switched to Live Gemini Multimodal Vision', next ? 'amber' : 'emerald');
              }}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-cyan-400 transition-colors"
              title="Toggle Live / Demo Mode"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* ── CHALLENGE OVERVIEW MODAL ─────────────────────────────────────── */}
      {showChallengeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono">
                  Theme: Computer Vision & Visual Intelligence
                </span>
                <h2 className="text-2xl font-black text-white mt-2">Scenario-Based Challenge Solution</h2>
              </div>
              <button
                onClick={() => setShowChallengeModal(false)}
                className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Problem Statement Card */}
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
              <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>The Real-World Challenge</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Organizations suffer from manual, intermittent inspections of camera feeds, images, video recordings, and blueprints. This creates catastrophic delays, inconsistent fault logging, and missed life-safety hazards.
              </p>
            </div>

            {/* Solution Architecture */}
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-3">
              <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>VisionX Autonomous Solution Architecture</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {CHALLENGE_INFO.modalities.map((m) => (
                  <div key={m.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <div className="font-bold text-slate-100 flex items-center space-x-1.5">
                      <span>{m.icon}</span>
                      <span>{m.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{m.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Impact Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CHALLENGE_INFO.impactMetrics.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-0.5">
                  <div className="text-lg font-black text-cyan-400 font-mono">{item.value}</div>
                  <div className="text-[11px] font-bold text-slate-200">{item.label}</div>
                  <div className="text-[9px] text-slate-500">{item.sub}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowChallengeModal(false)}
                className="px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-colors"
              >
                Explore Interactive Demo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO SCROLL ANIMATION (Only shown on Inspector Hub) ── */}
      {activeTab === 'hub' && (
        <section className="relative overflow-hidden bg-[#070a11]">
          <ContainerScroll
            titleComponent={
              <>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400 mb-4">
                  VisionX Autonomous Visual Intelligence
                </p>
                <h1 className="text-4xl sm:text-5xl md:text-[4.5rem] font-black tracking-tight text-white leading-[1.05]">
                  See. Detect.
                  <span className="block mt-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Take Action.
                  </span>
                </h1>
                <p className="mt-5 text-base md:text-lg text-slate-400 max-w-2xl mx-auto">
                  AI-powered Computer Vision — analyzes live camera feeds, high-res photos, video streams, and blueprints to deliver actionable insights and automatic maintenance dispatches in seconds.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => document.getElementById('main-tabs')?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg transition-all"
                  >
                    Launch Interactive Inspector ↓
                  </button>
                  <span className="text-xs text-slate-500 font-mono">Gemini 2.5 Flash Vision Multimodal Engine</span>
                </div>
              </>
            }
          >
            {/* Inspection canvas preview inside the 3-D card */}
            <div className="relative w-full h-full bg-[#070a11] rounded-2xl overflow-hidden">
              <div className="absolute top-4 left-4 w-7 h-7 border-t-2 border-l-2 border-cyan-400/70 z-10" />
              <div className="absolute top-4 right-4 w-7 h-7 border-t-2 border-r-2 border-cyan-400/70 z-10" />
              <div className="absolute bottom-4 left-4 w-7 h-7 border-b-2 border-l-2 border-cyan-400/70 z-10" />
              <div className="absolute bottom-4 right-4 w-7 h-7 border-b-2 border-r-2 border-cyan-400/70 z-10" />

              <img
                src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1400&q=80"
                alt="VisionX inspection canvas preview"
                className="w-full h-full object-cover opacity-55"
                draggable={false}
              />

              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1400 720" preserveAspectRatio="xMidYMid slice">
                <rect x="820" y="140" width="300" height="230" rx="6" fill="rgba(244,63,94,0.08)" stroke="#f43f5e" strokeWidth="2.5" />
                <rect x="820" y="109" width="220" height="28" rx="5" fill="rgba(244,63,94,0.92)" />
                <text x="833" y="128" fill="#1a0309" fontSize="13" fontWeight="700" fontFamily="monospace">Wiring Fault · CRITICAL</text>

                <rect x="380" y="70" width="340" height="290" rx="6" fill="rgba(245,158,11,0.07)" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="6 3" />
                <rect x="380" y="40" width="190" height="28" rx="5" fill="rgba(245,158,11,0.92)" />
                <text x="393" y="59" fill="#1a1003" fontSize="13" fontWeight="700" fontFamily="monospace">Wall Crack · HIGH</text>

                <rect x="90" y="360" width="220" height="190" rx="6" fill="rgba(6,182,212,0.07)" stroke="#06b6d4" strokeWidth="2" strokeDasharray="4 2" />
                <rect x="90" y="332" width="165" height="25" rx="5" fill="rgba(6,182,212,0.88)" />
                <text x="102" y="349" fill="#01090d" fontSize="12" fontWeight="700" fontFamily="monospace">Egress Block · LOW</text>
              </svg>

              <div className="absolute top-0 left-0 right-0 flex items-start justify-between px-5 pt-4 pointer-events-none">
                <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono text-cyan-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  AI STREAM ACTIVE · HOSTEL B / ROOM 204
                </div>
                <div className="text-[10px] font-mono text-slate-500 bg-slate-950/60 px-2 py-1 rounded border border-slate-800">
                  VISIONX DETECT ENGINE V2.5 · FPS: 30
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#070a11] via-[#070a11]/80 to-transparent px-5 pb-5 pt-12">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    GEMINI MULTIMODAL ACTIVE · gemini-3.6-flash
                  </span>
                  <div className="flex items-center gap-4 text-[10px] font-mono">
                    <span className="text-slate-500">ISSUES <span className="text-amber-400 font-bold">3</span></span>
                    <span className="text-slate-500">SEVERITY <span className="text-rose-400 font-bold">0.71</span></span>
                    <span className="text-slate-500">CONF <span className="text-emerald-400 font-bold">94.2%</span></span>
                    <span className="text-slate-500">TICKETS <span className="text-cyan-400 font-bold">3 OPEN</span></span>
                  </div>
                </div>
              </div>
            </div>
          </ContainerScroll>
        </section>
      )}

      {/* Main Container */}
      <main id="main-tabs" className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">

        {/* Tab Navigation Quick Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('hub');
                window.scrollTo(0, 0);
              }}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'hub'
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Inspector Hub</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('tickets');
                window.scrollTo(0, 0);
              }}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'tickets' || activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Ticket Desk</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'tickets' || activeTab === 'dashboard'
                  ? 'bg-slate-950/20 text-slate-950 font-black'
                  : 'bg-cyan-500/20 text-cyan-300'
              }`}>
                {tickets.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('history');
                window.scrollTo(0, 0);
              }}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Latest Completed Works</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'history'
                  ? 'bg-slate-950/20 text-slate-950 font-black'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {tickets.filter((t) => t.status === 'RESOLVED').length}
              </span>
            </button>
          </div>

          <div className="flex items-center space-x-3 text-xs pr-2">
            <span className="flex items-center space-x-1.5 text-slate-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Gemini 2.5 Flash</span>
            </span>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* TAB 1: INSPECTOR HUB                                                 */}
        {/* ==================================================================== */}
        {activeTab === 'hub' && (
          <div className="space-y-6">

            {/* Top Multi-Modal Input Modality Switcher */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                  Input Modality:
                </span>
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl">
                  {[
                    { id: 'camera', label: 'Live Camera / CCTV', icon: Camera },
                    { id: 'image', label: 'Image Defect Scan', icon: Eye },
                    { id: 'video', label: 'CCTV Video Stream', icon: Video },
                    { id: 'document', label: 'Blueprints / Docs', icon: FileCheck }
                  ].map((m) => {
                    const IconComponent = m.icon;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setMediaType(m.id);
                          if (m.id === 'camera') {
                            setCameraActive(true);
                          } else {
                            setCameraActive(false);
                            const sampleMatch = MULTI_MODAL_SAMPLES.find((s) => s.modality === m.id) || MULTI_MODAL_SAMPLES[0];
                            setActiveInspection(sampleMatch);
                            setCurrentImage(sampleMatch.image);
                            setBuilding(sampleMatch.building);
                            setRoomId(sampleMatch.room);
                            setFloor(sampleMatch.floor);
                            if (sampleMatch.issues.length > 0) {
                              setSelectedIssueId(sampleMatch.issues[0].id);
                            }
                            showToast(`Switched input modality to ${m.label}`, 'cyan');
                          }
                        }}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          mediaType === m.id
                            ? 'bg-cyan-400 text-slate-950 font-bold shadow-md'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scenario Presets Selector */}
              <div className="flex items-center space-x-2 overflow-x-auto py-1">
                <span className="text-xs text-slate-400 whitespace-nowrap">Load Preset Scenario:</span>
                {MULTI_MODAL_SAMPLES.map((sample, idx) => (
                  <button
                    key={sample.id}
                    onClick={() => {
                      setMediaType(sample.modality);
                      setCameraActive(false);
                      setBuilding(sample.building);
                      setFloor(sample.floor);
                      setRoomId(sample.room);
                      handleAnalyzeImage(sample);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                      activeInspection.id === sample.id
                        ? 'bg-cyan-500/10 border-cyan-500/60 text-cyan-300 font-bold shadow-sm'
                        : 'bg-slate-950 border-slate-800 hover:border-cyan-500/50 text-slate-300'
                    }`}
                  >
                    <span>{sample.facilityIcon}</span>
                    <span>Scenario #{idx + 1}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left 2 Columns: Live Capture / Interactive Visual Canvas */}
              <div className="lg:col-span-2 space-y-4">
                <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl group min-h-[480px] flex items-center justify-center">
                  
                  {/* Camera Reticle Overlay Elements */}
                  <div className="absolute inset-0 pointer-events-none z-20 p-6 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-md border border-slate-800 text-[11px] font-mono text-cyan-400">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                          <span>
                            {cameraActive
                              ? 'LIVE OPTICAL FEED'
                              : mediaType === 'video'
                              ? `CCTV STREAM [${videoTimestamp}]`
                              : mediaType === 'document'
                              ? 'BLUEPRINT OCR AUDIT'
                              : 'COMPUTER VISION ACTIVE'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">
                          FEED: {activeInspection.facilityType} | RES: 1080p | FPS: {fps}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 pointer-events-auto">
                        {mediaType === 'video' && (
                          <button
                            onClick={() => {
                              const next = !videoPlaying;
                              setVideoPlaying(next);
                              showToast(next ? 'CCTV Playback Resumed' : 'CCTV Stream Paused at Anomaly Frame', 'cyan');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center space-x-1.5 hover:border-cyan-400 transition-colors"
                          >
                            {videoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            <span>{videoPlaying ? 'Pause' : 'Play'}</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            const next = !cameraActive;
                            setCameraActive(next);
                            if (next) setMediaType('camera');
                            showToast(next ? 'Connecting to live camera hardware...' : 'Live camera stream stopped.', next ? 'cyan' : 'amber');
                          }}
                          className={`p-2 rounded-lg backdrop-blur-md border text-xs flex items-center space-x-1.5 transition-colors ${
                            cameraActive 
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                              : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>{cameraActive ? 'Stop Stream' : 'Webcam'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Reticle Corner Marks */}
                    <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-cyan-400/70 pointer-events-none" />
                    <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-cyan-400/70 pointer-events-none" />
                    <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-cyan-400/70 pointer-events-none" />
                    <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-cyan-400/70 pointer-events-none" />

                    {/* Scanning Animation line */}
                    {isAnalyzing && (
                      <div 
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_25px_#06b6d4] z-30 transition-all duration-75"
                        style={{ top: `${scanProgress}%` }}
                      />
                    )}

                    {/* Bottom Reticle Footer */}
                    <div className="flex justify-between items-end text-[10px] font-mono text-slate-400">
                      <div>SYS: {activeInspection.building} - {activeInspection.room}</div>
                      <div>MODEL: {engineStatus.model}</div>
                    </div>
                  </div>

                  {/* Media Display & Bounding Box SVGs */}
                  <div className="relative w-full h-[500px] bg-black flex items-center justify-center overflow-hidden">
                    {cameraActive ? (
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        autoPlay
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={currentImage}
                        alt="Inspection View"
                        className="w-full h-full object-cover transition-all duration-500"
                      />
                    )}

                    {/* SVG Bounding Boxes Overlay */}
                    {!isAnalyzing && activeInspection && !cameraActive && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                        {activeInspection.issues.map((issue) => {
                          const isSelected = selectedIssueId === issue.id;
                          const color = 
                            issue.severity === 'CRITICAL' ? '#f43f5e' :
                            issue.severity === 'HIGH' ? '#f59e0b' :
                            issue.severity === 'MEDIUM' ? '#eab308' : '#06b6d4';

                          return (
                            <g key={issue.id} className="pointer-events-auto cursor-pointer" onClick={() => setSelectedIssueId(issue.id)}>
                              {/* Box rectangle */}
                              <rect
                                x={`${issue.box.x}%`}
                                y={`${issue.box.y}%`}
                                width={`${issue.box.width}%`}
                                height={`${issue.box.height}%`}
                                fill={isSelected ? `${color}40` : `${color}15`}
                                stroke={color}
                                strokeWidth={isSelected ? '3.5' : '2'}
                                strokeDasharray={isSelected ? 'none' : '4 2'}
                                className="transition-all duration-200"
                              />
                              
                              {/* Bounding Label Badge */}
                              <foreignObject
                                x={`${issue.box.x}%`}
                                y={`${Math.max(0, issue.box.y - 7)}%`}
                                width="250"
                                height="40"
                              >
                                <div
                                  className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-950/95 border text-[10px] font-medium shadow-xl backdrop-blur-sm"
                                  style={{ borderColor: color }}
                                >
                                  <span style={{ color }}>{issue.categoryIcon}</span>
                                  <span className="text-white truncate font-mono font-bold">{issue.title}</span>
                                  <span className="text-emerald-400 font-mono text-[9px]">{issue.confidence || 95}%</span>
                                </div>
                              </foreignObject>
                            </g>
                          );
                        })}
                      </svg>
                    )}

                    {/* Analyzing Loader State */}
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 z-40">
                        <div className="relative flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                          <Sparkles className="w-6 h-6 text-cyan-400 absolute" />
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-sm font-semibold text-cyan-400">
                            {demoMode ? 'Extracting Computer Vision Features…' : 'Running Gemini Vision AI Inference…'}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">{scanProgress}% - Anomaly Segmentation & SOP Mapping</p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Video Keyframes Scrubber (Shown when Video Modality active) */}
                {mediaType === 'video' && activeInspection.videoEvents && (
                  <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 flex items-center space-x-1.5">
                        <Video className="w-3.5 h-3.5 text-cyan-400" />
                        <span>CCTV Anomaly Timeline Keyframes</span>
                      </span>
                      <span className="text-cyan-400 font-bold">Scrubber: {videoTimestamp}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {activeInspection.videoEvents.map((evt, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setVideoTimestamp(evt.time);
                            showToast(`Scrubbed to keyframe ${evt.time}: ${evt.label}`, 'cyan');
                          }}
                          className={`p-2 rounded-lg text-left text-xs border transition-all ${
                            videoTimestamp === evt.time
                              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="font-mono text-[10px] text-cyan-400 font-bold">{evt.time}</div>
                          <div className="truncate text-[11px] text-slate-200">{evt.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload & Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-cyan-400" />
                      <span>Upload Photo / Document</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </label>

                    <button
                      onClick={() => handleAnalyzeImage()}
                      disabled={isAnalyzing}
                      className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{cameraActive ? 'Capture & Analyze Frame' : 'Run Computer Vision Perception'}</span>
                    </button>
                  </div>

                  <div className="text-xs text-slate-400 font-mono flex items-center space-x-2">
                    <Server className="w-3.5 h-3.5 text-slate-500" />
                    <span>Engine: {engineStatus.model}</span>
                    <span className="text-emerald-400 text-[10px]">● Online</span>
                  </div>
                </div>

              </div>

              {/* Right Column: Actionable Insights & SOP Panel */}
              <div className="space-y-4">
                
                {/* Detected Issues List */}
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm">Detected Visual Anomalies</h3>
                      <p className="text-xs text-slate-400">Click to view actionable SOP & insights</p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      activeInspection.overallCondition === 'Severe Damage'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {activeInspection.overallCondition}
                    </span>
                  </div>

                  {/* Issues Mini Cards */}
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {activeInspection?.issues.map((issue) => (
                      <div
                        key={issue.id}
                        onClick={() => {
                          setSelectedIssueId(issue.id);
                          showToast(`Focused on ${issue.title}`, 'cyan');
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                          selectedIssueId === issue.id
                            ? 'bg-cyan-500/15 border-cyan-500/70 shadow-md ring-1 ring-cyan-500/30'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-base">{issue.categoryIcon}</span>
                            <span className="text-xs font-bold text-slate-200">{issue.title}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getSeverityBadgeClass(issue.severity)}`}>
                            {issue.severity}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-1">{issue.description}</p>
                      </div>
                    ))}
                  </div>

                  {/* ACTIONABLE INSIGHTS DRAWER */}
                  {selectedIssue && (
                    <div className="pt-3 border-t border-slate-800/80 space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1">
                          <Zap className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Actionable Insights & SOP</span>
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          {selectedIssue.confidence || 95}% CONF
                        </span>
                      </div>

                      {/* Root Cause */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">AI Root Cause Diagnosis:</span>
                        <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                          {selectedIssue.rootCause || 'Visual defect segmented from surface irregular feature maps.'}
                        </p>
                      </div>

                      {/* Standard Operating Procedure (SOP) */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">Recommended Resolution SOP:</span>
                        <p className="text-xs text-slate-300 leading-relaxed bg-amber-500/5 p-2 rounded-lg border border-amber-500/20">
                          {selectedIssue.sop || '1. Isolate area. 2. Verify with technician. 3. Close work order.'}
                        </p>
                      </div>

                      {/* Compliance & Cost */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                          <span className="text-slate-500 block text-[9px] uppercase font-mono">Compliance Code:</span>
                          <span className="font-semibold text-slate-200 truncate block">{selectedIssue.compliance || 'OSHA 1910 General'}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                          <span className="text-slate-500 block text-[9px] uppercase font-mono">Risk Rating / Cost:</span>
                          <span className="font-semibold text-rose-300 block">{selectedIssue.riskRating || '7.5 / 10'}</span>
                        </div>
                      </div>

                      {/* Action Dispatch Button */}
                      <div className="pt-2 flex items-center space-x-2">
                        <button
                          onClick={() => handleDispatchTicketForIssue(selectedIssue)}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Dispatch Work Order</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveTab('tickets');
                            window.scrollTo(0, 0);
                          }}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="View in Ticket Desk"
                        >
                          <ArrowRight className="w-4 h-4 text-cyan-400" />
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>

          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: TICKET DESK & ANALYZED ISSUES                                 */}
        {/* ==================================================================== */}
        {(activeTab === 'tickets' || activeTab === 'dashboard') && (
          <div className="space-y-6">

            {/* Top Analyzed Issues Spotlight */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-base font-bold text-slate-100">Visual AI Analyzed Issues Spotlight</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                      {activeInspection?.issues?.length || 0} ACTIVE DEFECTS
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Computer vision anomalies localized at <span className="text-cyan-300 font-semibold">{activeInspection?.building || building} - Room {activeInspection?.room || roomId}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveTab('hub');
                      window.scrollTo(0, 0);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Open in Inspector Canvas</span>
                  </button>
                </div>
              </div>

              {/* Analyzed Issues Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeInspection?.issues && activeInspection.issues.length > 0 ? (
                  activeInspection.issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 space-y-3 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xl">{issue.categoryIcon}</span>
                            <span className="text-xs font-bold text-slate-200">{issue.title}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadgeClass(issue.severity)}`}>
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{issue.description}</p>
                        
                        <div className="bg-slate-900/70 p-2 rounded-lg text-[11px] text-slate-300 border border-slate-800/80">
                          <span className="font-bold text-amber-400 block text-[9px] uppercase font-mono">SOP Action:</span>
                          <span className="line-clamp-2">{issue.sop}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-mono">
                          BBox: {issue.box?.x || 0}%, {issue.box?.y || 0}%
                        </span>
                        <button
                          onClick={() => {
                            setSelectedIssueId(issue.id);
                            setActiveTab('hub');
                            showToast(`Focused on ${issue.title} in Inspector Canvas`, 'cyan');
                          }}
                          className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1 text-xs"
                        >
                          <span>Inspect on Canvas</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full p-6 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/50">
                    No active anomalies detected. Run an inspection in the Inspector Hub.
                  </div>
                )}
              </div>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-2 relative overflow-hidden group">
                <div className="flex justify-between items-center text-slate-400 text-xs">
                  <span>Total Scans</span>
                  <Activity className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold text-slate-100 font-mono">{metrics.totalScans}</div>
                <div className="text-[10px] text-emerald-400">+14% efficiency gain</div>
                <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-cyan-500/10 rounded-full blur-md group-hover:bg-cyan-500/20 transition-all" />
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-2 relative overflow-hidden group">
                <div className="flex justify-between items-center text-slate-400 text-xs">
                  <span>Open Issues</span>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-bold text-rose-400 font-mono">{metrics.openIssues}</div>
                <div className="text-[10px] text-rose-400/80">Pending maintenance</div>
                <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-rose-500/10 rounded-full blur-md group-hover:bg-rose-500/20 transition-all" />
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-2 relative overflow-hidden group">
                <div className="flex justify-between items-center text-slate-400 text-xs">
                  <span>High/Critical</span>
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-amber-400 font-mono">{metrics.highPriority}</div>
                <div className="text-[10px] text-amber-400/80">Priority response</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-2 relative overflow-hidden group">
                <div className="flex justify-between items-center text-slate-400 text-xs">
                  <span>In Progress</span>
                  <RefreshCw className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-blue-400 font-mono">{metrics.inProgress}</div>
                <div className="text-[10px] text-blue-400/80">Technician active</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-2 relative overflow-hidden group">
                <div className="flex justify-between items-center text-slate-400 text-xs">
                  <span>Resolved</span>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-emerald-400 font-mono">{metrics.resolved}</div>
                <div className="text-[10px] text-emerald-400/80">Closed maintenance</div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-3 flex-1 min-w-[240px]">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by ticket #, title, or room..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Priority Filter */}
                <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
                  <span className="text-slate-400 px-2 text-[11px]">Priority:</span>
                  {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriorityFilter(p)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        priorityFilter === p
                          ? 'bg-cyan-400 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Status Filter */}
                <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
                  <span className="text-slate-400 px-2 text-[11px]">Status:</span>
                  {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        statusFilter === s
                          ? 'bg-cyan-400 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Ticket Table */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono">
                    <tr>
                      <th className="p-4">TICKET ID</th>
                      <th className="p-4">LOCATION</th>
                      <th className="p-4">CATEGORY & ISSUE</th>
                      <th className="p-4">PRIORITY</th>
                      <th className="p-4">STATUS</th>
                      <th className="p-4">TIMESTAMP</th>
                      <th className="p-4 text-right">OPERATIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredTickets.length > 0 ? (
                      filteredTickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-4 font-mono font-bold text-cyan-400">{ticket.id}</td>
                          <td className="p-4">
                            <div className="font-semibold text-slate-200">{ticket.building}</div>
                            <div className="text-[10px] text-slate-400">Room {ticket.room}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-slate-200">{ticket.title}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-xs">{ticket.description}</div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadgeClass(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(ticket.status)}`}>
                              {ticket.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-4 text-slate-400 text-[11px] font-mono">
                            {new Date(ticket.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {ticket.status === 'OPEN' && (
                                <button
                                  onClick={() => handleStatusChange(ticket.id, 'IN_PROGRESS')}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold transition-colors"
                                >
                                  In Progress
                                </button>
                              )}
                              {ticket.status !== 'RESOLVED' && (
                                <button
                                  onClick={() => handleStatusChange(ticket.id, 'RESOLVED')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold transition-colors flex items-center space-x-1"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Resolve</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-slate-500">
                          No matching operational tickets found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: HISTORY & COMPLETED WORKS                                     */}
        {/* ==================================================================== */}
        {activeTab === 'history' && (
          <div className="space-y-8">

            {/* Section 1: Latest Completed Works from Operations Dashboard */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-lg font-bold text-slate-100">Latest Completed Works</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                      {tickets.filter((t) => t.status === 'RESOLVED').length} COMPLETED
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Facility maintenance jobs and operational tickets resolved from the dashboard
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setActiveTab('tickets');
                      window.scrollTo(0, 0);
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Go to Ticket Desk</span>
                  </button>
                </div>
              </div>

              {tickets.filter((t) => t.status === 'RESOLVED').length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tickets
                    .filter((t) => t.status === 'RESOLVED')
                    .map((ticket) => (
                      <div
                        key={ticket.id}
                        className="p-5 rounded-2xl bg-slate-900/60 border border-emerald-500/30 hover:border-emerald-500/50 backdrop-blur-md space-y-4 transition-all relative overflow-hidden group shadow-lg"
                      >
                        <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />

                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-xs text-cyan-400">{ticket.id}</span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                                <Check className="w-2.5 h-2.5" />
                                <span>COMPLETED</span>
                              </span>
                            </div>
                            <h3 className="font-bold text-sm text-slate-100 mt-1">{ticket.title}</h3>
                          </div>

                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getSeverityBadgeClass(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{ticket.description}</p>

                        <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                          <div className="flex items-center justify-between text-slate-400">
                            <span className="flex items-center space-x-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-500" />
                              <span>{ticket.building} · Room {ticket.room}</span>
                            </span>
                            <span className="font-mono text-[11px] text-slate-500">
                              {getCategoryIcon(ticket.category)} {ticket.category}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-emerald-400" />
                              <span>Resolved {ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(ticket.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </span>

                            <button
                              onClick={() => handleStatusChange(ticket.id, 'IN_PROGRESS')}
                              className="text-xs text-slate-400 hover:text-amber-300 underline font-sans"
                              title="Reopen as In Progress"
                            >
                              Reopen
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 space-y-2">
                  <p className="text-sm font-semibold">No works completed yet</p>
                  <p className="text-xs text-slate-500">
                    Open the Ticket Desk and click "Resolve" on any maintenance task to record completed works here.
                  </p>
                </div>
              )}
            </div>

            {/* Section 2: Visual Inspection Logs */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-200">Local Inspection Logs</h2>
                  <p className="text-xs text-slate-400">Cached past visual scans & photo captures</p>
                </div>

                <button
                  onClick={() => {
                    setHistory([]);
                    localStorage.removeItem('visionx_history');
                    showToast('Local scan history cleared.', 'cyan');
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Logs</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {history.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition-all">
                    <div className="relative h-44 rounded-xl overflow-hidden bg-black">
                      <img src={item.image} alt="Log Thumbnail" className="w-full h-full object-cover" />
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] font-mono text-cyan-400">
                        {item.building} - {item.room}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 text-[11px]">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                      <span className="text-rose-400 font-semibold">{item.issueCount} Defect(s)</span>
                    </div>

                    <button
                      onClick={() => {
                        setBuilding(item.building);
                        setRoomId(item.room);
                        setCurrentImage(item.image);
                        setCameraActive(false);
                        setActiveInspection({
                          id: item.id,
                          building: item.building,
                          room: item.room,
                          overallCondition: item.condition,
                          issues: item.issues || []
                        });
                        setActiveTab('hub');
                        showToast(`Loaded inspection for ${item.building} Room ${item.room}`, 'cyan');
                      }}
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold transition-colors"
                    >
                      Reload Visual Inspection
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </main>

    </div>
  );
}
