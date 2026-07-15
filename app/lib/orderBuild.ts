import type { NewOrder } from "./orders";
import type { OrderAnswer, Question } from "./types";

// Customers may edit their order for this long after submitting it.
export const EDIT_WINDOW_MS = 3 * 60 * 60 * 1000; // 3 hours

/** Whether an order created at `createdAt` (ISO string) is still editable. */
export function isEditable(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return Date.now() < created + EDIT_WINDOW_MS;
}

/** ISO timestamp when the edit window closes for an order created at `createdAt`. */
export function editDeadline(createdAt: string): string {
  return new Date(new Date(createdAt).getTime() + EDIT_WINDOW_MS).toISOString();
}

export type IncomingAnswer = { qkey?: string; label?: string; value?: unknown };

/**
 * Validate submitted answers against the active questions and build the order
 * record. Shared by the create (POST) and edit (PUT) routes so both enforce the
 * same required-field, blocked-date and pickup-slot rules.
 */
export function buildOrder(
  incoming: IncomingAnswer[],
  questions: Question[],
  settings: { blockedDates?: string[]; pickupSlots?: string[] }
): { error: string } | { newOrder: NewOrder } {
  const byKey = new Map<string, string>();
  for (const a of incoming) {
    if (a && a.qkey) byKey.set(String(a.qkey), a.value == null ? "" : String(a.value));
  }

  for (const q of questions) {
    if (q.required && !(byKey.get(q.qkey) || "").trim()) {
      return { error: `Missing field: ${q.label}` };
    }
  }

  const answers: OrderAnswer[] = [];
  const role: Record<string, string> = {};
  for (const q of questions) {
    const value = (byKey.get(q.qkey) || "").trim();
    answers.push({ label: q.label, value });
    if (q.role !== "none") role[q.role] = value;
  }

  const totalValue = (byKey.get("order_total") || "").trim();
  if (totalValue) answers.push({ label: "Grand Total", value: totalValue });

  if (role.date && (settings.blockedDates || []).includes(role.date)) {
    return { error: "That pickup date isn't available. Please choose another date." };
  }
  if (
    role.time &&
    (settings.pickupSlots || []).length > 0 &&
    !(settings.pickupSlots || []).includes(role.time)
  ) {
    return { error: "That pickup time isn't available. Please choose a listed time slot." };
  }

  return {
    newOrder: {
      name: role.name || "",
      phone: role.phone || "",
      email: role.email || "",
      pickupDate: role.date || "",
      pickupTime: role.time || "",
      answers,
    },
  };
}
