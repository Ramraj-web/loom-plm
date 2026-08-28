export const RESOURCE_SEEDS = {
  orders: [
    { id: "GKT-1054", buyer: "Zara", country: "Spain", season: "AW26", style: "Hoodie", qty: 12500, ship: "20 May", risk: "high", status: "At Risk" },
    { id: "ST-7788", buyer: "H&M", country: "Sweden", season: "AW26", style: "T-Shirt", qty: 8000, ship: "18 May", risk: "high", status: "Delayed" },
    { id: "JKT-2231", buyer: "Uniqlo", country: "Japan", season: "AW26", style: "Jacket", qty: 6200, ship: "22 May", risk: "medium", status: "At Risk" },
    { id: "TR-8899", buyer: "M&S", country: "United Kingdom", season: "SS26", style: "Trouser", qty: 4500, ship: "25 May", risk: "medium", status: "On Track" },
    { id: "DR-5566", buyer: "Next", country: "United Kingdom", season: "SS26", style: "Dress", qty: 5300, ship: "23 May", risk: "medium", status: "Delayed" },
    { id: "PL-3321", buyer: "Zara", country: "Spain", season: "SS26", style: "Polo", qty: 9100, ship: "28 May", risk: "low", status: "On Track" },
  ],
  staff: [
    { id: "staff-arasinth-raja", name: "Arasinth Raja", title: "Manager", dept: "Merchandising", status: "present" },
    { id: "staff-suresh", name: "Suresh", title: "Senior", dept: "Merchandising", status: "present" },
    { id: "staff-selva-kumar", name: "Selva Kumar", title: "Senior", dept: "Purchase – Fabric", status: "present" },
    { id: "staff-shankar", name: "Shankar", title: "Senior", dept: "Purchase – Trims", status: "present" },
    { id: "staff-viswa", name: "Viswa", title: "Manager", dept: "Sample", status: "present" },
    { id: "staff-sezhiyan", name: "Sezhiyan", title: "DGM", dept: "Quality", status: "present" },
    { id: "staff-durai", name: "Durai", title: "Manager", dept: "Cutting", status: "present" },
    { id: "staff-praveen-kumar", name: "Praveen Kumar", title: "FM", dept: "Production", status: "present" },
    { id: "staff-gopal", name: "Gopal", title: "Finishing Incharge", dept: "Finishing", status: "present" },
    { id: "staff-srinivasan", name: "Srinivasan", title: "Senior", dept: "Logistics & Documentation", status: "present" },
  ],
  leaveRequests: [
    { id: "leave-1", name: "Suresh", dept: "Merchandising", from: "26 May", to: "27 May", reason: "Personal", status: "pending" },
    { id: "leave-2", name: "Selva Kumar", dept: "Purchase – Fabric", from: "29 May", to: "31 May", reason: "Family function", status: "pending" },
  ],
  financials: [{ id: "current", revenue: 4415000, cogs: 0, ebitda: 820000, cashFlow: 1236000, stockValue: 2548000, complianceScore: 96.3 }],
  certifications: [
    { id: "tc", name: "Transaction Certificate (TC)", note: "Per-shipment chain of custody", status: "applied", file: null },
    { id: "gots", name: "GOTS", note: "Annual facility certification", status: "approved", file: null },
    { id: "ocs", name: "OCS", note: "Organic content certification", status: "not_applied", file: null },
  ],
  debitNotes: [
    { id: "debit-1", season: "AW26", buyer: "H&M", po: "ST-7788", amount: 4200, reason: "Late shipment penalty", date: "2 Jun" },
    { id: "debit-2", season: "AW26", buyer: "Zara", po: "GKT-1054", amount: 1800, reason: "Quality claim", date: "5 Jun" },
  ],
  capas: [
    { id: "capa-1", season: "AW26", buyer: "H&M", po: "ST-7788", issue: "PP approval delay", action: "Escalate samples within 24 hrs", status: "in_progress", date: "3 Jun" },
    { id: "capa-2", season: "AW26", buyer: "Uniqlo", po: "JKT-2231", issue: "Trims shortage", action: "Add supplier lead-time buffer", status: "open", date: "6 Jun" },
  ],
};