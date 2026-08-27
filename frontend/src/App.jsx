import React, { useState, useMemo, useEffect } from "react";
import {
  LayoutDashboard, Package, CheckSquare, BarChart3, Settings as SettingsIcon,
  ChevronLeft, ChevronDown, ChevronRight, AlertTriangle, Clock, CheckCircle2, Circle,
  Search, Bell, Moon, ClipboardList, Shirt, Layers, Scissors, Factory, Truck,
  Calendar, CircleAlert, TriangleAlert, ArrowDownRight, Zap,
  Users, ShieldCheck, ClipboardCheck, Lightbulb, FileText, Palette, Warehouse, Radio,
  Upload, Paperclip, Send, RefreshCw, UserCheck, TrendingUp, Landmark, Globe, Gauge, Lock
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";

const SHIPMENT_PERFORMANCE = [
  { month: "Dec", onTime: 74, target: 75 },
  { month: "Jan", onTime: 78, target: 75 },
  { month: "Feb", onTime: 73, target: 75 },
  { month: "Mar", onTime: 80, target: 75 },
  { month: "Apr", onTime: 77, target: 75 },
  { month: "May", onTime: 82.3, target: 75 },
];

const REASONS = [
  "Buyer approval delay", "Fabric delay", "Trims shortage",
  "Capacity shortage", "Quality rework", "Logistics", "Others"
];

const VAP_SUPPLIERS = ["Elite Print & Embro", "ColorTex Dyeing", "Precision Embroidery Co.", "SunPrint Studio"];

const TA_STAGES_90 = [
  { name: "Order Confirmation & Enquiry", day: "Day 1", dept: "Merchandising" },
  { name: "Tech Pack Received", day: "Day 1", dept: "Merchandising" },
  { name: "Fabric Booking", day: "Day 1-3", dept: "Purchase – Fabric" },
  { name: "Trim Booking", day: "Day 3-4", dept: "Purchase – Trims" },
  { name: "Fit Sample", day: "Day 2-6", dept: "Sample" },
  { name: "Fit Approval", day: "Day 7-13", dept: "Merchandising" },
  { name: "Fabric In-House", day: "Day 25", dept: "Store" },
  { name: "Fabric Inspection", day: "Day 28", dept: "Quality" },
  { name: "Size Set Sample", day: "Day 26-28", dept: "Sample" },
  { name: "Size Set Approval", day: "Day 31", dept: "Merchandising" },
  { name: "PP Sample", day: "Day 27-32", dept: "Production" },
  { name: "PP Approval", day: "Day 33-36", dept: "Merchandising" },
  { name: "Cutting", day: "Day 33-38", dept: "Cutting" },
  { name: "Printing / Embroidery", day: "Day 39-55", dept: "VAP" },
  { name: "Feeding", day: "Day 56-61", dept: "Production" },
  { name: "Sewing", day: "Day 62-84", dept: "Production" },
  { name: "Finishing", day: "Day 84-86", dept: "Finishing" },
  { name: "Packing", day: "Day 86-88", dept: "Finishing" },
  { name: "Final Inspection", day: "Day 88-90", dept: "Quality" },
  { name: "Shipment Documentation", day: "Day 90", dept: "Logistics & Documentation" },
  { name: "Goods Ready / Shipment", day: "Day 90", dept: "Logistics & Documentation" },
];

const TA_STAGES_120 = [
  { name: "Order Confirmation & Enquiry", day: "Day 1", dept: "Merchandising" },
  { name: "Tech Pack Received", day: "Day 1", dept: "Merchandising" },
  { name: "Fabric Booking", day: "Day 1-3", dept: "Purchase – Fabric" },
  { name: "Trim Booking", day: "Day 3-4", dept: "Purchase – Trims" },
  { name: "Fit Sample", day: "Day 2-6", dept: "Sample" },
  { name: "Fit Approval", day: "Day 7-13", dept: "Merchandising" },
  { name: "Fabric In-House", day: "Day 50", dept: "Store" },
  { name: "Fabric Inspection", day: "Day 50-52", dept: "Quality" },
  { name: "Size Set Sample", day: "Day 53-60", dept: "Sample" },
  { name: "Size Set Approval", day: "Day 60-64", dept: "Merchandising" },
  { name: "PP Sample", day: "Day 53-60", dept: "Production" },
  { name: "PP Approval", day: "Day 60-64", dept: "Merchandising" },
  { name: "Cutting", day: "Day 65-70", dept: "Cutting" },
  { name: "Garment Dye", day: "Day 70-84", dept: "VAP" },
  { name: "Printing / Embroidery", day: "Day 84-98", dept: "VAP" },
  { name: "Feeding", day: "Day 98-100", dept: "Production" },
  { name: "Sewing", day: "Day 100-112", dept: "Production" },
  { name: "Finishing", day: "Day 112-114", dept: "Finishing" },
  { name: "Packing", day: "Day 115-118", dept: "Finishing" },
  { name: "Final Inspection", day: "Day 118-120", dept: "Quality" },
  { name: "Shipment Documentation", day: "Day 120", dept: "Logistics & Documentation" },
  { name: "Goods Ready / Shipment", day: "Day 120", dept: "Logistics & Documentation" },
];

const TA_TEMPLATES = { "90": TA_STAGES_90, "120": TA_STAGES_120 };
const TA_STAGES = TA_STAGES_90;

const STAGE_ICON_SET_BASE = [FileText, ClipboardList, Package, Package, Layers, CheckCircle2, Warehouse, ShieldCheck, Layers, CheckCircle2, Shirt, CheckCircle2, Scissors, Palette, Palette, Factory, Shirt, Shirt, Shirt, ShieldCheck, FileText, Truck];
function stageIcon(i) { return STAGE_ICON_SET_BASE[i % STAGE_ICON_SET_BASE.length]; }
const STAGE_ICON_SET = STAGE_ICON_SET_BASE;

const COSTING_TEMPLATES = {
  fabric: {
    label: "Fabric to Garment",
    sections: [
      { section: "Fabric", items: ["Fabric 1", "Fabric 2", "Dyeing", "Finishing — peach/sueded/acid wash/bio wash", "Compacting"] },
      { section: "Trims & Accessories", items: ["Sewing Thread", "Zip / Buttons / Elastic", "Main Label", "Care Label", "Disclaimer Tag", "Hang Tag", "Oversize Tag", "Tissue", "Fusing Sticker / Label", "Polybag", "Carton"] },
      { section: "VAP", items: ["Print / Embroidery / Hot Fix Stone"] },
      { section: "CMT", items: ["Cutting", "Power Table", "Singer", "Checking", "Ironing", "Packing", "Quality Inspection"] },
      { section: "Overheads", items: [] },
      { section: "Rejection", items: [] },
      { section: "Commercial Costs", items: [] },
      { section: "Profit", items: [] },
    ],
  },
  yarn: {
    label: "Yarn to Garment",
    sections: [
      { section: "Yarn & Fabrication", items: ["Yarn 1", "Yarn 2", "Knitting", "Heat Setting", "Dyeing", "Finishing — peach/sueded/acid wash/bio wash", "Compacting"] },
      { section: "Trims & Accessories", items: ["Sewing Thread", "Zip / Buttons / Elastic", "Main Label", "Care Label", "Disclaimer Tag", "Hang Tag", "Oversize Tag", "Tissue", "Fusing Sticker / Label", "Polybag", "Carton"] },
      { section: "VAP", items: ["Print / Embroidery / Hot Fix Stone"] },
      { section: "CMT", items: ["Cutting", "Power Table", "Singer", "Checking", "Ironing", "Packing", "Printing / Embroidery", "Quality Inspection"] },
      { section: "Overheads", items: [] },
      { section: "Rejection", items: [] },
      { section: "Commercial Costs", items: [] },
      { section: "Profit", items: [] },
    ],
  },
};

function buildCostingRows(templateKey) {
  const rows = [];
  COSTING_TEMPLATES[templateKey].sections.forEach(sec => {
    if (sec.items.length === 0) {
      rows.push({ label: sec.section, section: sec.section, isHeader: false, price: 0, qty: 1 });
    } else {
      rows.push({ label: sec.section, section: sec.section, isHeader: true });
      sec.items.forEach(item => rows.push({ label: item, section: sec.section, isHeader: false, price: 0, qty: 1 }));
    }
  });
  return rows;
}

const FILES_CATEGORIES = [
  { key: "buyerFiles", label: "Buyer-Provided Files" },
  { key: "techpack", label: "Techpacks" },
  { key: "ob", label: "Operational Breakdown (OB)" },
  { key: "pom", label: "Points of Measure" },
  { key: "pattern", label: "Pattern Files" },
  { key: "cadmarker", label: "CAD Markers" },
  { key: "orderSheetFile", label: "Order Sheet" },
  { key: "costingFile", label: "Costing Sheet" },
  { key: "rmDetails", label: "Raw Material Details" },
  { key: "stageUploaded", label: "Stage Uploaded Files" },
];
const BOMS_CATEGORIES = [
  { key: "fabricBom", label: "Fabric BOM" },
  { key: "trimsBom", label: "Trims BOM" },
  { key: "fabricPo", label: "Fabric PO" },
  { key: "trimsPo", label: "Trims PO" },
];
const RM_CATEGORIES = [
  { key: "fabricDelivery", label: "Fabric Delivery / GRN Proof" },
  { key: "trimsDelivery", label: "Trims Delivery / GRN Proof" },
];
const SAMPLING_CATEGORIES = [
  { key: "proto", label: "Proto Sample" },
  { key: "sms", label: "SMS (Salesman Sample)" },
  { key: "pps", label: "PPS" },
  { key: "top", label: "TOP" },
  { key: "testing", label: "Lab Testing" },
];
function productionCategories(vapCount) {
  const vaps = Array.from({ length: vapCount }, (_, i) => ({ key: `vap${i + 1}`, label: `VAP ${i + 1}` }));
  return [
    { key: "cutting", label: "Cutting" },
    ...vaps,
    { key: "sewing", label: "Sewing" },
    { key: "packing", label: "Packing" },
  ];
}
const INSPECTION_CATEGORIES = [{ key: "inspection", label: "Final Inspection Report" }];
const FINAL_OCR_CATEGORIES = [{ key: "finalOcr", label: "Final OCR" }];

const ORG_STRUCTURE = {
  "Merchandising": [
    { title: "Manager", name: "Arasinth Raja", bullets: ["PO receiving", "Fabric plan app", "CMT plan app", "Pre budget plan app", "Bulk file app", "Process app", "VAP app", "Monitoring"] },
    { title: "Senior", name: "Suresh", bullets: ["Fabric planning & app — projection & bulk", "CMT planning & app", "Acc planning & app", "Pre budget plan", "Lab dips app", "Trims app", "Buyer app — lab dips, trims, strike off, samples", "Monthly budget plan"] },
    { title: "PPS & TOP", name: "Logesh", bullets: ["PP Sample", "TOP Sample", "Testing"] },
    { title: "Pro. Merch", name: "Gokul & Saravanan", bullets: ["Style file prep & app", "Consumption details", "Foam CAD", "PP meeting", "Size set & shrinkage closure", "Packing app", "QIMA", "Follow up"] },
    { title: "VAP Merch", name: "Srinivasan", bullets: ["Rate closure", "Grading app", "Bills closure", "Follow up — VAP"] },
  ],
  "Program": [
    { title: "Senior", name: "Vidhya", bullets: ["PO receiving", "Qty app", "Fabric plan app", "Acknowledgement tracking", "Merch approval"] },
    { title: "Assistant 1", name: "Selvi", bullets: ["Work order sheet", "Fabric planning & app — requirement"] },
    { title: "Assistant 2", name: "Arachana", bullets: ["Internal order entry", "Enquiry entry"] },
    { title: "Junior 1", name: "Geetha" },
    { title: "Junior 2", name: "Sandhya", bullets: ["Fabric program"] },
  ],
  "Planning": [
    { title: "Senior", name: "Krishnan", bullets: ["Fabric plan", "Fabric receiving", "Cut plan", "PPM"] },
    { title: "Samples", name: "Nivedhini", bullets: ["PPS", "TOP", "Testing", "File status"] },
    { title: "Cut Plan", name: "Ramya" },
    { title: "Line Plan", name: "Thangaraj", bullets: ["Line plan", "Shipment plan", "T&A", "Ready for feeding"] },
    { title: "Production O/P", name: "—", bullets: ["Fabric program"] },
  ],
  "Purchase – Fabric": [
    { title: "Senior", name: "Selva Kumar", bullets: ["Fabric req plan", "Supplier rate closure", "Lab dips acq", "Lab dips merch app"] },
    { title: "Assistant", name: "Raja Sekar", bullets: ["Lab dips acq", "Merch app", "Supplier communication"] },
    { title: "Junior", name: "Thiru" },
    { title: "Junior", name: "—" },
    { title: "Data Entry", name: "—", bullets: ["PO raising", "ERP entries"] },
    { title: "Senior (Yarn)", name: "Tamil", bullets: ["Yarn req plan", "Supplier rate closure", "Yarn acq", "Send to knitting"] },
  ],
  "Purchase – Trims": [
    { title: "Senior", name: "Shankar", bullets: ["Cross check BOM", "Trims & accessories plan", "Rate closure", "Merch app", "PO raise — pre budget app", "Follow up"] },
    { title: "Assistant", name: "Renuka" },
    { title: "Junior", name: "—" },
    { title: "Junior", name: "—" },
    { title: "Data Entry", name: "—", bullets: ["PO raising", "ERP entries"] },
  ],
  "Warehouse": [
    { title: "Senior", name: "Shiva Kumar", bullets: ["Fabric inhouse", "Inspection", "CSV check", "Lot card & cutting app", "Merch req app", "Delivery"] },
    { title: "Assistant", name: "Surekha", bullets: ["Fabric GRN & location", "ERP entries"] },
  ],
  "Testing": [
    { title: "Senior", name: "—", bullets: ["Fabric inspection", "Fabric testing", "CSV check", "Shrinkage", "Lot card prep & app — DGM", "Merch app"] },
    { title: "Assistant", name: "—" },
  ],
  "Store": [
    { title: "Manager", name: "—" },
    { title: "Assistant", name: "—" },
    { title: "Quality Check", name: "—" },
    { title: "Data Entry 2", name: "—" },
  ],
  "Cutting": [
    { title: "Manager", name: "Durai" },
    { title: "Assistant", name: "—" },
    { title: "Assistant", name: "Chandhini" },
    { title: "Data Entry", name: "Mahesh" },
  ],
  "Production": [
    { title: "FM", name: "Praveen Kumar", bullets: ["Line plan from planning", "File & complete kit", "Quality discussion on critical points"] },
    { title: "PM", name: "Shiva Kumar", bullets: ["Cut qty acc", "OB chart from IE / line plan", "Comments from quality", "First op app"] },
    { title: "Supervisor", name: "—", bullets: ["Line qty op", "OCR details", "Manpower handling"] },
    { title: "IE", name: "Sekar" },
    { title: "Assistant (IE)", name: "Marutha Muthu" },
    { title: "Junior 1", name: "Pasumathi" },
    { title: "Junior 2", name: "Haritha" },
    { title: "OCR", name: "Dinesh", bullets: ["Process styles handling — supplier / in-house / sewing / finishing", "Balance qty — OCR report", "Follow up — size set"] },
  ],
  "IoT": [
    { title: "IoT", name: "Aravind" },
    { title: "Junior 1", name: "—" },
    { title: "Junior 2", name: "—" },
  ],
  "Finishing": [
    { title: "Finishing Incharge", name: "Gopal", bullets: ["Order qty complete", "Packing app from merch", "Ironing & packing", "Packing list", "Box auditing", "Inspection", "Dispatch"] },
    { title: "Ironing", name: "—" },
    { title: "Packing", name: "—" },
    { title: "Inspection", name: "—" },
    { title: "Data Entry", name: "—" },
  ],
  "Quality": [
    { title: "DGM", name: "Sezhiyan" },
    { title: "Assistant — Sample", name: "Kamalkannan", bullets: ["Tech pack — meeting", "Pattern — measurement check — fit check — app", "Artwork app", "Technical — sewing", "Final quality app"] },
    { title: "Manager — Bulk", name: "Prakash", bullets: ["PPM", "Size set & shrinkage", "Cutting app", "First O/P — line setting — mechanism", "First checking", "Auditing", "Ironing"] },
    { title: "Assistant — Bulk", name: "Soundar Raj" },
    { title: "Quality Controller", name: "—" },
  ],
  "Sample": [
    { title: "DGM", name: "Raza" },
    { title: "Manager", name: "Viswa", bullets: ["Tech pack — meeting", "Pattern — measurement check — fit check — app", "Artwork app", "Technical — sewing", "Final quality app"] },
    { title: "Costing", name: "Subha Devi" },
    { title: "Senior", name: "Abdur" },
    { title: "Junior", name: "Cahaya Dewi" },
  ],
  "CAD": [
    { title: "Pattern", name: "Ramesh" },
    { title: "Marker", name: "Suresh" },
  ],
  "Logistics & Documentation": [
    { title: "Senior", name: "Srinivasan" },
    { title: "Assistant", name: "Raghu" },
    { title: "Assistant", name: "Prakash" },
    { title: "Junior", name: "—" },
  ],
  "VAP": [
    { title: "VAP Merch", name: "Srinivasan", bullets: ["Rate closure", "Grading app", "Bills closure", "Follow up — VAP"] },
  ],
  "Compliance & Certification": [
    { title: "Compliance Officer", name: "—", bullets: ["Apply for and renew Transaction Certificates (TC) per shipment", "Apply for and maintain GOTS certification", "Apply for and maintain OCS certification", "Social compliance audits (BSCI, WRAP, SEDEX)", "Chemical management (ZDHC) and sustainability documentation"] },
  ],
};

const DEPT_ICONS = {
  "Merchandising": Users, "Program": ClipboardList, "Planning": Calendar, "Purchase – Fabric": Package,
  "Purchase – Trims": Package, "Warehouse": Warehouse, "Testing": ShieldCheck, "Store": Warehouse,
  "Cutting": Scissors, "Production": Factory, "IoT": Radio, "Finishing": Shirt, "Quality": ShieldCheck,
  "Sample": Layers, "CAD": Palette, "Logistics & Documentation": Truck, "VAP": Palette,
  "Compliance & Certification": ShieldCheck,
};

const DOC_TABS_CONFIG = {
  "Files": ["Techpacks", "Operational Breakdown (OB)", "Points of measure", "Pattern Files", "CAD markers", "Stage Uploaded Files"],
  "Order Sheet": ["Order Sheet"],
  "BOMs & POs": ["Fabric BOM", "Trims BOM", "Fabric PO", "Trims PO"],
  "Costing": ["Costing Sheet"],
  "RM Delivery": ["GRN / Delivery Challan", "Fabric Inspection Report"],
  "Sampling": ["Fit Sample Proof", "PP Sample Proof", "Size Set Proof", "TOP Sample Proof", "Testing Sample Proof"],
  "Pre-Production": [],
  "Production": ["Cutting Report", "Sewing Output Report"],
  "Inspection": ["Inline Inspection Report", "Final Inspection Report"],
  "Final OCR": ["OCR Report", "Dispatch Proof"],
};
const DOC_TAB_NAMES = Object.keys(DOC_TABS_CONFIG);
const DOC_TAB_ICONS = {
  "Files": FileText, "Order Sheet": ClipboardList, "BOMs & POs": Package, "Costing": TrendingUp,
  "RM Delivery": Truck, "Sampling": Layers, "Pre-Production": ClipboardCheck, "Production": Factory, "Inspection": ShieldCheck, "Final OCR": CheckCircle2,
};
const CUSTOMIZABLE_TABS = new Set(["BOMs & POs", "RM Delivery", "Sampling", "Files"]);
const STAGE_CHAT_TABS = ["RM Delivery", "Sampling", "Inspection", "Final OCR"];

const TAB_ALLOWED_DEPTS = {
  "Files": ["Merchandising", "Sample", "CAD"],
  "BOMs & POs": ["Purchase – Fabric", "Purchase – Trims"],
  "Costing": ["Merchandising", "Finance"],
  "RM Delivery": ["Purchase – Fabric", "Purchase – Trims", "Warehouse", "Store"],
  "Sampling": ["Sample"],
  "Pre-Production": ["Merchandising", "Production Planning"],
  "Production": ["Cutting", "Production", "VAP"],
  "Inspection": ["Quality"],
  "Final OCR": ["Logistics & Documentation", "Production"],
};

const PRE_PROD_DOC_TYPES = [
  { key: "techPack", label: "Tech Pack", fields: [{ key: "styleNo", label: "Style No." }, { key: "revisionNo", label: "Revision No." }, { key: "constructionNotes", label: "Key construction notes" }] },
  { key: "poSheet", label: "PO Sheet", fields: [{ key: "poNumber", label: "PO Number" }, { key: "poQty", label: "PO Qty", type: "number" }, { key: "poDate", label: "PO Date" }] },
  { key: "programSheet", label: "Program Sheet", fields: [{ key: "cuttingStart", label: "Cutting start date" }, { key: "targetShipWeek", label: "Target ship week" }] },
  { key: "cmtPlanning", label: "CMT Planning", fields: [{ key: "cmtRate", label: "CMT rate / pc ($)", type: "number" }, { key: "targetEfficiency", label: "Target efficiency (%)", type: "number" }, { key: "lineAllocated", label: "Line allocated" }] },
  { key: "accPlanning", label: "ACC Planning", fields: [{ key: "accessoriesList", label: "Key accessories" }, { key: "leadTimeDays", label: "Lead time (days)", type: "number" }] },
  { key: "grading", label: "Grading", fields: [{ key: "gradedSizes", label: "Graded size range" }, { key: "gradeRuleRef", label: "Grade rule reference" }] },
];

function initPreProd() {
  const obj = {};
  PRE_PROD_DOC_TYPES.forEach(d => { obj[d.key] = { values: {}, status: "draft", approvedBy: null, approvedAt: null }; });
  return obj;
}

function allPreProdApproved(order) {
  return PRE_PROD_DOC_TYPES.every(d => order.preProd[d.key].status === "approved");
}

const HIGHLIGHT_DEPT_OPTIONS = Object.keys(ORG_STRUCTURE);

function getAllPeopleNames() {
  const names = new Set();
  Object.values(ORG_STRUCTURE).forEach(roles => roles.forEach(r => {
    if (r.name && r.name !== "—") {
      r.name.split(/&|,/).forEach(n => names.add(n.trim()));
    }
  }));
  return Array.from(names).sort();
}
const ALL_PEOPLE = getAllPeopleNames();

function renderWithMentions(text) {
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? <span key={i} style={{ color: "#378ADD", fontWeight: 600 }}>{part}</span> : part
  );
}

function DocumentsPanel({ order, role, costingContent, preProdContent, onUpdateShippedQty }) {
  const [activeTab, setActiveTab] = useState("Files");
  const [docs, setDocs] = useState({});
  const [customTypes, setCustomTypes] = useState({});
  const [addingCustom, setAddingCustom] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [messages, setMessages] = useState([]);
  const [includeStages, setIncludeStages] = useState(() => Object.fromEntries(STAGE_CHAT_TABS.map(t => [t, true])));
  const [draft, setDraft] = useState("");
  const [mentionQuery, setMentionQuery] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await window.storage.get(`docs:${order.id}`, true);
        if (!cancelled) setDocs(res ? JSON.parse(res.value) : {});
      } catch (e) { if (!cancelled) setDocs({}); }
      try {
        const res2 = await window.storage.get(`chat:${order.id}`, true);
        if (!cancelled) setMessages(res2 ? JSON.parse(res2.value) : []);
      } catch (e) { if (!cancelled) setMessages([]); }
      try {
        const res3 = await window.storage.get(`customTypes:${order.id}`, true);
        if (!cancelled) setCustomTypes(res3 ? JSON.parse(res3.value) : {});
      } catch (e) { if (!cancelled) setCustomTypes({}); }
    })();
    return () => { cancelled = true; };
  }, [order.id]);

  const uploaderName = role.label.split(" (")[0];

  async function upload(docType, file) {
    const entry = { name: file.name, uploadedAt: new Date().toLocaleString(), by: uploaderName };
    const next = { ...docs, [docType]: entry };
    setDocs(next);
    try { await window.storage.set(`docs:${order.id}`, JSON.stringify(next), true); } catch (e) {}
  }

  async function addCustomType() {
    const label = customLabel.trim();
    if (!label) return;
    const next = { ...customTypes, [activeTab]: [...(customTypes[activeTab] || []), label] };
    setCustomTypes(next);
    setCustomLabel("");
    setAddingCustom(false);
    try { await window.storage.set(`customTypes:${order.id}`, JSON.stringify(next), true); } catch (e) {}
  }

  async function sendMessage() {
    if (!draft.trim()) return;
    const msg = { id: Date.now(), author: uploaderName, text: draft.trim(), ts: new Date().toLocaleString(), stage: STAGE_CHAT_TABS.includes(activeTab) ? activeTab : null };
    const next = [...messages, msg];
    setMessages(next);
    setDraft("");
    setMentionQuery(null);
    try { await window.storage.set(`chat:${order.id}`, JSON.stringify(next), true); } catch (e) {}
  }

  function handleDraftChange(e) {
    const val = e.target.value;
    setDraft(val);
    const m = val.match(/@(\w*)$/);
    setMentionQuery(m ? m[1] : null);
  }

  function insertMention(name) {
    const first = name.split(" ")[0];
    setDraft(d => d.replace(/@(\w*)$/, `@${first} `));
    setMentionQuery(null);
  }

  const mentionSuggestions = mentionQuery !== null
    ? ALL_PEOPLE.filter(n => n.split(" ")[0].toLowerCase().startsWith(mentionQuery.toLowerCase())).slice(0, 5)
    : [];

  const visibleMessages = messages.filter(m => !m.stage || includeStages[m.stage]);
  const docTypes = [...DOC_TABS_CONFIG[activeTab], ...(customTypes[activeTab] || [])];
  const ActiveIcon = DOC_TAB_ICONS[activeTab] || FileText;
  const ACCENT = "#534AB7";
  const allowedDepts = TAB_ALLOWED_DEPTS[activeTab] || [];
  const canUploadHere = role.fullAccess || allowedDepts.includes(role.dept);

  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div style={{ width: 92, flexShrink: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {DOC_TAB_NAMES.map(tab => {
          const Icon = DOC_TAB_ICONS[tab] || FileText;
          const active = activeTab === tab;
          return (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textAlign: "center",
                padding: "10px 4px", borderRadius: 10, cursor: "pointer",
                background: active ? "#F0EFFB" : "transparent",
                border: active ? "1px solid #D9D6F5" : "1px solid transparent",
              }}
            >
              <div style={{ width: 30, height: 30, borderRadius: 8, background: active ? ACCENT : "#F0F0F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={14} color={active ? "#fff" : "#8A8D98"} />
              </div>
              <div style={{ fontSize: 9.5, fontWeight: active ? 700 : 500, color: active ? "#39328F" : "#8A8D98", lineHeight: 1.2 }}>{tab}</div>
            </div>
          );
        })}
      </div>

      <Card style={{ flex: 1, padding: 0, overflow: "hidden" }}>
        <div style={{ height: 3, background: ACCENT }} />
        <div style={{ padding: "18px 20px" }}>
          {activeTab === "Costing" && costingContent ? costingContent : activeTab === "Pre-Production" && preProdContent ? preProdContent : (
          <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: "#F0EFFB", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ActiveIcon size={13} color={ACCENT} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1B2130" }}>{activeTab}</div>
          </div>
          <div style={{ fontSize: 11.5, color: "#8A8D98", marginBottom: 16, marginLeft: 34 }}>
            {activeTab === "Files" ? "Source documents for this order" : "Upload proof once this T&A action is complete"}
            {!canUploadHere && allowedDepts.length > 0 && (
              <span style={{ color: "#B0812E", fontWeight: 600 }}> · Attaching here is owned by {allowedDepts.join(" / ")}</span>
            )}
          </div>
          {activeTab === "Final OCR" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F7F7F9", border: "1px solid #ECEDF1", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "#1B2130" }}>Shipped quantity</div>
                <div style={{ fontSize: 11, color: "#8A8D98", marginTop: 2 }}>Actual qty dispatched — this is what feeds the Buyer Qty Difference Per Season report, in place of an estimate.</div>
              </div>
              <input
                type="number"
                value={order.shippedQty || 0}
                disabled={!canUploadHere}
                onChange={e => onUpdateShippedQty(order.id, Number(e.target.value))}
                style={{ width: 110, fontSize: 13, fontWeight: 600, padding: "7px 10px", borderRadius: 8, border: "1px solid #E7E8ED", textAlign: "right" }}
              />
              <span style={{ fontSize: 11.5, color: "#8A8D98" }}>/ {order.qty.toLocaleString()} pcs ordered</span>
            </div>
          )}
          {docTypes.map((docType, i) => {
            const entry = docs[docType];
            const inputId = `upload-${order.id}-${activeTab}-${i}`;
            return (
              <div key={docType} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 14px", marginBottom: 8, borderRadius: 10, background: entry ? "#F7FBF9" : "#FAFAFB", border: `1px solid ${entry ? "#DCEFE6" : "#EFEFF2"}` }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1B2130" }}>{docType}</div>
                  {entry ? (
                    <div style={{ fontSize: 11, color: "#1F9E8D", marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
                      <CheckCircle2 size={12} /> {entry.name} · {entry.by} · {entry.uploadedAt}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: "#B0B2BA", marginTop: 3 }}>Not uploaded yet</div>
                  )}
                </div>
                <div>
                  {canUploadHere ? (
                    <>
                      <input
                        type="file"
                        id={inputId}
                        style={{ display: "none" }}
                        onChange={e => { const f = e.target.files[0]; if (f) upload(docType, f); }}
                      />
                      <label
                        htmlFor={inputId}
                        style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: entry ? "#1F9E8D" : ACCENT, border: `1px solid ${entry ? "#BFE4D6" : "#D9D6F5"}`, background: "#fff", borderRadius: 999, padding: "6px 12px", cursor: "pointer" }}
                      >
                        <Upload size={11} /> {entry ? "Replace" : "Upload"}
                      </label>
                    </>
                  ) : (
                    <span style={{ fontSize: 11, color: "#B0B2BA", fontWeight: 600, padding: "6px 12px" }}>View only</span>
                  )}
                </div>
              </div>
            );
          })}
          {CUSTOMIZABLE_TABS.has(activeTab) && canUploadHere && (
            addingCustom ? (
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <input
                  autoFocus
                  value={customLabel}
                  onChange={e => setCustomLabel(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addCustomType(); }}
                  placeholder="e.g. Other Trim — Elastic Tape"
                  style={{ flex: 1, fontSize: 12.5, padding: "8px 10px", borderRadius: 8, border: "1px solid #E7E8ED" }}
                />
                <button onClick={addCustomType} style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: ACCENT, border: "none", borderRadius: 8, padding: "0 14px", cursor: "pointer" }}>Add</button>
                <button onClick={() => { setAddingCustom(false); setCustomLabel(""); }} style={{ fontSize: 12, color: "#8A8D98", background: "none", border: "none", cursor: "pointer" }}>Cancel</button>
              </div>
            ) : (
              <div
                onClick={() => setAddingCustom(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 14px", borderRadius: 10, border: "1px dashed #D9D6F5", color: ACCENT, fontSize: 12.5, fontWeight: 600, cursor: "pointer", marginTop: 4 }}
              >
                + Add other {activeTab === "Sampling" ? "sample type" : activeTab === "Costing" ? "line item" : "material / trim / file"}
              </div>
            )
          )}
          </>
          )}
        </div>
      </Card>

      <Card style={{ width: 280, flexShrink: 0, padding: 0, display: "flex", flexDirection: "column", maxHeight: 560, overflow: "hidden" }}>
        <div style={{ height: 3, background: "#378ADD" }} />
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #ECEDF1", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: "#EAF2FC", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={12} color="#378ADD" />
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1B2130" }}>Activity & Chat</div>
        </div>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #ECEDF1" }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: "#8A8D98", letterSpacing: 0.4, marginBottom: 8 }}>INCLUDE STAGE CHATS</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {STAGE_CHAT_TABS.map(tab => (
              <div key={tab} onClick={() => setIncludeStages(s => ({ ...s, [tab]: !s[tab] }))} style={{ textAlign: "center", cursor: "pointer" }}>
                <div style={{ padding: "5px 9px", border: `1.5px solid ${includeStages[tab] ? "#378ADD" : "#DADCE2"}`, background: includeStages[tab] ? "#EAF2FC" : "#fff", borderRadius: 999, fontSize: 9.5, color: includeStages[tab] ? "#255D9E" : "#8A8D98", fontWeight: 600 }}>
                  {tab}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", minHeight: 140 }}>
          {visibleMessages.length === 0 ? (
            <div style={{ fontSize: 12, color: "#B0B2BA" }}>No messages yet. Tag a teammate with @ to loop them in.</div>
          ) : visibleMessages.map(m => (
            <div key={m.id} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 22, height: 22, borderRadius: 999, background: "#7F77DD", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {m.author.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 11.5 }}>
                  <span style={{ fontWeight: 700, color: "#1B2130" }}>{m.author}</span>{" "}
                  <span style={{ color: "#B0B2BA" }}>{m.ts}</span>
                  {m.stage && <span style={{ color: "#B0B2BA" }}> · {m.stage}</span>}
                </div>
                <div style={{ fontSize: 12.5, color: "#1B2130", background: "#F5F6F8", borderRadius: 10, padding: "6px 10px", marginTop: 3, display: "inline-block" }}>
                  {renderWithMentions(m.text)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid #ECEDF1", padding: "10px 16px", position: "relative" }}>
          {mentionSuggestions.length > 0 && (
            <div style={{ position: "absolute", bottom: "100%", left: 16, right: 16, background: "#fff", border: "1px solid #ECEDF1", borderRadius: 8, boxShadow: "0 -4px 16px rgba(0,0,0,0.08)", marginBottom: 4 }}>
              {mentionSuggestions.map(n => (
                <div key={n} onClick={() => insertMention(n)} style={{ padding: "7px 12px", fontSize: 12.5, cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = "#F7F7F9"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  {n}
                </div>
              ))}
            </div>
          )}
          <textarea
            value={draft}
            onChange={handleDraftChange}
            placeholder="Type a message... Use @ to mention"
            rows={2}
            style={{ width: "100%", border: "1px solid #E7E8ED", borderRadius: 8, padding: "8px 10px", fontSize: 12.5, resize: "none", fontFamily: "inherit" }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
            <button onClick={sendMessage} style={{ display: "flex", alignItems: "center", gap: 5, background: "#378ADD", color: "#fff", border: "none", borderRadius: 999, padding: "7px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Send size={11} /> Send
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function firstNamedAssignee(dept) {
  const roles = ORG_STRUCTURE[dept] || [];
  const found = roles.find(r => r.name && r.name !== "—");
  return found ? `${found.name} (${found.title})` : "Unassigned";
}

function makeStages(template, activeUpto, delayedAt) {
  const list = TA_TEMPLATES[template] || TA_STAGES_90;
  return list.map((s, i) => ({
    name: s.name,
    dept: s.dept,
    status: i < activeUpto ? "done" : i === activeUpto ? "in_progress" : "pending",
    assignee: firstNamedAssignee(s.dept),
    reason: delayedAt === i ? REASONS[0] : null,
    planned: s.day,
  }));
}

const RISK_DELAY_DAYS = { high: 3, medium: 2, low: 1 };

const INITIAL_ORDERS = [
  { id: "GKT-1054", buyer: "Zara", country: "Spain", season: "AW26", style: "Hoodie", qty: 12500, ship: "20 May", risk: "high", status: "At Risk", activeUpto: 10, delayedAt: 10 },
  { id: "ST-7788", buyer: "H&M", country: "Sweden", season: "AW26", style: "T-Shirt", qty: 8000, ship: "18 May", risk: "high", status: "Delayed", activeUpto: 5, delayedAt: 5 },
  { id: "JKT-2231", buyer: "Uniqlo", country: "Japan", season: "AW26", style: "Jacket", qty: 6200, ship: "22 May", risk: "medium", status: "At Risk", activeUpto: 7, delayedAt: null },
  { id: "TR-8899", buyer: "M&S", country: "United Kingdom", season: "SS26", style: "Trouser", qty: 4500, ship: "25 May", risk: "medium", status: "On Track", activeUpto: 13, delayedAt: null },
  { id: "DR-5566", buyer: "Next", country: "United Kingdom", season: "SS26", style: "Dress", qty: 5300, ship: "23 May", risk: "medium", status: "Delayed", activeUpto: 8, delayedAt: 8 },
  { id: "PL-3321", buyer: "Zara", country: "Spain", season: "SS26", style: "Polo", qty: 9100, ship: "28 May", risk: "low", status: "On Track", activeUpto: 15, delayedAt: null },
];

function riskDot(risk) {
  const c = risk === "high" ? "#D64545" : risk === "medium" ? "#E2A83B" : "#1F9E8D";
  return <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 999, background: c, marginRight: 8 }} />;
}

function statusPill(status) {
  const map = {
    "On Track": { bg: "#E1F5EE", fg: "#085041" },
    "At Risk": { bg: "#FAEEDA", fg: "#633806" },
    "Delayed": { bg: "#FCEBEB", fg: "#791F1F" },
    "done": { bg: "#E1F5EE", fg: "#085041" },
    "in_progress": { bg: "#FAEEDA", fg: "#633806" },
    "pending": { bg: "#F0F0F2", fg: "#565A66" },
  };
  const labelMap = { done: "Done", in_progress: "In progress", pending: "Pending" };
  const s = map[status] || map["On Track"];
  return (
    <span style={{ background: s.bg, color: s.fg, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
      {labelMap[status] || status}
    </span>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #ECEDF1", borderRadius: 12, padding: "18px 20px", ...style }}>
      {children}
    </div>
  );
}

function CardHeader({ title, sub, action, onAction }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1B2130" }}>{title}</div>
        {sub && <div style={{ fontSize: 11.5, color: "#8A8D98", marginTop: 2 }}>{sub}</div>}
      </div>
      {action && <div onClick={onAction} style={{ fontSize: 12, color: "#378ADD", display: "flex", alignItems: "center", gap: 2, cursor: "pointer", whiteSpace: "nowrap" }}>{action} <ChevronRight size={12} /></div>}
    </div>
  );
}

function PageHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#1B2130" }}>{title}</h1>
      {sub && <div style={{ fontSize: 13.5, color: "#8A8D98", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function BackLink({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#565A66", fontSize: 13, cursor: "pointer", marginBottom: 20, padding: 0 }}
    >
      <ChevronLeft size={16} /> {label}
    </button>
  );
}

function collectTasks(orders, deptFilter) {
  const rows = [];
  orders.forEach(o => {
    o.stages.forEach((s, idx) => {
      if (!deptFilter || s.dept === deptFilter) {
        rows.push({ order: o, stage: s, stageIdx: idx, dept: s.dept });
      }
    });
  });
  return rows;
}

function TaskTable({ rows, onOpenOrder, emptyText }) {
  if (rows.length === 0) {
    return <div style={{ fontSize: 12.5, color: "#B0B2BA", padding: "12px 4px" }}>{emptyText}</div>;
  }
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.3fr 0.9fr 0.9fr 1fr", fontSize: 11, color: "#8A8D98", padding: "0 4px 8px", borderBottom: "1px solid #F0F0F2" }}>
        <div>Order / Style</div><div>Task / stage</div><div>Due</div><div>Status</div><div>Flag</div>
      </div>
      {rows.map(({ order, stage, stageIdx }) => (
        <div
          key={order.id + stageIdx}
          onClick={() => onOpenOrder(order.id)}
          style={{ display: "grid", gridTemplateColumns: "1.1fr 1.3fr 0.9fr 0.9fr 1fr", alignItems: "center", fontSize: 12.5, padding: "10px 4px", borderBottom: "1px solid #F5F5F7", cursor: "pointer" }}
          onMouseEnter={e => e.currentTarget.style.background = "#FAFAFB"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 11, color: "#8A8D98" }}>{order.id}</div>
            <div style={{ fontWeight: 600, color: "#1B2130" }}>{order.style}</div>
          </div>
          <div>{stage.name}</div>
          <div>{stage.planned}</div>
          <div>{statusPill(stage.status)}</div>
          <div style={{ color: stage.reason ? "#A32D2D" : "#B0B2BA" }}>{stage.reason || "—"}</div>
        </div>
      ))}
    </div>
  );
}

function OrgChain({ roles }) {
  return (
    <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 6 }}>
      {roles.map((r, i) => (
        <React.Fragment key={i}>
          <div style={{ minWidth: 152, maxWidth: 152, flexShrink: 0 }}>
            <div style={{ background: "#F7F7F9", border: "1px solid #ECEDF1", borderRadius: 8, padding: "9px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#1B2130", textTransform: "uppercase", letterSpacing: 0.3 }}>{r.title}</div>
              <div style={{ fontSize: 12, color: "#565A66", marginTop: 2 }}>{r.name || "—"}</div>
            </div>
            {r.bullets && r.bullets.length > 0 && (
              <ul style={{ margin: "8px 0 0", paddingLeft: 14, fontSize: 10, color: "#8A8D98", lineHeight: 1.55 }}>
                {r.bullets.map(b => <li key={b}>{b}</li>)}
              </ul>
            )}
          </div>
          {i < roles.length - 1 && (
            <div style={{ display: "flex", alignItems: "flex-start", paddingTop: 16, color: "#C9A455", flexShrink: 0 }}>
              <ChevronRight size={16} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function gatingApproval(stages, idx) {
  for (let j = idx - 1; j >= 0; j--) {
    if (stages[j].name.toLowerCase().includes("approval")) {
      return stages[j].status !== "done" ? stages[j] : null;
    }
  }
  return null;
}

function StageNode({ stage, idx, onCycle, onReason, onSupplierChange, lockedBy }) {
  const [open, setOpen] = useState(false);
  const locked = !!lockedBy;
  const icon =
    stage.status === "done" ? <CheckCircle2 size={17} color="#1F9E8D" /> :
    locked ? <Lock size={14} color="#B0B2BA" /> :
    stage.status === "in_progress" ? <Clock size={17} color="#E2A83B" /> :
    <Circle size={17} color="#C7CAD1" />;

  return (
    <div style={{ flex: "0 0 128px", minWidth: 128, position: "relative", opacity: locked ? 0.6 : 1 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          onClick={() => { if (!locked) onCycle(idx); }}
          title={locked ? `Locked until ${lockedBy} is approved` : "Click to change status"}
          style={{
            width: 30, height: 30, borderRadius: 999, background: "#fff",
            border: `2px solid ${stage.status === "done" ? "#1F9E8D" : locked ? "#D9DBE1" : stage.status === "in_progress" ? "#E2A83B" : "#D9DBE1"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: locked ? "not-allowed" : "pointer", flexShrink: 0
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, height: 2, background: stage.status === "done" ? "#1F9E8D" : "#E7E8ED" }} />
      </div>
      <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 600, color: locked ? "#B0B2BA" : "#1B2130", lineHeight: 1.3 }}>{stage.name}</div>
      <div style={{ fontSize: 10.5, color: "#8A8D98", marginTop: 2 }}>{stage.planned}</div>
      <div style={{ fontSize: 10, color: "#B0B2BA", marginTop: 2 }}>{stage.dept}</div>
      {stage.dept === "VAP" && (
        <select
          value={stage.supplier || ""}
          onChange={e => onSupplierChange(idx, e.target.value)}
          style={{ marginTop: 4, width: "100%", fontSize: 9.5, padding: "2px 4px", borderRadius: 5, border: "1px solid #E0DBF5", color: "#534AB7", background: "#F8F7FD" }}
        >
          <option value="">No supplier set</option>
          {VAP_SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      )}
      {locked && (
        <div style={{ fontSize: 10, color: "#B0812E", marginTop: 4, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
          <Lock size={9} /> Needs {lockedBy}
        </div>
      )}
      {!locked && stage.status !== "pending" && (
        <div style={{ fontSize: 10.5, color: "#565A66", marginTop: 2 }}>{stage.assignee}</div>
      )}
      {!locked && stage.status === "in_progress" && (
        <div style={{ marginTop: 6 }}>
          <button
            onClick={() => setOpen(!open)}
            style={{
              fontSize: 10.5, background: stage.reason ? "#FCEBEB" : "#F4F4F6",
              color: stage.reason ? "#791F1F" : "#565A66", border: "none",
              padding: "3px 7px", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4
            }}
          >
            {stage.reason || "Flag delay"} <ChevronDown size={10} />
          </button>
          {open && (
            <div style={{ position: "absolute", top: "100%", left: 0, background: "#fff", border: "1px solid #E7E8ED", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 10, minWidth: 170, marginTop: 4 }}>
              {REASONS.map(r => (
                <div
                  key={r}
                  onClick={() => { onReason(idx, r); setOpen(false); }}
                  style={{ padding: "8px 12px", fontSize: 12.5, cursor: "pointer", color: "#1B2130" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F7F7F9"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {r}
                </div>
              ))}
              <div
                onClick={() => { onReason(idx, null); setOpen(false); }}
                style={{ padding: "8px 12px", fontSize: 12.5, cursor: "pointer", color: "#8A8D98", borderTop: "1px solid #F0F0F2" }}
              >
                Clear
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PreProductionTab({ order, role, onFieldChange, onSubmit, onApprove }) {
  const canApprove = role.fullAccess;
  const allApproved = allPreProdApproved(order);

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#1B2130", marginBottom: 4 }}>Pre-production sign-off</div>
      <div style={{ fontSize: 11.5, color: "#8A8D98", marginBottom: 16 }}>
        Fill these in here instead of on paper. Bulk production (Cutting onward) stays locked until every document below is approved by a manager.
      </div>
      {allApproved ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#E1F5EE", border: "1px solid #BFE7D8", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12.5, color: "#085041", fontWeight: 600 }}>
          <CheckCircle2 size={14} /> All pre-production documents approved — bulk production is unlocked.
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FAEEDA", border: "1px solid #F0DBAA", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12.5, color: "#633806", fontWeight: 600 }}>
          <Lock size={13} /> Cutting and every stage after it stay locked until all documents below are approved.
        </div>
      )}
      {PRE_PROD_DOC_TYPES.map(doc => {
        const state = order.preProd[doc.key];
        const st = state.status === "approved" ? { bg: "#E1F5EE", fg: "#085041", label: "Approved" }
          : state.status === "submitted" ? { bg: "#FAEEDA", fg: "#633806", label: "Submitted — awaiting approval" }
          : { bg: "#F0F0F2", fg: "#565A66", label: "Draft" };
        return (
          <div key={doc.key} style={{ border: "1px solid #ECEDF1", borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1B2130" }}>{doc.label}</div>
              <span style={{ fontSize: 11, fontWeight: 600, background: st.bg, color: st.fg, padding: "3px 10px", borderRadius: 999 }}>{st.label}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${doc.fields.length}, 1fr)`, gap: 8, marginBottom: 10 }}>
              {doc.fields.map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 10.5, color: "#8A8D98", display: "block", marginBottom: 3 }}>{f.label}</label>
                  <input
                    type={f.type || "text"}
                    value={state.values[f.key] || ""}
                    disabled={state.status === "approved"}
                    onChange={e => onFieldChange(doc.key, f.key, e.target.value)}
                    style={{ width: "100%", fontSize: 12, padding: "6px 8px", borderRadius: 6, border: "1px solid #E7E8ED" }}
                  />
                </div>
              ))}
            </div>
            <div>
              {state.status === "draft" && (
                <button onClick={() => onSubmit(doc.key)} style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: "#378ADD", border: "none", borderRadius: 7, padding: "6px 14px", cursor: "pointer" }}>Submit for approval</button>
              )}
              {state.status === "submitted" && canApprove && (
                <button onClick={() => onApprove(doc.key)} style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: "#1F9E8D", border: "none", borderRadius: 7, padding: "6px 14px", cursor: "pointer" }}>Approve</button>
              )}
              {state.status === "submitted" && !canApprove && (
                <div style={{ fontSize: 11.5, color: "#8A8D98" }}>Waiting on manager approval</div>
              )}
              {state.status === "approved" && (
                <div style={{ fontSize: 11.5, color: "#1F9E8D" }}>Approved by {state.approvedBy} · {state.approvedAt}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CostingTab({ order, onSetTemplate, onUpdateRow, onAddRow }) {
  const tmpl = COSTING_TEMPLATES[order.costingTemplate];
  const grandTotal = order.costingRows.reduce((a, r) => a + (r.isHeader ? 0 : (Number(r.price) || 0) * (Number(r.qty) || 0)), 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1B2130" }}>Costing — {tmpl.label}</div>
        <select
          value={order.costingTemplate}
          onChange={e => onSetTemplate(order.id, e.target.value)}
          style={{ fontSize: 12, padding: "5px 8px", borderRadius: 7, border: "1px solid #E7E8ED" }}
        >
          <option value="fabric">Fabric to Garment</option>
          <option value="yarn">Yarn to Garment</option>
        </select>
      </div>
      <div style={{ fontSize: 11.5, color: "#8A8D98", marginBottom: 16 }}>
        Matches the two costing sheets from your T&A workbook. Switching templates resets the entered values below. Use "Add other fabric / trim" for anything this style needs that isn't in the standard list.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 0.8fr 0.7fr 0.9fr", fontSize: 11, color: "#8A8D98", padding: "0 4px 8px", borderBottom: "1px solid #F0F0F2" }}>
        <div>Particulars</div><div>Price</div><div>Qty</div><div>Total</div>
      </div>
      {order.costingRows.map((row, i) => (
        row.isHeader ? (
          <div key={i} style={{ fontSize: 12, fontWeight: 700, color: "#1B2130", padding: "12px 4px 6px" }}>{row.label}</div>
        ) : (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1.6fr 0.8fr 0.7fr 0.9fr", alignItems: "center", fontSize: 12.5, padding: "6px 4px", borderBottom: "1px solid #F7F7F9", background: row.custom ? "#FBFAFF" : "transparent" }}>
            {row.custom ? (
              <input
                value={row.label}
                placeholder="e.g. Recycled polyester tape"
                onChange={e => onUpdateRow(order.id, i, "label", e.target.value)}
                style={{ fontSize: 12.5, padding: "5px 8px", borderRadius: 6, border: "1px solid #E0DBF5", marginLeft: 8, marginRight: 8, color: "#1B2130" }}
              />
            ) : (
              <div style={{ color: "#565A66", paddingLeft: 8 }}>{row.label}</div>
            )}
            <input type="number" value={row.price} onChange={e => onUpdateRow(order.id, i, "price", e.target.value)} style={{ width: 64, fontSize: 12, padding: "4px 6px", borderRadius: 6, border: "1px solid #E7E8ED" }} />
            <input type="number" value={row.qty} onChange={e => onUpdateRow(order.id, i, "qty", e.target.value)} style={{ width: 54, fontSize: 12, padding: "4px 6px", borderRadius: 6, border: "1px solid #E7E8ED" }} />
            <div style={{ fontWeight: 600 }}>{((Number(row.price) || 0) * (Number(row.qty) || 0)).toLocaleString()}</div>
          </div>
        )
      ))}
      <button
        onClick={() => onAddRow(order.id)}
        style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, background: "#F5F3FF", color: "#534AB7", border: "1px dashed #C9BFF0", borderRadius: 8, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
      >
        + Add other fabric / trim
      </button>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 4px 0", fontSize: 14, fontWeight: 700, color: "#1B2130", borderTop: "1px solid #F0F0F2", marginTop: 14 }}>
        <div>TOTAL COST</div>
        <div>{grandTotal.toLocaleString()}</div>
      </div>
    </div>
  );
}

function OrderHighlightsCard({ order, role }) {
  const [highlights, setHighlights] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState("");
  const [tagDept, setTagDept] = useState("All");
  const [showResolved, setShowResolved] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const personName = role.label.split(" (")[0];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await window.storage.get(`highlights:${order.id}`, true);
        if (!cancelled) setHighlights(res ? JSON.parse(res.value) : []);
      } catch (e) { if (!cancelled) setHighlights([]); }
      if (!cancelled) setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [order.id]);

  async function persist(next) {
    setHighlights(next);
    try { await window.storage.set(`highlights:${order.id}`, JSON.stringify(next), true); } catch (e) {}
  }

  function addHighlight() {
    const t = text.trim();
    if (!t) return;
    const item = { id: Date.now(), text: t, dept: tagDept, by: personName, ts: new Date().toLocaleString(), resolved: false, source: "manual" };
    persist([item, ...highlights]);
    setText("");
    setTagDept("All");
  }

  async function extractFromTechPack() {
    const source = pasteText.trim();
    if (!source) return;
    setExtracting(true);
    setExtractError("");
    try {
      // NOTE: this now calls OUR backend (/api/claude/extract-highlights), which holds the
      // real Anthropic API key server-side and forwards the request. Never call
      // api.anthropic.com directly from the browser — that would expose the key.
      const response = await fetch("/api/claude/extract-highlights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ techPackNotes: source, deptOptions: HIGHLIGHT_DEPT_OPTIONS }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");
      const parsed = data.items; // backend already returns a parsed JSON array
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setExtractError("No specific instructions found in that text — try pasting the full comments section.");
      } else {
        const validDepts = new Set(["All", ...HIGHLIGHT_DEPT_OPTIONS]);
        const items = parsed.map(p => ({
          id: Date.now() + Math.random(),
          text: String(p.text || "").slice(0, 200),
          dept: validDepts.has(p.dept) ? p.dept : "All",
          by: `${personName} (auto-extracted)`,
          ts: new Date().toLocaleString(),
          resolved: false,
          source: "auto",
        })).filter(i => i.text);
        persist([...items, ...highlights]);
        setPasteText("");
      }
    } catch (e) {
      setExtractError("Couldn't extract right now — you can still add a note manually below.");
    } finally {
      setExtracting(false);
    }
  }

  function toggleResolved(id) {
    persist(highlights.map(h => h.id === id ? { ...h, resolved: !h.resolved } : h));
  }

  if (!loaded) return null;
  const unresolved = highlights.filter(h => !h.resolved);
  const resolved = highlights.filter(h => h.resolved);

  return (
    <div style={{ background: "#FFFBF0", border: "1px solid #F5E3B8", borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "#FBEFD1", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AlertTriangle size={14} color="#966B1E" />
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: "#5A3E0E" }}>Order Highlights — Buyer Comments & Tech Pack Notes</div>
      </div>
      <div style={{ fontSize: 11.5, color: "#8A6E2E", margin: "4px 0 14px", marginLeft: 36 }}>
        Paste the tech pack's comments section below and it's read automatically — no need to type each note out by hand.
      </div>

      <div style={{ background: "#fff", border: "1px solid #EBD9A0", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
        <textarea
          value={pasteText}
          onChange={e => setPasteText(e.target.value)}
          placeholder="Paste the tech pack's comments / buyer notes section here…"
          rows={3}
          style={{ width: "100%", fontSize: 12.5, padding: "8px 10px", borderRadius: 8, border: "1px solid #EBD9A0", resize: "vertical", fontFamily: "inherit" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <button
            onClick={() => setShowManualAdd(!showManualAdd)}
            style={{ fontSize: 11.5, color: "#8A6E2E", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
          >
            {showManualAdd ? "Hide manual add" : "Add a note manually instead"}
          </button>
          <button
            onClick={extractFromTechPack}
            disabled={extracting || !pasteText.trim()}
            style={{ fontSize: 12.5, fontWeight: 600, color: "#fff", background: extracting ? "#C7A75A" : "#B0812E", border: "none", borderRadius: 8, padding: "8px 16px", cursor: extracting ? "default" : "pointer" }}
          >
            {extracting ? "Reading tech pack…" : "Auto-extract highlights"}
          </button>
        </div>
        {extractError && <div style={{ fontSize: 11.5, color: "#A32D2D", marginTop: 8 }}>{extractError}</div>}
      </div>

      {showManualAdd && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") addHighlight(); }}
            placeholder="e.g. Buyer wants matte snap buttons, not shiny — confirmed on call"
            style={{ flex: 1, fontSize: 12.5, padding: "8px 10px", borderRadius: 8, border: "1px solid #EBD9A0" }}
          />
          <select value={tagDept} onChange={e => setTagDept(e.target.value)} style={{ fontSize: 12, padding: "8px 8px", borderRadius: 8, border: "1px solid #EBD9A0" }}>
            <option value="All">All departments</option>
            {HIGHLIGHT_DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button onClick={addHighlight} style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: "#B0812E", border: "none", borderRadius: 8, padding: "0 16px", cursor: "pointer" }}>Add</button>
        </div>
      )}

      {unresolved.length === 0 ? (
        <div style={{ fontSize: 12.5, color: "#8A6E2E" }}>No open highlights — nothing flagged from the buyer or tech pack right now.</div>
      ) : unresolved.map(h => {
        const relevant = h.dept !== "All" && h.dept === role.dept;
        return (
          <div
            key={h.id}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, padding: "10px 12px", marginBottom: 8, borderRadius: 10, background: relevant ? "#FCEBEB" : "#fff", border: `1px solid ${relevant ? "#F0C4C4" : "#F0E4C0"}` }}
          >
            <div>
              <div style={{ fontSize: 13, color: "#3D2E0E", fontWeight: relevant ? 700 : 500 }}>
                {h.source === "auto" && <Zap size={11} color="#B0812E" style={{ marginRight: 4, verticalAlign: -1 }} />}
                {h.text}
              </div>
              <div style={{ fontSize: 10.5, color: "#9C8659", marginTop: 3 }}>
                {h.dept !== "All" && <span style={{ background: "#F0E4C0", color: "#6B5216", padding: "1px 7px", borderRadius: 999, marginRight: 6 }}>{h.dept}</span>}
                {h.by} · {h.ts}
              </div>
            </div>
            <button onClick={() => toggleResolved(h.id)} style={{ fontSize: 11, fontWeight: 600, color: "#6B5216", background: "#F0E4C0", border: "none", borderRadius: 999, padding: "4px 10px", cursor: "pointer", whiteSpace: "nowrap" }}>
              Mark noted
            </button>
          </div>
        );
      })}

      {resolved.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div onClick={() => setShowResolved(!showResolved)} style={{ fontSize: 11.5, color: "#8A6E2E", cursor: "pointer", fontWeight: 600 }}>
            {showResolved ? "Hide" : "Show"} noted ({resolved.length})
          </div>
          {showResolved && resolved.map(h => (
            <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, padding: "8px 12px", marginTop: 6, borderRadius: 10, background: "#F7F5EE" }}>
              <div style={{ fontSize: 12.5, color: "#A79A78", textDecoration: "line-through" }}>{h.text}</div>
              <button onClick={() => toggleResolved(h.id)} style={{ fontSize: 10.5, color: "#8A6E2E", background: "none", border: "none", cursor: "pointer" }}>Reopen</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderWorkspace({ order, onBack, onUpdateStages, role, onSetTemplate, onSetCostingTemplate, onUpdateCostingRow, onAddCostingRow, onUpdateShippedQty, onPreProdField, onPreProdSubmit, onPreProdApprove }) {
  const cuttingIdx = order.stages.findIndex(s => s.name === "Cutting");
  const bulkGateOpen = allPreProdApproved(order);

  const cycle = (idx) => {
    if (gatingApproval(order.stages, idx)) return;
    if (cuttingIdx !== -1 && idx >= cuttingIdx && !bulkGateOpen) return;
    const stages = order.stages.map((s, i) => {
      if (i !== idx) return s;
      const next = s.status === "pending" ? "in_progress" : s.status === "in_progress" ? "done" : "pending";
      return { ...s, status: next, reason: next === "done" ? null : s.reason };
    });
    onUpdateStages(order.id, stages);
  };
  const setReason = (idx, reason) => {
    const stages = order.stages.map((s, i) => i === idx ? { ...s, reason } : s);
    onUpdateStages(order.id, stages);
  };
  const setSupplier = (idx, supplier) => {
    const stages = order.stages.map((s, i) => i === idx ? { ...s, supplier } : s);
    onUpdateStages(order.id, stages);
  };

  const doneCount = order.stages.filter(s => s.status === "done").length;
  const flaggedReasons = order.stages.filter(s => s.reason).map(s => `${s.name}: ${s.reason}`);

  const trackerCard = (
    <div style={{ background: "#fff", border: "1px solid #ECEDF1", borderRadius: 14, padding: "20px 22px", marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#F0EFFB", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Calendar size={14} color="#534AB7" />
          </div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "#1B2130" }}>T&A stage tracker</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#8A8D98" }}>Template:</span>
          <select
            value={order.template || "90"}
            onChange={e => onSetTemplate(order.id, e.target.value)}
            style={{ fontSize: 12, padding: "5px 8px", borderRadius: 7, border: "1px solid #E7E8ED" }}
          >
            <option value="90">90-day (standard)</option>
            <option value="120">120-day (dye / print, longer lead time)</option>
          </select>
        </div>
      </div>
      <div style={{ fontSize: 11, color: "#B0B2BA", margin: "6px 0 16px" }}>
        {order.stages.length} steps from the {order.template || "90"}-day T&A template — pick 120-day for styles with a longer delivery window that need garment dye or heavier print/embroidery. Switching templates resets stage progress on this order. Stages after an approval step stay locked until that approval is marked done, and bulk production stays locked until Pre-Production sign-off is complete.
      </div>
      <div style={{ display: "flex", gap: 2, overflowX: "auto", paddingBottom: 8 }}>
        {order.stages.map((s, i) => {
          const gate = gatingApproval(order.stages, i);
          const bulkLocked = !gate && cuttingIdx !== -1 && i >= cuttingIdx && !bulkGateOpen;
          return <StageNode key={i} stage={s} idx={i} onCycle={cycle} onReason={setReason} onSupplierChange={setSupplier} lockedBy={gate ? gate.name : bulkLocked ? "Pre-Production sign-off" : null} />;
        })}
      </div>
      {flaggedReasons.length > 0 && (
        <div style={{ background: "#FCEBEB", border: "1px solid #F5CFCF", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 8, alignItems: "flex-start", marginTop: 16 }}>
          <AlertTriangle size={16} color="#A32D2D" style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: "#791F1F" }}>{flaggedReasons.join(" · ")}</div>
        </div>
      )}
    </div>
  );

  const costingContent = (
    <CostingTab order={order} onSetTemplate={onSetCostingTemplate} onUpdateRow={onUpdateCostingRow} onAddRow={onAddCostingRow} />
  );

  const preProdContent = (
    <PreProductionTab
      order={order}
      role={role}
      onFieldChange={(docKey, fieldKey, value) => onPreProdField(order.id, docKey, fieldKey, value)}
      onSubmit={(docKey) => onPreProdSubmit(order.id, docKey)}
      onApprove={(docKey) => onPreProdApprove(order.id, docKey, role.label.split(" (")[0])}
    />
  );

  return (
    <div>
      <BackLink onClick={onBack} label="Back" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 13, color: "#8A8D98", marginBottom: 4 }}>PO #{order.id}</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "#1B2130" }}>{order.style}</h1>
          <div style={{ fontSize: 13.5, color: "#565A66", marginTop: 4 }}>
            {order.buyer} · {order.country} · {order.qty.toLocaleString()} pcs · Ship {order.ship}
          </div>
        </div>
        {statusPill(order.status)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "#F7F7F9", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, color: "#8A8D98" }}>Stage progress</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{doneCount}/{order.stages.length} done</div>
        </div>
        <div style={{ background: "#F7F7F9", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, color: "#8A8D98" }}>Risk level</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, textTransform: "capitalize", display: "flex", alignItems: "center" }}>{riskDot(order.risk)}{order.risk}</div>
        </div>
        <div style={{ background: "#F7F7F9", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, color: "#8A8D98" }}>Open delay flags</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{flaggedReasons.length}</div>
        </div>
      </div>

      <OrderHighlightsCard order={order} role={role} />

      {trackerCard}

      <DocumentsPanel order={order} role={role} costingContent={costingContent} preProdContent={preProdContent} onUpdateShippedQty={onUpdateShippedQty} />
    </div>
  );
}

function Dashboard({ orders, onOpenOrder, onNavigate, attendance, roster }) {
  const stats = useMemo(() => {
    const total = orders.length;
    const onTrack = orders.filter(o => o.status === "On Track").length;
    const atRisk = orders.filter(o => o.status === "At Risk").length;
    const delayed = orders.filter(o => o.status === "Delayed").length;
    const shipRisk = orders.filter(o => o.risk === "high" || o.risk === "medium").length;
    const totalQtyYear = orders.reduce((a, o) => a + o.qty, 0);
    return { total, onTrack, atRisk, delayed, shipRisk, totalQtyYear };
  }, [orders]);

  const allStages = useMemo(() => orders.flatMap(o => o.stages), [orders]);

  const stageCounts = useMemo(() => {
    return TA_STAGES.map((s, i) => {
      const count = orders.filter(o => o.stages[i].status === "done" || o.stages[i].status === "in_progress").length;
      return { name: s.name, count };
    });
  }, [orders]);

  const summary = useMemo(() => {
    const completed = allStages.filter(s => s.status === "done").length;
    const inProgress = allStages.filter(s => s.status === "in_progress" && !s.reason).length;
    const atRisk = allStages.filter(s => s.status === "in_progress" && s.reason).length;
    const pending = allStages.filter(s => s.status === "pending").length;
    return { completed, inProgress, atRisk, pending, total: allStages.length };
  }, [allStages]);

  const reasonCounts = useMemo(() => {
    const counts = {};
    allStages.forEach(s => { if (s.reason) counts[s.reason] = (counts[s.reason] || 0) + 1; });
    const arr = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const totalFlags = arr.reduce((a, [, c]) => a + c, 0) || 1;
    return { arr, totalFlags };
  }, [allStages]);

  const departmentCounts = useMemo(() => {
    const depts = Object.keys(ORG_STRUCTURE);
    return depts.map(dept => {
      const count = allStages.filter(s => s.dept === dept && s.reason).length;
      return { dept, count };
    }).filter(d => d.count > 0).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [allStages]);

  const productionPlan = useMemo(() => {
    const totalQty = orders.reduce((a, o) => a + o.qty, 0);
    const avgProgress = orders.reduce((a, o) => a + o.stages.filter(s => s.status === "done").length / o.stages.length, 0) / orders.length;
    const actual = Math.round(totalQty * avgProgress);
    return { totalQty, actual, balance: totalQty - actual, pct: Math.round(avgProgress * 100) };
  }, [orders]);

  const alerts = useMemo(() => {
    const items = [];
    orders.forEach(o => {
      o.stages.forEach(s => {
        if (s.reason) items.push({ text: `${s.reason} — ${o.style} PO #${o.id} (${s.dept})`, sev: o.risk });
      });
    });
    return items.slice(0, 5);
  }, [orders]);

  const topAtRisk = useMemo(() => {
    return orders
      .filter(o => o.status !== "On Track")
      .sort((a, b) => (a.risk === "high" ? 0 : 1) - (b.risk === "high" ? 0 : 1))
      .slice(0, 5)
      .map(o => {
        const flagged = o.stages.find(s => s.reason);
        return { ...o, predictedDelay: `${RISK_DELAY_DAYS[o.risk]} Day${RISK_DELAY_DAYS[o.risk] > 1 ? "s" : ""}`, primaryReason: flagged ? flagged.reason : "—" };
      });
  }, [orders]);

  const riskCounts = useMemo(() => ({
    high: orders.filter(o => o.risk === "high").length,
    medium: orders.filter(o => o.risk === "medium").length,
    low: orders.filter(o => o.risk === "low").length,
  }), [orders]);
  const riskPieData = [
    { name: "High risk", value: riskCounts.high, color: "#D64545" },
    { name: "Medium risk", value: riskCounts.medium, color: "#E2A83B" },
    { name: "Low risk", value: riskCounts.low, color: "#1F9E8D" },
  ].filter(d => d.value > 0);

  const lookFirstText = useMemo(() => {
    if (departmentCounts.length === 0) return null;
    const top = departmentCounts.slice(0, 2).map(d => d.dept);
    const topSum = departmentCounts.slice(0, 2).reduce((a, d) => a + d.count, 0);
    const pct = Math.round((topSum / reasonCounts.totalFlags) * 100);
    return top.length === 2
      ? `${top[0]} and ${top[1]} delays account for ${pct}% of flagged issues this week.`
      : `${top[0]} delays account for ${pct}% of flagged issues this week.`;
  }, [departmentCounts, reasonCounts]);

  const aiInsightText = useMemo(() => {
    if (reasonCounts.arr.length === 0) return null;
    const [topReason, topCount] = reasonCounts.arr[0];
    const pct = Math.round((topCount / reasonCounts.totalFlags) * 100);
    return `${riskCounts.high} order${riskCounts.high === 1 ? "" : "s"} carry high shipment risk — the leading cause is ${topReason} (${pct}%).`;
  }, [reasonCounts, riskCounts]);

  const myTasksPreview = useMemo(() => {
    const items = [];
    orders.forEach(o => {
      o.stages.forEach(s => {
        if (s.status === "in_progress") items.push({ order: o, stage: s });
      });
    });
    return items.slice(0, 4);
  }, [orders]);

  const bottomStats = useMemo(() => {
    const approvalStages = allStages.filter(s => s.name.toLowerCase().includes("approval"));
    const doneApprovals = approvalStages.filter(s => s.status === "done" && !s.reason).length;
    const onTimeApprovalPct = approvalStages.length > 0 ? Math.round((doneApprovals / approvalStages.length) * 100) : 0;

    const floorStages = allStages.filter(s => s.dept === "Cutting" || s.dept === "Production");
    const doneFloor = floorStages.filter(s => s.status === "done").length;
    const capacityUtilPct = floorStages.length > 0 ? Math.round((doneFloor / floorStages.length) * 100) : 0;

    return { onTimeApprovalPct, capacityUtilPct };
  }, [allStages]);

  const cards = [
    { label: "Total orders", value: stats.total, color: "#378ADD", Icon: Package, delta: "+12% vs last month" },
    { label: "On track", value: stats.onTrack, color: "#1F9E8D", Icon: CheckCircle2, delta: `+8% vs last month · ${Math.round(stats.onTrack / stats.total * 100)}%` },
    { label: "At risk", value: stats.atRisk, color: "#E2A83B", Icon: TriangleAlert, delta: `+5% vs last month · ${Math.round(stats.atRisk / stats.total * 100)}%` },
    { label: "Delayed", value: stats.delayed, color: "#D64545", Icon: ArrowDownRight, delta: `-3% vs last month · ${Math.round(stats.delayed / stats.total * 100)}%` },
    { label: "High risk items", value: stats.shipRisk, color: "#7F77DD", Icon: Zap, delta: "+4 vs last month" },
    { label: "Total qty produced (yr)", value: `${stats.totalQtyYear.toLocaleString()} pcs`, color: "#0E9BB0", Icon: Factory, delta: "Sum of all PO / order sheet qty" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" sub="Real-time overview of all orders and operations" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 20 }}>
        {cards.map(c => (
          <Card key={c.label} style={{ padding: "16px 18px" }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: c.color + "22", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <c.Icon size={15} color={c.color} />
            </div>
            <div style={{ fontSize: 12.5, color: "#8A8D98" }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 10.5, color: c.delta.startsWith("-") ? "#D64545" : "#1F9E8D", marginTop: 4, fontWeight: 600 }}>{c.delta}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr 0.9fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <CardHeader title="Orders by department" sub="Delay flags" action="View all" onAction={() => onNavigate("departments")} />
          {departmentCounts.length === 0 ? (
            <div style={{ fontSize: 12, color: "#B0B2BA" }}>No delays flagged yet.</div>
          ) : departmentCounts.map((d, i) => {
            const max = Math.max(...departmentCounts.map(x => x.count), 1);
            const dotColor = ["#D64545", "#E2A83B", "#378ADD", "#1F9E8D", "#7F77DD", "#B0812E"][i % 6];
            return (
              <div key={d.dept} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: dotColor, flexShrink: 0 }} />
                <div style={{ width: 76, fontSize: 11.5, color: "#565A66", flexShrink: 0 }}>{d.dept}</div>
                <div style={{ flex: 1, height: 7, background: "#F0F0F2", borderRadius: 999 }}>
                  <div style={{ height: 7, width: `${(d.count / max) * 100}%`, background: dotColor, borderRadius: 999 }} />
                </div>
                <div style={{ fontSize: 12, color: "#8A8D98", width: 16, textAlign: "right" }}>{d.count}</div>
              </div>
            );
          })}
          {lookFirstText && (
            <div style={{ background: "#F0EFFB", border: "1px solid #DCD8F5", borderRadius: 10, padding: "10px 12px", marginTop: 14 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#534AB7", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 3 }}>Where to look first</div>
              <div style={{ fontSize: 12, color: "#3D3878" }}>{lookFirstText}</div>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Shipment performance" sub="Last 6 months" />
          <div style={{ width: "100%", height: 170 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SHIPMENT_PERFORMANCE} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F2" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8A8D98" }} axisLine={{ stroke: "#F0F0F2" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#8A8D98" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #ECEDF1" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="onTime" name="On-time %" stroke="#534AB7" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="target" name="Target %" stroke="#B0B2BA" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card style={{ background: "#fff" }}>
          <CardHeader title="Risk analysis" action="View insights" onAction={() => onNavigate("insights")} />
          <div style={{ width: "100%", height: 140, position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskPieData.length ? riskPieData : [{ name: "No risk", value: 1, color: "#E7E8ED" }]} dataKey="value" nameKey="name" innerRadius={42} outerRadius={62} paddingAngle={3} stroke="none">
                  {(riskPieData.length ? riskPieData : [{ color: "#E7E8ED" }]).map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1B2130" }}>{stats.total}</div>
              <div style={{ fontSize: 10, color: "#8A8D98" }}>Orders</div>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", justifyContent: "center", marginTop: 4, marginBottom: 12 }}>
            {[["High", "#D64545"], ["Medium", "#E2A83B"], ["Low", "#1F9E8D"]].map(([l, c]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "#8A8D98" }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: c }} /> {l}
              </div>
            ))}
          </div>
          {aiInsightText && (
            <div style={{ background: "#F0EFFB", border: "1px solid #DCD8F5", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#534AB7", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 3 }}>AI Insight</div>
              <div style={{ fontSize: 12, color: "#3D3878" }}>{aiInsightText}</div>
            </div>
          )}
        </Card>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="T&A progress overview (all orders)" sub="21-step workflow from the T&A template" action="Timeline / calendar" onAction={() => onNavigate("calendar")} />
        <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 8 }}>
          {stageCounts.map((s, i) => {
            const Icon = STAGE_ICON_SET[i];
            return (
              <div key={s.name} style={{ flex: "0 0 64px", textAlign: "center" }}>
                <div style={{ width: 30, height: 30, borderRadius: 999, background: "#F0EFFB", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                  <Icon size={14} color="#534AB7" />
                </div>
                <div style={{ fontSize: 9.5, color: "#8A8D98", marginTop: 6, lineHeight: 1.25 }}>{s.name}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1B2130", marginTop: 2 }}>{s.count}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 20, paddingTop: 16, borderTop: "1px solid #F0F0F2" }}>
          <div>
            <div style={{ fontSize: 11.5, color: "#1F9E8D", display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={12} />Completed</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{summary.completed} <span style={{ fontSize: 11, color: "#8A8D98", fontWeight: 400 }}>({Math.round(summary.completed / summary.total * 100)}%)</span></div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: "#378ADD", display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} />In progress</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{summary.inProgress} <span style={{ fontSize: 11, color: "#8A8D98", fontWeight: 400 }}>({Math.round(summary.inProgress / summary.total * 100)}%)</span></div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: "#E2A83B", display: "flex", alignItems: "center", gap: 4 }}><TriangleAlert size={12} />At risk</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{summary.atRisk} <span style={{ fontSize: 11, color: "#8A8D98", fontWeight: 400 }}>({Math.round(summary.atRisk / summary.total * 100)}%)</span></div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: "#D64545", display: "flex", alignItems: "center", gap: 4 }}><CircleAlert size={12} />Pending</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{summary.pending} <span style={{ fontSize: 11, color: "#8A8D98", fontWeight: 400 }}>({Math.round(summary.pending / summary.total * 100)}%)</span></div>
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 0.9fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <CardHeader title="Order timeline (next 7 days)" action="View full calendar" onAction={() => onNavigate("calendar")} />
          <div style={{ display: "grid", gridTemplateColumns: "90px repeat(7, 1fr)", fontSize: 10.5, color: "#8A8D98", marginBottom: 10 }}>
            <div></div>
            {["12 May", "13 May", "14 May", "15 May", "16 May", "17 May", "18 May"].map(d => <div key={d} style={{ textAlign: "center" }}>{d}</div>)}
          </div>
          {orders.slice(0, 5).map((o, i) => {
            const startCol = (i % 4) + 1;
            const span = 2 + (i % 3);
            const color = ["#7F77DD", "#E2A83B", "#1F9E8D", "#D85A30", "#378ADD"][i % 5];
            return (
              <div key={o.id} onClick={() => onOpenOrder(o.id)} style={{ display: "grid", gridTemplateColumns: "90px repeat(7, 1fr)", alignItems: "center", marginBottom: 10, cursor: "pointer" }}>
                <div style={{ fontSize: 11, color: "#565A66" }}>
                  <div style={{ fontWeight: 600 }}>{o.id}</div>
                  <div style={{ color: "#B0B2BA" }}>{o.style}</div>
                </div>
                <div style={{ gridColumn: `${startCol + 1} / span ${span}`, height: 20, background: color + "33", color: color, fontSize: 10, fontWeight: 600, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px" }}>
                  {o.stages[o.activeUpto] ? o.stages[o.activeUpto].name : "Shipment"}
                </div>
              </div>
            );
          })}
        </Card>

        <Card style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <CardHeader title="Production vs plan (today)" action="Reports" onAction={() => onNavigate("reports")} />
          <div style={{ position: "relative", width: 120, height: 120, margin: "8px 0 16px" }}>
            <svg viewBox="0 0 36 36" width="120" height="120">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F0F0F2" strokeWidth="3.5" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#534AB7" strokeWidth="3.5" strokeDasharray={`${productionPlan.pct}, 100`} strokeLinecap="round" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#1B2130" }}>{productionPlan.pct}%</div>
              <div style={{ fontSize: 10.5, color: "#8A8D98" }}>Achieved</div>
            </div>
          </div>
          <div style={{ width: "100%", fontSize: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ color: "#8A8D98" }}>Planned</span><span style={{ fontWeight: 600 }}>{productionPlan.totalQty.toLocaleString()} pcs</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ color: "#8A8D98" }}>Actual</span><span style={{ fontWeight: 600, color: "#1F9E8D" }}>{productionPlan.actual.toLocaleString()} pcs</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#8A8D98" }}>Balance</span><span style={{ fontWeight: 600, color: "#D64545" }}>{productionPlan.balance.toLocaleString()} pcs</span></div>
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <CardHeader title="My tasks" action="Open" onAction={() => onNavigate("tasks")} />
            {myTasksPreview.length === 0 ? (
              <div style={{ fontSize: 12, color: "#B0B2BA" }}>Nothing in progress right now.</div>
            ) : myTasksPreview.map((item, i) => {
              const due = item.stage.reason
                ? { label: "Overdue", bg: "#FCEBEB", fg: "#791F1F" }
                : [{ label: "Due Today", bg: "#FCEBEB", fg: "#791F1F" }, { label: "Tomorrow", bg: "#FAEEDA", fg: "#633806" }, { label: "In 2 Days", bg: "#E6F1FB", fg: "#1D5A8A" }][i % 3];
              return (
                <div key={item.order.id + item.stage.name} onClick={() => onOpenOrder(item.order.id)} style={{ padding: "8px 0", borderBottom: "1px solid #F5F5F7", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#1B2130" }}>{item.stage.name}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, background: due.bg, color: due.fg, borderRadius: 999, padding: "2px 8px", whiteSpace: "nowrap" }}>{due.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#8A8D98", marginTop: 2 }}>{item.order.style} · {item.order.buyer}</div>
                </div>
              );
            })}
          </Card>
          {attendance && (
            <Card>
              <CardHeader title="Attendance today" action="Open" onAction={() => onNavigate("attendance")} />
              {(() => {
                const counts = { present: 0, absent: 0, leave: 0 };
                roster.forEach(s => { counts[attendance[s.name] || "present"]++; });
                return [["Present", counts.present, "#1F9E8D"], ["Absent", counts.absent, "#D64545"], ["On leave", counts.leave, "#E2A83B"]].map(([label, val, color]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #F5F5F7", fontSize: 12 }}>
                    <span style={{ color: "#565A66" }}>{label}</span>
                    <span style={{ fontWeight: 700, color }}>{val}</span>
                  </div>
                ));
              })()}
            </Card>
          )}
        </div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="Critical alerts" action="Notifications" onAction={() => onNavigate("notifications")} />
        {alerts.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#B0B2BA" }}>No active alerts. Flag a delay on an order to see it here.</div>
        ) : alerts.map((a, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 10px", marginBottom: 6, borderRadius: 8, background: "#FAFAFB", borderLeft: `3px solid ${a.sev === "high" ? "#D64545" : "#E2A83B"}` }}>
            <TriangleAlert size={14} color={a.sev === "high" ? "#D64545" : "#E2A83B"} style={{ marginTop: 1, flexShrink: 0 }} />
            <div style={{ fontSize: 12.5, color: "#1B2130" }}>{a.text}</div>
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="Top orders at risk" action="View all orders" onAction={() => onNavigate("orders")} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 0.8fr 0.8fr 0.9fr 0.9fr 0.7fr 0.9fr 1.2fr", fontSize: 11, color: "#8A8D98", padding: "0 4px 8px", borderBottom: "1px solid #F0F0F2" }}>
          <div>Order / Style</div><div>Buyer</div><div>Ship date</div><div>Status</div><div>Risk</div><div>Predicted delay</div><div></div><div>Primary reason</div>
        </div>
        {topAtRisk.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#B0B2BA", padding: "12px 4px" }}>No at-risk or delayed orders right now.</div>
        ) : topAtRisk.map(o => (
          <div
            key={o.id}
            onClick={() => onOpenOrder(o.id)}
            style={{ display: "grid", gridTemplateColumns: "1fr 0.8fr 0.8fr 0.9fr 0.9fr 0.7fr 0.9fr 1.2fr", alignItems: "center", fontSize: 12.5, padding: "10px 4px", borderBottom: "1px solid #F5F5F7", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = "#FAFAFB"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#8A8D98" }}>{o.id}</div>
              <div style={{ fontWeight: 600, color: "#1B2130" }}>{o.style}</div>
            </div>
            <div>{o.buyer}</div>
            <div>{o.ship}</div>
            <div>{statusPill(o.status)}</div>
            <div style={{ display: "flex", alignItems: "center", textTransform: "capitalize" }}>{riskDot(o.risk)}{o.risk}</div>
            <div style={{ color: "#D64545", fontWeight: 600 }}>{o.predictedDelay}</div>
            <div></div>
            <div style={{ color: "#565A66" }}>{o.primaryReason}</div>
          </div>
        ))}
      </Card>

      <Card style={{ padding: "18px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
          {[
            ["Avg Order Lead Time", "87 days"],
            ["Avg Sampling Time", "24 days"],
            ["On-Time Approval %", `${bottomStats.onTimeApprovalPct}%`],
            ["Quality Pass Rate", "93.4%"],
            ["Production Efficiency", `${productionPlan.pct}%`],
            ["Capacity Utilization", `${bottomStats.capacityUtilPct}%`],
          ].map(([label, val]) => (
            <div key={label}>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#1B2130" }}>{val}</div>
              <div style={{ fontSize: 10.5, color: "#8A8D98", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function OrdersPage({ orders, onOpenOrder }) {
  return (
    <div>
      <PageHeader title="Orders" sub={`${orders.length} orders across all buyers and factories`} />
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 0.9fr 0.9fr 0.8fr 0.9fr 0.7fr 0.9fr", fontSize: 11.5, color: "#8A8D98", padding: "0 4px 8px", borderBottom: "1px solid #F0F0F2" }}>
          <div>PO / Style</div><div>Buyer</div><div>Country</div><div>Qty</div><div>Ship date</div><div>Risk</div><div>Status</div>
        </div>
        {orders.map(o => (
          <div
            key={o.id}
            onClick={() => onOpenOrder(o.id)}
            style={{ display: "grid", gridTemplateColumns: "1fr 0.9fr 0.9fr 0.8fr 0.9fr 0.7fr 0.9fr", alignItems: "center", fontSize: 13, padding: "12px 4px", borderBottom: "1px solid #F5F5F7", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = "#FAFAFB"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#8A8D98" }}>{o.id}</div>
              <div style={{ fontWeight: 600, color: "#1B2130" }}>{o.style}</div>
            </div>
            <div>{o.buyer}</div>
            <div>{o.country}</div>
            <div>{o.qty.toLocaleString()}</div>
            <div>{o.ship}</div>
            <div style={{ display: "flex", alignItems: "center", textTransform: "capitalize" }}>{riskDot(o.risk)}{o.risk}</div>
            <div>{statusPill(o.status)}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function REASON_ORDER_LIST() { return REASONS; }

function groupRows(rows) {
  const buckets = {};
  REASONS.forEach(r => { buckets[`Delayed — ${r}`] = []; });
  buckets["Awaiting action"] = [];
  buckets["Not started yet"] = [];
  buckets["Completed"] = [];
  rows.forEach(r => {
    if (r.stage.reason) buckets[`Delayed — ${r.stage.reason}`].push(r);
    else if (r.stage.status === "in_progress") buckets["Awaiting action"].push(r);
    else if (r.stage.status === "pending") buckets["Not started yet"].push(r);
    else buckets["Completed"].push(r);
  });
  return Object.entries(buckets).filter(([, v]) => v.length > 0);
}

function groupColor(label) {
  if (label.startsWith("Delayed")) return "#D64545";
  if (label === "Awaiting action") return "#E2A83B";
  if (label === "Not started yet") return "#8A8D98";
  return "#1F9E8D";
}

function GroupedTaskList({ rows, onOpenOrder, emptyText }) {
  const groups = useMemo(() => groupRows(rows), [rows]);
  const [openMap, setOpenMap] = useState({});
  if (rows.length === 0) {
    return <div style={{ fontSize: 12.5, color: "#B0B2BA", padding: "12px 4px" }}>{emptyText}</div>;
  }
  const isOpen = (label) => (openMap[label] !== undefined ? openMap[label] : label !== "Completed");
  const toggle = (label) => setOpenMap(m => ({ ...m, [label]: !isOpen(label) }));

  return (
    <div>
      {groups.map(([label, groupItems]) => (
        <div key={label} style={{ marginBottom: 10 }}>
          <div
            onClick={() => toggle(label)}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "9px 10px", background: "#FAFAFB", borderRadius: 8 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: groupColor(label), flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1B2130" }}>{label}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11.5, color: "#8A8D98", background: "#EFEFF2", borderRadius: 999, padding: "1px 8px" }}>{groupItems.length}</span>
              <ChevronDown size={13} style={{ transform: isOpen(label) ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform .15s" }} />
            </div>
          </div>
          {isOpen(label) && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.3fr 0.9fr 0.9fr", fontSize: 10.5, color: "#B0B2BA", padding: "8px 10px 4px" }}>
                <div>Order / Style</div><div>Task / stage</div><div>Due</div><div>Status</div>
              </div>
              {groupItems.map(({ order, stage, stageIdx }) => (
                <div
                  key={order.id + stageIdx}
                  onClick={() => onOpenOrder(order.id)}
                  style={{ display: "grid", gridTemplateColumns: "1.1fr 1.3fr 0.9fr 0.9fr", alignItems: "center", fontSize: 12.5, padding: "9px 10px", borderBottom: "1px solid #F5F5F7", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#FAFAFB"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div>
                    <div style={{ fontFamily: "monospace", fontSize: 11, color: "#8A8D98" }}>{order.id}</div>
                    <div style={{ fontWeight: 600, color: "#1B2130" }}>{order.style}</div>
                  </div>
                  <div>{stage.name} <span style={{ color: "#B0B2BA", fontSize: 10.5 }}>· {stage.dept}</span></div>
                  <div>{stage.planned}</div>
                  <div>{statusPill(stage.status)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MyTasksPage({ orders, role, onOpenOrder }) {
  const rows = useMemo(() => collectTasks(orders, role.dept).filter(r => r.stage.status !== "done"), [orders, role]);

  return (
    <div>
      <PageHeader title="My tasks" sub={`Showing open tasks for ${role.label} — ${role.dept}, grouped by why they're stuck`} />
      <Card>
        <CardHeader title={`${role.dept} — active tasks`} />
        <GroupedTaskList rows={rows} onOpenOrder={onOpenOrder} emptyText="No open tasks for this role right now." />
      </Card>
    </div>
  );
}

function CalendarPage({ orders, onOpenOrder }) {
  return (
    <div>
      <PageHeader title="Timeline / calendar" sub="Full 21-step T&A schedule across all active orders" />
      <Card>
        {orders.map(o => (
          <div key={o.id} style={{ marginBottom: 20 }}>
            <div onClick={() => onOpenOrder(o.id)} style={{ fontSize: 12.5, fontWeight: 600, color: "#1B2130", marginBottom: 8, cursor: "pointer" }}>
              {o.id} · {o.style} <span style={{ color: "#8A8D98", fontWeight: 400 }}>({o.buyer}, ship {o.ship})</span>
            </div>
            <div style={{ display: "flex", gap: 2, overflowX: "auto" }}>
              {o.stages.map((s, i) => (
                <div
                  key={i}
                  onClick={() => onOpenOrder(o.id)}
                  title={`${s.name} — ${s.status} (${s.dept})`}
                  style={{
                    flex: "0 0 32px", height: 22, borderRadius: 5, cursor: "pointer",
                    background: s.status === "done" ? "#1F9E8D" : s.status === "in_progress" ? (s.reason ? "#D64545" : "#E2A83B") : "#EDEEF1"
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function ApprovalsPage({ orders, onOpenOrder }) {
  const rows = useMemo(() => collectTasks(orders, null).filter(r => r.stage.name.toLowerCase().includes("approval") || r.stage.name === "Tech Pack Received"), [orders]);
  const pendingCount = rows.filter(r => r.stage.status !== "done").length;
  return (
    <div>
      <PageHeader title="Approvals" sub={`Buyer approval checkpoints — Fit, Size Set, and PP — plus tech pack receipt. ${pendingCount} not yet approved.`} />
      <Card>
        <GroupedTaskList rows={rows} onOpenOrder={onOpenOrder} emptyText="No approval items right now." />
      </Card>
    </div>
  );
}

function ProductionPage({ orders, onOpenOrder }) {
  const rows = useMemo(() => collectTasks(orders, null).filter(r => ["Cutting", "Production"].includes(r.dept)), [orders]);
  return (
    <div>
      <PageHeader title="Production" sub="Cutting room and production floor status across all orders, grouped by delay cause" />
      <Card>
        <GroupedTaskList rows={rows} onOpenOrder={onOpenOrder} emptyText="No production-stage tasks right now." />
      </Card>
    </div>
  );
}

function QualityPage({ orders, onOpenOrder }) {
  const rows = useMemo(() => collectTasks(orders, "Quality"), [orders]);
  const reworkCount = rows.filter(r => r.stage.reason === "Quality rework").length;
  return (
    <div>
      <PageHeader title="Quality" sub="Fabric inspection and final inspection checkpoints" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Checkpoints tracked</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{rows.length}</div></Card>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Flagged for rework</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#D64545" }}>{reworkCount}</div></Card>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>First pass rate</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#1F9E8D" }}>93.4%</div></Card>
      </div>
      <Card>
        <GroupedTaskList rows={rows} onOpenOrder={onOpenOrder} emptyText="No quality checkpoints yet." />
      </Card>
    </div>
  );
}

function ReportsPage({ orders }) {
  const total = orders.length;
  const onTrack = orders.filter(o => o.status === "On Track").length;
  const totalQty = orders.reduce((a, o) => a + o.qty, 0);
  const rows = [
    ["Total orders", total],
    ["On-time rate", `${Math.round(onTrack / total * 100)}%`],
    ["Total order quantity", totalQty.toLocaleString() + " pcs"],
    ["Avg order lead time", "87 days"],
    ["Avg sampling time", "24 days"],
    ["Quality pass rate", "93.6%"],
  ];

  const seasonRows = useMemo(() => {
    const groups = {};
    orders.forEach(o => {
      const key = `${o.buyer}||${o.season || "—"}`;
      if (!groups[key]) groups[key] = { buyer: o.buyer, season: o.season || "—", ordered: 0, shipped: 0 };
      groups[key].ordered += o.qty;
      groups[key].shipped += o.shippedQty || 0;
    });
    return Object.values(groups).map(g => ({
      ...g,
      diff: g.shipped - g.ordered,
      pctDiff: g.ordered > 0 ? ((g.shipped - g.ordered) / g.ordered) * 100 : 0,
    }));
  }, [orders]);

  return (
    <div>
      <PageHeader title="Reports" sub="Summary metrics — full report builder is next on the roadmap" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        {rows.map(([label, val]) => (
          <Card key={label} style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 12, color: "#8A8D98" }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>{val}</div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Shipped qty per season" sub="Ordered qty (from the PO) vs qty shipped (entered at Final OCR)" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 0.8fr 1fr 1fr 0.9fr 0.9fr", fontSize: 11, color: "#8A8D98", padding: "0 4px 8px", borderBottom: "1px solid #F0F0F2" }}>
          <div>Buyer</div><div>Season</div><div>Ordered Qty</div><div>Shipped Qty</div><div>Difference</div><div>% Diff</div>
        </div>
        {seasonRows.map(r => (
          <div key={r.buyer + r.season} style={{ display: "grid", gridTemplateColumns: "1fr 0.8fr 1fr 1fr 0.9fr 0.9fr", alignItems: "center", fontSize: 12.5, padding: "9px 4px", borderBottom: "1px solid #F5F5F7" }}>
            <div style={{ fontWeight: 600, color: "#1B2130" }}>{r.buyer}</div>
            <div>{r.season}</div>
            <div>{r.ordered.toLocaleString()}</div>
            <div>{r.shipped.toLocaleString()}</div>
            <div style={{ color: r.diff < 0 ? "#D64545" : "#1F9E8D", fontWeight: 600 }}>{r.diff > 0 ? "+" : ""}{r.diff.toLocaleString()}</div>
            <div style={{ color: r.pctDiff < 0 ? "#D64545" : "#1F9E8D", fontWeight: 600 }}>{r.pctDiff > 0 ? "+" : ""}{r.pctDiff.toFixed(2)}%</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function InsightsPage({ orders }) {
  const allStages = orders.flatMap(o => o.stages);
  const counts = {};
  allStages.forEach(s => { if (s.reason) counts[s.reason] = (counts[s.reason] || 0) + 1; });
  const arr = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = arr.reduce((a, [, c]) => a + c, 0) || 1;
  return (
    <div>
      <PageHeader title="All insights" sub="Root-cause breakdown across every flagged delay" />
      <Card>
        <CardHeader title="Delay reasons (all orders)" />
        {arr.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#B0B2BA" }}>No delays flagged yet.</div>
        ) : arr.map(([reason, count]) => (
          <div key={reason} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
              <span style={{ color: "#1B2130" }}>{reason}</span>
              <span style={{ color: "#8A8D98" }}>{count} ({Math.round(count / total * 100)}%)</span>
            </div>
            <div style={{ height: 6, background: "#F0F0F2", borderRadius: 999 }}>
              <div style={{ height: 6, width: `${count / total * 100}%`, background: "#D64545", borderRadius: 999 }} />
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function SupplierPerformancePage({ orders, onOpenOrder }) {
  const vapStages = [];
  orders.forEach(o => {
    o.stages.forEach((s, idx) => {
      if (s.dept === "VAP" && s.supplier) vapStages.push({ order: o, stage: s, idx });
    });
  });

  const bySupplier = {};
  vapStages.forEach(({ order, stage }) => {
    if (!bySupplier[stage.supplier]) bySupplier[stage.supplier] = { jobs: 0, onTime: 0, delayed: 0, qualityIssues: 0, orders: [] };
    const b = bySupplier[stage.supplier];
    b.jobs += 1;
    if (stage.reason) {
      b.delayed += 1;
      if (stage.reason === "Quality rework") b.qualityIssues += 1;
    } else {
      b.onTime += 1;
    }
    b.orders.push(order);
  });

  const rows = Object.entries(bySupplier).map(([name, b]) => ({
    name, ...b, onTimePct: b.jobs > 0 ? Math.round((b.onTime / b.jobs) * 100) : 0,
  })).sort((a, b) => b.onTimePct - a.onTimePct);

  const scoreColor = (pct) => pct >= 90 ? "#1F9E8D" : pct >= 75 ? "#E2A83B" : "#D64545";

  return (
    <div>
      <PageHeader title="Supplier performance" sub="Printing, embroidery, and dye jobs — tracked per supplier since orders can go to different vendors" />
      {rows.length === 0 ? (
        <Card><div style={{ fontSize: 12.5, color: "#B0B2BA" }}>No VAP jobs have a supplier assigned yet — set one on the T&A tracker's Printing/Embroidery or Garment Dye stage.</div></Card>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${rows.length}, 1fr)`, gap: 12, marginBottom: 16 }}>
            {rows.map(r => (
              <Card key={r.name} style={{ padding: "16px 18px" }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1B2130", marginBottom: 8 }}>{r.name}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: scoreColor(r.onTimePct) }}>{r.onTimePct}%</div>
                <div style={{ fontSize: 10.5, color: "#8A8D98", marginTop: 2 }}>on-time rate</div>
              </Card>
            ))}
          </div>

          <Card>
            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr 0.7fr 0.7fr 0.8fr 1fr", fontSize: 11, color: "#8A8D98", padding: "0 4px 8px", borderBottom: "1px solid #F0F0F2" }}>
              <div>Supplier</div><div>Jobs</div><div>On-time</div><div>Delayed</div><div>Quality issues</div><div>Orders</div>
            </div>
            {rows.map(r => (
              <div key={r.name} style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr 0.7fr 0.7fr 0.8fr 1fr", alignItems: "center", fontSize: 12.5, padding: "10px 4px", borderBottom: "1px solid #F5F5F7" }}>
                <div style={{ fontWeight: 600, color: "#1B2130" }}>{r.name}</div>
                <div>{r.jobs}</div>
                <div style={{ color: "#1F9E8D", fontWeight: 600 }}>{r.onTime}</div>
                <div style={{ color: r.delayed > 0 ? "#D64545" : "#8A8D98", fontWeight: r.delayed > 0 ? 600 : 400 }}>{r.delayed}</div>
                <div style={{ color: r.qualityIssues > 0 ? "#D64545" : "#8A8D98" }}>{r.qualityIssues}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {r.orders.map(o => (
                    <span key={o.id} onClick={() => onOpenOrder(o.id)} style={{ fontFamily: "monospace", fontSize: 10.5, color: "#378ADD", cursor: "pointer" }}>{o.id}</span>
                  ))}
                </div>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}

function NotificationsPage({ orders }) {
  const alerts = [];
  orders.forEach(o => o.stages.forEach(s => { if (s.reason) alerts.push({ text: `${s.reason} — ${o.style} PO #${o.id} (${s.dept})`, sev: o.risk }); }));
  return (
    <div>
      <PageHeader title="Notifications" sub={`${alerts.length} active alerts`} />
      <Card>
        {alerts.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#B0B2BA" }}>Nothing to flag right now.</div>
        ) : alerts.map((a, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderBottom: i < alerts.length - 1 ? "1px solid #F5F5F7" : "none" }}>
            <TriangleAlert size={14} color={a.sev === "high" ? "#D64545" : "#E2A83B"} style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: "#1B2130" }}>{a.text}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function DepartmentsPage({ orders, onOpenDept, orgStructure }) {
  const stageLinkedDepts = useMemo(() => new Set(TA_STAGES.map(s => s.dept)), []);
  const coveredCount = stageLinkedDepts.size;
  const deptNames = Object.keys(orgStructure);

  return (
    <div>
      <PageHeader title="Departments" sub="Full org structure from your charts — every T&A stage below is owned by exactly one department" />
      <Card style={{ marginBottom: 16, background: "#F0F7F4", border: "1px solid #CDEBDF" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CheckCircle2 size={18} color="#1F9E8D" />
          <div style={{ fontSize: 13, color: "#085041" }}>
            <strong>{TA_STAGES.length}/{TA_STAGES.length}</strong> T&A steps have an owning department, across <strong>{coveredCount}</strong> departments directly in the workflow and <strong>{deptNames.length - coveredCount}</strong> supporting departments (CAD, Warehouse, Testing, Store, IoT, Program, Planning) that feed those steps but aren't a named stage owner yet.
          </div>
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
        {deptNames.map(deptName => {
          const roles = orgStructure[deptName];
          const taskCount = stageLinkedDepts.has(deptName) ? collectTasks(orders, deptName).filter(r => r.stage.status !== "done").length : null;
          const Icon = DEPT_ICONS[deptName] || Users;
          const linkedStages = TA_STAGES.filter(s => s.dept === deptName).map(s => s.name);
          return (
            <Card key={deptName} style={{ cursor: "pointer" }}>
              <div onClick={() => onOpenDept(deptName)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: "#F0EFFB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={13} color="#534AB7" />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1B2130" }}>{deptName}</div>
                  </div>
                  {taskCount !== null && <span style={{ fontSize: 11, color: "#8A8D98" }}>{taskCount} open tasks</span>}
                </div>
                <div style={{ fontSize: 11, color: "#8A8D98", marginBottom: 6 }}>{roles.length} roles · {linkedStages.length > 0 ? `owns: ${linkedStages.join(", ")}` : "support function"}</div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function DepartmentDetail({ deptName, orders, onBack, onOpenOrder, orgStructure }) {
  const roles = orgStructure[deptName];
  const rows = collectTasks(orders, deptName);
  const linkedStages = TA_STAGES.filter(s => s.dept === deptName);
  return (
    <div>
      <BackLink onClick={onBack} label="Back to departments" />
      <PageHeader title={deptName} sub={linkedStages.length > 0 ? `Owns T&A step${linkedStages.length > 1 ? "s" : ""}: ${linkedStages.map(s => s.name).join(", ")}` : "Support department — not yet a T&A step owner"} />
      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="Reporting structure & responsibilities" />
        <OrgChain roles={roles} />
      </Card>
      <Card>
        <CardHeader title="Linked tasks" />
        {linkedStages.length > 0 ? (
          <TaskTable rows={rows} onOpenOrder={onOpenOrder} emptyText="No tasks tracked for this department yet." />
        ) : (
          <div style={{ fontSize: 12.5, color: "#B0B2BA" }}>This department isn't a T&A stage owner in the current template, so no live tasks show here yet.</div>
        )}
      </Card>
    </div>
  );
}

const ROLE_OPTIONS = [
  { label: "Merchandiser (Arasinth Raja)", dept: "Merchandising", fullAccess: true },
  { label: "Fabric purchase (Selva Kumar)", dept: "Purchase – Fabric", fullAccess: false },
  { label: "Trims purchase (Shankar)", dept: "Purchase – Trims", fullAccess: false },
  { label: "Sample (Viswa)", dept: "Sample", fullAccess: true },
  { label: "Quality (Sezhiyan)", dept: "Quality", fullAccess: true },
  { label: "Cutting (Durai)", dept: "Cutting", fullAccess: true },
  { label: "Production (Praveen Kumar)", dept: "Production", fullAccess: true },
  { label: "Finishing (Gopal)", dept: "Finishing", fullAccess: true },
  { label: "Logistics & documentation (Srinivasan)", dept: "Logistics & Documentation", fullAccess: false },
  { label: "Compliance officer", dept: "Compliance & Certification", fullAccess: false },
  { label: "Finance Team", dept: "Finance", fullAccess: false },
  { label: "Managing Director (MD)", dept: "Executive", fullAccess: true },
];

function buildStaffList() {
  const staff = [];
  const seen = new Set();
  Object.entries(ORG_STRUCTURE).forEach(([dept, roles]) => {
    roles.forEach(r => {
      if (!r.name || r.name === "—") return;
      r.name.split(/&|,/).map(n => n.trim()).forEach(name => {
        if (seen.has(name)) return;
        seen.add(name);
        staff.push({ name, title: r.title, dept });
      });
    });
  });
  return staff;
}
const STAFF_LIST = buildStaffList();

function seedAttendance() {
  const rec = {};
  STAFF_LIST.forEach((s, i) => { rec[s.name] = i % 11 === 0 ? "absent" : i % 13 === 0 ? "leave" : "present"; });
  return rec;
}

const INITIAL_LEAVE_REQUESTS = [
  { id: 1, name: STAFF_LIST[2] ? STAFF_LIST[2].name : "Staff", dept: STAFF_LIST[2] ? STAFF_LIST[2].dept : "", from: "26 May", to: "27 May", reason: "Personal", status: "pending" },
  { id: 2, name: STAFF_LIST[8] ? STAFF_LIST[8].name : "Staff", dept: STAFF_LIST[8] ? STAFF_LIST[8].dept : "", from: "29 May", to: "31 May", reason: "Family function", status: "pending" },
  { id: 3, name: STAFF_LIST[15] ? STAFF_LIST[15].name : "Staff", dept: STAFF_LIST[15] ? STAFF_LIST[15].dept : "", from: "20 May", to: "20 May", reason: "Medical", status: "approved" },
];

const ATTENDANCE_STATUS_STYLE = {
  present: { bg: "#E1F5EE", fg: "#085041", label: "Present" },
  absent: { bg: "#FCEBEB", fg: "#791F1F", label: "Absent" },
  leave: { bg: "#FAEEDA", fg: "#633806", label: "On leave" },
};

const CERT_STATUS_STYLE = {
  not_applied: { bg: "#F0F0F2", fg: "#565A66", label: "Not applied" },
  applied: { bg: "#FAEEDA", fg: "#633806", label: "Applied — pending" },
  approved: { bg: "#E1F5EE", fg: "#085041", label: "Approved" },
};
const INITIAL_CERTIFICATIONS = [
  { key: "tc", name: "Transaction Certificate (TC)", note: "Per-shipment certificate under the GOTS/OCS chain of custody", status: "applied", file: null },
  { key: "gots", name: "GOTS", note: "Global Organic Textile Standard — annual facility certification", status: "approved", file: null },
  { key: "ocs", name: "OCS", note: "Organic Content Standard — annual facility certification", status: "not_applied", file: null },
];

function CompliancePage({ certifications, onCycle, onUpload }) {
  return (
    <div>
      <PageHeader title="Compliance & Certification" sub="TC, GOTS, and OCS applications owned by the Compliance & Certification team — click a status to update it, and attach the certificate once it's obtained" />
      <Card>
        {certifications.map(c => {
          const st = CERT_STATUS_STYLE[c.status];
          const inputId = `cert-upload-${c.key}`;
          return (
            <div key={c.key} style={{ padding: "14px 4px", borderBottom: "1px solid #F5F5F7" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1B2130" }}>{c.name}</div>
                  <div style={{ fontSize: 11.5, color: "#8A8D98", marginTop: 2 }}>{c.note}</div>
                </div>
                <span
                  onClick={() => onCycle(c.key)}
                  style={{ cursor: "pointer", background: st.bg, color: st.fg, fontSize: 11.5, fontWeight: 600, padding: "5px 12px", borderRadius: 999, whiteSpace: "nowrap" }}
                >
                  {st.label}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, background: c.file ? "#F7FBF9" : "#FAFAFB", border: `1px solid ${c.file ? "#DCEFE6" : "#EFEFF2"}`, borderRadius: 8, padding: "8px 12px" }}>
                <div style={{ fontSize: 11.5, color: c.file ? "#1F9E8D" : "#B0B2BA", display: "flex", alignItems: "center", gap: 6 }}>
                  {c.file ? <><CheckCircle2 size={13} /> {c.file} attached</> : "Certificate not uploaded yet"}
                </div>
                <div>
                  <input
                    type="file"
                    id={inputId}
                    style={{ display: "none" }}
                    onChange={e => { const f = e.target.files[0]; if (f) onUpload(c.key, f.name); }}
                  />
                  <label
                    htmlFor={inputId}
                    style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: "#534AB7", background: "#F0EFFB", border: "1px solid #D9D6F5", borderRadius: 7, padding: "5px 10px", cursor: "pointer" }}
                  >
                    <Upload size={11} /> {c.file ? "Replace" : "Upload certificate"}
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function AttendancePage({ roster, attendance, onCycle, leaveRequests, onApprove, onReject, onAddStaff, onRemoveStaff }) {
  const [form, setForm] = useState({ name: "", title: "", dept: Object.keys(ORG_STRUCTURE)[0] });
  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const counts = { present: 0, absent: 0, leave: 0 };
  roster.forEach(s => { counts[attendance[s.name] || "present"]++; });
  const pending = leaveRequests.filter(l => l.status === "pending");

  function submitAdd() {
    if (!form.name.trim()) return;
    onAddStaff({ name: form.name.trim(), title: form.title.trim() || "Staff", dept: form.dept });
    setForm({ name: "", title: "", dept: form.dept });
  }

  return (
    <div>
      <PageHeader title="Attendance & Leave" sub="Click a staff member's status to cycle Present → Absent → On leave. Add new joiners or remove people who've left below." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Present today</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#1F9E8D" }}>{counts.present}</div></Card>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Absent today</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#D64545" }}>{counts.absent}</div></Card>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>On leave today</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#E2A83B" }}>{counts.leave}</div></Card>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="Leave requests" sub={`${pending.length} pending approval`} />
        {leaveRequests.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#B0B2BA" }}>No leave requests.</div>
        ) : leaveRequests.map(l => (
          <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 4px", borderBottom: "1px solid #F5F5F7" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1B2130" }}>{l.name} <span style={{ color: "#8A8D98", fontWeight: 400 }}>· {l.dept}</span></div>
              <div style={{ fontSize: 11.5, color: "#8A8D98" }}>{l.from} – {l.to} · {l.reason}</div>
            </div>
            {l.status === "pending" ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => onApprove(l.id)} style={{ fontSize: 12, fontWeight: 600, color: "#085041", background: "#E1F5EE", border: "none", borderRadius: 7, padding: "6px 12px", cursor: "pointer" }}>Approve</button>
                <button onClick={() => onReject(l.id)} style={{ fontSize: 12, fontWeight: 600, color: "#791F1F", background: "#FCEBEB", border: "none", borderRadius: 7, padding: "6px 12px", cursor: "pointer" }}>Reject</button>
              </div>
            ) : (
              <span style={{ fontSize: 12, fontWeight: 600, color: l.status === "approved" ? "#085041" : "#791F1F" }}>{l.status === "approved" ? "Approved" : "Rejected"}</span>
            )}
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="Add a joiner" sub="Add anyone new who's joined the team" />
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1.2fr auto", gap: 8, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Name</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Title</label>
            <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Junior" style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Department</label>
            <select value={form.dept} onChange={e => set("dept", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }}>
              {Object.keys(ORG_STRUCTURE).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button onClick={submitAdd} style={{ fontSize: 12.5, fontWeight: 600, color: "#fff", background: "#1F9E8D", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>Add</button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Today's roster" sub="Click a status pill to update it — remove anyone who's left the company" />
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 0.8fr 0.5fr", fontSize: 11, color: "#8A8D98", padding: "0 4px 8px", borderBottom: "1px solid #F0F0F2" }}>
          <div>Name</div><div>Title</div><div>Department</div><div>Status</div><div></div>
        </div>
        {roster.map(s => {
          const status = attendance[s.name] || "present";
          const st = ATTENDANCE_STATUS_STYLE[status];
          return (
            <div key={s.name} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 0.8fr 0.5fr", alignItems: "center", fontSize: 12.5, padding: "8px 4px", borderBottom: "1px solid #F7F7F9" }}>
              <div style={{ fontWeight: 600, color: "#1B2130" }}>{s.name}</div>
              <div style={{ color: "#8A8D98" }}>{s.title}</div>
              <div style={{ color: "#8A8D98" }}>{s.dept}</div>
              <div>
                <span
                  onClick={() => onCycle(s.name)}
                  style={{ cursor: "pointer", background: st.bg, color: st.fg, fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 999 }}
                >
                  {st.label}
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <button
                  onClick={() => onRemoveStaff(s.name)}
                  title="Remove — no longer with the company"
                  style={{ fontSize: 11, color: "#B0812E", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function MiniDonut({ data, size = 96, centerLabel, centerSub }) {
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <ResponsiveContainer width={size} height={size}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={size * 0.32} outerRadius={size * 0.48} paddingAngle={2} stroke="none">
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {centerLabel && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ fontSize: size > 90 ? 18 : 14, fontWeight: 700, color: "#fff" }}>{centerLabel}</div>
          {centerSub && <div style={{ fontSize: 9, color: "#9498A8" }}>{centerSub}</div>}
        </div>
      )}
    </div>
  );
}

function DarkCard({ children, style }) {
  return <div style={{ background: "#171E33", border: "1px solid #262E48", borderRadius: 12, padding: "16px 18px", ...style }}>{children}</div>;
}
function DarkCardHeader({ title, sub, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: 0.4 }}>{title}</div>
        {sub && <div style={{ fontSize: 10.5, color: "#8489A0", marginTop: 2 }}>{sub}</div>}
      </div>
      {action && <div style={{ fontSize: 11, color: "#7C8BFF", cursor: "pointer" }}>{action}</div>}
    </div>
  );
}

const INITIAL_FINANCIALS = { revenue: 4415000, cogs: 3610000, ebitda: 2137000, stockValue: 2548000, cashFlow: 1236000, complianceScore: 96 };

function FinanceEntryPage({ orders, financials, onUpdate, onUpdateOrderCost }) {
  const totals = orders.reduce((a, o) => ({
    planned: a.planned + (o.plannedCost || 0),
    actual: a.actual + (o.actualCost || 0),
  }), { planned: 0, actual: 0 });
  const totalVariance = totals.actual - totals.planned;
  const totalVariancePct = totals.planned > 0 ? (totalVariance / totals.planned) * 100 : 0;

  useEffect(() => {
    if (financials.cogs !== totals.actual) onUpdate("cogs", totals.actual);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totals.actual]);

  const grossProfit = financials.revenue - financials.cogs;
  const grossMargin = financials.revenue > 0 ? Math.round((grossProfit / financials.revenue) * 1000) / 10 : 0;

  return (
    <div>
      <PageHeader title="Finance data" sub="Cost planned vs. cost obtained per order — Total COGS on the Executive Dashboard now comes straight from the actual costs below" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Total planned cost</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>${totals.planned.toLocaleString()}</div></Card>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Total cost obtained (actual)</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>${totals.actual.toLocaleString()}</div></Card>
        <Card style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 12, color: "#8A8D98" }}>Total variance</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: totalVariance > 0 ? "#D64545" : "#1F9E8D" }}>
            {totalVariance > 0 ? "+" : ""}{totalVariance.toLocaleString()} <span style={{ fontSize: 13 }}>({totalVariancePct > 0 ? "+" : ""}{totalVariancePct.toFixed(1)}%)</span>
          </div>
        </Card>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="Cost by order" sub="Planned cost is set when the order is costed; actual cost is updated as spend comes in through the season" />
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr 0.9fr", fontSize: 11, color: "#8A8D98", padding: "0 4px 8px", borderBottom: "1px solid #F0F0F2" }}>
          <div>Order / Style</div><div>Buyer</div><div>Planned cost</div><div>Cost obtained</div><div>Variance</div>
        </div>
        {orders.map(o => {
          const variance = (o.actualCost || 0) - (o.plannedCost || 0);
          const variancePct = o.plannedCost > 0 ? (variance / o.plannedCost) * 100 : 0;
          return (
            <div key={o.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr 0.9fr", alignItems: "center", fontSize: 12.5, padding: "8px 4px", borderBottom: "1px solid #F5F5F7" }}>
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: "#8A8D98" }}>{o.id}</div>
                <div style={{ fontWeight: 600, color: "#1B2130" }}>{o.style}</div>
              </div>
              <div>{o.buyer}</div>
              <div>
                <input
                  type="number"
                  value={o.plannedCost || 0}
                  onChange={e => onUpdateOrderCost(o.id, "plannedCost", Number(e.target.value))}
                  style={{ width: 92, fontSize: 12, padding: "5px 7px", borderRadius: 6, border: "1px solid #E7E8ED" }}
                />
              </div>
              <div>
                <input
                  type="number"
                  value={o.actualCost || 0}
                  onChange={e => onUpdateOrderCost(o.id, "actualCost", Number(e.target.value))}
                  style={{ width: 92, fontSize: 12, padding: "5px 7px", borderRadius: 6, border: "1px solid #E7E8ED" }}
                />
              </div>
              <div style={{ fontWeight: 600, color: variance > 0 ? "#D64545" : variance < 0 ? "#1F9E8D" : "#8A8D98" }}>
                {variance > 0 ? "+" : ""}{variance.toLocaleString()}{o.plannedCost > 0 ? ` (${variancePct > 0 ? "+" : ""}${variancePct.toFixed(1)}%)` : ""}
              </div>
            </div>
          );
        })}
      </Card>

      <Card style={{ maxWidth: 460 }}>
        <CardHeader title="Computed" />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}><span style={{ color: "#8A8D98" }}>Gross profit</span><span style={{ fontWeight: 700 }}>${grossProfit.toLocaleString()}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: "#8A8D98" }}>Gross margin</span><span style={{ fontWeight: 700 }}>{grossMargin}%</span></div>
      </Card>
    </div>
  );
}

const SEASON_OPTIONS = ["AW26", "SS26", "AW27", "SS27"];

const INITIAL_DEBIT_NOTES = [
  { id: 1, season: "AW26", buyer: "H&M", po: "ST-7788", amount: 4200, reason: "Late shipment penalty", date: "2 Jun" },
  { id: 2, season: "AW26", buyer: "Zara", po: "GKT-1054", amount: 1800, reason: "Quality claim — stitching defect", date: "5 Jun" },
];

function DebitNotesPage({ orders, notes, onAdd }) {
  const [form, setForm] = useState({ season: SEASON_OPTIONS[0], buyer: "", po: "", amount: "", reason: "", date: "" });
  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const total = notes.reduce((a, n) => a + (Number(n.amount) || 0), 0);
  const bySeason = {};
  notes.forEach(n => { bySeason[n.season] = (bySeason[n.season] || 0) + (Number(n.amount) || 0); });

  function submit() {
    if (!form.buyer.trim() || !form.amount) return;
    onAdd({ id: Date.now(), season: form.season, buyer: form.buyer.trim(), po: form.po, amount: Number(form.amount), reason: form.reason.trim() || "—", date: form.date.trim() || "Today" });
    setForm({ season: form.season, buyer: "", po: "", amount: "", reason: "", date: "" });
  }

  return (
    <div>
      <PageHeader title="Debit Notes" sub="Entered by Merchandising each season — buyer deductions and claims against orders" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Total debit notes</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#D64545" }}>{notes.length}</div></Card>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Total value</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#D64545" }}>${total.toLocaleString()}</div></Card>
        <Card style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 12, color: "#8A8D98", marginBottom: 4 }}>By season</div>
          {Object.entries(bySeason).map(([s, v]) => (
            <div key={s} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}><span>{s}</span><span style={{ fontWeight: 600 }}>${v.toLocaleString()}</span></div>
          ))}
        </Card>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="Add a debit note" />
        <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1fr 1fr 0.8fr 1.4fr 0.8fr auto", gap: 8, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Season</label>
            <select value={form.season} onChange={e => set("season", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }}>
              {SEASON_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Buyer</label>
            <input value={form.buyer} onChange={e => set("buyer", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>PO (optional)</label>
            <select value={form.po} onChange={e => set("po", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }}>
              <option value="">—</option>
              {orders.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Amount ($)</label>
            <input type="number" value={form.amount} onChange={e => set("amount", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Reason</label>
            <input value={form.reason} onChange={e => set("reason", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Date</label>
            <input value={form.date} onChange={e => set("date", e.target.value)} placeholder="e.g. 12 Jun" style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <button onClick={submit} style={{ fontSize: 12.5, fontWeight: 600, color: "#fff", background: "#D64545", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>Add</button>
        </div>
      </Card>

      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1fr 0.9fr 0.9fr 1.6fr 0.8fr", fontSize: 11, color: "#8A8D98", padding: "0 4px 8px", borderBottom: "1px solid #F0F0F2" }}>
          <div>Season</div><div>Buyer</div><div>PO</div><div>Amount</div><div>Reason</div><div>Date</div>
        </div>
        {notes.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#B0B2BA", padding: "12px 4px" }}>No debit notes recorded yet.</div>
        ) : notes.map(n => (
          <div key={n.id} style={{ display: "grid", gridTemplateColumns: "0.8fr 1fr 0.9fr 0.9fr 1.6fr 0.8fr", alignItems: "center", fontSize: 12.5, padding: "10px 4px", borderBottom: "1px solid #F5F5F7" }}>
            <div>{n.season}</div>
            <div style={{ fontWeight: 600, color: "#1B2130" }}>{n.buyer}</div>
            <div style={{ fontFamily: "monospace", fontSize: 11 }}>{n.po || "—"}</div>
            <div style={{ color: "#D64545", fontWeight: 600 }}>${Number(n.amount).toLocaleString()}</div>
            <div style={{ color: "#565A66" }}>{n.reason}</div>
            <div>{n.date}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

const INITIAL_CAPAS = [
  { id: 1, season: "AW26", buyer: "H&M", po: "ST-7788", issue: "PP approval delay caused late cutting start", action: "Escalate PP samples to buyer within 24 hrs of readiness; weekly follow-up call", status: "in_progress", date: "3 Jun" },
  { id: 2, season: "AW26", buyer: "Uniqlo", po: "JKT-2231", issue: "Trims shortage delayed cutting", action: "Add a 2-week buffer to trims booking for new suppliers", status: "open", date: "6 Jun" },
  { id: 3, season: "SS26", buyer: "M&S", po: "TR-8899", issue: "Minor rework on button attachment", action: "Retrain sewing line on button placement SOP", status: "closed", date: "20 May" },
];
const CAPA_STATUS_STYLE = {
  open: { bg: "#FCEBEB", fg: "#791F1F", label: "Open" },
  in_progress: { bg: "#FAEEDA", fg: "#633806", label: "In progress" },
  closed: { bg: "#E1F5EE", fg: "#085041", label: "Closed" },
};

function CapasPage({ orders, capas, onAdd, onCycleStatus }) {
  const [form, setForm] = useState({ season: SEASON_OPTIONS[0], buyer: "", po: "", issue: "", action: "", date: "" });
  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const openCount = capas.filter(c => c.status !== "closed").length;

  function submit() {
    if (!form.buyer.trim() || !form.issue.trim()) return;
    onAdd({ id: Date.now(), season: form.season, buyer: form.buyer.trim(), po: form.po, issue: form.issue.trim(), action: form.action.trim() || "—", status: "open", date: form.date.trim() || "Today" });
    setForm({ season: form.season, buyer: "", po: "", issue: "", action: "", date: "" });
  }

  return (
    <div>
      <PageHeader title="CAPAs Registered" sub="Corrective & Preventive Actions — entered by Merchandising each season, click a status to move it forward" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Total CAPAs</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{capas.length}</div></Card>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Open / in progress</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#E2A83B" }}>{openCount}</div></Card>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Closed</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#1F9E8D" }}>{capas.length - openCount}</div></Card>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="Register a CAPA" />
        <div style={{ display: "grid", gridTemplateColumns: "0.7fr 0.9fr 0.8fr 1.4fr 1.4fr 0.7fr auto", gap: 8, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Season</label>
            <select value={form.season} onChange={e => set("season", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }}>
              {SEASON_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Buyer</label>
            <input value={form.buyer} onChange={e => set("buyer", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>PO (optional)</label>
            <select value={form.po} onChange={e => set("po", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }}>
              <option value="">—</option>
              {orders.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Issue</label>
            <input value={form.issue} onChange={e => set("issue", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Corrective action</label>
            <input value={form.action} onChange={e => set("action", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Date</label>
            <input value={form.date} onChange={e => set("date", e.target.value)} placeholder="e.g. 12 Jun" style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <button onClick={submit} style={{ fontSize: 12.5, fontWeight: 600, color: "#fff", background: "#534AB7", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>Register</button>
        </div>
      </Card>

      <Card>
        {capas.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#B0B2BA" }}>No CAPAs registered yet.</div>
        ) : capas.map(c => {
          const st = CAPA_STATUS_STYLE[c.status];
          return (
            <div key={c.id} style={{ padding: "12px 4px", borderBottom: "1px solid #F5F5F7" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1B2130" }}>{c.issue}</div>
                  <div style={{ fontSize: 11.5, color: "#8A8D98", marginTop: 2 }}>{c.season} · {c.buyer}{c.po ? ` · PO #${c.po}` : ""} · {c.date}</div>
                  <div style={{ fontSize: 12, color: "#565A66", marginTop: 4 }}>Action: {c.action}</div>
                </div>
                <span
                  onClick={() => onCycleStatus(c.id)}
                  style={{ cursor: "pointer", background: st.bg, color: st.fg, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" }}
                >
                  {st.label}
                </span>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function ExecutiveOverviewPage({ orders, attendance, financials, roster }) {
  const allStages = orders.flatMap(o => o.stages);
  const totalOrders = orders.length;
  const totalQty = orders.reduce((a, o) => a + o.qty, 0);

  const health = orders.map(o => {
    const flags = o.stages.filter(s => s.reason).length;
    let score = 100 - flags * 15 - (o.status === "Delayed" ? 20 : 0);
    score = Math.max(0, Math.min(100, score));
    return { order: o, score };
  });
  const healthBuckets = [
    { name: "Healthy (80-100)", color: "#1F9E8D", value: health.filter(h => h.score >= 80).length },
    { name: "At Risk (60-79)", color: "#E2A83B", value: health.filter(h => h.score >= 60 && h.score < 80).length },
    { name: "Critical (40-59)", color: "#D85A30", value: health.filter(h => h.score >= 40 && h.score < 60).length },
    { name: "Severe (0-39)", color: "#D64545", value: health.filter(h => h.score < 40).length },
  ].filter(b => b.value > 0);
  const overallHealth = Math.round(health.reduce((a, h) => a + h.score, 0) / (health.length || 1));

  const onTrack = orders.filter(o => o.status === "On Track").length;
  const onTimePct = Math.round((onTrack / totalOrders) * 100);

  const avgProgress = orders.reduce((a, o) => a + o.stages.filter(s => s.status === "done").length / o.stages.length, 0) / totalOrders;
  const shippedPcs = Math.round(totalQty * avgProgress);
  const grossProfit = financials.revenue - financials.cogs;
  const grossMargin = financials.revenue > 0 ? Math.round((grossProfit / financials.revenue) * 1000) / 10 : 0;

  const reasonCounts = {};
  allStages.forEach(s => { if (s.reason) reasonCounts[s.reason] = (reasonCounts[s.reason] || 0) + 1; });
  const reasonArr = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);
  const reasonTotal = reasonArr.reduce((a, [, c]) => a + c, 0) || 1;

  const alerts = [];
  orders.forEach(o => o.stages.forEach(s => { if (s.reason) alerts.push({ text: `${s.reason} — ${o.style} PO #${o.id} (${s.dept})`, sev: o.risk }); }));

  const inProduction = allStages.filter(s => ["Cutting", "Production"].includes(s.dept) && s.status === "in_progress").length;
  const ordersAtRisk = orders.filter(o => o.status === "At Risk").length;
  const ordersDelayed = orders.filter(o => o.status === "Delayed").length;
  const ordersCompleted = orders.filter(o => o.status === "On Track" && o.stages.every(s => s.status === "done")).length;

  const presentCount = roster.filter(s => (attendance[s.name] || "present") === "present").length;
  const capacityUtilization = Math.round((presentCount / roster.length) * 100);

  const buyerCounts = {};
  orders.forEach(o => { buyerCounts[o.buyer] = (buyerCounts[o.buyer] || 0) + 1; });
  const buyerColors = ["#7F77DD", "#378ADD", "#1F9E8D", "#E2A83B", "#D64545", "#8A8D98"];
  const buyerData = Object.entries(buyerCounts).map(([name, value], i) => ({ name, value, color: buyerColors[i % buyerColors.length] }));

  const countryCounts = {};
  orders.forEach(o => { countryCounts[o.country] = (countryCounts[o.country] || 0) + 1; });
  const countryArr = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]);
  const countryMax = Math.max(...countryArr.map(c => c[1]), 1);

  const riskCounts = { high: orders.filter(o => o.risk === "high").length, medium: orders.filter(o => o.risk === "medium").length, low: orders.filter(o => o.risk === "low").length };
  const riskData = [
    { name: "High risk", value: riskCounts.high, color: "#D64545" },
    { name: "Medium risk", value: riskCounts.medium, color: "#E2A83B" },
    { name: "Low risk", value: riskCounts.low, color: "#1F9E8D" },
  ].filter(r => r.value > 0);

  const shortPct = Math.max(0, Math.round((1 - avgProgress) * 100) - 90 + 4);
  const accuracy = Math.max(90, 100 - Math.round((1 - avgProgress) * 5));

  const openPOStages = allStages.filter(s => (s.name === "Fabric Booking" || s.name === "Trim Booking") && s.status !== "done");
  const latePOStages = openPOStages.filter(s => s.reason);

  const openTasksRows = allStages.filter(s => s.status !== "done");
  const overdueRows = allStages.filter(s => s.status === "in_progress" && s.reason);
  const pendingApprovals = allStages.filter(s => s.name.toLowerCase().includes("approval") && s.status !== "done");

  const activityFeed = orders.map(o => {
    const lastDoneIdx = [...o.stages].reverse().findIndex(s => s.status === "done");
    if (lastDoneIdx === -1) return null;
    const idx = o.stages.length - 1 - lastDoneIdx;
    const s = o.stages[idx];
    return { text: `${s.name} completed`, sub: `PO #${o.id} · ${s.dept}` };
  }).filter(Boolean).slice(0, 6);

  const kpis = [
    { label: "Total Orders", value: totalOrders, sub: `${totalQty.toLocaleString()} pcs`, icon: ClipboardList, color: "#378ADD" },
    { label: "Total Value (USD)", value: `$${(financials.revenue / 1e6).toFixed(2)}M`, icon: Landmark, color: "#1F9E8D" },
    { label: "On-Time Shipment %", value: `${onTimePct}%`, icon: Clock, color: "#378ADD" },
    { label: "Overall Order Health", value: `${overallHealth} /100`, icon: Gauge, color: "#E2A83B" },
    { label: "Total Shipped (PCS)", value: shippedPcs.toLocaleString(), icon: Truck, color: "#7F77DD" },
    { label: "Gross Margin", value: `${grossMargin}%`, icon: TrendingUp, color: "#E2A83B" },
  ];

  return (
    <div style={{ background: "#0E1424", margin: "-24px -28px", padding: 24, minHeight: "100%" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>MD Executive Dashboard</div>
        <div style={{ fontSize: 12.5, color: "#8489A0", marginTop: 2 }}>Real-time overview of entire organization performance</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 16 }}>
        {kpis.map(k => (
          <DarkCard key={k.label} style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: k.color + "33", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <k.icon size={13} color={k.color} />
              </div>
              <div style={{ fontSize: 10, color: "#8489A0", textTransform: "uppercase" }}>{k.label}</div>
            </div>
            <div style={{ fontSize: 19, fontWeight: 700, color: "#fff" }}>{k.value}</div>
            {k.sub && <div style={{ fontSize: 10.5, color: "#8489A0", marginTop: 2 }}>{k.sub}</div>}
          </DarkCard>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr 0.9fr", gap: 12, marginBottom: 12 }}>
        <DarkCard>
          <DarkCardHeader title="Order Health Distribution" />
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <MiniDonut data={healthBuckets} size={100} centerLabel={totalOrders} centerSub="Orders" />
            <div style={{ flex: 1 }}>
              {healthBuckets.map(b => (
                <div key={b.name} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontSize: 11 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: b.color }} />
                  <span style={{ color: "#C7CADA", flex: 1 }}>{b.name}</span>
                  <span style={{ color: "#fff", fontWeight: 700 }}>{b.value}</span>
                </div>
              ))}
            </div>
          </div>
        </DarkCard>

        <DarkCard>
          <DarkCardHeader title="Shipment Performance Trend" sub="Last 6 months" />
          <div style={{ width: "100%", height: 150 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SHIPMENT_PERFORMANCE} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262E48" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8489A0" }} axisLine={{ stroke: "#262E48" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#8489A0" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, background: "#171E33", border: "1px solid #262E48", color: "#fff" }} />
                <Line type="monotone" dataKey="onTime" name="On-time %" stroke="#7C8BFF" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="target" name="Target %" stroke="#4B5270" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DarkCard>

        <DarkCard>
          <DarkCardHeader title="Top Delay Reasons" sub="All orders" />
          {reasonArr.length === 0 ? (
            <div style={{ fontSize: 11.5, color: "#8489A0" }}>No delays flagged.</div>
          ) : reasonArr.map(([reason, count]) => (
            <div key={reason} style={{ marginBottom: 9 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                <span style={{ color: "#C7CADA" }}>{reason}</span>
                <span style={{ color: "#8489A0" }}>{Math.round(count / reasonTotal * 100)}%</span>
              </div>
              <div style={{ height: 5, background: "#262E48", borderRadius: 999 }}>
                <div style={{ height: 5, width: `${count / reasonTotal * 100}%`, background: "#D64545", borderRadius: 999 }} />
              </div>
            </div>
          ))}
        </DarkCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr", gap: 12, marginBottom: 12 }}>
        <DarkCard>
          <DarkCardHeader title="Order & Production Performance" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {[
              ["Orders in Production", inProduction, "#7F77DD"],
              ["Capacity Utilization", `${capacityUtilization}%`, "#378ADD"],
              ["Orders Completed", ordersCompleted, "#1F9E8D"],
              ["Orders At Risk", ordersAtRisk, "#E2A83B"],
              ["Orders Delayed", ordersDelayed, "#D64545"],
              ["Compliance Score", `${financials.complianceScore}%`, "#1F9E8D"],
            ].map(([label, val, color]) => (
              <div key={label} style={{ background: "#0E1424", borderRadius: 10, padding: "12px 12px" }}>
                <div style={{ fontSize: 10, color: "#8489A0", marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color }}>{val}</div>
              </div>
            ))}
          </div>
        </DarkCard>
        <DarkCard>
          <DarkCardHeader title="Critical Alerts" action={`${alerts.length}`} />
          {alerts.length === 0 ? (
            <div style={{ fontSize: 11.5, color: "#8489A0" }}>No active alerts.</div>
          ) : alerts.slice(0, 5).map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "7px 0", borderBottom: i < 4 ? "1px solid #262E48" : "none" }}>
              <TriangleAlert size={13} color={a.sev === "high" ? "#D64545" : "#E2A83B"} style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontSize: 11, color: "#C7CADA" }}>{a.text}</div>
            </div>
          ))}
        </DarkCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
        <DarkCard>
          <DarkCardHeader title="Orders by Buyer" />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <MiniDonut data={buyerData} size={84} centerLabel={totalOrders} />
            <div style={{ flex: 1 }}>
              {buyerData.map(b => (
                <div key={b.name} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4, fontSize: 10.5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: b.color }} />
                  <span style={{ color: "#C7CADA", flex: 1 }}>{b.name}</span>
                  <span style={{ color: "#fff", fontWeight: 700 }}>{b.value}</span>
                </div>
              ))}
            </div>
          </div>
        </DarkCard>

        <DarkCard>
          <DarkCardHeader title="Orders by Country" />
          {countryArr.map(([country, count]) => (
            <div key={country} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7, fontSize: 10.5 }}>
              <Globe size={11} color="#8489A0" style={{ flexShrink: 0 }} />
              <span style={{ color: "#C7CADA", width: 70, flexShrink: 0 }}>{country}</span>
              <div style={{ flex: 1, height: 5, background: "#262E48", borderRadius: 999 }}>
                <div style={{ height: 5, width: `${(count / countryMax) * 100}%`, background: "#378ADD", borderRadius: 999 }} />
              </div>
              <span style={{ color: "#fff", fontWeight: 700 }}>{count}</span>
            </div>
          ))}
        </DarkCard>

        <DarkCard>
          <DarkCardHeader title="Quality Overview" />
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <MiniDonut data={[{ name: "Pass", value: 93.4, color: "#1F9E8D" }, { name: "Fail", value: 6.6, color: "#262E48" }]} size={80} centerLabel="93.4%" centerSub="Pass rate" />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#8489A0" }}>
            <span>Defect rate <b style={{ color: "#fff" }}>2.1%</b></span>
            <span>Rework <b style={{ color: "#fff" }}>1.8%</b></span>
          </div>
        </DarkCard>

        <DarkCard>
          <DarkCardHeader title="Predicted Shipment Risk" sub="Next 30 days" />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <MiniDonut data={riskData} size={80} centerLabel={totalOrders} />
            <div style={{ flex: 1 }}>
              {riskData.map(r => (
                <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4, fontSize: 10 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: r.color }} />
                  <span style={{ color: "#C7CADA", flex: 1 }}>{r.name}</span>
                  <span style={{ color: "#fff", fontWeight: 700 }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </DarkCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12, marginBottom: 12 }}>
        <DarkCard>
          <DarkCardHeader title="Financial Overview" sub="YTD — entered by Finance team" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[
              ["Total Revenue", `$${(financials.revenue / 1e6).toFixed(2)}M`, "#fff"],
              ["Total COGS", `$${(financials.cogs / 1e6).toFixed(2)}M`, "#fff"],
              ["Gross Profit", `$${(grossProfit / 1e6).toFixed(2)}M`, "#1F9E8D"],
              ["Gross Margin", `${grossMargin}%`, "#1F9E8D"],
              ["EBITDA", `$${(financials.ebitda / 1e6).toFixed(2)}M`, "#fff"],
              ["Stock Value", `$${(financials.stockValue / 1e6).toFixed(2)}M`, "#fff"],
            ].map(([label, val, color]) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: "#8489A0", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color }}>{val}</div>
              </div>
            ))}
          </div>
        </DarkCard>
        <DarkCard>
          <DarkCardHeader title="Activity Feed" sub="Latest updates" />
          {activityFeed.length === 0 ? (
            <div style={{ fontSize: 11.5, color: "#8489A0" }}>No recent activity.</div>
          ) : activityFeed.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "6px 0", borderBottom: i < activityFeed.length - 1 ? "1px solid #262E48" : "none" }}>
              <CheckCircle2 size={12} color="#1F9E8D" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 11, color: "#C7CADA" }}>{a.text}</div>
                <div style={{ fontSize: 9.5, color: "#8489A0" }}>{a.sub}</div>
              </div>
            </div>
          ))}
        </DarkCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
        {[
          ["Open Tasks", openTasksRows.length, "#378ADD"],
          ["Overdue Tasks", overdueRows.length, "#D64545"],
          ["Pending Approvals", pendingApprovals.length, "#E2A83B"],
          ["Open POs", openPOStages.length, "#378ADD"],
          ["Late POs", latePOStages.length, "#D64545"],
          ["Cash Flow, YTD", `$${(financials.cashFlow / 1e6).toFixed(2)}M`, "#1F9E8D"],
        ].map(([label, val, color]) => (
          <DarkCard key={label} style={{ padding: "12px 14px" }}>
            <div style={{ fontSize: 9.5, color: "#8489A0", marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color }}>{val}</div>
          </DarkCard>
        ))}
      </div>
    </div>
  );
}

function MyDepartmentDashboard({ orders, role, personName, onOpenOrder, onNavigate }) {
  const rows = collectTasks(orders, role.dept);
  const openRows = rows.filter(r => r.stage.status !== "done");
  const delayedRows = rows.filter(r => r.stage.reason);
  const linkedOrders = orders.filter(o => o.stages.some(s => s.dept === role.dept));

  const reasonCounts = {};
  rows.forEach(r => { if (r.stage.reason) reasonCounts[r.stage.reason] = (reasonCounts[r.stage.reason] || 0) + 1; });
  const reasonArr = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);
  const reasonTotal = reasonArr.reduce((a, [, c]) => a + c, 0) || 1;

  return (
    <div>
      <PageHeader title={`${role.dept}`} sub={`Welcome, ${personName} — you're seeing only what's relevant to your department. Merchandisers, managers, and the MD can see the full organization.`} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        <Card style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 12, color: "#8A8D98" }}>Open tasks</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: "#378ADD" }}>{openRows.length}</div>
        </Card>
        <Card style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 12, color: "#8A8D98" }}>Delayed / flagged</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: "#D64545" }}>{delayedRows.length}</div>
        </Card>
        <Card style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 12, color: "#8A8D98" }}>Orders touching your department</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: "#1F9E8D" }}>{linkedOrders.length}</div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <CardHeader title="Your orders" action="My tasks" onAction={() => onNavigate("tasks")} />
          {linkedOrders.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "#B0B2BA" }}>No orders currently touch your department.</div>
          ) : linkedOrders.map(o => (
            <div
              key={o.id}
              onClick={() => onOpenOrder(o.id)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 4px", borderBottom: "1px solid #F5F5F7", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "#FAFAFB"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: "#8A8D98" }}>{o.id}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1B2130" }}>{o.style} <span style={{ color: "#8A8D98", fontWeight: 400 }}>· {o.buyer}</span></div>
              </div>
              {statusPill(o.status)}
            </div>
          ))}
        </Card>

        <Card>
          <CardHeader title="Top delay reasons in your department" />
          {reasonArr.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "#B0B2BA" }}>No delays flagged in your department.</div>
          ) : reasonArr.map(([reason, count]) => (
            <div key={reason} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                <span style={{ color: "#1B2130" }}>{reason}</span>
                <span style={{ color: "#8A8D98" }}>{count} ({Math.round(count / reasonTotal * 100)}%)</span>
              </div>
              <div style={{ height: 6, background: "#F0F0F2", borderRadius: 999 }}>
                <div style={{ height: 6, width: `${count / reasonTotal * 100}%`, background: "#D64545", borderRadius: 999 }} />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function SettingsPage({ role, setRole }) {
  return (
    <div>
      <PageHeader title="Settings" sub="Prototype account settings" />
      <Card style={{ maxWidth: 420 }}>
        <CardHeader title="Signed in as" />
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: "#8A8D98", display: "block", marginBottom: 6 }}>Role</label>
          <select
            value={role.label}
            onChange={e => setRole(ROLE_OPTIONS.find(r => r.label === e.target.value))}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #E7E8ED", fontSize: 13 }}
          >
            {ROLE_OPTIONS.map(r => <option key={r.label} value={r.label}>{r.label}</option>)}
          </select>
        </div>
        <div style={{ fontSize: 12, color: "#8A8D98" }}>Switching your role changes what shows up under "My tasks."</div>
      </Card>
    </div>
  );
}

export default function LoomPLM() {
  const [orders, setOrders] = useState(() =>
    INITIAL_ORDERS.map((o, i) => ({
      ...o, template: "90", costingTemplate: "fabric", costingRows: buildCostingRows("fabric"), vapCount: 1,
      shippedQty: Math.round(o.qty * [0.72, 0.4, 0.55, 0.9, 0.6, 0.98][i]),
      plannedCost: Math.round(o.qty * [4.2, 2.1, 7.8, 3.6, 5.4, 2.8][i]),
      actualCost: Math.round(o.qty * [4.2, 2.1, 7.8, 3.6, 5.4, 2.8][i] * [1.044, 1.077, 0.976, 0.991, 1.052, 0.977][i]),
      stages: makeStages("90", o.activeUpto, o.delayedAt).map(s => s.dept === "VAP" ? { ...s, supplier: VAP_SUPPLIERS[i % VAP_SUPPLIERS.length] } : s),
      preProd: initPreProd(),
    }))
  );
  const [view, setView] = useState("dashboard");
  const [previousView, setPreviousView] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [role, setRole] = useState(ROLE_OPTIONS[0]);
  const [attendance, setAttendance] = useState(seedAttendance);
  const [leaveRequests, setLeaveRequests] = useState(INITIAL_LEAVE_REQUESTS);
  const [roster, setRoster] = useState(STAFF_LIST);
  const [orgStructure, setOrgStructure] = useState(() => JSON.parse(JSON.stringify(ORG_STRUCTURE)));

  const addStaff = (person) => {
    setRoster(prev => [...prev, person]);
    setAttendance(prev => ({ ...prev, [person.name]: "present" }));
    setOrgStructure(prev => ({
      ...prev,
      [person.dept]: [...(prev[person.dept] || []), { title: person.title, name: person.name, bullets: [] }],
    }));
  };
  const removeStaff = (name) => {
    setRoster(prev => prev.filter(s => s.name !== name));
    setOrgStructure(prev => {
      const next = {};
      Object.entries(prev).forEach(([dept, roles]) => {
        next[dept] = roles.map(r => (r.name === name ? { ...r, name: "—" } : r));
      });
      return next;
    });
  };

  const cycleAttendance = (name) => {
    setAttendance(prev => {
      const current = prev[name] || "present";
      const next = current === "present" ? "absent" : current === "absent" ? "leave" : "present";
      return { ...prev, [name]: next };
    });
  };
  const approveLeave = (id) => setLeaveRequests(prev => prev.map(l => l.id === id ? { ...l, status: "approved" } : l));
  const rejectLeave = (id) => setLeaveRequests(prev => prev.map(l => l.id === id ? { ...l, status: "rejected" } : l));

  const [financials, setFinancials] = useState({
    revenue: 4415000,
    cogs: 3206000,
    ebitda: 820000,
    cashFlow: 1236000,
    stockValue: 2548000,
    complianceScore: 96.3,
  });
  const updateFinancials = (field, value) => setFinancials(prev => ({ ...prev, [field]: value }));

  const [certifications, setCertifications] = useState(INITIAL_CERTIFICATIONS);
  const cycleCert = (key) => {
    setCertifications(prev => prev.map(c => {
      if (c.key !== key) return c;
      const next = c.status === "not_applied" ? "applied" : c.status === "applied" ? "approved" : "not_applied";
      return { ...c, status: next };
    }));
  };

  const [debitNotes, setDebitNotes] = useState(INITIAL_DEBIT_NOTES);
  const addDebitNote = (note) => setDebitNotes(prev => [note, ...prev]);

  const [capas, setCapas] = useState(INITIAL_CAPAS);
  const addCapa = (capa) => setCapas(prev => [capa, ...prev]);
  const cycleCapaStatus = (id) => {
    setCapas(prev => prev.map(c => {
      if (c.id !== id) return c;
      const next = c.status === "open" ? "in_progress" : c.status === "in_progress" ? "closed" : "open";
      return { ...c, status: next };
    }));
  };

  const updateStages = (id, stages) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const doneCount = stages.filter(s => s.status === "done").length;
      const hasFlag = stages.some(s => s.reason);
      const status = doneCount === stages.length ? "On Track" : hasFlag ? "Delayed" : "At Risk";
      return { ...o, stages, status };
    }));
  };

  const setOrderTemplate = (id, tmpl) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, template: tmpl, stages: makeStages(tmpl, 0, null), status: "On Track" } : o));
  };

  const setOrderCostingTemplate = (id, tmpl) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, costingTemplate: tmpl, costingRows: buildCostingRows(tmpl) } : o));
  };

  const updateCostingRow = (id, idx, field, value) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const rows = [...o.costingRows];
      rows[idx] = { ...rows[idx], [field]: value };
      return { ...o, costingRows: rows };
    }));
  };

  const addCostingRow = (id) => {
    setOrders(prev => prev.map(o => o.id === id
      ? { ...o, costingRows: [...o.costingRows, { label: "", section: "Other", isHeader: false, price: 0, qty: 1, custom: true }] }
      : o));
  };

  const updateShippedQty = (id, qty) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, shippedQty: qty } : o));
  };

  const updateOrderCost = (id, field, value) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const updatePreProdField = (id, docKey, fieldKey, value) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const doc = o.preProd[docKey];
      return { ...o, preProd: { ...o.preProd, [docKey]: { ...doc, values: { ...doc.values, [fieldKey]: value } } } };
    }));
  };
  const submitPreProdDoc = (id, docKey) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      return { ...o, preProd: { ...o.preProd, [docKey]: { ...o.preProd[docKey], status: "submitted" } } };
    }));
  };
  const approvePreProdDoc = (id, docKey, approverName) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      return { ...o, preProd: { ...o.preProd, [docKey]: { ...o.preProd[docKey], status: "approved", approvedBy: approverName, approvedAt: new Date().toLocaleDateString() } } };
    }));
  };

  const navigate = (key) => { setView(key); };

  const openOrder = (id) => {
    setSelectedId(id);
    setPreviousView(view === "order" ? previousView : view);
    setView("order");
  };

  const openDept = (name) => {
    setSelectedDept(name);
    setPreviousView(view);
    setView("departmentDetail");
  };

  const selectedOrder = orders.find(o => o.id === selectedId);
  const canSeeAll = !!role.fullAccess;
  const personName = (role.label.match(/\(([^)]+)\)/) || [])[1] || role.label;

  const [factoryMenuOpen, setFactoryMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("2025-05-12");
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [headerDark, setHeaderDark] = useState(false);

  const searchResults = searchQuery.trim().length === 0 ? [] : orders
    .filter(o => canSeeAll || o.stages.some(s => s.dept === role.dept))
    .filter(o => {
      const q = searchQuery.toLowerCase();
      return o.id.toLowerCase().includes(q) || o.style.toLowerCase().includes(q) || o.buyer.toLowerCase().includes(q) || (o.country || "").toLowerCase().includes(q);
    })
    .slice(0, 6);

  const bellAlerts = (() => {
    const items = [];
    orders.forEach(o => {
      o.stages.forEach(s => {
        if (s.reason && (canSeeAll || s.dept === role.dept)) {
          items.push({ text: `${s.reason} — ${o.style} PO #${o.id}`, sev: o.risk, orderId: o.id });
        }
      });
    });
    return items;
  })();

  const navSections = [
    { section: null, items: [
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      ...(canSeeAll ? [{ key: "orders", label: "Orders", icon: Package }] : []),
      { key: "tasks", label: "My tasks", icon: CheckSquare },
      ...(canSeeAll ? [{ key: "calendar", label: "Timeline / calendar", icon: Calendar }] : []),
      ...(canSeeAll ? [{ key: "approvals", label: "Approvals", icon: ClipboardCheck }] : []),
    ]},
    { section: "Operations", items: [
      ...(canSeeAll
        ? [{ key: "departments", label: "Departments", icon: Users }]
        : [{ key: "myDepartment", label: "My department", icon: Users }]),
      ...(canSeeAll || ["Cutting", "Production"].includes(role.dept) ? [{ key: "production", label: "Production", icon: Factory }] : []),
      ...(canSeeAll || role.dept === "Quality" ? [{ key: "quality", label: "Quality", icon: ShieldCheck }] : []),
      ...(canSeeAll || role.dept === "Compliance & Certification" ? [{ key: "compliance", label: "Compliance & certs", icon: ShieldCheck }] : []),
      { key: "attendance", label: "Attendance & leave", icon: UserCheck },
      ...(canSeeAll || role.dept === "Finance" ? [{ key: "finance", label: "Finance data", icon: Landmark }] : []),
    ]},
    { section: "Insights", items: [
      ...(canSeeAll ? [{ key: "reports", label: "Reports", icon: BarChart3 }] : []),
      ...(canSeeAll ? [{ key: "insights", label: "All insights", icon: Lightbulb }] : []),
      ...(canSeeAll ? [{ key: "supplierPerformance", label: "Supplier performance", icon: TrendingUp }] : []),
      ...(canSeeAll ? [{ key: "notifications", label: "Notifications", icon: Bell }] : []),
      ...(canSeeAll ? [{ key: "debitNotes", label: "Debit notes", icon: ArrowDownRight }] : []),
      ...(canSeeAll ? [{ key: "capas", label: "CAPAs", icon: RefreshCw }] : []),
      ...(role.dept === "Executive" ? [{ key: "executiveOverview", label: "Executive Dashboard (MD)", icon: TrendingUp }] : []),
    ]},
    { section: null, items: [
      { key: "settings", label: "Settings", icon: SettingsIcon },
    ]},
  ];

  let content;
  if (view === "order" && selectedOrder) {
    content = <OrderWorkspace order={selectedOrder} onBack={() => setView(previousView)} onUpdateStages={updateStages} role={role} onSetTemplate={setOrderTemplate} onSetCostingTemplate={setOrderCostingTemplate} onUpdateCostingRow={updateCostingRow} onAddCostingRow={addCostingRow} onUpdateShippedQty={updateShippedQty} onPreProdField={updatePreProdField} onPreProdSubmit={submitPreProdDoc} onPreProdApprove={approvePreProdDoc} />;
  } else if (view === "departmentDetail" && selectedDept) {
    content = <DepartmentDetail deptName={selectedDept} orders={orders} onBack={() => setView(previousView)} onOpenOrder={openOrder} orgStructure={orgStructure} />;
  } else if (view === "myDepartment") {
    content = <DepartmentDetail deptName={role.dept} orders={orders} onBack={() => setView("dashboard")} onOpenOrder={openOrder} orgStructure={orgStructure} />;
  } else if (view === "orders" && canSeeAll) {
    content = <OrdersPage orders={orders} onOpenOrder={openOrder} />;
  } else if (view === "tasks") {
    content = <MyTasksPage orders={orders} role={role} onOpenOrder={openOrder} />;
  } else if (view === "calendar" && canSeeAll) {
    content = <CalendarPage orders={orders} onOpenOrder={openOrder} />;
  } else if (view === "approvals" && canSeeAll) {
    content = <ApprovalsPage orders={orders} onOpenOrder={openOrder} />;
  } else if (view === "departments" && canSeeAll) {
    content = <DepartmentsPage orders={orders} onOpenDept={openDept} orgStructure={orgStructure} />;
  } else if (view === "production" && (canSeeAll || ["Cutting", "Production"].includes(role.dept))) {
    content = <ProductionPage orders={orders} onOpenOrder={openOrder} />;
  } else if (view === "quality" && (canSeeAll || role.dept === "Quality")) {
    content = <QualityPage orders={orders} onOpenOrder={openOrder} />;
  } else if (view === "compliance" && (canSeeAll || role.dept === "Compliance & Certification")) {
    content = <CompliancePage certifications={certifications} onCycle={cycleCert} />;
  } else if (view === "reports" && canSeeAll) {
    content = <ReportsPage orders={orders} />;
  } else if (view === "insights" && canSeeAll) {
    content = <InsightsPage orders={orders} />;
  } else if (view === "supplierPerformance" && canSeeAll) {
    content = <SupplierPerformancePage orders={orders} onOpenOrder={openOrder} />;
  } else if (view === "notifications" && canSeeAll) {
    content = <NotificationsPage orders={orders} />;
  } else if (view === "debitNotes" && canSeeAll) {
    content = <DebitNotesPage orders={orders} notes={debitNotes} onAdd={addDebitNote} />;
  } else if (view === "capas" && canSeeAll) {
    content = <CapasPage orders={orders} capas={capas} onAdd={addCapa} onCycleStatus={cycleCapaStatus} />;
  } else if (view === "attendance") {
    content = <AttendancePage roster={roster} attendance={attendance} onCycle={cycleAttendance} leaveRequests={leaveRequests} onApprove={approveLeave} onReject={rejectLeave} onAddStaff={addStaff} onRemoveStaff={removeStaff} />;
  } else if (view === "finance" && (canSeeAll || role.dept === "Finance")) {
    content = <FinanceEntryPage orders={orders} financials={financials} onUpdate={updateFinancials} onUpdateOrderCost={updateOrderCost} />;
  } else if (view === "executiveOverview" && role.dept === "Executive") {
    content = <ExecutiveOverviewPage orders={orders} attendance={attendance} financials={financials} roster={roster} />;
  } else if (view === "settings") {
    content = <SettingsPage role={role} setRole={setRole} />;
  } else if (canSeeAll) {
    content = <Dashboard orders={orders} onOpenOrder={openOrder} onNavigate={navigate} attendance={attendance} roster={roster} />;
  } else {
    content = <MyDepartmentDashboard orders={orders} role={role} personName={personName} onOpenOrder={openOrder} onNavigate={navigate} />;
  }

  return (
    <div style={{ display: "flex", height: "100vh", maxWidth: 1440, margin: "0 auto", background: "#F5F6F8", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", overflow: "hidden", boxShadow: "0 0 0 1px #E7E8ED" }}>
      <div style={{ width: 208, background: "#151B2E", padding: "20px 14px", flexShrink: 0, overflowY: "auto", height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px 20px", color: "#fff" }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "#1F9E8D", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>L</div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Loom PLM</span>
        </div>
        {navSections.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 10 }}>
            {group.section && (
              <div style={{ fontSize: 10, fontWeight: 700, color: "#5C6178", textTransform: "uppercase", letterSpacing: 0.5, padding: "10px 10px 4px" }}>{group.section}</div>
            )}
            {group.items.map(item => {
              const active = view === item.key || (item.key === "orders" && (view === "order")) || (item.key === "departments" && view === "departmentDetail");
              return (
                <div
                  key={item.key}
                  onClick={() => navigate(item.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8,
                    color: active ? "#fff" : "#9498A8", background: active ? "#1F9E8D22" : "transparent",
                    fontSize: 13.5, fontWeight: active ? 600 : 500, cursor: "pointer", marginBottom: 2
                  }}
                >
                  <item.icon size={16} />
                  {item.label}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: 56, background: headerDark ? "#1B2340" : "#fff", borderBottom: `1px solid ${headerDark ? "#2A3358" : "#ECEDF1"}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <div
                onClick={() => setFactoryMenuOpen(!factoryMenuOpen)}
                style={{ display: "flex", alignItems: "center", gap: 6, background: headerDark ? "#2A3358" : "#F5F6F8", borderRadius: 8, padding: "6px 10px", fontSize: 12.5, color: headerDark ? "#D6D9E8" : "#565A66", cursor: "pointer" }}
              >
                All factories <ChevronDown size={12} />
              </div>
              {factoryMenuOpen && (
                <div style={{ position: "absolute", top: "110%", left: 0, background: "#fff", border: "1px solid #ECEDF1", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 30, minWidth: 160, padding: 6 }}>
                  <div style={{ padding: "7px 10px", fontSize: 12.5, borderRadius: 6, background: "#F0EFFB", color: "#534AB7", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle2 size={13} /> All factories
                  </div>
                </div>
              )}
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, background: headerDark ? "#2A3358" : "#F5F6F8", borderRadius: 8, padding: "6px 10px", fontSize: 12.5, color: headerDark ? "#D6D9E8" : "#565A66", cursor: "pointer" }}>
              <Calendar size={13} />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                style={{ border: "none", background: "transparent", fontSize: 12.5, color: "inherit", cursor: "pointer", fontFamily: "inherit" }}
              />
            </label>
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: headerDark ? "#2A3358" : "#F5F6F8", borderRadius: 8, padding: "6px 12px", width: 240 }}>
              <Search size={14} color={headerDark ? "#9AA0C0" : "#8A8D98"} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search orders, styles, PO..."
                style={{ border: "none", background: "transparent", fontSize: 13, color: headerDark ? "#E4E6F2" : "#1B2130", width: "100%", outline: "none" }}
              />
            </div>
            {searchQuery.trim().length > 0 && (
              <div style={{ position: "absolute", top: "110%", left: 0, right: 0, background: "#fff", border: "1px solid #ECEDF1", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 30, maxHeight: 260, overflowY: "auto" }}>
                {searchResults.length === 0 ? (
                  <div style={{ padding: "12px 14px", fontSize: 12.5, color: "#B0B2BA" }}>No matching orders.</div>
                ) : searchResults.map(o => (
                  <div
                    key={o.id}
                    onClick={() => { openOrder(o.id); setSearchQuery(""); }}
                    style={{ padding: "9px 14px", cursor: "pointer", borderBottom: "1px solid #F5F5F7", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FAFAFB"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div>
                      <span style={{ fontFamily: "monospace", fontSize: 11, color: "#8A8D98", marginRight: 8 }}>{o.id}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1B2130" }}>{o.style}</span>
                      <span style={{ fontSize: 12, color: "#8A8D98" }}> · {o.buyer}</span>
                    </div>
                    {statusPill(o.status)}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setNotifOpen(!notifOpen)}>
                <Bell size={17} color={headerDark ? "#D6D9E8" : "#565A66"} />
                {bellAlerts.length > 0 && (
                  <span style={{ position: "absolute", top: -6, right: -6, background: "#D64545", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 999, width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {bellAlerts.length}
                  </span>
                )}
              </div>
              {notifOpen && (
                <div style={{ position: "absolute", top: "140%", right: 0, background: "#fff", border: "1px solid #ECEDF1", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 30, width: 300, maxHeight: 320, overflowY: "auto" }}>
                  <div style={{ padding: "10px 14px", fontSize: 12.5, fontWeight: 700, color: "#1B2130", borderBottom: "1px solid #F0F0F2" }}>Alerts</div>
                  {bellAlerts.length === 0 ? (
                    <div style={{ padding: "14px", fontSize: 12.5, color: "#B0B2BA" }}>Nothing to flag right now.</div>
                  ) : bellAlerts.slice(0, 8).map((a, i) => (
                    <div
                      key={i}
                      onClick={() => { openOrder(a.orderId); setNotifOpen(false); }}
                      style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #F5F5F7" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#FAFAFB"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <TriangleAlert size={13} color={a.sev === "high" ? "#D64545" : "#E2A83B"} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div style={{ fontSize: 12, color: "#1B2130" }}>{a.text}</div>
                    </div>
                  ))}
                  {canSeeAll && (
                    <div onClick={() => { navigate("notifications"); setNotifOpen(false); }} style={{ padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#378ADD", cursor: "pointer" }}>
                      View all in Notifications →
                    </div>
                  )}
                </div>
              )}
            </div>
            <Moon size={16} color={headerDark ? "#D6D9E8" : "#565A66"} style={{ cursor: "pointer" }} onClick={() => setHeaderDark(!headerDark)} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => navigate("settings")}>
              <div style={{ width: 30, height: 30, borderRadius: 999, background: "#7F77DD", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>
                {role.label.split(" ")[0].slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: headerDark ? "#fff" : "#1B2130" }}>{role.label.split(" (")[0]}</div>
                <div style={{ fontSize: 10.5, color: headerDark ? "#9AA0C0" : "#8A8D98" }}>{role.dept}</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1, minHeight: 0 }}>
          {content}
        </div>
      </div>
    </div>
  );
}
