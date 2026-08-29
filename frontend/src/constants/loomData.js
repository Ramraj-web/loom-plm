import {
  FileText, ClipboardList, Package, Layers, CheckCircle2, Warehouse, ShieldCheck,
  Shirt, Scissors, Palette, Factory, Truck, Users, Calendar, Radio, TrendingUp, ClipboardCheck
} from "lucide-react";

export const SHIPMENT_PERFORMANCE = [
  { month: "Dec", onTime: 74, target: 75 },
  { month: "Jan", onTime: 78, target: 75 },
  { month: "Feb", onTime: 73, target: 75 },
  { month: "Mar", onTime: 80, target: 75 },
  { month: "Apr", onTime: 77, target: 75 },
  { month: "May", onTime: 82.3, target: 75 },
];

export const REASONS = [
  "Buyer approval delay", "Fabric delay", "Trims shortage",
  "Capacity shortage", "Quality rework", "Logistics", "Others"
];

export const VAP_SUPPLIERS = [
  "Elite Print & Embro", "ColorTex Dyeing", "Precision Embroidery Co.", "SunPrint Studio"
];

export const TA_STAGES_90 = [
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

export const TA_STAGES_120 = [
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

export const TA_TEMPLATES = { "90": TA_STAGES_90, "120": TA_STAGES_120 };
export const TA_STAGES = TA_STAGES_90;

export const STAGE_ICON_SET_BASE = [
  FileText, ClipboardList, Package, Package, Layers, CheckCircle2, Warehouse, ShieldCheck,
  Layers, CheckCircle2, Shirt, CheckCircle2, Scissors, Palette, Palette, Factory, Shirt,
  Shirt, Shirt, ShieldCheck, FileText, Truck
];

export const COSTING_TEMPLATES = {
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

export function buildCostingRows(templateKey) {
  const tmpl = COSTING_TEMPLATES[templateKey] || COSTING_TEMPLATES.fabric;
  const rows = [];
  tmpl.sections.forEach(sec => {
    if (sec.items.length === 0) {
      rows.push({ label: sec.section, section: sec.section, isHeader: false, price: 0, qty: 1 });
    } else {
      rows.push({ label: sec.section, section: sec.section, isHeader: true });
      sec.items.forEach(item => rows.push({ label: item, section: sec.section, isHeader: false, price: 0, qty: 1 }));
    }
  });
  return rows;
}

export const ORG_STRUCTURE = {
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

export const DEPT_ICONS = {
  "Merchandising": Users, "Program": ClipboardList, "Planning": Calendar, "Purchase – Fabric": Package,
  "Purchase – Trims": Package, "Warehouse": Warehouse, "Testing": ShieldCheck, "Store": Warehouse,
  "Cutting": Scissors, "Production": Factory, "IoT": Radio, "Finishing": Shirt, "Quality": ShieldCheck,
  "Sample": Layers, "CAD": Palette, "Logistics & Documentation": Truck, "VAP": Palette,
  "Compliance & Certification": ShieldCheck,
};

export const DOC_TABS_CONFIG = {
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
export const DOC_TAB_NAMES = Object.keys(DOC_TABS_CONFIG);
export const DOC_TAB_ICONS = {
  "Files": FileText, "Order Sheet": ClipboardList, "BOMs & POs": Package, "Costing": TrendingUp,
  "RM Delivery": Truck, "Sampling": Layers, "Pre-Production": ClipboardCheck, "Production": Factory, "Inspection": ShieldCheck, "Final OCR": CheckCircle2,
};
export const CUSTOMIZABLE_TABS = new Set(["BOMs & POs", "RM Delivery", "Sampling", "Files"]);
export const STAGE_CHAT_TABS = ["RM Delivery", "Sampling", "Inspection", "Final OCR"];

export const TAB_ALLOWED_DEPTS = {
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

export const PRE_PROD_DOC_TYPES = [
  { key: "techPack", label: "Tech Pack", fields: [{ key: "styleNo", label: "Style No." }, { key: "revisionNo", label: "Revision No." }, { key: "constructionNotes", label: "Key construction notes" }] },
  { key: "poSheet", label: "PO Sheet", fields: [{ key: "poNumber", label: "PO Number" }, { key: "poQty", label: "PO Qty", type: "number" }, { key: "poDate", label: "PO Date" }] },
  { key: "programSheet", label: "Program Sheet", fields: [{ key: "cuttingStart", label: "Cutting start date" }, { key: "targetShipWeek", label: "Target ship week" }] },
  { key: "cmtPlanning", label: "CMT Planning", fields: [{ key: "cmtRate", label: "CMT rate / pc ($)", type: "number" }, { key: "targetEfficiency", label: "Target efficiency (%)", type: "number" }, { key: "lineAllocated", label: "Line allocated" }] },
  { key: "accPlanning", label: "ACC Planning", fields: [{ key: "accessoriesList", label: "Key accessories" }, { key: "leadTimeDays", label: "Lead time (days)", type: "number" }] },
  { key: "grading", label: "Grading", fields: [{ key: "gradedSizes", label: "Graded size range" }, { key: "gradeRuleRef", label: "Grade rule reference" }] },
];

export function initPreProd() {
  const obj = {};
  PRE_PROD_DOC_TYPES.forEach(d => { obj[d.key] = { values: {}, status: "draft", approvedBy: null, approvedAt: null }; });
  return obj;
}

export function allPreProdApproved(order) {
  if (!order || !order.preProd) return false;
  return PRE_PROD_DOC_TYPES.every(d => order.preProd[d.key] && order.preProd[d.key].status === "approved");
}

export const HIGHLIGHT_DEPT_OPTIONS = Object.keys(ORG_STRUCTURE);

export function getAllPeopleNames() {
  const names = new Set();
  Object.values(ORG_STRUCTURE).forEach(roles => roles.forEach(r => {
    if (r.name && r.name !== "—") {
      r.name.split(/&|,/).forEach(n => names.add(n.trim()));
    }
  }));
  return Array.from(names).sort();
}
export const ALL_PEOPLE = getAllPeopleNames();

export function firstNamedAssignee(dept) {
  const roles = ORG_STRUCTURE[dept] || [];
  const found = roles.find(r => r.name && r.name !== "—");
  return found ? `${found.name} (${found.title})` : "Unassigned";
}

export function makeStages(template, activeUpto = 0, delayedAt = null) {
  const list = TA_TEMPLATES[template] || TA_STAGES_90;
  return list.map((s, i) => ({
    name: s.name,
    dept: s.dept,
    status: i < activeUpto ? "done" : i === activeUpto ? "in_progress" : "pending",
    assignee: firstNamedAssignee(s.dept),
    reason: delayedAt === i ? REASONS[0] : null,
    planned: s.day,
    supplier: s.dept === "VAP" ? VAP_SUPPLIERS[0] : undefined,
  }));
}

export const ROLE_OPTIONS = [
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

export function buildStaffList() {
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
export const STAFF_LIST = buildStaffList();

export function seedAttendance() {
  const rec = {};
  STAFF_LIST.forEach((s, i) => { rec[s.name] = i % 11 === 0 ? "absent" : i % 13 === 0 ? "leave" : "present"; });
  return rec;
}

export const INITIAL_LEAVE_REQUESTS = [
  { id: 1, name: STAFF_LIST[2] ? STAFF_LIST[2].name : "Staff", dept: STAFF_LIST[2] ? STAFF_LIST[2].dept : "", from: "26 May", to: "27 May", reason: "Personal", status: "pending" },
  { id: 2, name: STAFF_LIST[8] ? STAFF_LIST[8].name : "Staff", dept: STAFF_LIST[8] ? STAFF_LIST[8].dept : "", from: "29 May", to: "31 May", reason: "Family function", status: "pending" },
  { id: 3, name: STAFF_LIST[15] ? STAFF_LIST[15].name : "Staff", dept: STAFF_LIST[15] ? STAFF_LIST[15].dept : "", from: "20 May", to: "20 May", reason: "Medical", status: "approved" },
];

export const ATTENDANCE_STATUS_STYLE = {
  present: { bg: "#E1F5EE", fg: "#085041", label: "Present" },
  absent: { bg: "#FCEBEB", fg: "#791F1F", label: "Absent" },
  leave: { bg: "#FAEEDA", fg: "#633806", label: "On leave" },
};

export const CERT_STATUS_STYLE = {
  not_applied: { bg: "#F0F0F2", fg: "#565A66", label: "Not applied" },
  applied: { bg: "#FAEEDA", fg: "#633806", label: "Applied — pending" },
  approved: { bg: "#E1F5EE", fg: "#085041", label: "Approved" },
};

export const INITIAL_CERTIFICATIONS = [
  { key: "tc", name: "Transaction Certificate (TC)", note: "Per-shipment certificate under the GOTS/OCS chain of custody", status: "applied", file: null },
  { key: "gots", name: "GOTS", note: "Global Organic Textile Standard — annual facility certification", status: "approved", file: null },
  { key: "ocs", name: "OCS", note: "Organic Content Standard — annual facility certification", status: "not_applied", file: null },
];

export const INITIAL_FINANCIALS = {
  revenue: 4415000,
  cogs: 3610000,
  ebitda: 2137000,
  stockValue: 2548000,
  cashFlow: 1236000,
  complianceScore: 96,
};

export const SEASON_OPTIONS = ["AW26", "SS26", "AW27", "SS27"];

export const INITIAL_DEBIT_NOTES = [
  { id: 1, season: "AW26", buyer: "H&M", po: "ST-7788", amount: 4200, reason: "Late shipment penalty", date: "2 Jun" },
  { id: 2, season: "AW26", buyer: "Zara", po: "GKT-1054", amount: 1800, reason: "Quality claim — stitching defect", date: "5 Jun" },
];

export const INITIAL_CAPAS = [
  { id: 1, season: "AW26", buyer: "H&M", po: "ST-7788", issue: "PP approval delay caused late cutting start", action: "Escalate PP samples to buyer within 24 hrs of readiness; weekly follow-up call", status: "in_progress", date: "3 Jun" },
  { id: 2, season: "AW26", buyer: "Uniqlo", po: "JKT-2231", issue: "Trims shortage delayed cutting", action: "Add a 2-week buffer to trims booking for new suppliers", status: "open", date: "6 Jun" },
  { id: 3, season: "SS26", buyer: "M&S", po: "TR-8899", issue: "Minor rework on button attachment", action: "Retrain sewing line on button placement SOP", status: "closed", date: "20 May" },
];

export const CAPA_STATUS_STYLE = {
  open: { bg: "#FCEBEB", fg: "#791F1F", label: "Open" },
  in_progress: { bg: "#FAEEDA", fg: "#633806", label: "In progress" },
  closed: { bg: "#E1F5EE", fg: "#085041", label: "Closed" },
};

export const RISK_DELAY_DAYS = { high: 3, medium: 2, low: 1 };

export const INITIAL_ORDERS = [
  { id: "GKT-1054", buyer: "Zara", country: "Spain", season: "AW26", style: "Hoodie", qty: 12500, ship: "20 May", risk: "high", status: "At Risk", activeUpto: 10, delayedAt: 10 },
  { id: "ST-7788", buyer: "H&M", country: "Sweden", season: "AW26", style: "T-Shirt", qty: 8000, ship: "18 May", risk: "high", status: "Delayed", activeUpto: 5, delayedAt: 5 },
  { id: "JKT-2231", buyer: "Uniqlo", country: "Japan", season: "AW26", style: "Jacket", qty: 6200, ship: "22 May", risk: "medium", status: "At Risk", activeUpto: 7, delayedAt: null },
  { id: "TR-8899", buyer: "M&S", country: "United Kingdom", season: "SS26", style: "Trouser", qty: 4500, ship: "25 May", risk: "medium", status: "On Track", activeUpto: 13, delayedAt: null },
  { id: "DR-5566", buyer: "Next", country: "United Kingdom", season: "SS26", style: "Dress", qty: 5300, ship: "23 May", risk: "medium", status: "Delayed", activeUpto: 8, delayedAt: 8 },
  { id: "PL-3321", buyer: "Zara", country: "Spain", season: "SS26", style: "Polo", qty: 9100, ship: "28 May", risk: "low", status: "On Track", activeUpto: 15, delayedAt: null },
];
