/**
 * The "Working hours" setting is free text (e.g. "Monday – Saturday · 11am – 7pm")
 * while pickup slots are structured "HH:MM" values. Nothing ties the two together,
 * so they can silently drift apart and offer customers a pickup time the bakery is
 * closed for. These helpers make that drift visible in the admin.
 *
 * Parsing is deliberately conservative: if the hours text can't be read with
 * confidence we return null and show no warning, rather than a false alarm.
 */

/** Minutes since midnight for an "HH:MM" slot value. */
export function slotToMinutes(slot: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(slot.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function minutesToLabel(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

/**
 * Pull an opening and closing time out of free-text hours.
 * Returns null when the text doesn't contain two readable times.
 */
export function parseHours(hours: string): { open: number; close: number } | null {
  if (!hours) return null;

  // Prefer 12-hour tokens ("11am", "7:30 pm") — that's how the field is usually written.
  const ampm = [...hours.matchAll(/(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\.?/gi)].map((m) => {
    let h = Number(m[1]) % 12;
    if (m[3].toLowerCase() === "p") h += 12;
    return h * 60 + Number(m[2] || 0);
  });
  if (ampm.length >= 2) {
    return { open: ampm[0], close: ampm[ampm.length - 1] };
  }

  // Fall back to 24-hour tokens ("11:00 – 19:00").
  const h24 = [...hours.matchAll(/\b(\d{1,2}):(\d{2})\b/g)]
    .map((m) => (Number(m[1]) > 23 || Number(m[2]) > 59 ? null : Number(m[1]) * 60 + Number(m[2])))
    .filter((n): n is number => n !== null);
  if (h24.length >= 2) {
    return { open: h24[0], close: h24[h24.length - 1] };
  }

  return null;
}

/**
 * Pickup slots that fall outside the stated opening hours.
 * Empty when the hours can't be parsed or everything lines up.
 */
export function slotsOutsideHours(slots: string[], hours: string): string[] {
  const range = parseHours(hours);
  if (!range || range.close <= range.open) return [];
  return slots.filter((s) => {
    const mins = slotToMinutes(s);
    if (mins === null) return false;
    return mins < range.open || mins > range.close;
  });
}
