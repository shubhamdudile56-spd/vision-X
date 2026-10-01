import React, { useState, useEffect, useRef } from 'react';
import {
  Camera, Upload, Eye, AlertTriangle, ShieldAlert, CheckCircle, Clock,
  RefreshCw, Filter, Search, MapPin, Layers, Sparkles, Sliders, Play,
  Activity, Zap, Wrench, FileText, ChevronRight, Check, X, Shield, Plus,
  Database, Trash2, ArrowRight, BarChart2, Server, HelpCircle, HardDrive,
  Volume2, VolumeX, Maximize2
} from 'lucide-react';
import { ContainerScroll } from './components/ui/container-scroll-animation.jsx';

const MOCK_SAMPLES = [
  {
    id: 'sample-1',
    name: 'Hostel B - Room 204 (Damaged Light & Wall)',
    building: 'Hostel B',
    room: '204',
    floor: '2',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80',
    overallCondition: 'Needs Attention',
    issues: [
      {
        id: 'iss-101',
        title: 'Broken Ceiling Fixture',
        category: 'Electrical',
        categoryIcon: '⚡',
        severity: 'HIGH',
        description: 'Light fixture partially detached with exposed wiring hanging.',
        box: { x: 35, y: 12, width: 30, height: 25 }
      },
      {
        id: 'iss-102',
        title: 'Plaster Structural Crack',
        category: 'Structural',
        categoryIcon: '🏢',
        severity: 'MEDIUM',
        description: 'Deep vertical wall crack extending near window trim.',
        box: { x: 68, y: 35, width: 22, height: 45 }
      },
      {
        id: 'iss-103',
        title: 'Overflowing Waste Bin',
        category: 'Sanitation',
        categoryIcon: '🗑️',
        severity: 'LOW',
        description: 'Uncollected refuse overflowing into common space.',
        box: { x: 10, y: 65, width: 20, height: 28 }
      }
    ]
  },
  {
    id: 'sample-2',
    name: 'Block C - Washroom 102 (Plumbing Failure)',
    building: 'Block C',
    room: '102',
    floor: '1',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80',
    overallCondition: 'Severe Damage',
    issues: [
      {
        id: 'iss-201',
        title: 'Active Water Pipe Leak',
        category: 'Plumbing',
        categoryIcon: '💧',
        severity: 'CRITICAL',
        description: 'Pressurized water dripping from high-pressure conduit joint.',
        box: { x: 40, y: 40, width: 25, height: 30 }
      },
      {
        id: 'iss-202',
        title: 'Black Mold Proliferation',
        category: 'Sanitation',
        categoryIcon: '🗑️',
        severity: 'HIGH',
        description: 'Extensive damp mold patches accumulating under sink unit.',
        box: { x: 15, y: 60, width: 35, height: 32 }
      }
    ]
  },
  {
    id: 'sample-3',
    name: 'Hostel A - Study Hall (Furniture & Safety)',
    building: 'Hostel A',
    room: 'G-05',
    floor: 'G',
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1000&q=80',
    overallCondition: 'Needs Attention',
    issues: [
      {
        id: 'iss-301',
        title: 'Broken Desk Support Frame',
        category: 'Structural',
        categoryIcon: '🏢',
        severity: 'MEDIUM',
        description: 'Structural leg joint snapped on desk station 4.',
        box: { x: 25, y: 50, width: 30, height: 35 }
      },
      {
        id: 'iss-302',
        title: 'Damaged Safety Signage',
        category: 'Safety',
        categoryIcon: '🛡️',
        severity: 'LOW',
        description: 'Emergency exit direction poster torn and unreadable.',
        box: { x: 75, y: 15, width: 18, height: 25 }
      }
    ]
  }
];

const INITIAL_TICKETS = [
  {
    id: 'TICK-1042',
    inspectionId: 'insp-1',
    building: 'Hostel B',
    room: '204',
    category: 'Electrical',
    title: 'Broken Ceiling Fixture',
    description: 'Light fixture partially detached with exposed wiring hanging.',
    priority: 'HIGH',
    status: 'OPEN',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'TICK-1043',
    inspectionId: 'insp-1',
    building: 'Hostel B',
    room: '204',
    category: 'Structural',
    title: 'Plaster Structural Crack',
    description: 'Deep vertical wall crack extending near window trim.',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'TICK-1044',
    inspectionId: 'insp-2',
    building: 'Block C',
    room: '102',
    category: 'Plumbing',
    title: 'Active Water Pipe Leak',
    description: 'Pressurized water dripping from high-pressure conduit joint.',
    priority: 'CRITICAL',
    status: 'OPEN',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'TICK-1040',
    inspectionId: 'insp-3',
    building: 'Hostel A',
    room: '108',
    category: 'Sanitation',
    title: 'Overflowing Bin Container',
    description: 'Uncollected debris near corridor hallway.',
    priority: 'LOW',
    status: 'RESOLVED',
    timestamp: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=300&q=80'
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
  if (c.includes('sanit') || c.includes('mold') || c.includes('waste')) return '🗑️';
  if (c.includes('safe') || c.includes('hazard') || c.includes('fire')) return '🛡️';
  return '🔍';
};

export default function App() {
  const [activeTab, setActiveTab] = useState('hub'); // 'hub', 'dashboard', 'history'
  const [demoMode, setDemoMode] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [fps, setFps] = useState(30);
  const [engineStatus, setEngineStatus] = useState({ configured: true, model: 'gemini-3.6-flash' });

  // Inspection Hub state
  const [building, setBuilding] = useState('Hostel B');
  const [floor, setFloor] = useState('2');
  const [roomId, setRoomId] = useState('204');
  const [currentImage, setCurrentImage] = useState(MOCK_SAMPLES[0].image);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeInspection, setActiveInspection] = useState(MOCK_SAMPLES[0]);
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

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
          building: 'Hostel B',
          room: '204',
          timestamp: new Date().toISOString(),
          image: MOCK_SAMPLES[0].image,
          condition: 'Needs Attention',
          issueCount: 3,
          issues: MOCK_SAMPLES[0].issues
        }
      ];
    } catch {
      return [];
    }
  });

  // Filter states for Dashboard
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Probe backend engine on load
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
      .catch(() => {
        // Soft fallback to simulated values if standalone
      });
  }, []);

  // Save changes to local storage
  useEffect(() => {
    try {
      localStorage.setItem('visionx_tickets', JSON.stringify(tickets));
    } catch {
      /* ignore storage errors */
    }
  }, [tickets]);

  useEffect(() => {
    try {
      localStorage.setItem('visionx_history', JSON.stringify(history));
    } catch {
      /* ignore storage errors */
    }
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
          console.warn('Camera stream unavailable, keeping canvas view:', err.message);
          setCameraActive(false);
          showToast('Webcam access was denied or not available.', 'amber');
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

  // FPS simulation effect for camera view
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

  // Capture current camera frame if active
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

  const handleAnalyzeImage = async (sampleData = null) => {
    setIsAnalyzing(true);
    setScanProgress(10);
    setSelectedIssueId(null);

    // If camera is streaming and no sampleData given, capture current frame
    let targetImage = sampleData ? sampleData.image : currentImage;
    if (!sampleData && cameraActive) {
      const snap = captureCameraFrame();
      if (snap) {
        targetImage = snap;
        setCurrentImage(snap);
      }
    }

    // Determine whether to invoke real Gemini backend or run local simulation
    const useRealInference = !demoMode && targetImage && targetImage.startsWith('data:');

    if (useRealInference) {
      // Progress ticker during real network call
      const ticker = setInterval(() => {
        setScanProgress((prev) => (prev < 90 ? prev + 10 : prev));
      }, 300);

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

        // Map backend detected_objects to UI inspection schema
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
            description: obj.insight || `Detected ${obj.object_name} with ${Math.round(obj.confidence)}% confidence.`,
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
              description: data.scene_description || 'Visual inspection complete. No critical hazards detected.',
              box: { x: 20, y: 20, width: 60, height: 60 }
            }
          ]
        };

        setActiveInspection(resultInspection);

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
        setHistory((prevHist) => [newHistItem, ...prevHist]);

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

        setTickets((prevTix) => [...newTickets, ...prevTix]);
        showToast(`Gemini Real Vision processed ${mappedIssues.length} anomalies.`, 'emerald');
        return;
      } catch (err) {
        console.warn('Real inference fallback to simulation:', err.message);
        showToast(`Gemini call notice: ${err.message}. Falling back to simulation.`, 'amber');
      }
    }

    // Local / Simulated Inference Loop
    const progressInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsAnalyzing(false);

          const result = sampleData || MOCK_SAMPLES[Math.floor(Math.random() * MOCK_SAMPLES.length)];
          setActiveInspection(result);
          setCurrentImage(result.image);

          // Add to History
          const newHistItem = {
            id: 'hist-' + Date.now(),
            building: building || result.building,
            room: roomId || result.room,
            timestamp: new Date().toISOString(),
            image: result.image,
            condition: result.overallCondition,
            issueCount: result.issues.length,
            issues: result.issues
          };
          setHistory((prevHist) => [newHistItem, ...prevHist]);

          // Auto Create Tickets
          const newTickets = result.issues.map((iss) => ({
            id: `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
            inspectionId: newHistItem.id,
            building: building || result.building,
            room: roomId || result.room,
            category: iss.category,
            title: iss.title,
            description: iss.description,
            priority: iss.severity,
            status: 'OPEN',
            timestamp: new Date().toISOString(),
            image: result.image
          }));

          setTickets((prevTix) => [...newTickets, ...prevTix]);
          return 100;
        }
        return prev + 15;
      });
    }, 120);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target.result;
        setCurrentImage(dataUrl);

        if (demoMode) {
          const customInspection = {
            id: 'custom-' + Date.now(),
            name: `${building} - Room ${roomId}`,
            building,
            room: roomId,
            floor,
            image: dataUrl,
            overallCondition: 'Needs Attention',
            issues: [
              {
                id: 'iss-c1',
                title: 'Surface Irregularity / Wear',
                category: 'Structural',
                categoryIcon: '🏢',
                severity: 'HIGH',
                description: 'Vision perception localized physical distress pattern in image frame.',
                box: { x: 28, y: 25, width: 44, height: 40 }
              }
            ]
          };
          handleAnalyzeImage(customInspection);
        } else {
          // Trigger live Gemini detection on upload
          handleAnalyzeImage({
            id: 'custom-' + Date.now(),
            name: `${building} - Room ${roomId}`,
            building,
            room: roomId,
            floor,
            image: dataUrl,
            overallCondition: 'Evaluating…',
            issues: []
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStatusChange = (ticketId, newStatus) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? {
        ...t,
        status: newStatus,
        resolvedAt: newStatus === 'RESOLVED' ? (t.resolvedAt || new Date().toISOString()) : t.resolvedAt
      } : t))
    );
    showToast(`Ticket ${ticketId} updated to ${newStatus.replace('_', ' ')}.`, 'cyan');
  };

  // Metric Calculation
  const metrics = {
    totalScans: history.length + 138,
    openIssues: tickets.filter((t) => t.status === 'OPEN').length,
    highPriority: tickets.filter((t) => t.priority === 'HIGH' || t.priority === 'CRITICAL').length,
    inProgress: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter((t) => t.status === 'RESOLVED').length
  };

  // Filtered Tickets
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
        <div className="fixed top-16 right-6 z-50 animate-bounce">
          <div className="px-4 py-2.5 rounded-xl border border-cyan-500/40 bg-slate-950/90 text-cyan-400 text-xs shadow-2xl backdrop-blur-md flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>{toastMessage.msg}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#090d16]/80 border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo */}
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
                <span className="text-xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-blue-400">
                  VISION<span className="text-blue-400">X</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-widest text-blue-400 bg-blue-400/10 border border-blue-400/30 rounded-full uppercase">
                  v2.5 AI
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Autonomous Visual Intelligence</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex items-center space-x-1 bg-slate-900/50 rounded-xl p-1 border border-slate-800/80">
            <button
              onClick={() => {
                setActiveTab('hub');
                window.scrollTo({ top: 0, behavior: 'instant' });
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
                window.scrollTo({ top: 0, behavior: 'instant' });
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
                window.scrollTo({ top: 0, behavior: 'instant' });
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
              <span className="font-mono">{demoMode ? 'DEMO MODE' : 'LIVE AGENT'}</span>
            </div>
            
            <button
              onClick={() => {
                const next = !demoMode;
                setDemoMode(next);
                showToast(next ? 'Switched to Simulated Demo Mode' : 'Switched to Live Gemini Multimodal Agent', next ? 'amber' : 'emerald');
              }}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-cyan-400 transition-colors"
              title="Toggle Live / Demo Mode"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

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
                AI-powered building inspection — point a camera, upload a photo, and get
                bounding boxes, severity scores, and auto-generated maintenance tickets in seconds.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => document.getElementById('main-tabs')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg transition-all"
                >
                  Launch Inspector ↓
                </button>
                <span className="text-xs text-slate-500 font-mono">Powered by Gemini 2.5 Flash Vision</span>
              </div>
            </>
          }
        >
          {/* Inspection canvas preview inside the 3-D card */}
          <div className="relative w-full h-full bg-[#070a11] rounded-2xl overflow-hidden">
            {/* Reticle corners */}
            <div className="absolute top-4 left-4 w-7 h-7 border-t-2 border-l-2 border-cyan-400/70 z-10" />
            <div className="absolute top-4 right-4 w-7 h-7 border-t-2 border-r-2 border-cyan-400/70 z-10" />
            <div className="absolute bottom-4 left-4 w-7 h-7 border-b-2 border-l-2 border-cyan-400/70 z-10" />
            <div className="absolute bottom-4 right-4 w-7 h-7 border-b-2 border-r-2 border-cyan-400/70 z-10" />

            {/* Background inspection photo */}
            <img
              src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1400&q=80"
              alt="VisionX inspection canvas preview"
              className="w-full h-full object-cover opacity-55"
              draggable={false}
            />

            {/* SVG bounding boxes */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 1400 720"
              preserveAspectRatio="xMidYMid slice"
            >
              {/* CRITICAL — Wiring Fault */}
              <rect x="820" y="140" width="300" height="230" rx="6" fill="rgba(244,63,94,0.08)" stroke="#f43f5e" strokeWidth="2.5" />
              <rect x="820" y="109" width="212" height="28" rx="5" fill="rgba(244,63,94,0.92)" />
              <text x="833" y="128" fill="#1a0309" fontSize="13" fontWeight="700" fontFamily="monospace">Wiring Fault · CRITICAL</text>

              {/* HIGH — Wall Crack */}
              <rect x="380" y="70" width="340" height="290" rx="6" fill="rgba(245,158,11,0.07)" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="6 3" />
              <rect x="380" y="40" width="190" height="28" rx="5" fill="rgba(245,158,11,0.92)" />
              <text x="393" y="59" fill="#1a1003" fontSize="13" fontWeight="700" fontFamily="monospace">Wall Crack · HIGH</text>

              {/* LOW — Furniture */}
              <rect x="90" y="360" width="220" height="190" rx="6" fill="rgba(6,182,212,0.07)" stroke="#06b6d4" strokeWidth="2" strokeDasharray="4 2" />
              <rect x="90" y="332" width="156" height="25" rx="5" fill="rgba(6,182,212,0.88)" />
              <text x="102" y="349" fill="#01090d" fontSize="12" fontWeight="700" fontFamily="monospace">Furniture · LOW</text>
            </svg>

            {/* Top HUD */}
            <div className="absolute top-0 left-0 right-0 flex items-start justify-between px-5 pt-4 pointer-events-none">
              <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                AI STREAM ACTIVE · HOSTEL B / ROOM 204
              </div>
              <div className="text-[10px] font-mono text-slate-500 bg-slate-950/60 px-2 py-1 rounded border border-slate-800">
                VISIONX DETECT ENGINE V2.5 · FPS: 30
              </div>
            </div>

            {/* Bottom status bar */}
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
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'tickets' || activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Ticket Desk & Analyzed Issues</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'tickets' || activeTab === 'dashboard'
                  ? 'bg-slate-950/20 text-slate-950 font-black'
                  : 'bg-cyan-500/20 text-cyan-300'
              }`}>
                {activeInspection?.issues?.length || tickets.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('history');
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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

          <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400 pr-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-mono">Live Sync Active</span>
          </div>
        </div>

        {/* TAB 1: INSPECTION HUB */}
        {activeTab === 'hub' && (
          <div className="space-y-6">

            {/* Top Bar Location & Controls */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>Target Inspection Location:</span>
                </div>

                {/* Building Dropdown */}
                <div className="flex items-center space-x-2">
                  <label className="text-xs text-slate-400">Building:</label>
                  <select
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Hostel A">Hostel A</option>
                    <option value="Hostel B">Hostel B</option>
                    <option value="Block C">Block C</option>
                    <option value="Main Science Block">Main Science Block</option>
                  </select>
                </div>

                {/* Floor Dropdown */}
                <div className="flex items-center space-x-2">
                  <label className="text-xs text-slate-400">Floor:</label>
                  <select
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="G">Ground</option>
                    <option value="1">1st Floor</option>
                    <option value="2">2nd Floor</option>
                    <option value="3">3rd Floor</option>
                  </select>
                </div>

                {/* Room Input */}
                <div className="flex items-center space-x-2">
                  <label className="text-xs text-slate-400">Room ID:</label>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
                    placeholder="e.g. 204"
                  />
                </div>
              </div>

              {/* Sample Preset Selector */}
              <div className="flex items-center space-x-2 overflow-x-auto py-1">
                <span className="text-xs text-slate-400 whitespace-nowrap">Load Preset:</span>
                {MOCK_SAMPLES.map((sample, idx) => (
                  <button
                    key={sample.id}
                    onClick={() => {
                      setBuilding(sample.building);
                      setFloor(sample.floor);
                      setRoomId(sample.room);
                      setCameraActive(false);
                      handleAnalyzeImage(sample);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-slate-300 transition-all whitespace-nowrap"
                  >
                    Sample #{idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Interactive Inspector Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left 2 Columns: Live Capture / Interactive Image Overlay Canvas */}
              <div className="lg:col-span-2 space-y-4">
                <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl group min-h-[460px] flex items-center justify-center">
                  
                  {/* Camera Reticle Overlay Elements */}
                  <div className="absolute inset-0 pointer-events-none z-20 p-6 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-md border border-slate-800 text-[11px] font-mono text-cyan-400">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          <span>{cameraActive ? 'WEBCAM ACTIVE' : 'AI STREAM ACTIVE'}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">RES: 1080p | FPS: {fps}</p>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCameraActive(!cameraActive)}
                          className={`p-2 rounded-lg backdrop-blur-md border text-xs flex items-center space-x-1.5 pointer-events-auto transition-colors ${
                            cameraActive 
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>{cameraActive ? 'Stop Stream' : 'Cam Feed'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Reticle Frame Corner Marks */}
                    <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-cyan-400/60 pointer-events-none" />
                    <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-cyan-400/60 pointer-events-none" />
                    <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-cyan-400/60 pointer-events-none" />
                    <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-cyan-400/60 pointer-events-none" />

                    {/* Scanning Animation line */}
                    {isAnalyzing && (
                      <div 
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#06b6d4] z-30 transition-all duration-75"
                        style={{ top: `${scanProgress}%` }}
                      />
                    )}

                    {/* Bottom Reticle Footer */}
                    <div className="flex justify-between items-end text-[10px] font-mono text-slate-400">
                      <div>SYS: {building} - ROOM {roomId}</div>
                      <div>VISIONX DETECT ENGINE V2.5</div>
                    </div>
                  </div>

                  {/* Image Display & Bounding Box SVGs */}
                  <div className="relative w-full h-[480px] bg-black flex items-center justify-center overflow-hidden">
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
                                strokeWidth={isSelected ? '3' : '2'}
                                strokeDasharray={isSelected ? 'none' : '4 2'}
                                className="transition-all duration-200"
                              />
                              
                              {/* Bounding Label Badge */}
                              <foreignObject
                                x={`${issue.box.x}%`}
                                y={`${Math.max(0, issue.box.y - 8)}%`}
                                width="220"
                                height="40"
                              >
                                <div
                                  className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-950/90 border border-slate-800 text-[10px] font-medium shadow-lg backdrop-blur-sm"
                                  style={{ borderColor: color }}
                                >
                                  <span style={{ color }}>{issue.categoryIcon}</span>
                                  <span className="text-white truncate font-mono">{issue.title}</span>
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
                            {demoMode ? 'Simulating Visual Perception…' : 'Running Gemini Vision AI Model…'}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">{scanProgress}% - Extracting Defect Patterns</p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Upload & Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-cyan-400" />
                      <span>Upload Custom Photo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </label>

                    <button
                      onClick={() => handleAnalyzeImage()}
                      disabled={isAnalyzing}
                      className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{cameraActive ? 'Capture & Analyze Frame' : 'Run AI Detection'}</span>
                    </button>
                  </div>

                  <div className="text-xs text-slate-400 font-mono flex items-center space-x-2">
                    <Server className="w-3.5 h-3.5 text-slate-500" />
                    <span>Model: {engineStatus.model}</span>
                    <span className="text-emerald-400 text-[10px]">● Online</span>
                  </div>
                </div>

              </div>

              {/* Right Column: Detected Issues & Ticket Generator Panel */}
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="font-semibold text-slate-200 text-sm">Visual AI Analysis</h3>
                      <p className="text-xs text-slate-400">Detected issues mapping</p>
                    </div>

                    {activeInspection && (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        activeInspection.overallCondition === 'Severe Damage'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {activeInspection.overallCondition}
                      </span>
                    )}
                  </div>

                  {/* Issues List */}
                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {activeInspection?.issues.map((issue) => (
                      <div
                        key={issue.id}
                        onClick={() => setSelectedIssueId(issue.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                          selectedIssueId === issue.id
                            ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-base">{issue.categoryIcon}</span>
                            <span className="text-xs font-semibold text-slate-200">{issue.title}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getSeverityBadgeClass(issue.severity)}`}>
                            {issue.severity}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2">{issue.description}</p>
                        
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-1">
                          <span>Category: {issue.category}</span>
                          <span className="text-cyan-400 font-sans flex items-center space-x-1">
                            <span>Locate on canvas</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Ticket Creation Callout */}
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <div className="flex items-center space-x-2 text-xs text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      <span>{activeInspection?.issues.length || 0} Tickets Dispatched to Operations</span>
                    </div>

                    <button
                      onClick={() => setActiveTab('tickets')}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center space-x-2 transition-colors"
                    >
                      <span>View in Ticket Desk & Analyzed Issues</span>
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    </button>
                  </div>

                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: TICKET DESK & ANALYZED ISSUES */}
        {(activeTab === 'tickets' || activeTab === 'dashboard') && (
          <div className="space-y-6">

            {/* Top Analyzed Issues Section */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-base font-bold text-slate-100">Visual AI Analyzed Issues</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                      {activeInspection?.issues?.length || 0} DETECTED
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Defects and structural anomalies detected for <span className="text-cyan-300 font-semibold">{activeInspection?.building || building} - Room {activeInspection?.room || roomId}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('hub')}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Open in Inspector Canvas</span>
                  </button>
                </div>
              </div>

              {/* Analyzed Issues Grid */}
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
                    No active anomalies detected in current frame. Run an inspection in the Inspector Hub to analyze defects.
                  </div>
                )}
              </div>
            </div>

            {/* Glassmorphism Metric Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-2 relative overflow-hidden group">
                <div className="flex justify-between items-center text-slate-400 text-xs">
                  <span>Total Scans</span>
                  <Activity className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold text-slate-100 font-mono">{metrics.totalScans}</div>
                <div className="text-[10px] text-emerald-400">+12% from last week</div>
                <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-cyan-500/10 rounded-full blur-md group-hover:bg-cyan-500/20 transition-all" />
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-2 relative overflow-hidden group">
                <div className="flex justify-between items-center text-slate-400 text-xs">
                  <span>Open Issues</span>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-bold text-rose-400 font-mono">{metrics.openIssues}</div>
                <div className="text-[10px] text-rose-400/80">Requires assignment</div>
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
                <div className="text-[10px] text-blue-400/80">Staff dispatched</div>
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
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-slate-200">{ticket.title}</span>
                            </div>
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

        {/* TAB 3: HISTORY & COMPLETED WORKS */}
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
                    onClick={() => setActiveTab('tickets')}
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
