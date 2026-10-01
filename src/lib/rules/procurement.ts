import { addMoney, compareMoney, divMoney, isZeroMoney, money, mulMoney, percentOf, subMoney, sumBy, toDecimal, type Money } from "@/lib/money";
import { daysBetween, formatDate } from "@/lib/format";
import type {
  GoodsReceipt,
  Invoice,
  PurchaseOrder,
  PurchaseRequest,
  PurchaseRequestStatus,
  Role,
  Supplier,
  SupplierStatus,
} from "@/lib/types";

export const PO_TAX_RATE = "0.05";

export const ROLE_APPROVAL_LIMITS: Record<Role, Money> = {
  site_engineer: "5000.00",
  procurement_officer: "25000.00",
  approver: "2500000.00",
  hr_manager: "0.00",
  admin: "9999999.00",
};

export const PROCUREMENT_SLA_DAYS = 3;

export interface ApprovalDecision {
  allowed: boolean;
  requiresApprover: boolean;
  reason: string;
  limit: Money;
}

export function approvalDecision(role: Role, amount: Money): ApprovalDecision {
  const limit = ROLE_APPROVAL_LIMITS[role];
  if (isZeroMoney(limit)) {
    return {
      allowed: false,
      requiresApprover: true,
      reason: "This role cannot commit spend directly. Route to the Approver.",
      limit,
    };
  }
  const withinLimit = compareMoney(amount, limit) <= 0;
  return {
    allowed: withinLimit,
    requiresApprover: !withinLimit,
    reason: withinLimit
      ? "Within your delegated limit."
      : `Above your ${money(limit)} limit — needs Approver sign-off.`,
    limit,
  };
}

export function requiresSecondApproval(amount: Money): boolean {
  return toDecimal(amount).greaterThanOrEqualTo("50000");
}

export const PR_STATUS_LABELS: Record<PurchaseRequestStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  ordered: "Ordered",
};

export const PR_STATUS_TONES: Record<PurchaseRequestStatus, "ok" | "warn" | "danger" | "muted" | "info"> = {
  draft: "muted",
  submitted: "info",
  under_review: "info",
  approved: "ok",
  rejected: "danger",
  ordered: "muted",
};

export const PO_STATUS_LABELS: Record<PurchaseOrder["status"], string> = {
  draft: "Draft",
  issued: "Issued",
  partially_received: "Part received",
  received: "Fully received",
  cancelled: "Cancelled",
};

export const PO_STATUS_TONES: Record<
  PurchaseOrder["status"],
  "ok" | "warn" | "danger" | "muted" | "info"
> = {
  draft: "muted",
  issued: "info",
  partially_received: "warn",
  received: "ok",
  cancelled: "danger",
};

export function prAgeDays(pr: PurchaseRequest, asOf: string | Date = new Date()): number {
  return Math.max(0, daysBetween(pr.requestedDate, asOf));
}

export function prIsOverdue(pr: PurchaseRequest, asOf: string | Date = new Date()): boolean {
  return (
    ["submitted", "under_review"].includes(pr.status) &&
    prAgeDays(pr, asOf) > PROCUREMENT_SLA_DAYS
  );
}

export function daysUntilNeeded(pr: PurchaseRequest, asOf: string | Date = new Date()): number {
  return daysBetween(asOf, pr.neededByDate);
}

export function prUrgency(pr: PurchaseRequest, asOf: string | Date = new Date()): "overdue" | "urgent" | "normal" {
  const days = daysUntilNeeded(pr, asOf);
  if (days < 0) return "overdue";
  if (days <= 7) return "urgent";
  return "normal";
}

export function canConvertPrToPo(pr: PurchaseRequest, role: Role): { allowed: boolean; reason: string } {
  if (pr.status !== "approved") {
    return { allowed: false, reason: "Only approved purchase requests can be converted to a PO." };
  }
  if (role !== "procurement_officer" && role !== "admin") {
    return { allowed: false, reason: "Issuing purchase orders is restricted to Procurement." };
  }
  return { allowed: true, reason: "Eligible for PO issuance." };
}

export function taxAmount(subtotal: Money, rate: Money = PO_TAX_RATE): Money {
  return money(divMoney(subtotal, String(toDecimal(rate).plus(1)), 4));
}

export function poTotal(subtotal: Money, rate: Money = PO_TAX_RATE): {
  subtotal: Money;
  tax: Money;
  total: Money;
} {
  const tax = taxAmount(subtotal, rate);
  return { subtotal: money(subtotal), tax, total: addMoney(subtotal, tax) };
}

export function openPurchaseOrders(orders: readonly PurchaseOrder[]): PurchaseOrder[] {
  return orders.filter((order) => ["issued", "partially_received"].includes(order.status));
}

export function overduePurchaseOrders(orders: readonly PurchaseOrder[], asOf: string | Date = new Date()): PurchaseOrder[] {
  return openPurchaseOrders(orders).filter((order) => daysBetween(order.expectedDate, asOf) > 0);
}

export function purchaseOrderValue(orders: readonly PurchaseOrder[]): Money {
  return sumBy(orders, (order) => order.total);
}

export type MatchState = "matched" | "quantity_variance" | "price_variance" | "awaiting_receipt" | "awaiting_invoice";

export interface ThreeWayMatch {
  state: MatchState;
  poRef: string;
  receiptRef: string | null;
  valueVariance: Money;
  description: string;
}

export function threeWayMatch(
  order: PurchaseOrder,
  receipt: GoodsReceipt | null,
  invoice: Invoice | null,
): ThreeWayMatch {
  const value = invoice ? subMoney(invoice.total, order.total) : money(0);
  if (!receipt) {
    return {
      state: "awaiting_receipt",
      poRef: order.ref,
      receiptRef: null,
      valueVariance: money(0),
      description: "No goods receipt posted yet.",
    };
  }
  if (!invoice) {
    return {
      state: "awaiting_invoice",
      poRef: order.ref,
      receiptRef: receipt.ref,
      valueVariance: money(0),
      description: "Receipt posted, supplier invoice not received.",
    };
  }
  if (!isZeroMoney(value)) {
    return {
      state: "price_variance",
      poRef: order.ref,
      receiptRef: receipt.ref,
      valueVariance: value,
      description: `Invoice differs from PO by ${money(value)}.`,
    };
  }
  if (receipt.rejectedLines > 0 || receipt.acceptedValue !== order.subtotal) {
    return {
      state: "quantity_variance",
      poRef: order.ref,
      receiptRef: receipt.ref,
      valueVariance: value,
      description: "Received value does not equal ordered value.",
    };
  }
  return {
    state: "matched",
    poRef: order.ref,
    receiptRef: receipt.ref,
    valueVariance: money(0),
    description: "PO, receipt and invoice agree.",
  };
}

export const MATCH_STATE_LABELS: Record<MatchState, string> = {
  matched: "3-way matched",
  quantity_variance: "Quantity variance",
  price_variance: "Price variance",
  awaiting_receipt: "Awaiting receipt",
  awaiting_invoice: "Awaiting invoice",
};

export function supplierScore(supplier: Supplier): number {
  const delivery = toDecimal(supplier.onTimeDeliveryPercent);
  const quality = toDecimal(100).minus(supplier.qualityRejectPercent);
  const rating = toDecimal(supplier.rating).times(20);
  return delivery.plus(quality).plus(rating).dividedBy(3).toDecimalPlaces(1).toNumber();
}

export type SupplierTier = "platinum" | "gold" | "silver" | "watch";

export function supplierTier(supplier: Supplier): SupplierTier {
  const score = supplierScore(supplier);
  if (score >= 90) return "platinum";
  if (score >= 78) return "gold";
  if (score >= 65) return "silver";
  return "watch";
}

export const SUPPLIER_TIER_LABELS: Record<SupplierTier, string> = {
  platinum: "Platinum",
  gold: "Gold",
  silver: "Silver",
  watch: "Watch list",
};

export const SUPPLIER_STATUS_LABELS: Record<SupplierStatus, string> = {
  approved: "Approved",
  under_review: "Under review",
  suspended: "Suspended",
};

export const SUPPLIER_STATUS_TONES: Record<SupplierStatus, "ok" | "warn" | "danger"> = {
  approved: "ok",
  under_review: "warn",
  suspended: "danger",
};

export function supplierSpendShare(supplier: Supplier, suppliers: readonly Supplier[]): string {
  return percentOf(supplier.totalSpend, sumBy(suppliers, (s) => s.totalSpend), 1);
}

export function approvedSuppliers(suppliers: readonly Supplier[]): Supplier[] {
  return suppliers.filter((supplier) => supplier.status === "approved");
}

export function suppliersByCategory(
  suppliers: readonly Supplier[],
  category: string,
): Supplier[] {
  return suppliers.filter((supplier) => supplier.categories.includes(category));
}

export function insuranceExpired(supplier: Supplier, asOf: string | Date = new Date()): boolean {
  return daysBetween(asOf, supplier.insuranceExpiry) < 0;
}

export function supplierRiskNotes(supplier: Supplier, asOf: string | Date = new Date()): string[] {
  const notes: string[] = [];
  if (supplier.status !== "approved") notes.push(`Panel status is ${SUPPLIER_STATUS_LABELS[supplier.status]}.`);
  if (supplier.onTimeDeliveryPercent < 85) notes.push("On-time delivery below the 85% service level.");
  if (supplier.qualityRejectPercent > 3) notes.push("Quality rejection rate above tolerance.");
  if (!supplier.bankVerified) notes.push("Bank details not verified.");
  if (insuranceExpired(supplier, asOf)) {
    notes.push(`Insurance expired on ${formatDate(supplier.insuranceExpiry)}.`);
  }
  return notes;
}

export function commitmentCoverage(
  committed: Money,
  budget: Money,
  coverageDays: number,
): Money {
  if (coverageDays <= 0) return money(0);
  return money(divMoney(subMoney(budget, committed), String(coverageDays), 2));
}

export function goodsReceiptValue(receipts: readonly GoodsReceipt[]): Money {
  return sumBy(receipts, (receipt) => receipt.acceptedValue);
}

export function pendingInspectionCount(receipts: readonly GoodsReceipt[]): number {
  return receipts.filter((receipt) => receipt.status === "pending_inspection").length;
}

export function estimatedTaxOnSpend(spend: Money, rate: Money = PO_TAX_RATE): Money {
  return money(divMoney(spend, String(toDecimal(rate).plus(1)), 4));
}

export function negotiatedSaving(quotedPrice: Money, awardedPrice: Money): Money {
  return money(subMoney(quotedPrice, awardedPrice));
}

export function savingPercent(quotedPrice: Money, awardedPrice: Money): string {
  return percentOf(negotiatedSaving(quotedPrice, awardedPrice), quotedPrice, 1);
}

export function supplierOrderSpend(
  orders: readonly PurchaseOrder[],
  supplier: Supplier,
): Money {
  return sumBy(orders.filter((order) => order.supplierId === supplier.id), (order) => order.total);
}

export function pipelineValueByStage<T extends { stage: string; estimatedValue: Money }>(
  items: readonly T[],
): Record<string, Money> {
  const output: Record<string, Money> = {};
  for (const item of items) {
    output[item.stage] = addMoney(output[item.stage] ?? "0", mulMoney(item.estimatedValue, "1"));
  }
  return output;
}
