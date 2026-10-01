import type { Money } from "@/lib/money";

export type Role =
  | "site_engineer"
  | "procurement_officer"
  | "approver"
  | "hr_manager"
  | "admin";

export type SectionStatus = "live" | "planned";

export type Currency = "USD" | "AED" | "SAR" | "EUR" | "GBP";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  jobTitle: string;
  employeeId: string | null;
  active: boolean;
}

export type EmployeeStatus = "active" | "on_leave" | "probation" | "inactive";

export interface Employee {
  id: string;
  employeeNo: string;
  name: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: Department;
  projectId: string | null;
  email: string;
  phone: string;
  nationality: string;
  status: EmployeeStatus;
  employmentType: "full_time" | "contract" | "subcontract";
  joinedOn: string;
  baseMonthlySalary: Money;
  bankAccountLast4: string;
  certifications: string[];
}

export type Department =
  | "site"
  | "procurement"
  | "finance"
  | "hr"
  | "commercial"
  | "health_safety";

export type ClientStatus = "active" | "prospect" | "on_hold";

export interface Client {
  id: string;
  code: string;
  companyName: string;
  sector: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  billingAddress: string;
  city: string;
  country: string;
  taxId: string;
  currency: Currency;
  paymentTermsDays: number;
  creditLimit: Money;
  outstandingBalance: Money;
  status: ClientStatus;
  relationshipSince: string;
  projectIds: string[];
  accountManagerUserId: string;
  notes: string;
}

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed";

export type ProjectType = "residential" | "commercial" | "infrastructure" | "fit_out";

export interface Project {
  id: string;
  code: string;
  name: string;
  clientId: string;
  type: ProjectType;
  status: ProjectStatus;
  siteAddress: string;
  city: string;
  country: string;
  contractValue: Money;
  retentionPercent: string;
  startDate: string;
  endDate: string;
  progressPercent: number;
  siteManagerEmployeeId: string;
  engineerEmployeeIds: string[];
  budgetLines: BudgetLine[];
  description: string;
}

export type BudgetCategory =
  | "labour"
  | "materials"
  | "equipment"
  | "subcontractors"
  | "professional_fees"
  | "permits"
  | "contingency"
  | "overhead";

export interface BudgetLine {
  id: string;
  projectId: string;
  code: string;
  category: BudgetCategory;
  description: string;
  budgetAmount: Money;
  committedAmount: Money;
  actualAmount: Money;
}

export type SupplierStatus = "approved" | "under_review" | "suspended";

export interface Supplier {
  id: string;
  code: string;
  name: string;
  categories: string[];
  contactName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  taxId: string;
  status: SupplierStatus;
  rating: number;
  onTimeDeliveryPercent: number;
  qualityRejectPercent: number;
  paymentTermsDays: number;
  totalSpend: Money;
  openPurchaseOrderCount: number;
  bankVerified: boolean;
  insuranceExpiry: string;
}

export type AttendanceStatus = "present" | "late" | "absent" | "leave" | "holiday";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  projectId: string | null;
  date: string;
  status: AttendanceStatus;
  checkIn: string | null;
  checkOut: string | null;
  regularHours: string;
  overtimeHours: string;
  note: string | null;
}

export type AuditSeverity = "info" | "warning" | "critical";

export interface AuditEntry {
  id: string;
  at: string;
  actorUserId: string;
  actorName: string;
  actorRole: Role;
  action: string;
  entity: string;
  entityId: string;
  entityLabel: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  summary: string;
  severity: AuditSeverity;
}

export type PurchaseRequestStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "ordered";

export interface PurchaseRequest {
  id: string;
  ref: string;
  projectId: string;
  supplierId: string | null;
  requestedByUserId: string;
  requestedDate: string;
  neededByDate: string;
  status: PurchaseRequestStatus;
  estimatedTotal: Money;
  itemCount: number;
  urgency: "low" | "normal" | "high";
  approverUserId: string | null;
  purpose: string;
}

export type PurchaseOrderStatus =
  | "draft"
  | "issued"
  | "partially_received"
  | "received"
  | "cancelled";

export interface PurchaseOrder {
  id: string;
  ref: string;
  supplierId: string;
  projectId: string;
  purchaseRequestId: string | null;
  issuedDate: string;
  expectedDate: string;
  status: PurchaseOrderStatus;
  subtotal: Money;
  taxAmount: Money;
  total: Money;
  currency: Currency;
  lineCount: number;
  receivedPercent: number;
}

export interface Milestone {
  id: string;
  ref: string;
  projectId: string;
  name: string;
  phase: string;
  dueDate: string;
  status: "not_started" | "in_progress" | "blocked" | "done";
  weightPercent: number;
  progressPercent: number;
  ownerEmployeeId: string;
}

export interface SiteLog {
  id: string;
  ref: string;
  projectId: string;
  date: string;
  weather: string;
  crewOnSite: number;
  totalManHours: string;
  delays: string;
  safetyIncidents: number;
  submittedByUserId: string;
  status: "draft" | "submitted" | "approved";
}

export interface VariationOrder {
  id: string;
  ref: string;
  projectId: string;
  title: string;
  variationType: "addition" | "omission" | "price_adjustment";
  status: "draft" | "submitted" | "approved" | "rejected";
  submittedDate: string;
  valueImpact: Money;
  timeImpactDays: number;
  requestedByUserId: string;
}

export interface GoodsReceipt {
  id: string;
  ref: string;
  purchaseOrderId: string;
  projectId: string;
  supplierId: string;
  receivedDate: string;
  receivedByUserId: string;
  lineCount: number;
  acceptedValue: Money;
  rejectedLines: number;
  inspectionResult: "passed" | "passed_with_notes" | "failed";
  status: "pending_inspection" | "inspected" | "posted";
}

export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "income" | "cost" | "equity";
  parentCode: string | null;
  balance: Money;
  currency: Currency;
  active: boolean;
}

export interface Invoice {
  id: string;
  ref: string;
  clientId: string;
  projectId: string;
  issueDate: string;
  dueDate: string;
  status: "draft" | "sent" | "partially_paid" | "paid" | "overdue";
  subtotal: Money;
  taxAmount: Money;
  total: Money;
  amountPaid: Money;
  retentionAmount: Money;
  currency: Currency;
}

export interface ExpenseClaim {
  id: string;
  ref: string;
  employeeId: string;
  projectId: string;
  claimDate: string;
  category: BudgetCategory;
  description: string;
  amount: Money;
  status: "submitted" | "approved" | "rejected" | "reimbursed";
  approverUserId: string | null;
  receiptAttached: boolean;
}

export interface Timesheet {
  id: string;
  ref: string;
  employeeId: string;
  projectId: string;
  weekStart: string;
  weekEnd: string;
  regularHours: string;
  overtimeHours: string;
  submittedDate: string;
  status: "draft" | "submitted" | "approved" | "rejected";
}

export interface LeaveRequest {
  id: string;
  ref: string;
  employeeId: string;
  leaveType: "annual" | "sick" | "unpaid" | "compassionate";
  startDate: string;
  endDate: string;
  days: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  approverUserId: string | null;
}

export interface PayrollRun {
  id: string;
  ref: string;
  period: string;
  payDate: string;
  employeeCount: number;
  grossTotal: Money;
  deductionsTotal: Money;
  netTotal: Money;
  status: "draft" | "in_review" | "approved" | "paid";
}

export interface Contact {
  id: string;
  clientId: string;
  name: string;
  jobTitle: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  decisionRole: "decision_maker" | "technical" | "finance" | "site";
}

export interface Lead {
  id: string;
  ref: string;
  companyName: string;
  contactName: string;
  source: "referral" | "tender" | "website" | "repeat_client" | "cold_call";
  stage: "enquiry" | "qualification" | "estimating" | "tendering" | "won" | "lost";
  estimatedValue: Money;
  probabilityPercent: number;
  expectedStart: string;
  ownerUserId: string;
  city: string;
  nextAction: string;
}

export interface Tender {
  id: string;
  ref: string;
  projectName: string;
  clientId: string;
  tenderCloseDate: string;
  submissionDate: string | null;
  status: "preparing" | "submitted" | "won" | "lost" | "withdrawn";
  bidValue: Money;
  estimatedCost: Money;
  documentsComplete: number;
  documentsRequired: number;
  ownerUserId: string;
}

export interface CashFlowMonth {
  id: string;
  period: string;
  projectId: string;
  inflow: Money;
  outflow: Money;
  openingBalance: Money;
  closingBalance: Money;
  forecast: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  severity: AuditSeverity;
  moduleKey: string;
  createdAt: string;
  read: boolean;
  roleHint: Role | "all";
}
