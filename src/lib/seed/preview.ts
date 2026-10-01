import { addDays, addMonths, format, subDays, subMonths } from "date-fns";
import { mulberry32 } from "./random";
import type {
  CashFlowMonth,
  ChartOfAccount,
  Contact,
  Employee,
  ExpenseClaim,
  GoodsReceipt,
  Invoice,
  Lead,
  LeaveRequest,
  Milestone,
  PayrollRun,
  PurchaseOrder,
  PurchaseRequest,
  Project,
  SiteLog,
  Supplier,
  Tender,
  Timesheet,
  VariationOrder,
} from "@/lib/types";

export interface PreviewSeed {
  purchaseRequests: PurchaseRequest[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts: GoodsReceipt[];
  milestones: Milestone[];
  siteLogs: SiteLog[];
  variations: VariationOrder[];
  chartOfAccounts: ChartOfAccount[];
  invoices: Invoice[];
  expenseClaims: ExpenseClaim[];
  timesheets: Timesheet[];
  leaveRequests: LeaveRequest[];
  payrollRuns: PayrollRun[];
  contacts: Contact[];
  leads: Lead[];
  tenders: Tender[];
  cashFlow: CashFlowMonth[];
}

const day = (offset: number, base: Date): string => format(addDays(base, offset), "yyyy-MM-dd");

const PR_PURPOSES = [
  "Level 14–18 curtain wall brackets and fixings",
  "Additional rebar supply for transfer slab pour",
  "Replacement tower crane diesel and filters",
  "Precast stair core units — delivery slots 3–5",
  "MEP first fix materials for civic centre",
  "Scaffold erection — east elevation zones C–F",
  "Waterproofing membrane for podium roof",
  "Safety barrier and edge protection restock",
  "Ready-mix concrete C40/50 for platform slab",
  "Aggregate and cement for track bed works",
  "Temporary lighting and power distribution units",
  "Piling rig spares and cutting discs",
  "Drainage pipework and manhole rings",
  "Site welfare unit servicing and cleaning",
];

const REQUESTORS = [
  "usr_engineer",
  "usr_engineer",
  "usr_procurement",
  "usr_procurement_2",
  "usr_approver",
];

const REQUEST_STATUSES: PurchaseRequest["status"][] = [
  "approved",
  "submitted",
  "under_review",
  "ordered",
  "approved",
  "rejected",
  "approved",
  "submitted",
];

export function buildPreviewSeed(
  projects: readonly Project[],
  suppliers: readonly Supplier[],
  employees: readonly Employee[],
  clients: readonly { id: string }[],
  now: Date = new Date(),
): PreviewSeed {
  const rng = mulberry32(778811);
  const activeProjects = projects.filter((project) => project.status === "active");
  const allProjects = projects;

  const purchaseRequests: PurchaseRequest[] = Array.from({ length: 14 }, (_, index) => {
    const project = rng.pick(allProjects);
    const status = REQUEST_STATUSES[index % REQUEST_STATUSES.length];
    const supplier = rng.pick(suppliers);
    const requested = subDays(now, index * 2 + 1);
    const neededBy = addDays(requested, rng.int(7, 28));
    return {
      id: `pr_${String(index + 1).padStart(3, "0")}`,
      ref: `PR-2026-${String(410 + index).padStart(4, "0")}`,
      projectId: project.id,
      supplierId: status === "ordered" ? supplier.id : rng.chance(0.5) ? supplier.id : null,
      requestedByUserId: rng.pick(REQUESTORS),
      requestedDate: format(requested, "yyyy-MM-dd"),
      neededByDate: format(neededBy, "yyyy-MM-dd"),
      status,
      estimatedTotal: rng.decimal(4000, 920000, 2),
      itemCount: rng.int(1, 14),
      urgency: index % 5 === 0 ? "high" : index % 3 === 0 ? "normal" : "low",
      approverUserId: ["approved", "ordered"].includes(status) ? "usr_approver" : null,
      purpose: PR_PURPOSES[index % PR_PURPOSES.length],
    };
  });

  const PO_STATUSES: PurchaseOrder["status"][] = [
    "issued",
    "partially_received",
    "received",
    "issued",
    "partially_received",
    "received",
    "cancelled",
    "issued",
  ];

  const purchaseOrders: PurchaseOrder[] = Array.from({ length: 12 }, (_, index) => {
    const subtotal = rng.int(8, 780) * 1000 + Number(rng.decimal(0, 999, 2));
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const status = PO_STATUSES[index % PO_STATUSES.length];
    const project = rng.pick(activeProjects);
    const issued = subDays(now, index * 4 + 2);
    return {
      id: `po_${String(index + 1).padStart(3, "0")}`,
      ref: `PO-2026-${String(1180 + index).padStart(4, "0")}`,
      supplierId: rng.pick(suppliers).id,
      projectId: project.id,
      purchaseRequestId: index % 2 === 0 ? `pr_${String(index + 1).padStart(3, "0")}` : null,
      issuedDate: format(issued, "yyyy-MM-dd"),
      expectedDate: format(addDays(issued, rng.int(10, 45)), "yyyy-MM-dd"),
      status,
      subtotal: subtotal.toFixed(2),
      taxAmount: tax.toFixed(2),
      total: (subtotal + tax).toFixed(2),
      currency: "USD",
      lineCount: rng.int(2, 18),
      receivedPercent:
        status === "received" ? 100 : status === "partially_received" ? rng.int(25, 85) : 0,
    };
  });

  const INSPECTION_RESULTS: GoodsReceipt["inspectionResult"][] = [
    "passed",
    "passed_with_notes",
    "passed",
    "failed",
  ];

  const goodsReceipts: GoodsReceipt[] = purchaseOrders
    .filter((order) => order.status !== "cancelled")
    .slice(0, 8)
    .map((order, index) => ({
      id: `grn_${String(index + 1).padStart(3, "0")}`,
      ref: `GRN-2026-${String(660 + index).padStart(4, "0")}`,
      purchaseOrderId: order.id,
      projectId: order.projectId,
      supplierId: order.supplierId,
      receivedDate: format(subDays(now, index * 3 + 1), "yyyy-MM-dd"),
      receivedByUserId: rng.pick(["usr_engineer", "usr_procurement", "usr_procurement_2"]),
      lineCount: rng.int(1, order.lineCount),
      acceptedValue: order.subtotal,
      rejectedLines: index % 4 === 3 ? rng.int(1, 3) : 0,
      inspectionResult: INSPECTION_RESULTS[index % INSPECTION_RESULTS.length],
      status: index % 3 === 0 ? "pending_inspection" : index % 3 === 1 ? "inspected" : "posted",
    }));

  const MILESTONE_TEMPLATES: [string, string, number][] = [
    ["Substructure complete", "Substructure", 18],
    ["Tower core to roof level", "Structure", 12],
    ["Envelope handover", "Envelope", 10],
    ["MEP first fix complete", "MEP", 9],
    ["MEP second fix complete", "MEP", 9],
    ["Internal fit-out level 10", "Fit-out", 6],
    ["Commissioning & testing", "Commissioning", 5],
    ["Practical completion", "Handover", 4],
    ["Defects liability start", "Handover", 2],
    ["Piling platform A", "Substructure", 15],
    ["Track bed completion", "Civil", 8],
  ];

  const milestones: Milestone[] = MILESTONE_TEMPLATES.map(([name, phase, weight], index) => {
    const project = allProjects[index % allProjects.length];
    const status: Milestone["status"] =
      index < 3 ? "done" : index < 6 ? "in_progress" : index === 7 ? "blocked" : "not_started";
    const progress = status === "done" ? 100 : status === "in_progress" ? rng.int(20, 85) : 0;
    return {
      id: `ms_${String(index + 1).padStart(3, "0")}`,
      ref: `MS-${project.code.slice(4)}-${String(index + 1).padStart(2, "0")}`,
      projectId: project.id,
      name,
      phase,
      dueDate: format(addDays(now, (index - 4) * 21), "yyyy-MM-dd"),
      status,
      weightPercent: weight,
      progressPercent: progress,
      ownerEmployeeId: project.siteManagerEmployeeId,
    };
  });

  const WEATHER = ["Clear 24°C", "Cloudy 19°C", "Light rain 16°C", "Windy 21°C", "Hot 34°C", "Overcast 18°C"];

  const siteLogs: SiteLog[] = Array.from({ length: 14 }, (_, index) => {
    const project = rng.pick(allProjects);
    const date = day(-index - 1, now);
    const status: SiteLog["status"] = index === 0 ? "draft" : index % 4 === 0 ? "approved" : "submitted";
    return {
      id: `log_${String(index + 1).padStart(3, "0")}`,
      ref: `DL-${project.code.slice(4)}-${String(index + 1).padStart(3, "0")}`,
      projectId: project.id,
      date,
      weather: WEATHER[index % WEATHER.length],
      crewOnSite: rng.int(14, 68),
      totalManHours: rng.decimal(96, 512, 2),
      delays: index % 3 === 0 ? "Crane wind hold — 2.5 h" : "None",
      safetyIncidents: index === 2 || index === 9 ? 1 : 0,
      submittedByUserId: "usr_engineer",
      status,
    };
  });

  const VARIATION_TITLES = [
    "Additional basement waterproofing extent",
    "Client design change — lobby feature wall",
    "Omission of basement parking bay 44",
    "Escalator length increase at concourse",
    "Additional fire-rated separation to plant room",
    "Price adjustment on steel (index clause 7.2)",
  ];

  const variations: VariationOrder[] = VARIATION_TITLES.map((title, index) => {
    const project = rng.pick(allProjects);
    const status: VariationOrder["status"] =
      index % 3 === 0 ? "approved" : index % 3 === 1 ? "submitted" : "draft";
    return {
      id: `vo_${String(index + 1).padStart(3, "0")}`,
      ref: `VO-${project.code.slice(4)}-${String(index + 1).padStart(2, "0")}`,
      projectId: project.id,
      title,
      variationType: index % 3 === 0 ? "addition" : index % 3 === 1 ? "omission" : "price_adjustment",
      status,
      submittedDate: day(-(index * 6 + 3), now),
      valueImpact: rng.decimal(4000, 96000, 2),
      timeImpactDays: rng.int(0, 24),
      requestedByUserId: "usr_engineer",
    };
  });

  const ACCOUNTS: [string, string, ChartOfAccount["type"], string | null][] = [
    ["1000", "Cash at bank", "asset", null],
    ["1100", "Trade receivables", "asset", null],
    ["1200", "Retention receivable", "asset", null],
    ["1300", "Prepayments", "asset", null],
    ["2000", "Trade payables", "liability", null],
    ["2100", "Accruals", "liability", null],
    ["2200", "Retention payable", "liability", null],
    ["3000", "Share capital", "equity", null],
    ["3100", "Retained earnings", "equity", null],
    ["4000", "Contract revenue", "income", null],
    ["5000", "Site establishment", "cost", null],
    ["5100", "Direct labour", "cost", "5000"],
    ["5200", "Materials", "cost", "5000"],
    ["5300", "Subcontractors", "cost", "5000"],
    ["5400", "Plant & equipment", "cost", "5000"],
    ["5500", "Professional fees", "cost", "5000"],
    ["6000", "Admin overheads", "cost", null],
    ["6100", "Salaries & wages", "cost", "6000"],
  ];

  const ACCOUNT_BALANCES: Record<string, string> = {
    "1000": "482150.40",
    "1100": "1506150.00",
    "1200": "268000.00",
    "1300": "96120.75",
    "2000": "724380.00",
    "2100": "188400.00",
    "2200": "196500.00",
    "3000": "500000.00",
    "3100": "421540.15",
    "4000": "8450000.00",
    "5000": "6137200.00",
    "6000": "724380.00",
  };

  const chartOfAccounts: ChartOfAccount[] = ACCOUNTS.map(
    ([code, name, type, parentCode], index) => ({
      id: `coa_${code}`,
      code,
      name,
      type,
      parentCode,
      balance:
        ACCOUNT_BALANCES[code] ??
        (type === "cost" ? `${(rng.int(20, 900) * 1000 + index).toFixed(2)}` : "0.00"),
      currency: "USD",
      active: index !== 12,
    }),
  );

  const INVOICE_STATUSES: Invoice["status"][] = [
    "paid",
    "sent",
    "partially_paid",
    "overdue",
    "sent",
    "overdue",
    "draft",
    "paid",
  ];

  const invoices: Invoice[] = Array.from({ length: 10 }, (_, index) => {
    const project = rng.pick(allProjects);
    const client = clients.find((item) => item.id === project.clientId) ?? clients[0];
    const subtotal = rng.int(60, 1400) * 1000 + Number(rng.decimal(0, 999, 2));
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;
    const status = INVOICE_STATUSES[index % INVOICE_STATUSES.length];
    const issue = subDays(now, index * 12 + 4);
    const paid = status === "paid" ? total : status === "partially_paid" ? Math.round(total * 0.4 * 100) / 100 : 0;
    return {
      id: `inv_${String(index + 1).padStart(3, "0")}`,
      ref: `INV-2026-${String(2200 + index).padStart(4, "0")}`,
      clientId: client.id,
      projectId: project.id,
      issueDate: format(issue, "yyyy-MM-dd"),
      dueDate: format(addDays(issue, client.id === "cli_0001" ? 45 : 30), "yyyy-MM-dd"),
      status,
      subtotal: subtotal.toFixed(2),
      taxAmount: tax.toFixed(2),
      total: total.toFixed(2),
      amountPaid: paid.toFixed(2),
      retentionAmount: (Math.round(subtotal * 0.05 * 100) / 100).toFixed(2),
      currency: "USD",
    };
  });

  const EXPENSE_PURPOSES = [
    "Site vehicle fuel and tolls",
    "Permit renewal — lane closure",
    "Subcontractor mobilisation",
    "Survey equipment hire",
    "Client-requested additional design",
    "Site laboratory testing",
    "Travel to client workshop",
    "Temporary accommodation",
    "Equipment calibration",
    "Documentation and drawing issue",
    "Consumable PPE restock",
    "Insurance excess on claim",
  ];

  const expenseClaims: ExpenseClaim[] = Array.from({ length: 12 }, (_, index) => {
    const employee = rng.pick(employees);
    const project = rng.pick(allProjects);
    const status: ExpenseClaim["status"] = index % 3 === 0 ? "approved" : index % 3 === 1 ? "submitted" : "reimbursed";
    return {
      id: `exp_${String(index + 1).padStart(3, "0")}`,
      ref: `EXP-2026-${String(530 + index).padStart(4, "0")}`,
      employeeId: employee.id,
      projectId: project.id,
      claimDate: day(-(index * 2 + 1), now),
      category: index % 4 === 0 ? "materials" : index % 4 === 1 ? "overhead" : "professional_fees",
      description: EXPENSE_PURPOSES[index % EXPENSE_PURPOSES.length],
      amount: rng.decimal(45, 9800, 2),
      status,
      approverUserId: status === "submitted" ? null : rng.pick(["usr_approver", "usr_hr"]),
      receiptAttached: index % 5 !== 0,
    };
  });

  const timesheets: Timesheet[] = Array.from({ length: 12 }, (_, index) => {
    const employee = rng.pick(employees);
    const weekStart = subDays(now, (index % 6) * 7 + 7);
    return {
      id: `ts_${String(index + 1).padStart(3, "0")}`,
      ref: `TS-${format(weekStart, "yyyy-'W'ww")}-${employee.employeeNo}`,
      employeeId: employee.id,
      projectId: employee.projectId ?? rng.pick(activeProjects).id,
      weekStart: format(weekStart, "yyyy-MM-dd"),
      weekEnd: format(addDays(weekStart, 6), "yyyy-MM-dd"),
      regularHours: rng.decimal(28, 48, 1),
      overtimeHours: rng.decimal(0, 12, 1),
      submittedDate: format(addDays(weekStart, 7), "yyyy-MM-dd"),
      status: index % 3 === 0 ? "approved" : index % 3 === 1 ? "submitted" : "draft",
    };
  });

  const LEAVE_TYPES: LeaveRequest["leaveType"][] = ["annual", "sick", "unpaid", "annual"];
  const leaveRequests: LeaveRequest[] = Array.from({ length: 8 }, (_, index) => {
    const employee = rng.pick(employees);
    const start = addDays(now, rng.int(-40, 25));
    return {
      id: `lv_${String(index + 1).padStart(3, "0")}`,
      ref: `LV-2026-${String(310 + index).padStart(4, "0")}`,
      employeeId: employee.id,
      leaveType: LEAVE_TYPES[index % LEAVE_TYPES.length],
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(addDays(start, rng.int(1, 9)), "yyyy-MM-dd"),
      days: String(rng.int(1, 9)),
      reason: rng.pick([
        "Family holiday",
        "Medical appointment and recovery",
        "Personal circumstances",
        "Annual leave carry-over",
        "Compassionate leave",
      ]),
      status: index % 4 === 0 ? "pending" : index % 4 === 1 ? "approved" : index % 4 === 2 ? "rejected" : "cancelled",
      approverUserId: index % 4 === 0 ? null : "usr_hr",
    };
  });

  const payrollRuns: PayrollRun[] = [
    {
      id: "pay_001",
      ref: "PR-2026-01",
      period: format(subMonths(now, 2), "MMMM yyyy"),
      payDate: format(subDays(subMonths(now, 2), 0), "yyyy-MM-dd"),
      employeeCount: 8,
      grossTotal: "48210.55",
      deductionsTotal: "3011.40",
      netTotal: "45199.15",
      status: "paid",
    },
    {
      id: "pay_002",
      ref: "PR-2026-02",
      period: format(subMonths(now, 1), "MMMM yyyy"),
      payDate: format(subDays(subMonths(now, 1), 0), "yyyy-MM-dd"),
      employeeCount: 8,
      grossTotal: "49780.90",
      deductionsTotal: "3395.12",
      netTotal: "46385.78",
      status: "approved",
    },
    {
      id: "pay_003",
      ref: "PR-2026-03",
      period: format(subMonths(now, 0), "MMMM yyyy"),
      payDate: format(addDays(now, 6), "yyyy-MM-dd"),
      employeeCount: 8,
      grossTotal: "50345.20",
      deductionsTotal: "3610.08",
      netTotal: "46735.12",
      status: "in_review",
    },
  ];

  const contacts: Contact[] = [
    {
      id: "con_001",
      clientId: "cli_0001",
      name: "Rachel Osei",
      jobTitle: "Development Director",
      email: "rachel.osei@meridiandev.example",
      phone: "+1 512 555 0301",
      isPrimary: true,
      decisionRole: "decision_maker",
    },
    {
      id: "con_002",
      clientId: "cli_0001",
      name: "Colin Meadows",
      jobTitle: "Cost Consultant",
      email: "colin.meadows@meadw.example",
      phone: "+1 512 555 0302",
      isPrimary: false,
      decisionRole: "finance",
    },
    {
      id: "con_003",
      clientId: "cli_0001",
      name: "Ingrid Solberg",
      jobTitle: "Project Architect",
      email: "ingrid.solberg@meridiandev.example",
      phone: "+1 512 555 0303",
      isPrimary: false,
      decisionRole: "technical",
    },
    {
      id: "con_004",
      clientId: "cli_0002",
      name: "Daniel Whitfield",
      jobTitle: "Programme Manager",
      email: "daniel.whitfield@halcyoninfra.example",
      phone: "+1 614 555 0444",
      isPrimary: true,
      decisionRole: "decision_maker",
    },
    {
      id: "con_005",
      clientId: "cli_0002",
      name: "Beatrice Lam",
      jobTitle: "Commercial Manager",
      email: "beatrice.lam@halcyoninfra.example",
      phone: "+1 614 555 0445",
      isPrimary: false,
      decisionRole: "finance",
    },
    {
      id: "con_006",
      clientId: "cli_0002",
      name: "Farid Nasser",
      jobTitle: "Site Inspector",
      email: "farid.nasser@halcyoninfra.example",
      phone: "+1 614 555 0446",
      isPrimary: false,
      decisionRole: "site",
    },
  ];

  const LEAD_COMPANIES = [
    "Northbank Academies Trust",
    "Cedar Grove Retirement Living",
    "Kestrel Logistics Park",
    "Riverport Data Centre",
    "Ashfield Medical Campus",
    "Lakeside Hotels Group",
    "Westfield Distribution Hub",
    "Summit Sports Arena",
  ];

  const LEAD_STAGES: Lead["stage"][] = [
    "enquiry",
    "qualification",
    "estimating",
    "tendering",
    "tendering",
    "won",
    "lost",
    "qualification",
  ];

  const leads: Lead[] = LEAD_COMPANIES.map((companyName, index) => {
    const stage = LEAD_STAGES[index];
    return {
      id: `lead_${String(index + 1).padStart(3, "0")}`,
      ref: `LD-2026-${String(90 + index).padStart(4, "0")}`,
      companyName,
      contactName: rng.pick([
        "Helen Barrett",
        "Samuel Ojo",
        "Margit Lindqvist",
        "Anthony Ruiz",
        "Priya Menon",
        "Duncan Hayes",
        "Lucia Ferrari",
        "Samuel Adeyemi",
      ]),
      source: rng.pick(["referral", "tender", "website", "repeat_client", "cold_call"]),
      stage,
      estimatedValue: `${rng.int(4, 260) * 100000}.00`,
      probabilityPercent:
        stage === "won" ? 100 : stage === "lost" ? 0 : rng.int(15, 75),
      expectedStart: format(addMonths(now, rng.int(2, 18)), "yyyy-MM-dd"),
      ownerUserId: rng.pick(["usr_approver", "usr_admin", "usr_engineer"]),
      city: rng.pick(["Denver, CO", "Nashville, TN", "Raleigh, NC", "Phoenix, AZ", "Portland, OR"]),
      nextAction: rng.pick([
        "Schedule technical walkthrough",
        "Issue revised cost plan",
        "Chase tender clarifications",
        "Confirm bond availability",
        "Follow up on pre-qualification",
      ]),
    };
  });

  const tenders: Tender[] = [
    {
      id: "tnd_001",
      ref: "TND-2026-11",
      projectName: "Riverport Data Centre — Phase 1",
      clientId: "cli_0002",
      tenderCloseDate: day(18, now),
      submissionDate: null,
      status: "preparing",
      bidValue: "18400000.00",
      estimatedCost: "16120000.00",
      documentsComplete: 14,
      documentsRequired: 19,
      ownerUserId: "usr_approver",
    },
    {
      id: "tnd_002",
      ref: "TND-2026-12",
      projectName: "Northbank Academies — Block C",
      clientId: "cli_0001",
      tenderCloseDate: day(-6, now),
      submissionDate: day(-9, now),
      status: "submitted",
      bidValue: "6400000.00",
      estimatedCost: "5720000.00",
      documentsComplete: 21,
      documentsRequired: 21,
      ownerUserId: "usr_approver",
    },
    {
      id: "tnd_003",
      ref: "TND-2026-13",
      projectName: "Cedar Grove Retirement Living",
      clientId: "cli_0001",
      tenderCloseDate: day(-24, now),
      submissionDate: day(-27, now),
      status: "won",
      bidValue: "9750000.00",
      estimatedCost: "8560000.00",
      documentsComplete: 24,
      documentsRequired: 24,
      ownerUserId: "usr_admin",
    },
    {
      id: "tnd_004",
      ref: "TND-2026-14",
      projectName: "Kestrel Logistics Park — Enabling Works",
      clientId: "cli_0002",
      tenderCloseDate: day(31, now),
      submissionDate: null,
      status: "preparing",
      bidValue: "4260000.00",
      estimatedCost: "3980000.00",
      documentsComplete: 9,
      documentsRequired: 19,
      ownerUserId: "usr_engineer",
    },
    {
      id: "tnd_005",
      ref: "TND-2026-15",
      projectName: "Ashfield Medical Campus — Ward Block",
      clientId: "cli_0001",
      tenderCloseDate: day(-52, now),
      submissionDate: day(-55, now),
      status: "lost",
      bidValue: "15200000.00",
      estimatedCost: "13400000.00",
      documentsComplete: 20,
      documentsRequired: 20,
      ownerUserId: "usr_approver",
    },
  ];

  const cashFlow: CashFlowMonth[] = allProjects.flatMap((project, projectIndex) =>
    Array.from({ length: 6 }, (_, index) => {
      const month = subMonths(now, 5 - index);
      const opening = index === 0 ? 0 : 0;
      const inflow = project.status === "planning" ? 0 : rng.int(40, 640) * 1000;
      const outflow = rng.int(180, 920) * 1000;
      const balance = rng.int(-420, 380) * 1000;
      return {
        id: `cf_${projectIndex}_${index}`,
        period: format(month, "yyyy-MM"),
        projectId: project.id,
        inflow: inflow.toFixed(2),
        outflow: outflow.toFixed(2),
        openingBalance: (opening + rng.int(0, 120) * 1000).toFixed(2),
        closingBalance: (balance).toFixed(2),
        forecast: index >= 4,
      };
    }),
  );

  return {
    purchaseRequests,
    purchaseOrders,
    goodsReceipts,
    milestones,
    siteLogs,
    variations,
    chartOfAccounts,
    invoices,
    expenseClaims,
    timesheets,
    leaveRequests,
    payrollRuns,
    contacts,
    leads,
    tenders,
    cashFlow,
  };
}
