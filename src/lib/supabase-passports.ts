import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type {
  Passport,
  PassportAttribute,
  PassportAttributeInsert,
  PassportHistoryInsert,
  PassportInsert,
  PassportReportInsert,
  PassportWithDashboardRelations,
  PassportWithPublicRelations,
  Seller,
} from "@/lib/database.types";

const passportPublicColumns = `
  id,
  passport_id,
  category,
  product_name,
  brand,
  model,
  condition,
  description,
  identifier_type,
  masked_identifier,
  verification_status,
  warranty_status,
  warranty_period,
  warranty_expiry,
  seller_name,
  seller_id,
  owner_wallet,
  solana_certificate_status,
  solana_mint_address,
  solana_tx_signature,
  qr_status,
  public_link,
  is_published,
  published_at,
  created_at,
  updated_at
`;

const publicPassportSelect = `
  ${passportPublicColumns},
  passport_attributes (*),
  passport_history (*)
`;

const dashboardPassportSelect = `
  ${passportPublicColumns},
  passport_attributes (*),
  passport_history (*),
  passport_reports (*)
`;

export type PassportListItem = {
  passportId: string;
  productName: string;
  category: string;
  brand: string;
  model: string;
  condition: string;
  verificationStatus: string;
  identifierStatus: "Protected" | "Not Added";
  warrantyStatus: string;
  solanaStatus: string;
  qrStatus: string;
  createdAt: string;
  publicLink: string;
};

export type PublicPassportCategoryDetails = {
  storage: string;
  color: string;
  batteryHealth: string;
  repairHistory: string;
  accessoriesIncluded: string;
};

export type NewPassportAttributeInput = Omit<PassportAttributeInsert, "passport_id">;
export type NewPassportHistoryInput = Omit<PassportHistoryInsert, "passport_id">;

export type CreateMvpPublicPassportInput = {
  passport: Omit<
    PassportInsert,
    | "passport_id"
    | "public_link"
    | "verification_status"
    | "qr_status"
    | "solana_certificate_status"
    | "is_published"
    | "published_at"
  >;
  attributes?: NewPassportAttributeInput[];
  history?: NewPassportHistoryInput[];
};

function ensureSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
}

function fallbackText(value: string | null, fallback = "Not provided") {
  return value?.trim() || fallback;
}

export function formatPassportDate(value: string | null) {
  if (!value) return "Not provided";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function mapPassportToListItem(passport: Passport): PassportListItem {
  return {
    passportId: passport.passport_id,
    productName: passport.product_name,
    category: passport.category,
    brand: fallbackText(passport.brand),
    model: fallbackText(passport.model),
    condition: fallbackText(passport.condition),
    verificationStatus: passport.verification_status,
    identifierStatus: passport.masked_identifier ? "Protected" : "Not Added",
    warrantyStatus: passport.warranty_status,
    solanaStatus: passport.solana_certificate_status,
    qrStatus: passport.qr_status,
    createdAt: formatPassportDate(passport.created_at),
    publicLink: passport.public_link || `trustlayer.app/passport/${passport.passport_id}`,
  };
}

export function mapPassportAttributesToCategoryDetails(
  attributes: PassportAttribute[],
  fallback?: PublicPassportCategoryDetails,
): PublicPassportCategoryDetails {
  if (!attributes.length && fallback) {
    return fallback;
  }

  const attributeValues = new Map(
    attributes.map((attribute) => [
      attribute.attribute_key,
      fallbackText(attribute.attribute_value),
    ]),
  );

  return {
    storage: attributeValues.get("storage") || "Not provided",
    color: attributeValues.get("color") || "Not provided",
    batteryHealth: attributeValues.get("battery_health") || "Not provided",
    repairHistory: attributeValues.get("repair_history") || "Not provided",
    accessoriesIncluded:
      fallback && !attributes.length ? fallback.accessoriesIncluded : "Not provided",
  };
}

export async function getCurrentSeller() {
  ensureSupabaseConfigured();

  const { data, error } = await supabase.from("sellers").select("*").maybeSingle();

  if (error) throw error;

  return data as Seller | null;
}

export async function listSellerPassports() {
  ensureSupabaseConfigured();

  const { data, error } = await supabase
    .from("passports")
    .select(dashboardPassportSelect)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []) as PassportWithDashboardRelations[];
}

export async function listRecentDashboardPassports(limit = 50) {
  ensureSupabaseConfigured();

  const { data, error } = await supabase
    .from("passports")
    .select(passportPublicColumns)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map((passport) => mapPassportToListItem(passport as Passport));
}

export async function getPublishedPassportByPassportId(passportId: string) {
  ensureSupabaseConfigured();

  const { data, error } = await supabase
    .from("passports")
    .select(publicPassportSelect)
    .eq("passport_id", passportId)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throw error;

  return data as PassportWithPublicRelations | null;
}

export async function verifyPublishedPassport(passportId: string) {
  const passport = await getPublishedPassportByPassportId(passportId);

  return passport ? mapPassportToListItem(passport) : null;
}

export async function createSellerPassport(input: {
  passport: PassportInsert;
  attributes?: NewPassportAttributeInput[];
  history?: NewPassportHistoryInput[];
}) {
  ensureSupabaseConfigured();

  const { data: passport, error: passportError } = await supabase
    .from("passports")
    .insert(input.passport)
    .select(passportPublicColumns)
    .single();

  if (passportError) throw passportError;

  if (input.attributes?.length) {
    const { error } = await supabase.from("passport_attributes").insert(
      input.attributes.map((attribute, index) => ({
        ...attribute,
        passport_id: passport.id,
        sort_order: attribute.sort_order ?? index,
      })),
    );

    if (error) throw error;
  }

  if (input.history?.length) {
    const { error } = await supabase.from("passport_history").insert(
      input.history.map((event) => ({
        ...event,
        passport_id: passport.id,
      })),
    );

    if (error) throw error;
  }

  return passport;
}

export async function createMvpPublicPassport(input: CreateMvpPublicPassportInput) {
  ensureSupabaseConfigured();

  const { data: insertedPassport, error: passportError } = await supabase
    .from("passports")
    .insert({
      ...input.passport,
      seller_id: input.passport.seller_id ?? null,
      verification_status: "Seller Verified",
      qr_status: "QR Ready",
      solana_certificate_status: "Not Minted",
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .select(passportPublicColumns)
    .single();

  if (passportError) throw passportError;

  const publicLink = `trustlayer.app/passport/${insertedPassport.passport_id}`;
  const { data: passport, error: publicLinkError } = await supabase
    .from("passports")
    .update({ public_link: publicLink })
    .eq("id", insertedPassport.id)
    .select(passportPublicColumns)
    .single();

  if (publicLinkError) throw publicLinkError;

  if (input.attributes?.length) {
    const { error } = await supabase.from("passport_attributes").insert(
      input.attributes.map((attribute, index) => ({
        ...attribute,
        passport_id: passport.id,
        sort_order: attribute.sort_order ?? index,
      })),
    );

    if (error) throw error;
  }

  if (input.history?.length) {
    const { error } = await supabase.from("passport_history").insert(
      input.history.map((event) => ({
        ...event,
        passport_id: passport.id,
      })),
    );

    if (error) throw error;
  }

  return passport as Passport;
}

export async function createPassportReport(
  report: Pick<
    PassportReportInsert,
    "passport_id" | "reporter_email" | "report_type" | "message" | "metadata"
  >,
) {
  ensureSupabaseConfigured();

  const { error } = await supabase.from("passport_reports").insert({
    ...report,
    status: "Open",
  });

  if (error) throw error;
}
