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

const requireBoolean = (value: unknown, field: string) => {
  if (typeof value !== "boolean") {
    throw new Error(`Account navigation response was missing ${field}.`);
  }
  return value;
};

const assertItemConsistency = ({
  index,
  kind,
  enabled,
  status,
  destination,
}: {
  index: number;
  kind: AccountNavigationItemResult["kind"];
  enabled: boolean;
  status: AccountNavigationItemResult["status"];
  destination: string | null;
}) => {
  if (kind === "placeholder" && (enabled || status !== "unavailable" || destination)) {
    throw new Error(`Account navigation response had inconsistent items[${index}].`);
  }
  if (enabled && status !== "available") {
    throw new Error(`Account navigation response had inconsistent items[${index}].`);
  }
  if (status === "available" && (!enabled || !destination)) {
    throw new Error(`Account navigation response had inconsistent items[${index}].`);
  }
  if (status === "unavailable" && enabled) {
    throw new Error(`Account navigation response had inconsistent items[${index}].`);
  }
};

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
    const enabled = requireBoolean(item.enabled, `items[${index}].enabled`);
    const destination = optionalString(item.destination);
    const normalizedItem = {
      id: requireString(item.id, `items[${index}].id`),
      label: requireString(item.label, `items[${index}].label`),
      icon: requireString(item.icon, `items[${index}].icon`),
      kind: kind as AccountNavigationItemResult["kind"],
      enabled,
      status: status as AccountNavigationItemResult["status"],
      destination,
      reason: optionalString(item.reason),
    };
    assertItemConsistency({
      index,
      kind: normalizedItem.kind,
      enabled: normalizedItem.enabled,
      status: normalizedItem.status,
      destination: normalizedItem.destination,
    });
    return normalizedItem;
  });

  return { source, generatedAt, items };
};
