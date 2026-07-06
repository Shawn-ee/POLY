import type { PolyApi } from "../api";

export type AccountNavigationItemResult = {
  id: string;
  label: string;
  icon: string;
  kind: "internal" | "external" | "placeholder";
  enabled: boolean;
  status: "available" | "unavailable";
  destination: string | null;
  reason: string | null;
};

export type AccountNavigationResult = {
  source: string;
  generatedAt: string;
  items: AccountNavigationItemResult[];
};

const allowedKinds = new Set(["internal", "external", "placeholder"]);
const allowedStatuses = new Set(["available", "unavailable"]);

const requireString = (value: unknown, field: string) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Account navigation response was missing ${field}.`);
  }
  return value.trim();
};

const optionalString = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

export const loadAccountNavigation = async (
  api: Pick<PolyApi, "getAccountNavigation">,
): Promise<AccountNavigationResult> => {
  const navigation = await api.getAccountNavigation();
  const source = requireString(navigation.source, "source");
  const generatedAt = requireString(navigation.generatedAt, "generatedAt");
  if (!Array.isArray(navigation.items)) {
    throw new Error("Account navigation response was missing items.");
  }

  const items = navigation.items.map((item, index) => {
    const kind = requireString(item.kind, `items[${index}].kind`);
    const status = requireString(item.status, `items[${index}].status`);
    if (!allowedKinds.has(kind)) {
      throw new Error(`Account navigation response had invalid items[${index}].kind.`);
    }
    if (!allowedStatuses.has(status)) {
      throw new Error(`Account navigation response had invalid items[${index}].status.`);
    }
    return {
      id: requireString(item.id, `items[${index}].id`),
      label: requireString(item.label, `items[${index}].label`),
      icon: requireString(item.icon, `items[${index}].icon`),
      kind: kind as AccountNavigationItemResult["kind"],
      enabled: Boolean(item.enabled),
      status: status as AccountNavigationItemResult["status"],
      destination: optionalString(item.destination),
      reason: optionalString(item.reason),
    };
  });

  return { source, generatedAt, items };
};
