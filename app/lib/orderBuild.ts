import type { NewOrder, OrderFormState } from "./orders";
import type { Order, OrderAnswer, Question } from "./types";

/**
 * Customers can edit or cancel their order until the bakery hands it over
 * (marks it "completed") — or until it's already cancelled. In other words,
 * while it's still "new" or "confirmed".
 */
export function isEditable(status: Order["status"]): boolean {
  return status === "new" || status === "confirmed";
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

/** Strip a trailing price off an option label ("Sourdough Bread - $12" -> "Sourdough Bread"). */
function optionBaseName(option: string): string {
  const m = option.match(/^(.*?)\s*-\s*\$[\d.,]+\s*$/);
  return (m ? m[1] : option).trim();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Rebuild the edit form's state from the saved answers.
 *
 * Orders normally store the raw `formState` so the edit page can rehydrate exactly.
 * That column can be null — orders created before it existed, or any order created
 * through the API rather than the form. Without this fallback the customer would
 * open their edit link and be shown a completely empty form.
 *
 * Answers are stored as { label, value } with multi-selects flattened to a single
 * string ("Crinkle Cookies × 2 - $24, Sourdough Bread - $12"), so this is a
 * best-effort reconstruction: options are matched by name and consumed as they're
 * found, longest first, so one option name can't swallow another's match.
 */
export function reconstructFormState(
  answers: OrderAnswer[],
  questions: Question[],
  menuOptions: string[]
): OrderFormState {
  const values: Record<string, string | string[]> = {};
  const qty: Record<string, number> = {};

  const byLabel = new Map<string, string>();
  for (const a of answers) byLabel.set(a.label, a.value);

  for (const q of questions) {
    const raw = (byLabel.get(q.label) || "").trim();
    const isMulti = q.type === "checkbox" || q.type === "menu";

    if (!isMulti) {
      values[q.qkey] = raw;
      continue;
    }

    const options = q.type === "menu" ? menuOptions : q.options;
    const picked: string[] = [];
    // Work on a copy we chip away at, so "Madlouka" can't also match inside
    // "Madlouka Special" once the longer option has claimed its text.
    let remaining = raw;

    for (const option of [...options].sort(
      (a, b) => optionBaseName(b).length - optionBaseName(a).length
    )) {
      const base = optionBaseName(option);
      if (!base || !remaining.includes(base)) continue;

      picked.push(option);
      const countMatch = new RegExp(`${escapeRegExp(base)}\\s*×\\s*(\\d+)`).exec(remaining);
      if (countMatch) {
        const n = Number(countMatch[1]);
        if (n > 1) qty[`${q.qkey}|${option}`] = Math.min(99, n);
      }
      remaining = remaining.replace(base, "");
    }

    // Restore the question's own option order rather than longest-first.
    values[q.qkey] = options.filter((o) => picked.includes(o));
  }

  return { values, qty };
}
