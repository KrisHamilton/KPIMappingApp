import React, { useEffect, useState, useRef } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  MarkerType,
  applyNodeChanges,
} from "reactflow";
import dagre from "dagre";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import domtoimage from "dom-to-image-more";
import "reactflow/dist/style.css";
import FloatingEdge from "./FloatingEdge";

// Utils
const uid = (prefix = "id") =>
  `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`;

const nodeWidth = 180;
const nodeHeight = 48;
const PAD = 16; // padding to prevent touching

// Lever Data (unchanged)
const initialLeversData = [
  {
    id: "lev_cdh",
    name: "Customer Decision Hub",
    features: [
      {
        id: "cdh_nba_designer",
        name: "Next-Best-Action Designer",
        rules: [
          "NBA Strategies (Upsell, Cross-sell, Retention, Acquisition, Nurture, Loyalty, Onboarding, Collections)",
          "Engagement Policies",
          "Action Arbitration",
          "Prioritization Logic",
          "Eligibility Rules",
          "Suppression Rules",
        ],
      },
      {
        id: "cdh_actions_treatments",
        name: "Actions & Treatments",
        rules: [
          "Action Configuration",
          "Treatment Variations (per channel)",
          "Offer Bundling",
          "Message Personalization",
          "Channel Assignment",
        ],
      },
      {
        id: "cdh_analytics",
        name: "Analytical Tools",
        rules: [
          "Impact Analyzer",
          "Value Finder",
          "Simulation Testing",
          "Engagement Metrics",
          "Journey Monitoring & Visualization",
        ],
      },
      {
        id: "cdh_ai_ml",
        name: "AI & Machine Learning",
        rules: [
          "Predictive Model Building",
          "Adaptive Modeling",
          "Import 3rd Party Models (PMML, H2O.ai)",
          "Real-Time AI Connectors (Google Cloud ML, Amazon SageMaker)",
          "Natural Language Processing & Text Analytics",
          "Model Transparency Controls",
          "GenAI CDH Assistant",
        ],
      },
      {
        id: "cdh_profiles",
        name: "Customer Profiles",
        rules: [
          "Customer Profile Designer",
          "Customer Profile Viewer",
          "Interaction History",
          "Audience & Profile Data Management",
          "Multi-level Customer Data Management",
          "Complex Event Processing",
          "Streaming Data Management",
        ],
      },
      {
        id: "cdh_journeys",
        name: "Customer Journeys",
        rules: [
          "Next-Best-Action Customer Journeys",
          "Journey Monitoring & Visualization",
          "Channel, Treatment, Engagement, and Throughput Monitoring",
        ],
      },
      {
        id: "cdh_channels",
        name: "Engagement Channels",
        rules: [
          "Inbound (Web, Mobile, ATM, Kiosk, Contact Center, Retail, Branch)",
          "Outbound (Email, SMS, Direct Mail)",
          "Preference Management (GDPR Compliance)",
          "Real-time Web Personalization",
          "Interactive Digital Microsites",
        ],
      },
      {
        id: "cdh_context",
        name: "Context Dictionary & Switching",
        rules: [
          "Context Dictionary Configuration",
          "Context Switching in Strategy Canvas",
          "Multilevel Context Definition",
        ],
      },
      {
        id: "cdh_portal",
        name: "Customer Decision Hub Portal",
        rules: [
          "Role-based Information Layout",
          "Application Overview",
          "Ruleset Management",
          "Performance Data",
        ],
      },
    ],
  },
  { id: "lev_rpa", name: "Robotic Process Automation" },
  { id: "lev_ai", name: "Artificial Intelligence & Decisioning" },
  { id: "lev_case_mgmt", name: "Case Management" },
  { id: "lev_workflow", name: "Workflow Automation" },
  { id: "lev_proc_mining", name: "Process Mining" },
  { id: "lev_rules", name: "Business Rules Engine" },
  { id: "lev_integration", name: "Integration (APIs, Connectors)" },
  { id: "lev_data_mgmt", name: "Data Management" },
  { id: "lev_uiux", name: "UI/UX Components" },
  { id: "lev_reporting", name: "Reporting & Analytics" },
  { id: "lev_sla", name: "SLA Management" },
  { id: "lev_notifications", name: "Notifications & Alerts" },
  { id: "lev_security", name: "Security & Access Control" },
  { id: "lev_mobile", name: "Mobile Application Support" },
  { id: "lev_multichannel", name: "Multi-Channel Communication" },
  { id: "lev_docs", name: "Document Generation & Management" },
  { id: "lev_audit", name: "Audit & Compliance Tracking" },
  { id: "lev_legacy", name: "Legacy System Integration" },
  { id: "lev_reusable", name: "Reusable Components" },
  { id: "lev_testing", name: "Testing & Quality Assurance Tools" },
  { id: "lev_devops", name: "Deployment & DevOps Tools" },
  { id: "lev_portal", name: "User Portal & Dashboards" },
  { id: "lev_exception", name: "Exception Handling" },
  { id: "lev_case_lifecycle", name: "Case Lifecycle Management" },
  { id: "lev_microjourney", name: "Microjourneys" },
  { id: "lev_cust_service", name: "Customer Service Automation" },
  { id: "lev_sales", name: "Sales Automation" },
  { id: "lev_rda", name: "Robotic Desktop Automation" },
  { id: "lev_knowledge", name: "Knowledge Management" },
  { id: "lev_predictive", name: "Predictive Analytics" },
  { id: "lev_adaptive", name: "Adaptive Models" },
  { id: "lev_realtime", name: "Real-Time Event Processing" },
  { id: "lev_ext_data", name: "External Data Integration" },
  { id: "lev_data_transform", name: "Data Transformation" },
  { id: "lev_batch", name: "Batch Processing" },
  { id: "lev_rule_delegate", name: "Rule Delegation" },
  { id: "lev_versioning", name: "Application Versioning" },
  { id: "lev_change_mgmt", name: "Change Management" },
  { id: "lev_perf_monitor", name: "Performance Monitoring" },
  { id: "lev_kpi", name: "Value Measurement & KPI Tracking" },
];

function getDagreLayout(elements, direction = "TB", nodeSpacing = 50) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: nodeSpacing, ranksep: nodeSpacing });

  elements.forEach((el) => {
    if (el.data && el.data.type === "node") {
      g.setNode(el.id, { width: nodeWidth, height: nodeHeight });
    }
  });

  elements.filter((e) => e.source && e.target).forEach((edge) => g.setEdge(edge.source, edge.target));
  dagre.layout(g);

  return elements.map((el) => {
    if (el.data && el.data.type === "node") {
      const p = g.node(el.id);
      if (p) el.position = { x: p.x - nodeWidth / 2, y: p.y - nodeHeight / 2 };
    }
    return el;
  });
}

function cleanImportedData(data) {
  // Collect all valid node IDs
  const allNodeIds = new Set();
  (data.kpis || []).forEach((kpi) => {
    allNodeIds.add(kpi.id);
    (kpi.drivers || []).forEach((driver) => {
      allNodeIds.add(driver.id);
      (driver.levers || []).forEach((lever) => {
        allNodeIds.add(lever.id);
      });
    });
  });
  // Remove positions for missing nodes
  if (data.positions) {
    Object.keys(data.positions).forEach((id) => {
      if (!allNodeIds.has(id)) {
        delete data.positions[id];
      }
    });
  }
  return data;
}

function nodeStyle(category) {
  if (category === "kpi")
    return { background: "#374151", color: "#fff", padding: 10, borderRadius: 8, width: nodeWidth };
  if (category === "driver")
    return { background: "#0d9488", color: "#fff", padding: 10, borderRadius: 8, width: nodeWidth };
  return { background: "#f59e0b", color: "#042027", padding: 10, borderRadius: 8, width: nodeWidth };
}

function radialPositions(n, cx, cy, r, startAngle = -Math.PI / 2) {
  const positions = [];
  if (n === 0) return positions;
  const step = (2 * Math.PI) / Math.max(n, 1);
  for (let i = 0; i < n; i++) {
    const theta = startAngle + i * step;
    positions.push({ x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta), angle: theta, step });
  }
  return positions;
}
const safeRadiusForArc = (stepAngle, requiredArc) => requiredArc / Math.max(stepAngle, 1e-6);

/** Multi-ring lever placement (no overlap) */
function placeLeversNoOverlap({
  L,
  centerX,
  centerY,
  baseRadius,
  driverAngle,
  driverGapAngle,
  leverArcCapRatio = 0.8,
  leverBaseArcDeg = 20,
  leverArcPerItemDeg = 10,
  radialGapBase = nodeHeight + 28,
}) {
  if (L <= 0) return [];

  const maxLocalArc = driverGapAngle * leverArcCapRatio;
  const desiredLocalArcDeg = Math.min(leverBaseArcDeg + leverArcPerItemDeg * (L - 1), 140);
  const desiredLocalArc = Math.min(maxLocalArc, (desiredLocalArcDeg * Math.PI) / 180);

  if (L === 1) {
    const r = Math.max(baseRadius, nodeWidth + PAD);
    return [{ x: centerX + r * Math.cos(driverAngle), y: centerY + r * Math.sin(driverAngle) }];
  }

  const positions = [];
  let remaining = L;
  let ringIndex = 0;

  while (remaining > 0 && ringIndex < 20) {
    const ringRadius = baseRadius + ringIndex * radialGapBase;
    const minDeltaAngle = (nodeWidth + PAD) / ringRadius;
    let capacity = Math.max(1, Math.floor(desiredLocalArc / Math.max(minDeltaAngle, 1e-6)) + 1);

    if (capacity <= 1 && desiredLocalArc > 0) {
      ringIndex += 1;
      continue;
    }

    const count = Math.min(remaining, capacity);
    const delta = count > 1 ? desiredLocalArc / (count - 1) : 0;

    for (let i = 0; i < count; i++) {
      const offsetAngle = count === 1 ? 0 : -desiredLocalArc / 2 + i * delta;
      const theta = driverAngle + offsetAngle;
      positions.push({
        x: centerX + ringRadius * Math.cos(theta),
        y: centerY + ringRadius * Math.sin(theta),
      });
    }
    remaining -= count;
    ringIndex += 1;
  }

  return positions;
}

/** Build nodes/edges; respects stored positions when dragEnabled (skip auto layout) */
function buildFlowFromData(
  data,
  layoutMode = "vertical",
  filterNodeId = null,
  islandKpiId = null,
  dragEnabled = false
) {
  const nodes = [];
  const edges = [];
  const positionsMap = data.positions || {};
  const useStored = (id, fallback) => (positionsMap && positionsMap[id] ? { ...positionsMap[id] } : fallback);

  if (!data || !Array.isArray(data.kpis)) return { nodes, edges };

  // Helper to add node safely
  const addNode = (id, label, category, fallback) => {
    nodes.push({
      id,
      data: { label, type: "node", category },
      position: useStored(id, fallback),
      style: nodeStyle(category),
    });
  };

  // Build full vertical layout
  if (layoutMode === "vertical") {
    const tmpNodes = [];
    const tmpEdges = [];

    data.kpis.forEach((kpi, ki) => {
      tmpNodes.push({
        id: kpi.id,
        data: { label: kpi.name, type: "node", category: "kpi" },
        position: useStored(kpi.id, { x: 100 + ki * 40, y: 80 + ki * 20 }),
        style: nodeStyle("kpi"),
      });
      (kpi.drivers || []).forEach((drv, di) => {
        tmpNodes.push({
          id: drv.id,
          data: { label: drv.name, type: "node", category: "driver" },
          position: useStored(drv.id, { x: 420 + di * 40, y: 160 + di * 50 }),
          style: nodeStyle("driver"),
        });
        tmpEdges.push({
          id: `e-${kpi.id}-${drv.id}`,
          source: kpi.id,
          target: drv.id,
          type: "floating",
          markerEnd: { type: MarkerType.ArrowClosed },
        });
        (drv.levers || []).forEach((lvr, li) => {
          tmpNodes.push({
            id: lvr.id,
            data: { label: lvr.name, type: "node", category: "lever" },
            position: useStored(lvr.id, { x: 740 + li * 40, y: 160 + di * 50 + li * 10 }),
            style: nodeStyle("lever"),
          });
          tmpEdges.push({
            id: `e-${drv.id}-${lvr.id}`,
            source: drv.id,
            target: lvr.id,
            type: "floating",
            markerEnd: { type: MarkerType.ArrowClosed },
          });
        });
      });
    });

    // If filterNodeId present, filter nodes/edges to the relevant subgraph
    if (filterNodeId) {
      const keepIds = new Set();
      let matchedAsKpi = false;
      let matchedAsDriver = false;
      let matchedAsLever = false;

      // Discover how the filter id matches (kpi / driver / lever)
      data.kpis.forEach((kpi) => {
        if (kpi.id === filterNodeId) {
          matchedAsKpi = true;
          // KPI clicked -> keep whole KPI subtree
          keepIds.add(kpi.id);
          (kpi.drivers || []).forEach((d) => {
            keepIds.add(d.id);
            (d.levers || []).forEach((l) => keepIds.add(l.id));
          });
        } else {
          (kpi.drivers || []).forEach((d) => {
            if (d.id === filterNodeId) {
              matchedAsDriver = true;
              // Driver clicked -> keep KPI + this driver subtree
              keepIds.add(kpi.id);
              keepIds.add(d.id);
              (d.levers || []).forEach((l) => keepIds.add(l.id));
            }
            (d.levers || []).forEach((l) => {
              if (l.id === filterNodeId) {
                matchedAsLever = true;
                // Lever clicked -> include only this lever, its driver, and that KPI
                keepIds.add(kpi.id);
                keepIds.add(d.id);
                keepIds.add(l.id);
              }
            });
          });
        }
      });

      // NOTE: when matchedAsLever is true we DO NOT add other drivers or other levers.
      // matchedAsDriver and matchedAsKpi behavior remains unchanged (show driver with its levers or full KPI subtree).

      // filter
      const filteredNodes = tmpNodes.filter((n) => keepIds.has(n.id));
      const filteredEdges = tmpEdges.filter((e) => keepIds.has(e.source) && keepIds.has(e.target));
      if (dragEnabled) return { nodes: filteredNodes, edges: filteredEdges };
      const positioned = getDagreLayout([...filteredNodes, ...filteredEdges], "TB");
      return {
        nodes: positioned.filter((n) => n.data && n.data.type === "node"),
        edges: positioned.filter((e) => e.source && e.target),
      };
    }

    if (dragEnabled) return { nodes: tmpNodes, edges: tmpEdges };

    const positioned = getDagreLayout([...tmpNodes, ...tmpEdges], "TB");
    return {
      nodes: positioned.filter((n) => n.data && n.data.type === "node"),
      edges: positioned.filter((e) => e.source && e.target),
    };
  }

  // === Island (radial, single KPI focus) ===
  const focusedKpi = islandKpiId ? data.kpis.find((k) => k.id === islandKpiId) : data.kpis[0];
  if (!focusedKpi) return { nodes, edges };

  const centerX = 720,
    centerY = 420;
  addNode(
    focusedKpi.id,
    focusedKpi.name,
    "kpi",
    { x: centerX - nodeWidth / 2, y: centerY - nodeHeight / 2 }
  );

  const nDrivers = (focusedKpi.drivers || []).length;
  if (nDrivers > 0) {
    const baseR1 = 200,
      baseR2 = baseR1 + 220;
    const driverStep = (2 * Math.PI) / nDrivers;
    const R1 = Math.max(baseR1, safeRadiusForArc(driverStep, nodeWidth + PAD));
    const dposList = radialPositions(nDrivers, centerX, centerY, R1);

    focusedKpi.drivers.forEach((drv, di) => {
      const dpos = dposList[di],
        angle = dpos.angle;
      const driverFallback = { x: dpos.x - nodeWidth / 2, y: dpos.y - nodeHeight / 2 };

      addNode(drv.id, drv.name, "driver", driverFallback);
      edges.push({
        id: `e-${focusedKpi.id}-${drv.id}`,
        source: focusedKpi.id,
        target: drv.id,
        type: "floating",
        markerEnd: { type: MarkerType.ArrowClosed },
      });

      const leverPositions = placeLeversNoOverlap({
        L: (drv.levers || []).length,
        centerX,
        centerY,
        baseRadius: baseR2,
        driverAngle: angle,
        driverGapAngle: dpos.step,
      });

      (drv.levers || []).forEach((lvr, idx) => {
        const lp = leverPositions[idx];
        const leverFallback = lp
          ? { x: lp.x - nodeWidth / 2, y: lp.y - nodeHeight / 2 }
          : { x: dpos.x - nodeWidth / 2 + 260, y: dpos.y - nodeHeight / 2 };

        addNode(lvr.id, lvr.name, "lever", leverFallback);
        edges.push({
          id: `e-${drv.id}-${lvr.id}`,
          source: drv.id,
          target: lvr.id,
          type: "floating",
          markerEnd: { type: MarkerType.ArrowClosed },
        });
      });
    });
  }

  return { nodes, edges };
}

function LeverSelector({ onSelect }) {
  const [selectedLeverId, setSelectedLeverId] = React.useState("");
  const [selectedRule, setSelectedRule] = React.useState("");
  const [customLever, setCustomLever] = React.useState("");

  // Find the selected lever object
  const selectedLever = initialLeversData.find((l) => l.id === selectedLeverId);

  // If CDH is selected, flatten all rules under its features
  const cdhRules =
    selectedLever?.id === "lev_cdh"
      ? selectedLever.features.flatMap((f) =>
          f.rules.map((rule) => ({
            feature: f.name,
            rule,
          }))
        )
      : [];

  const handleAddLever = () => {
    if (selectedLeverId === "lev_cdh" && selectedRule) {
      onSelect({
        id: `cdh_${selectedRule.replace(/\s+/g, "_").toLowerCase()}`,
        name: `CDH: ${selectedRule}`,
      });
      setSelectedLeverId("");
      setSelectedRule("");
      setCustomLever("");
    } else if (selectedLeverId && selectedLeverId !== "lev_cdh") {
      onSelect(selectedLever);
      setSelectedLeverId("");
      setSelectedRule("");
      setCustomLever("");
    } else if (customLever.trim()) {
      onSelect({ id: `custom_${Date.now()}`, name: customLever });
      setCustomLever("");
      setSelectedLeverId("");
      setSelectedRule("");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
      <select
        value={selectedLeverId}
        onChange={(e) => {
          setSelectedLeverId(e.target.value);
          setSelectedRule("");
        }}
      >
        <option value="">Select a predefined lever</option>
        {initialLeversData.map((lever) => (
          <option key={lever.id} value={lever.id}>
            {lever.name}
          </option>
        ))}
      </select>
      {/* If CDH is selected, show rules dropdown */}
      {selectedLeverId === "lev_cdh" && (
        <select value={selectedRule} onChange={(e) => setSelectedRule(e.target.value)}>
          <option value="">Select a CDH rule/feature</option>
          {cdhRules.map((r, idx) => (
            <option key={idx} value={r.rule}>
              {r.feature}: {r.rule}
            </option>
          ))}
        </select>
      )}
      {/* Free text entry below the selects */}
      <input
        type="text"
        placeholder="Or enter a custom lever"
        value={customLever}
        onChange={(e) => setCustomLever(e.target.value)}
      />
      <button className="btn small" onClick={handleAddLever}>
        Add
      </button>
    </div>
  );
}

function SidebarTree({
  data,
  setData,
  onLayoutChange,
  layoutMode,
  onFocusIslandKpi,
  islandKpiId,
  onCenterKpi,
}) {
  const [expanded, setExpanded] = useState({});
  const [addingKpi, setAddingKpi] = useState(false);
  const [addingDriver, setAddingDriver] = useState(null);
  const [addingLever, setAddingLever] = useState(null);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      const ids = new Set((data.kpis || []).map((k) => k.id));
      Object.keys(next).forEach((id) => {
        if (!ids.has(id)) delete next[id];
      });
      (data.kpis || []).forEach((k) => {
        if (!(k.id in next)) next[k.id] = false;
      });
      return next;
    });
  }, [data.kpis]);

  function toggleExpand(id) {
    setExpanded((s) => ({ ...s, [id]: !s[id] }));
  }

  function confirmAddKpi() {
    if (!newName.trim()) return;
    const next = JSON.parse(JSON.stringify(data));
    const newKpi = { id: uid("kpi"), name: newName.trim(), drivers: [] };
    next.kpis.push(newKpi);
    next.positions = next.positions || {};
    next.positions[newKpi.id] = { x: 120, y: 120 };
    setData(next);
    setExpanded((prev) => ({ ...prev, [newKpi.id]: true }));
    setAddingKpi(false);
    setNewName("");
  }
  function confirmAddDriver(kpiId) {
    if (!newName.trim()) return;
    const next = JSON.parse(JSON.stringify(data));
    const k = next.kpis.find((x) => x.id === kpiId);
    const newDriver = { id: uid("drv"), name: newName.trim(), levers: [] };
    k.drivers.push(newDriver);
    next.positions = next.positions || {};
    next.positions[newDriver.id] = {
      x: (next.positions[kpiId]?.x || 200) + 220,
      y: (next.positions[kpiId]?.y || 200),
    };
    setData(next);
    setAddingDriver(null);
    setNewName("");
  }
  function confirmAddLever(kpiId, drvId) {
    if (!newName.trim()) return;
    const next = JSON.parse(JSON.stringify(data));
    const k = next.kpis.find((x) => x.id === kpiId);
    const d = k.drivers.find((x) => x.id === drvId);
    const newLever = { id: uid("lvr"), name: newName.trim() };
    d.levers.push(newLever);
    next.positions = next.positions || {};
    next.positions[newLever.id] = {
      x: (next.positions[drvId]?.x || 400) + 220,
      y: (next.positions[drvId]?.y || 200),
    };
    setData(next);
    setAddingLever(null);
    setNewName("");
  }

  function removeKpi(kpiId) {
    if (!confirm("Remove KPI and all children?")) return;
    const next = JSON.parse(JSON.stringify(data));
    const k = next.kpis.find((x) => x.id === kpiId);
    if (k) {
      k.drivers.forEach((d) => {
        d.levers.forEach((l) => delete next.positions?.[l.id]);
        delete next.positions?.[d.id];
      });
      delete next.positions?.[k.id];
    }
    next.kpis = next.kpis.filter((kk) => kk.id !== kpiId);
    setData(next);
    onFocusIslandKpi(null);
    setExpanded((prev) => {
      const p = { ...prev };
      delete p[kpiId];
      return p;
    });
  }
  function removeDriver(kpiId, drvId) {
    if (!confirm("Remove Driver and its levers?")) return;
    const next = JSON.parse(JSON.stringify(data));
    const k = next.kpis.find((x) => x.id === kpiId);
    const d = k.drivers.find((x) => x.id === drvId);
    d.levers.forEach((l) => delete next.positions?.[l.id]);
    k.drivers = k.drivers.filter((d0) => d0.id !== drvId);
    delete next.positions?.[drvId];
    setData(next);
  }
  function removeLever(kpiId, drvId, leverId) {
    if (!confirm("Remove Lever?")) return;
    const next = JSON.parse(JSON.stringify(data));
    const k = next.kpis.find((x) => x.id === kpiId);
    const d = k.drivers.find((x) => x.id === drvId);
    d.levers = d.levers.filter((l) => l.id !== leverId);
    delete next.positions?.[leverId];
    setData(next);
  }

  function renameNode(type, ids) {
    const name = prompt("New name");
    if (!name) return;
    const next = JSON.parse(JSON.stringify(data));
    if (type === "kpi") {
      next.kpis.find((x) => x.id === ids.kpiId).name = name;
    } else if (type === "driver") {
      const k = next.kpis.find((x) => x.id === ids.kpiId);
      k.drivers.find((x) => x.id === ids.driverId).name = name;
    } else {
      const k = next.kpis.find((x) => x.id === ids.kpiId);
      const d = k.drivers.find((x) => x.id === ids.driverId);
      d.levers.find((x) => x.id === ids.leverId).name = name;
    }
    setData(next);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h4 style={{ margin: 0 }}>KPIs</h4>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn small" onClick={() => { setAddingKpi(true); setNewName(""); }}>
            + KPI
          </button>
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        {data.kpis.length === 0 && <div className="muted">No KPIs yet — add one to get started.</div>}
        {data.kpis.map((k) => {
          const isFocused = islandKpiId === k.id;
          return (
            <div key={k.id} style={{ marginBottom: 8, borderRadius: 6, background: "#0f1724", padding: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button className="link" onClick={() => toggleExpand(k.id)}>{expanded[k.id] ? "▾" : "▸"}</button>
                  <button className="link" onClick={() => onCenterKpi(k.id)}>
                    <strong style={{ color: "#e6eef6" }}>{k.name}</strong>
                  </button>
                  {layoutMode === "island" && (
                    <small style={{ color: isFocused ? "#7dd3fc" : "#94a3b8" }}>{isFocused ? " (focused)" : ""}</small>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="link" onClick={() => { onFocusIslandKpi(k.id); onCenterKpi(k.id); }}>Focus</button>
                  <button className="link" onClick={() => renameNode("kpi", { kpiId: k.id })}>Rename</button>
                  <button className="link" onClick={() => { setAddingDriver(k.id); setNewName(""); }}>+Drv</button>
                  <button className="link danger" onClick={() => removeKpi(k.id)}>Del</button>
                </div>
              </div>

              {expanded[k.id] && (
                <div style={{ marginTop: 8, paddingLeft: 18 }}>
                  {addingDriver === k.id && (
                    <div style={{ marginBottom: 8, padding: 6, background: "#081222", borderRadius: 6 }}>
                      <input
                        type="text"
                        placeholder="Driver name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && confirmAddDriver(k.id)}
                        autoFocus
                        style={{ width: "100%", padding: 6, background: "#061322", border: "1px solid #15202b", borderRadius: 4, color: "#e6eef6", marginBottom: 6 }}
                      />
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn small" onClick={() => confirmAddDriver(k.id)}>Add</button>
                        <button className="btn small" onClick={() => { setAddingDriver(null); setNewName(""); }}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {k.drivers.length === 0 && !addingDriver && <div className="muted">No Drivers</div>}
                  {k.drivers.map((d) => (
                    <div key={d.id} style={{ marginBottom: 6, padding: 6, borderRadius: 6, background: "#081222" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <small style={{ color: "#cfeef8" }}>{d.name}</small>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="link" onClick={() => { onFocusIslandKpi(k.id); onCenterKpi(d.id); }}>Focus</button>
                          <button className="link" onClick={() => renameNode("driver", { kpiId: k.id, driverId: d.id })}>Rename</button>
                          <button className="link" onClick={() => { setAddingLever({ kpiId: k.id, drvId: d.id }); setNewName(""); }}>+Lvr</button>
                          <button className="link danger" onClick={() => removeDriver(k.id, d.id)}>Del</button>
                        </div>
                      </div>

                      <div style={{ marginTop: 6, paddingLeft: 12 }}>
                        {addingLever?.kpiId === k.id && addingLever?.drvId === d.id && (
                          <LeverSelector
                            onSelect={(leverObj) => {
                              const next = JSON.parse(JSON.stringify(data));
                              const kpi = next.kpis.find((x) => x.id === k.id);
                              const drv = kpi.drivers.find((x) => x.id === d.id);

                              // normalize helper
                              const normalize = (s) => (s || "").trim().toLowerCase();

                              // Search for existing lever by id or by name (case-insensitive)
                              const allLevers = next.kpis.flatMap((kp) =>
                                (kp.drivers || []).flatMap((dr) => dr.levers || [])
                              );
                              const existing = allLevers.find(
                                (lv) => lv.id === leverObj.id || normalize(lv.name) === normalize(leverObj.name)
                              );

                              const leverIdToUse = existing ? existing.id : leverObj.id;
                              const leverNameToUse = existing ? existing.name : leverObj.name;

                              // Ensure we don't duplicate the lever under the same driver
                              if (!drv.levers.some((l) => l.id === leverIdToUse)) {
                                drv.levers.push({ id: leverIdToUse, name: leverNameToUse });

                                next.positions = next.positions || {};
                                // Only set a position for a newly created lever (i.e., no existing position)
                                if (!next.positions[leverIdToUse]) {
                                  next.positions[leverIdToUse] = {
                                    x: (next.positions[d.id]?.x || 400) + 220,
                                    y: (next.positions[d.id]?.y || 200),
                                  };
                                }

                                setData(next);
                              } else {
                                // already present for this driver — no change
                                // still close selector
                              }

                              setAddingLever(null);
                              setNewName("");
                            }}
                          />
                        )}

                        {d.levers.length === 0 && !addingLever && <div className="muted">No Levers</div>}
                        {d.levers.map((l) => (
                          <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <small>{l.name}</small>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button className="link" onClick={() => renameNode("lever", { kpiId: k.id, driverId: d.id, leverId: l.id })}>Rename</button>
                              <button className="link danger" onClick={() => removeLever(k.id, d.id, l.id)}>Del</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {addingKpi && (
        <div style={{ marginTop: 8, padding: 8, background: "#0f1724", borderRadius: 6 }}>
          <input
            type="text"
            placeholder="KPI name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmAddKpi()}
            autoFocus
            style={{ width: "100%", padding: 6, background: "#081222", border: "1px solid #15202b", borderRadius: 4, color: "#e6eef6", marginBottom: 6 }}
          />
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn small" onClick={confirmAddKpi}>Add</button>
            <button className="btn small" onClick={() => { setAddingKpi(false); setNewName(""); }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={layoutMode === "island"}
            onChange={(e) => onLayoutChange(e.target.checked ? "island" : "vertical")}
          />
          <small>Island (radial) layout — single KPI focus</small>
        </label>
        {layoutMode === "island" && (
          <div className="muted" style={{ marginTop: 6 }}>
            Click a KPI name and press <em>Focus</em> to set the island focus.
          </div>
        )}
      </div>
    </div>
  );
}

function JsonEditor({ data, setData }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(JSON.stringify(data, null, 2));
  useEffect(() => {
    setText(JSON.stringify(data, null, 2));
  }, [data]);

  function apply() {
    try {
      const parsed = JSON.parse(text);
      if (!parsed || !Array.isArray(parsed.kpis)) throw new Error("Root must have kpis array");
      if (!parsed.positions) parsed.positions = {};
      setData(cleanImportedData(parsed));
    } catch (err) {
      alert("Invalid JSON: " + err.message);
    }
  }

  return (
    <div style={{ marginTop: 12 }}>
      <button className="btn small" onClick={() => setOpen(!open)}>{open ? "Hide JSON Editor" : "Show JSON Editor"}</button>
      {open && (
        <div style={{ marginTop: 8 }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            style={{ width: "100%", fontFamily: "monospace", background: "#061322", color: "#e6eef6", borderRadius: 6, padding: 8 }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button className="btn small" onClick={apply}>Apply JSON</button>
            <button className="btn small" onClick={() => setText(JSON.stringify({ kpis: [], positions: {} }, null, 2))}>
              Reset to empty
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [data, setData] = useState({ kpis: [], positions: {} });
  const [layoutMode, setLayoutMode] = useState("vertical");
  const [rfNodes, setRfNodes] = useState([]);
  const [rfEdges, setRfEdges] = useState([]);
  const [filterNodeId, setFilterNodeId] = useState(null);
  const [islandKpiId, setIslandKpiId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dragToggle, setDragToggle] = useState(false); // user toggle
  const canvasRef = useRef(null);
  const reactFlowInstanceRef = useRef(null);
  const isDraggingRef = useRef(false); // guard rebuilds during drag

  // New: prompt panel state + the predefined prompt text
  const [promptVisible, setPromptVisible] = useState(false);
  const measurementPrompt = `You are acting as a domain expert assistant embedded in a KPI mapping application. Your role is to analyze structured input (JSON) that maps KPIs to their drivers and associated Pega functionalities ("levers") and generate a tailored measurement framework for each KPI.
Please prioritize your response based on the following:

Use the JSON structure as your primary knowledge source. It defines the KPI hierarchy and the Pega levers that influence each driver.
Use https://docs.pega.com as a preferred reference for implementation details, best practices, and component usage within Pega.
You may also draw from broader domain knowledge in enterprise performance management, customer experience, and intelligent automation where relevant and helpful—but clearly distinguish when insights are based on general best practices vs. Pega-specific capabilities.
Act as a Pega implementation strategist. Your suggestions should reflect how a Pega architect or business analyst would design data collection, reporting, and automation for each KPI.
Be specific and actionable. Avoid generic advice. Provide concrete data points, metrics, and implementation ideas using Pega components (e.g., case types, adaptive models, decision tables, CDH strategies).
Include strategic best practices for tracking and improving KPI performance, such as:

Designing closed-loop feedback systems using adaptive analytics and interaction history
Ensuring data quality and governance across channels and case types
Using real-time monitoring, alerts, and thresholds to proactively manage KPI performance
Aligning KPI tracking with business goals, operational workflows, and customer journeys
Applying continuous improvement using performance insights to refine strategies, rules, and models
Leveraging Pega’s AI and decisioning capabilities to automate and optimize interventions`;

  const dragEnabled = layoutMode === "island" && dragToggle; // only allow in island

  // Build nodes/edges (skip while dragging to avoid flicker/disappear)
  useEffect(() => {
    if (isDraggingRef.current) return;
    const { nodes, edges } = buildFlowFromData(
      data,
      layoutMode === "vertical" ? "vertical" : "island",
      filterNodeId,
      islandKpiId,
      dragEnabled
    );
    setRfNodes(nodes);
    setRfEdges(edges);
  }, [data, layoutMode, filterNodeId, islandKpiId, dragEnabled]);

  // Toggle filter on click (updated: allow lever clicks to filter)
  const onNodeClick = (_event, node) => {
    if (!node?.id) return;
    setFilterNodeId((prev) => (node.id === prev ? null : node.id));
  };

  // Live drag updates: keep visual in sync without touching data (prevents rebuild mid-drag)
  const onNodesChange = (changes) => {
    if (!dragEnabled) return;
    if (!changes || changes.length === 0) return;
    setRfNodes((nds) => applyNodeChanges(changes, nds));
  };

  // Persist final position on drag stop (single node)
  const onNodeDragStart = () => {
    if (dragEnabled) isDraggingRef.current = true;
  };
  const onNodeDragStop = (_evt, node) => {
    if (!dragEnabled || !node?.id) {
      isDraggingRef.current = false;
      return;
    }
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.positions = next.positions || {};
      next.positions[node.id] = { x: node.position.x, y: node.position.y };
      return next;
    });
    // allow rebuild after data update settles
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 0);
  };

  // Center viewport on a node
  const centerOnNode = (id) => {
    const inst = reactFlowInstanceRef.current;
    if (!inst) return;
    const node = rfNodes.find((n) => n.id === id);
    if (!node) return;
    inst.setCenter(node.position.x + nodeWidth / 2, node.position.y + nodeHeight / 2, { zoom: 1.2, duration: 300 });
  };

  // Relayout (Auto) – clear positions then rebuild
  const relayoutAuto = () => {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (layoutMode === "vertical") {
        next.positions = {};
      } else {
        if (islandKpiId) {
          const k = next.kpis.find((x) => x.id === islandKpiId);
          if (k) {
            k.drivers.forEach((d) => {
              d.levers.forEach((l) => delete next.positions?.[l.id]);
              delete next.positions?.[d.id];
            });
            delete next.positions?.[k.id];
          }
        } else {
          next.positions = {};
        }
      }
      return next;
    });
  };

  // Exports (unchanged)
  const fitThen = async (fn) => {
    if (reactFlowInstanceRef.current) {
      reactFlowInstanceRef.current.fitView({ padding: 0.2, duration: 0 });
      await new Promise((r) => setTimeout(r, 50));
    }
    return fn();
  };

  const exportToPDF = () =>
    fitThen(async () => {
      const container = document.querySelector(".react-flow");
      container.classList.add("export-clean");
      if (!container) return;
      const screenshot = await html2canvas(container, { backgroundColor: "#fff", scale: window.devicePixelRatio * 2, useCORS: true });
      const imgWidth = screenshot.width,
        imgHeight = screenshot.height;
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth(),
        pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20,
        targetWidth = pageWidth - margin * 2,
        scale = targetWidth / imgWidth;
      const targetPageContentHeight = pageHeight - margin * 2,
        sliceHeightPx = targetPageContentHeight / scale;
      const sliceCanvas = document.createElement("canvas");
      const ctx = sliceCanvas.getContext("2d");
      let y = 0,
        pageIndex = 0;
      while (y < imgHeight) {
        const sliceHeight = Math.min(sliceHeightPx, imgHeight - y);
        sliceCanvas.width = imgWidth;
        sliceCanvas.height = sliceHeight;
        ctx.clearRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(screenshot, 0, y, imgWidth, sliceHeight, 0, 0, imgWidth, sliceHeight);
        const imgData = sliceCanvas.toDataURL("image/png");
        const renderedHeight = sliceHeight * scale;
        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, margin, targetWidth, renderedHeight);
        y += sliceHeightPx;
        pageIndex += 1;
      }
      pdf.save("kpi-map.pdf");
      container.classList.remove("export-clean");
    });

  const exportToPNG = () =>
    fitThen(async () => {
      const container = document.querySelector(".react-flow");
      container.classList.add("export-clean");
      if (!container) return;
      const screenshot = await html2canvas(container, { backgroundColor: "#fff", scale: window.devicePixelRatio * 2, useCORS: true });
      container.classList.remove("export-clean");
      const a = document.createElement("a");
      a.href = screenshot.toDataURL("image/png");
      a.download = "kpi-map.png";
      a.click();
    });

  const exportToSVG = () =>
    fitThen(async () => {
      const container = document.querySelector(".react-flow");
      container.classList.add("export-clean");
      if (!container) return;
      const dataUrl = await domtoimage.toSvg(container, { bgcolor: "transparent", quality: 1, cacheBust: true });
      container.classList.remove("export-clean");
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "kpi-map.svg";
      a.click();
      URL.revokeObjectURL(url);
    });

  // New: copy-to-clipboard helper for the prompt (includes current JSON)
  const copyPromptToClipboard = async () => {
    const combined = `${measurementPrompt}

Here is the current JSON structure to analyze:
${JSON.stringify(data, null, 2)}`;

    try {
      await navigator.clipboard.writeText(combined);
      alert("Prompt + JSON copied to clipboard");
    } catch (err) {
      // Fallback: create temporary textarea
      const ta = document.createElement("textarea");
      ta.value = combined;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        alert("Prompt + JSON copied to clipboard");
      } catch {
        alert("Copy failed — please select and copy manually.");
      }
      document.body.removeChild(ta);
    }
  };

  return (
    <div className="app-root">
      <header className="topbar">
        <div className="brand">KPI Map Builder</div>
        <div className="controls">
          {filterNodeId && <button className="btn" onClick={() => setFilterNodeId(null)}>Clear Filter</button>}

          {/* Drag toggle only allowed in island mode */}
          <label className="btn" title={layoutMode !== "island" ? "Enable island layout to allow dragging" : ""} style={{ opacity: layoutMode === "island" ? 1 : 0.5, display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={dragToggle && layoutMode === "island"}
              disabled={layoutMode !== "island"}
              onChange={(e) => setDragToggle(e.target.checked)}
            />
            Dragging
          </label>
          <button className="btn" onClick={relayoutAuto} title="Clear stored positions and re-run auto layout">Relayout (Auto)</button>

          <button className="btn" onClick={exportToPDF}>Export PDF</button>
          <button className="btn" onClick={exportToPNG}>Export PNG</button>
          <button className="btn" onClick={exportToSVG}>Export SVG</button>

          <label className="btn">
            Import JSON
            <input
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files && e.target.files[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  try {
                    const parsed = JSON.parse(ev.target.result);
                    if (!parsed || !Array.isArray(parsed.kpis)) throw new Error("Invalid JSON");
                    if (!parsed.positions) parsed.positions = {};
                    setData(cleanImportedData(parsed));
                  } catch (err) { alert("Import failed: " + err.message); }
                };
                reader.readAsText(f);
              }}
            />
          </label>
          <button
            className="btn"
            onClick={() => {
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "kpi-map.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export JSON
          </button>

          {layoutMode === "island" && <button className="btn" onClick={() => setIslandKpiId(null)}>Clear Focus</button>}
        </div>
      </header>

      <div className="main">
        {sidebarOpen && (
          <aside className="sidebar">
            <SidebarTree
              data={data}
              setData={setData}
              onLayoutChange={(m) => {
                setLayoutMode(m === "island" ? "island" : "vertical");
                if (m === "island") {
                  relayoutAuto();
                }
              }}
              layoutMode={layoutMode}
              onFocusIslandKpi={(id) => setIslandKpiId(id)}
              islandKpiId={islandKpiId}
              onCenterKpi={(id) => centerOnNode(id)}
            />
            <JsonEditor data={data} setData={setData} />
          </aside>
        )}

        <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ left: sidebarOpen ? "360px" : "0" }}>
          {sidebarOpen ? "◀" : "▶"}
        </button>

        <section className="canvas" ref={canvasRef}>
          {data.kpis.length === 0 ? (
            <div className="empty-state">
              <h2>Start building your KPI Map</h2>
              <p>Add KPIs in the sidebar (▸ + KPI) — the map will appear here.</p>
            </div>
          ) : (
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              edgeTypes={{ floating: FloatingEdge }}
              onInit={(inst) => (reactFlowInstanceRef.current = inst)}
              onNodeClick={onNodeClick}
              onNodesChange={onNodesChange}
              onNodeDragStart={onNodeDragStart}
              onNodeDragStop={onNodeDragStop}
              nodesDraggable={dragEnabled}
              nodesConnectable={false}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              style={{ width: "100%", height: "100%" }}
            >
              <Controls />
              <MiniMap nodeColor={(n) => n.style?.background || "#888"} />
              <Background variant={BackgroundVariant.Dots} gap={16} />
            </ReactFlow>
          )}
        </section>
      </div>

      {/* New: Measurement Framework Prompt panel (bottom-left) */}
      <div
        className={`prompt-panel ${promptVisible ? "open" : "closed"}`}
        aria-hidden={!promptVisible}
        // move the prompt right when the sidebar is open so it doesn't overlap sidebar content (JSON editor buttons)
        style={{ left: sidebarOpen ? "384px" : "12px", bottom: 12 }}
      >
        {!promptVisible ? (
          <button
            className="prompt-toggle btn small"
            onClick={() => setPromptVisible(true)}
            title="Show Measurement Framework Prompt"
          >
            Show Measurement Framework Prompt
          </button>
        ) : (
          <div className="prompt-content">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <strong>Measurement Framework Prompt</strong>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn small" onClick={copyPromptToClipboard}>Copy</button>
                <button className="btn small" onClick={() => setPromptVisible(false)}>Hide</button>
              </div>
            </div>
            <textarea
              readOnly
              value={measurementPrompt}
              rows={8}
              style={{ width: "100%", marginTop: 8, resize: "vertical", padding: 8, background: "#061322", color: "#e6eef6", border: "1px solid #15202b", borderRadius: 6 }}
            />
          </div>
        )}
      </div>

      <style>{`
        body,html,#root{height:100%;margin:0}
        .app-root{font-family:Inter,Arial,sans-serif;color:#e6eef6;background:#071022;min-height:100vh}
        .topbar{height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;border-bottom:1px solid #0b1220}
        .controls{display:flex;gap:8px;flex-wrap:wrap}
        .brand{font-weight:600}
        .btn{background:#0b1220;border:1px solid #15202b;padding:6px 10px;border-radius:6px;color:#e6eef6;cursor:pointer}
        .btn.small{font-size:13px;padding:4px 8px}
        .link{background:none;border:none;color:#7dd3fc;cursor:pointer;font-size:13px}
        .link.danger{color:#fb7185}
        .main{display:flex;height:calc(100vh - 60px);position:relative}
        .sidebar{width:360px;background:#071827;border-right:1px solid #0b1220;padding:14px;overflow:auto}
        .sidebar-toggle{position:absolute;top:50%;transform:translateY(-50%);z-index:10;background:#0b1220;border:1px solid #15202b;color:#e6eef6;padding:8px 6px;cursor:pointer;border-radius:0 6px 6px 0;transition:left 0.3s}
        .canvas{flex:1;padding:12px;position:relative}
        .muted{color:#94a3b8;font-size:13px}
        .empty-state{color:#9aa4b2;text-align:center;padding-top:80px}
        .react-flow__node{cursor:${dragEnabled ? "grab" : "default"}}
        .export-clean .react-flow__controls,
        .export-clean .react-flow__minimap,
        .export-clean .react-flow__attribution,
        .export-clean .react-flow__background {
          display: none !important;
        }
        .export-clean .react-flow {
          background: #fff !important;
        }

        /* Prompt panel (bottom-left) */
        .prompt-panel { position: fixed; left: 12px; bottom: 12px; z-index: 60; max-width: 420px; width: calc(35vw + 120px); }
        .prompt-panel.closed .prompt-toggle { display: inline-block; }
        .prompt-panel.open .prompt-toggle { display: none; }
        .prompt-content { background:#071827;border:1px solid #0b1220;padding:10px;border-radius:8px;box-shadow:0 6px 18px rgba(2,6,23,0.6) }
        .prompt-toggle{ white-space:nowrap; }
        @media (max-width: 900px) {
          .prompt-panel { width: 320px; left: 8px; bottom: 8px; }
        }
      `}</style>
    </div>
  );
}

export default App;