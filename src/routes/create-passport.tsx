import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  ExternalLink,
  ImagePlus,
  QrCode,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { hasDemoSellerAccess, sellerAccessUrl } from "@/lib/demo-seller-access";
import {
  createMvpPublicPassport,
  type NewPassportAttributeInput,
  type NewPassportHistoryInput,
} from "@/lib/supabase-passports";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/create-passport")({
  component: CreatePassportPage,
  head: () => ({
    meta: [
      { title: "Create Product Passport - TrustLayer" },
      {
        name: "description",
        content:
          "Create a frontend-only TrustLayer product passport draft with masked identifiers, review, QR-ready status, and a live passport preview.",
      },
    ],
  }),
});

const EASE = [0.16, 1, 0.3, 1] as const;

type CreatedPassport = {
  passportId: string;
  publicLink: string;
  qrStatus: string;
  solanaStatus: string;
};

function createMockCreatedPassport(): CreatedPassport {
  const passportId = `TL-${Date.now().toString().slice(-6)}`;

  return {
    passportId,
    publicLink: `trustlayer.app/passport/${passportId}`,
    qrStatus: "QR Ready",
    solanaStatus: "Not Minted",
  };
}

const categories = [
  "Electronics",
  "Luxury Goods",
  "Collectibles",
  "Music Gear",
  "Mobility",
  "Other",
] as const;

type Category = (typeof categories)[number];

const conditionOptions = ["Like New", "Excellent", "Good", "Fair", "Needs Repair"] as const;
type Condition = (typeof conditionOptions)[number];

const identifierTypes = [
  "Serial Number",
  "IMEI",
  "Certificate Number",
  "Frame Number",
  "Edition Number",
  "Other",
] as const;
type IdentifierType = (typeof identifierTypes)[number];

const warrantyStatuses = [
  "No Warranty",
  "Store Warranty",
  "Manufacturer Warranty",
  "Third-Party Warranty",
] as const;
type WarrantyStatus = (typeof warrantyStatuses)[number];

const categoryDetails: Record<Category, string[]> = {
  Electronics: [
    "Storage / Specs",
    "Color",
    "Battery Health",
    "Repair History",
    "Accessories Included",
  ],
  "Luxury Goods": [
    "Material",
    "Box Included",
    "Papers Included",
    "Authentication Provider",
    "Purchase Receipt Available",
  ],
  Collectibles: [
    "Collection Name",
    "Edition Number",
    "Rarity",
    "Condition Grade",
    "Grading Provider",
  ],
  "Music Gear": [
    "Year",
    "Original Parts",
    "Modification History",
    "Serial Number",
    "Case Included",
  ],
  Mobility: [
    "Frame Number",
    "Battery Condition",
    "Service History",
    "Mileage / Usage Hours",
    "Charger Included",
  ],
  Other: ["Custom Attribute Name", "Custom Attribute Value", "Additional Notes"],
};

const categoryDescriptions: Record<Category, string> = {
  Electronics: "Phones, laptops, cameras, consoles, wearables, and audio gear.",
  "Luxury Goods": "Watches, bags, jewelry, sneakers, and authenticated fashion.",
  Collectibles: "Trading cards, limited editions, signed items, and graded products.",
  "Music Gear": "Guitars, keyboards, microphones, studio gear, and vintage instruments.",
  Mobility: "E-bikes, scooters, bicycles, drones, and mobility devices.",
  Other: "A custom product category with flexible attributes.",
};

const detailPlaceholders: Record<Category, Record<string, string>> = {
  Electronics: {
    "Storage / Specs": "256GB",
    Color: "Graphite",
    "Battery Health": "87%",
    "Repair History": "Screen replaced once / None",
  },
  "Luxury Goods": {
    Material: "Stainless Steel",
    "Authentication Provider": "Seller Verified / Third-Party Authenticator",
  },
  Collectibles: {
    "Collection Name": "Pokemon Base Set",
    "Edition Number": "142/500",
    Rarity: "Holo Rare",
    "Condition Grade": "PSA 9 / Excellent",
    "Grading Provider": "PSA / Beckett / CGC",
  },
  "Music Gear": {
    Year: "2018",
    "Modification History": "Pickup upgraded / None",
    "Serial Number": "MX123456",
  },
  Mobility: {
    "Frame Number": "VF123456",
    "Battery Condition": "92%",
    "Service History": "Last serviced March 2026",
    "Mileage / Usage Hours": "1,200 km",
  },
  Other: {
    "Custom Attribute Name": "Attribute name",
    "Custom Attribute Value": "Attribute value",
    "Additional Notes": "Add any relevant product details.",
  },
};

const binaryDetailFields = new Set([
  "Accessories Included",
  "Box Included",
  "Papers Included",
  "Purchase Receipt Available",
  "Original Parts",
  "Case Included",
  "Charger Included",
]);

const steps = [
  "Select Category",
  "Product Info",
  "Identifier",
  "Category Details",
  "Warranty & Ownership",
  "Review",
];

type PassportForm = {
  category: Category | "";
  productName: string;
  brand: string;
  model: string;
  condition: Condition | "";
  description: string;
  identifierType: IdentifierType | "";
  identifierValue: string;
  details: Record<string, string>;
  warrantyStatus: WarrantyStatus | "";
  warrantyPeriod: string;
  warrantyExpiryDate: string;
  sellerName: string;
  currentOwnerWallet: string;
};

function createInitialForm(): PassportForm {
  return {
    category: "",
    productName: "",
    brand: "",
    model: "",
    condition: "",
    description: "",
    identifierType: "",
    identifierValue: "",
    details: {},
    warrantyStatus: "",
    warrantyPeriod: "",
    warrantyExpiryDate: "",
    sellerName: "",
    currentOwnerWallet: "",
  };
}

function maskIdentifier(value: string) {
  const compact = value.trim().replace(/\s+/g, "");

  if (!compact) return "TL-****";
  if (compact.length <= 6) return `${compact.slice(0, 2)}****`;

  return `${compact.slice(0, 3)}****${compact.slice(-2)}`;
}

function displayValue(value?: string) {
  return value?.trim() || "Not provided";
}

function nullableText(value: string) {
  return value.trim() || null;
}

function normalizeAttributeKey(field: string) {
  return field
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function attributeKeyForField(category: Category | "", field: string) {
  if (category === "Electronics") {
    const electronicsKeys: Record<string, string> = {
      "Storage / Specs": "storage",
      Color: "color",
      "Battery Health": "battery_health",
      "Repair History": "repair_history",
      "Accessories Included": "accessories_included",
    };

    return electronicsKeys[field] || normalizeAttributeKey(field);
  }

  return normalizeAttributeKey(field);
}

function normalizeDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!slashMatch) return null;

  const [, month, day, year] = slashMatch;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function buildPassportAttributes(form: PassportForm): NewPassportAttributeInput[] {
  if (!form.category) return [];

  return categoryDetails[form.category].map((field, index) => ({
    attribute_key: attributeKeyForField(form.category, field),
    attribute_value: nullableText(form.details[field] || ""),
    attribute_type: "text",
    is_public: true,
    sort_order: index,
  }));
}

function buildPassportHistory(): NewPassportHistoryInput[] {
  return [
    {
      event_type: "passport_created",
      title: "Passport Created",
      description: "This product passport was created by the seller.",
      status: "Completed",
    },
    {
      event_type: "identifier_protected",
      title: "Identifier Protected",
      description:
        "The product identifier was masked publicly and stored as a secure verification reference.",
      status: "Completed",
    },
    {
      event_type: "qr_verification_ready",
      title: "QR Verification Ready",
      description: "This passport can be opened through a public link or QR code.",
      status: "Completed",
    },
    {
      event_type: "solana_certificate",
      title: "Solana Certificate",
      description: "On-chain certificate minting has not been enabled yet.",
      status: "Pending",
    },
  ];
}

function selectInputClass(value?: string) {
  return cn(inputClass, !value && "text-[#1a1a1a]/45");
}

const glassCard =
  "rounded-[32px] border border-black/10 bg-white/30 backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.06)]";

const inputClass =
  "h-12 w-full rounded-[18px] border border-black/10 bg-white/35 px-4 py-3 text-[14px] text-[#1a1a1a] outline-none transition placeholder:text-[#1a1a1a]/35 focus:border-[#0871E7]/40 focus:ring-2 focus:ring-[#0871E7]/25";

const textareaClass =
  "min-h-[120px] w-full resize-none rounded-[18px] border border-black/10 bg-white/35 px-4 py-3 text-[14px] text-[#1a1a1a] outline-none transition placeholder:text-[#1a1a1a]/35 focus:border-[#0871E7]/40 focus:ring-2 focus:ring-[#0871E7]/25";

const primaryButtonClass =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#0871E7] px-6 text-[14px] font-medium text-white shadow-[0_16px_34px_rgba(8,113,231,0.22),inset_0_-4px_4px_rgba(255,255,255,0.3)] transition hover:bg-[#0766d4] disabled:cursor-not-allowed disabled:bg-[#0871E7]/30 disabled:text-white/70 disabled:shadow-none";

const secondaryButtonClass =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-black/10 bg-white/35 px-5 text-[14px] font-medium text-[#1a1a1a] transition hover:bg-white/50";

function GlintButton({
  children,
  href,
  className,
}: {
  children: React.ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-[#0871E7] px-6 py-3 text-[14px] font-medium text-white shadow-[inset_0_-4px_4px_rgba(255,255,255,0.39)] outline outline-1 -outline-offset-1 outline-[#0871E7] transition hover:bg-[#0766d4]",
        className,
      )}
    >
      <span className="absolute left-[10%] top-[1px] h-4 w-[80%] rounded-[12px] bg-gradient-to-b from-[#DEF0FC] to-transparent transition-transform duration-300 group-hover:scale-x-105" />
      <span className="relative z-10">{children}</span>
    </a>
  );
}

function Navbar() {
  const links: [string, string][] = [
    ["Home", "/"],
    ["Passports", "/passport/TL-000001"],
    ["Verify", "/verify"],
    ["Dashboard", "/dashboard"],
    ["Create", "/create-passport"],
  ];

  return (
    <div className="fixed left-1/2 top-6 z-50 w-[95%] max-w-5xl -translate-x-1/2">
      <nav className="flex items-center justify-between rounded-full border border-black/10 bg-white/35 px-5 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        <a
          href="/"
          className="font-instrument text-[28px] italic leading-none tracking-tight text-[#1a1a1a]"
        >
          TrustLayer
        </a>
        <div className="hidden items-center gap-6 md:flex">
          {links.map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="text-[14px] text-[#1a1a1a] transition hover:opacity-60"
            >
              {label}
            </a>
          ))}
        </div>
        <GlintButton href="/create-passport">Create Passport</GlintButton>
      </nav>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-[13px] font-medium text-[#1a1a1a]/60">{children}</label>;
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <input
        className={inputClass}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: readonly string[];
}) {
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <select
        className={selectInputClass(value)}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function FakeQr({ className, light = false }: { className?: string; light?: boolean }) {
  const cells = Array.from({ length: 81 }, (_, index) => {
    const x = index % 9;
    const y = Math.floor(index / 9);
    const corner = (x < 3 && y < 3) || (x > 5 && y < 3) || (x < 3 && y > 5);
    return corner || (x * 11 + y * 7 + (x ^ y) * 5) % 4 === 0;
  });

  return (
    <div
      className={cn(
        "grid aspect-square rounded-[16px] p-2",
        light ? "bg-white/80" : "bg-[#1a1a1a]",
        className,
      )}
      style={{ gridTemplateColumns: "repeat(9, minmax(0, 1fr))", gap: 2 }}
    >
      {cells.map((on, index) => (
        <span
          key={index}
          className={cn(
            "rounded-[2px]",
            on ? (light ? "bg-[#1a1a1a]" : "bg-white") : "bg-transparent",
          )}
        />
      ))}
    </div>
  );
}

function ProgressHeader({ currentStep }: { currentStep: number }) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0871E7]">
            STEP {currentStep + 1} OF {steps.length}
          </div>
          <h1 className="mt-2 font-instrument text-[40px] italic leading-none text-[#1a1a1a] md:text-[54px]">
            Create Product Passport
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#1a1a1a]/60 md:text-[16px]">
            Create a verifiable product identity for a high-value second-hand item.
          </p>
        </div>
        <a
          href="/"
          className="rounded-full border border-black/10 bg-white/35 px-4 py-2 text-[13px] font-medium text-[#1a1a1a]/70 backdrop-blur-xl transition hover:bg-white/50"
        >
          TrustLayer
        </a>
      </div>

      <div className="h-2 overflow-hidden rounded-full border border-black/10 bg-white/35">
        <motion.div
          className="h-full rounded-full bg-[#0871E7]"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.45, ease: EASE }}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] md:grid md:grid-cols-6 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden">
        {steps.map((label, index) => (
          <div
            key={label}
            className={cn(
              "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-2 text-center text-[11px] transition md:min-w-0 md:truncate",
              index === currentStep
                ? "border-[#0871E7]/60 bg-[#0871E7]/10 font-medium text-[#0871E7] shadow-[0_10px_26px_rgba(8,113,231,0.12)]"
                : index < currentStep
                  ? "border-[#0871E7]/35 bg-[#0871E7]/5 font-medium text-[#0871E7]"
                  : "border-black/10 bg-white/30 text-[#1a1a1a]/45",
            )}
          >
            {index < currentStep && <Check className="h-3.5 w-3.5" />}
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function PassportPreview({
  form,
  maskedIdentifier,
  createdPassport,
}: {
  form: PassportForm;
  maskedIdentifier: string;
  createdPassport?: CreatedPassport;
}) {
  const previewRows: [string, string][] = [
    ["Passport ID", createdPassport?.passportId || "Pending"],
    ["Category", displayValue(form.category)],
    ["Product Name", displayValue(form.productName)],
    ["Brand / Model", [form.brand, form.model].filter(Boolean).join(" / ") || "Not provided"],
    ["Masked Identifier", maskedIdentifier],
    ["Condition", displayValue(form.condition)],
    ["Warranty", displayValue(form.warrantyStatus)],
    ["Seller", displayValue(form.sellerName)],
    ["Owner Wallet", displayValue(form.currentOwnerWallet)],
    ["Solana Certificate", createdPassport?.solanaStatus || "Not Minted"],
  ];

  return (
    <aside className="lg:sticky lg:top-32">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="overflow-hidden rounded-[32px] border border-black/10 bg-white/35 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.06)] backdrop-blur-xl md:p-8"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[12px] text-[#1a1a1a]/55">TrustLayer Passport</div>
            <div className="mt-2 max-w-full break-words font-instrument text-[32px] italic leading-[0.95] text-[#1a1a1a]">
              {form.productName || "Untitled Product"}
            </div>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/45">
            <ShieldCheck className="h-5 w-5 text-[#0871E7]" />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {["QR Ready", "Solana Certificate: Not Minted", "Identifier Protected"].map((status) => (
            <span
              key={status}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/40 px-3 py-1.5 text-[11px] font-medium text-[#1a1a1a]/70"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#0871E7]" />
              {status}
            </span>
          ))}
        </div>

        <div className="mt-5 rounded-[24px] border border-black/10 bg-white/35 p-4">
          <div className="grid grid-cols-1 gap-y-3 text-[13px]">
            {previewRows.map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 border-b border-black/10 pb-3 last:border-0 last:pb-0"
              >
                <span className="shrink-0 text-[#1a1a1a]/55">{label}</span>
                <span className="max-w-[58%] break-words text-right font-medium text-[#1a1a1a]">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4 rounded-[24px] border border-black/10 bg-white/25 p-4">
          <FakeQr className="h-24 w-24 shrink-0" />
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/50 px-3 py-1.5 text-[12px] font-medium text-[#1a1a1a]/75">
              <QrCode className="h-3.5 w-3.5 text-[#0871E7]" />
              QR Ready
            </div>
            <div className="rounded-full border border-black/10 bg-white/45 px-3 py-1.5 text-[12px] font-medium text-[#1a1a1a]/75">
              Solana Certificate: Not Minted
            </div>
            <div className="rounded-full border border-black/10 bg-white/45 px-3 py-1.5 text-[12px] font-medium text-[#1a1a1a]/75">
              Identifier Protected
            </div>
          </div>
        </div>
      </motion.div>
    </aside>
  );
}

function StatusPills() {
  return (
    <div className="flex flex-wrap gap-2">
      {["Draft Passport", "Identifier Protected", "QR Ready", "Solana Mint Pending"].map((pill) => (
        <span
          key={pill}
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/40 px-3 py-1.5 text-[12px] font-medium text-[#1a1a1a]/70"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#0871E7]" />
          {pill}
        </span>
      ))}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-black/10 py-3 text-[14px] last:border-0">
      <span className="shrink-0 text-[#1a1a1a]/55">{label}</span>
      <span className="max-w-[62%] break-words text-right font-medium text-[#1a1a1a]">{value}</span>
    </div>
  );
}

function ReviewSection({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="mb-4 rounded-[24px] border border-black/10 bg-white/25 p-5 last:mb-0">
      <h3 className="font-instrument text-[28px] italic leading-none text-[#1a1a1a]">{title}</h3>
      <div className="mt-3">
        {rows.map(([label, value]) => (
          <ReviewRow key={label} label={label} value={displayValue(value)} />
        ))}
      </div>
    </div>
  );
}

function StepContent({
  currentStep,
  form,
  maskedIdentifier,
  updateForm,
  updateDetail,
}: {
  currentStep: number;
  form: PassportForm;
  maskedIdentifier: string;
  updateForm: <K extends keyof PassportForm>(key: K, value: PassportForm[K]) => void;
  updateDetail: (key: string, value: string) => void;
}) {
  const activeDetails = form.category ? categoryDetails[form.category] : [];

  if (currentStep === 0) {
    return (
      <div>
        <div className="mb-6">
          <div className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#0871E7]">
            Category
          </div>
          <h2 className="mt-2 font-instrument text-[38px] italic leading-none text-[#1a1a1a]">
            Select Category
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => updateForm("category", category)}
              className={cn(
                "min-h-[112px] rounded-[24px] border p-5 text-left transition",
                form.category === category
                  ? "border-[#0871E7]/50 bg-[#0871E7]/5 shadow-[0_18px_45px_rgba(8,113,231,0.13)]"
                  : "border-black/10 bg-white/25 hover:bg-white/40",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-instrument text-[30px] italic leading-none text-[#1a1a1a]">
                  {category}
                </span>
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border",
                    form.category === category
                      ? "border-[#0871E7] bg-[#0871E7] text-white"
                      : "border-black/10 bg-white/35 text-transparent",
                  )}
                >
                  <Check className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-[#1a1a1a]/58">
                {categoryDescriptions[category]}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (currentStep === 1) {
    return (
      <div>
        <div className="mb-6">
          <div className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#0871E7]">
            Product
          </div>
          <h2 className="mt-2 font-instrument text-[38px] italic leading-none text-[#1a1a1a]">
            Basic Product Information
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField
            label="Product Name *"
            value={form.productName}
            placeholder="Omega Seamaster Professional"
            onChange={(value) => updateForm("productName", value)}
          />
          <TextField
            label="Brand"
            value={form.brand}
            placeholder="Omega"
            onChange={(value) => updateForm("brand", value)}
          />
          <TextField
            label="Model"
            value={form.model}
            placeholder="Seamaster 300M"
            onChange={(value) => updateForm("model", value)}
          />
          <SelectField
            label="Condition *"
            value={form.condition}
            placeholder="Select condition"
            options={conditionOptions}
            onChange={(value) => updateForm("condition", value as Condition | "")}
          />
        </div>

        <div className="mt-4 space-y-2">
          <FieldLabel>Description</FieldLabel>
          <textarea
            className={textareaClass}
            value={form.description}
            placeholder="Add condition notes, provenance, cosmetic details, included items, or seller notes."
            onChange={(event) => updateForm("description", event.target.value)}
          />
        </div>

        <div className="mt-4 rounded-[24px] border border-dashed border-black/15 bg-white/25 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <FieldLabel>Product photos</FieldLabel>
              <div className="text-[14px] leading-relaxed text-[#1a1a1a]/60">
                Photos can be attached later. For now, this passport will use a placeholder preview.
              </div>
            </div>
            <div className="flex gap-3">
              {[1, 2, 3].map((slot) => (
                <div
                  key={slot}
                  className="flex h-16 w-16 items-center justify-center rounded-[18px] border border-black/10 bg-white/45"
                >
                  <ImagePlus className="h-5 w-5 text-[#1a1a1a]/45" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div>
        <div className="mb-6">
          <div className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#0871E7]">
            Secure ID
          </div>
          <h2 className="mt-2 font-instrument text-[38px] italic leading-none text-[#1a1a1a]">
            Unique Identifier
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField
            label="Identifier Type *"
            value={form.identifierType}
            placeholder="Select identifier"
            options={identifierTypes}
            onChange={(value) => updateForm("identifierType", value as IdentifierType | "")}
          />
          <TextField
            label="Identifier Value *"
            value={form.identifierValue}
            placeholder="A85X9421X"
            onChange={(value) => updateForm("identifierValue", value)}
          />
        </div>
        <div className="mt-5 rounded-[24px] border border-black/10 bg-white/40 p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0871E7]/10">
              <ShieldCheck className="h-4 w-4 text-[#0871E7]" />
            </div>
            <div>
              <div className="text-[14px] font-medium leading-relaxed text-[#1a1a1a]">
                Your identifier is never shown in full. TrustLayer masks it publicly and stores only
                a secure verification reference.
              </div>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#0871E7]/20 bg-[#0871E7]/5 px-3 py-1.5 text-[12px] font-medium text-[#0871E7]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0871E7]" />
                Identifier Protected
              </div>
              <div className="mt-4 rounded-[18px] border border-black/10 bg-white/50 px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.16em] text-[#1a1a1a]/45">
                  Live masked preview
                </div>
                <div className="mt-1 font-mono text-[20px] font-semibold text-[#0871E7]">
                  {maskedIdentifier}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 3) {
    return (
      <div>
        <div className="mb-6">
          <div className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#0871E7]">
            {form.category ? form.category.toUpperCase() : "CATEGORY"}
          </div>
          <h2 className="mt-2 font-instrument text-[38px] italic leading-none text-[#1a1a1a]">
            Category Details
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {activeDetails.map((field) =>
            binaryDetailFields.has(field) ? (
              <div key={field} className="space-y-2">
                <FieldLabel>{field}</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  {["Yes", "No"].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateDetail(field, value)}
                      className={cn(
                        "h-12 rounded-[18px] border text-[14px] font-medium transition",
                        form.details[field] === value
                          ? "border-[#0871E7]/35 bg-[#0871E7]/10 text-[#0871E7]"
                          : "border-black/10 bg-white/40 text-[#1a1a1a]/65 hover:bg-white/55",
                      )}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ) : field === "Additional Notes" ? (
              <div key={field} className="space-y-2 md:col-span-2">
                <FieldLabel>{field}</FieldLabel>
                <textarea
                  className={textareaClass}
                  value={form.details[field] || ""}
                  placeholder={
                    form.category ? detailPlaceholders[form.category][field] || field : field
                  }
                  onChange={(event) => updateDetail(field, event.target.value)}
                />
              </div>
            ) : (
              <TextField
                key={field}
                label={field}
                value={form.details[field] || ""}
                placeholder={
                  form.category ? detailPlaceholders[form.category][field] || field : field
                }
                onChange={(value) => updateDetail(field, value)}
              />
            ),
          )}
        </div>
      </div>
    );
  }

  if (currentStep === 4) {
    return (
      <div>
        <div className="mb-6">
          <div className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#0871E7]">
            Coverage
          </div>
          <h2 className="mt-2 font-instrument text-[38px] italic leading-none text-[#1a1a1a]">
            Warranty & Ownership
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField
            label="Warranty Status"
            value={form.warrantyStatus}
            placeholder="Select warranty"
            options={warrantyStatuses}
            onChange={(value) => updateForm("warrantyStatus", value as WarrantyStatus | "")}
          />
          <TextField
            label="Warranty Period"
            value={form.warrantyPeriod}
            placeholder="12 months"
            onChange={(value) => updateForm("warrantyPeriod", value)}
          />
          <TextField
            label="Warranty Expiry Date"
            value={form.warrantyExpiryDate}
            placeholder="06/05/2026"
            onChange={(value) => updateForm("warrantyExpiryDate", value)}
          />
          <TextField
            label="Seller Name *"
            value={form.sellerName}
            placeholder="TrustLayer Studio"
            onChange={(value) => updateForm("sellerName", value)}
          />
          <div className="md:col-span-2">
            <TextField
              label="Current Owner Wallet (optional)"
              value={form.currentOwnerWallet}
              placeholder="9xA3...Qp21"
              onChange={(value) => updateForm("currentOwnerWallet", value)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#0871E7]">
          Final Check
        </div>
        <h2 className="mt-2 font-instrument text-[38px] italic leading-none text-[#1a1a1a]">
          Review Passport
        </h2>
        <div className="mt-5">
          <StatusPills />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <ReviewSection
          title="Product"
          rows={[
            ["Category", form.category],
            ["Product Name", form.productName],
            ["Brand", form.brand],
            ["Model", form.model],
            ["Condition", form.condition],
            ["Description", form.description],
            ["Product Photos", "Placeholder preview"],
          ]}
        />
        <ReviewSection
          title="Identifier"
          rows={[
            ["Identifier Type", form.identifierType],
            ["Masked Identifier", maskedIdentifier],
            ["Privacy", "Identifier protected"],
          ]}
        />
        <ReviewSection
          title="Category Details"
          rows={
            activeDetails.length
              ? activeDetails.map((field) => [field, form.details[field] || "Not provided"])
              : [["Details", "Not provided"]]
          }
        />
        <ReviewSection
          title="Warranty & Ownership"
          rows={[
            ["Warranty Status", form.warrantyStatus],
            ["Warranty Period", form.warrantyPeriod],
            ["Warranty Expiry Date", form.warrantyExpiryDate],
            ["Seller Name", form.sellerName],
            ["Owner Wallet", form.currentOwnerWallet],
          ]}
        />
      </div>
    </div>
  );
}

function SuccessState({
  createdPassport,
  onCreateAnother,
}: {
  createdPassport: CreatedPassport;
  onCreateAnother: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE }}
      className={cn(glassCard, "p-6 md:p-8")}
    >
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0871E7] text-white shadow-[0_18px_45px_rgba(8,113,231,0.24)]">
        <Sparkles className="h-5 w-5" />
      </div>
      <h1 className="mt-6 font-instrument text-[46px] italic leading-none text-[#1a1a1a] md:text-[60px]">
        Product Passport Created
      </h1>
      <p className="mt-4 text-[16px] leading-relaxed text-[#1a1a1a]/68">
        Your passport is ready for verification.
      </p>

      <div className="mt-7 rounded-[26px] border border-black/10 bg-white/40 p-5">
        <ReviewRow label="Passport ID" value={createdPassport.passportId} />
        <ReviewRow label="Public Link" value={createdPassport.publicLink} />
        <ReviewRow label="QR Status" value={createdPassport.qrStatus} />
        <ReviewRow label="Solana Certificate" value={createdPassport.solanaStatus} />
      </div>

      <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <a href={`/passport/${createdPassport.passportId}`} className={primaryButtonClass}>
          <ExternalLink className="h-4 w-4" />
          View Public Passport
        </a>
        <a href="/dashboard" className={secondaryButtonClass}>
          <ExternalLink className="h-4 w-4" />
          Seller Dashboard
        </a>
        <button
          type="button"
          onClick={() => window.alert("QR download will be available soon.")}
          className={secondaryButtonClass}
        >
          <Download className="h-4 w-4" />
          Download QR
        </button>
        <button type="button" onClick={onCreateAnother} className={secondaryButtonClass}>
          <ArrowRight className="h-4 w-4" />
          Create Another Passport
        </button>
        <div>
          <button
            type="button"
            disabled
            aria-label="Mint Solana Certificate coming soon"
            className="inline-flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-full border border-black/10 bg-white/30 px-5 text-[14px] font-medium text-[#1a1a1a]/40"
          >
            Mint Solana Certificate - Coming Soon
          </button>
          <div className="mt-2 text-center text-[12px] text-[#1a1a1a]/50">
            Solana minting will be enabled in a later version.
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SellerAccessRedirectScreen() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F3F4ED] px-6 pb-16 pt-28 font-sans text-[#1a1a1a]">
      <Navbar />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 8%, rgba(8,113,231,0.18), transparent 28%), radial-gradient(circle at 84% 18%, rgba(153,69,255,0.11), transparent 30%), radial-gradient(circle at 52% 90%, rgba(20,241,149,0.10), transparent 34%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(243,244,237,0.78)_70%,#F3F4ED_100%)]" />

      <div className="relative z-10 w-full max-w-lg rounded-[32px] border border-black/10 bg-white/35 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.05)] backdrop-blur-xl">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#0871E7]/20 bg-[#0871E7]/10 text-[#0871E7]">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h1 className="mt-5 font-instrument text-[42px] italic leading-none text-[#1a1a1a]">
          Seller access required.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#1a1a1a]/62">
          Opening the frontend-only demo seller access page before creating a passport.
        </p>
      </div>
    </main>
  );
}

function CreatePassportPage() {
  const [accessChecked, setAccessChecked] = useState(false);
  const [form, setForm] = useState<PassportForm>(() => createInitialForm());
  const [currentStep, setCurrentStep] = useState(0);
  const [created, setCreated] = useState(false);
  const [createdPassport, setCreatedPassport] = useState<CreatedPassport>(() =>
    createMockCreatedPassport(),
  );
  const [creatingPassport, setCreatingPassport] = useState(false);
  const [createError, setCreateError] = useState("");
  const [draftSaved, setDraftSaved] = useState(false);
  const draftSavedTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (hasDemoSellerAccess()) {
      setAccessChecked(true);
      return;
    }

    window.location.href = sellerAccessUrl("/create-passport");
  }, []);

  const maskedIdentifier = useMemo(
    () => maskIdentifier(form.identifierValue),
    [form.identifierValue],
  );

  const updateForm = <K extends keyof PassportForm>(key: K, value: PassportForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setDraftSaved(false);
  };

  const updateDetail = (key: string, value: string) => {
    setForm((current) => ({
      ...current,
      details: {
        ...current.details,
        [key]: value,
      },
    }));
    setDraftSaved(false);
  };

  const isCurrentStepValid = useMemo(() => {
    if (currentStep === 0) return Boolean(form.category);
    if (currentStep === 1) return Boolean(form.productName.trim() && form.condition);
    if (currentStep === 2) return Boolean(form.identifierType && form.identifierValue.trim());
    if (currentStep === 4) return Boolean(form.sellerName.trim());
    return true;
  }, [
    currentStep,
    form.category,
    form.condition,
    form.identifierType,
    form.identifierValue,
    form.productName,
    form.sellerName,
  ]);

  const disabledHelperText = useMemo(() => {
    if (isCurrentStepValid) return "";
    if (currentStep === 0) return "Select a category to continue.";
    if (currentStep === 1) return "Complete the required fields to continue.";
    if (currentStep === 2) return "Add an identifier type and value to continue.";
    if (currentStep === 4) return "Add a seller name to continue.";
    return "";
  }, [currentStep, isCurrentStepValid]);

  const saveDraft = () => {
    setDraftSaved(true);
    if (draftSavedTimer.current) {
      window.clearTimeout(draftSavedTimer.current);
    }
    draftSavedTimer.current = window.setTimeout(() => setDraftSaved(false), 1800);
  };

  const createPassport = async () => {
    if (creatingPassport) return;

    setCreatingPassport(true);
    setCreateError("");

    if (!isSupabaseConfigured) {
      console.warn("Supabase is not configured. Using mock passport success flow.");
      setCreatedPassport(createMockCreatedPassport());
      setCreatingPassport(false);
      setCreated(true);
      return;
    }

    try {
      const passport = await createMvpPublicPassport({
        passport: {
          category: form.category || "Other",
          product_name: form.productName.trim() || "Untitled Product",
          brand: nullableText(form.brand),
          model: nullableText(form.model),
          condition: nullableText(form.condition),
          description: nullableText(form.description),
          identifier_type: nullableText(form.identifierType),
          masked_identifier: maskedIdentifier,
          warranty_status: form.warrantyStatus || "No Warranty",
          warranty_period: nullableText(form.warrantyPeriod),
          warranty_expiry: normalizeDate(form.warrantyExpiryDate),
          seller_name: form.sellerName.trim() || "Demo Seller",
          seller_id: null,
          owner_wallet: nullableText(form.currentOwnerWallet),
        },
        attributes: buildPassportAttributes(form),
        history: buildPassportHistory(),
      });

      setCreatedPassport({
        passportId: passport.passport_id,
        publicLink: passport.public_link || `trustlayer.app/passport/${passport.passport_id}`,
        qrStatus: passport.qr_status,
        solanaStatus: passport.solana_certificate_status,
      });
    } catch (error) {
      console.warn("Unable to create Supabase passport. Using mock passport success flow.", error);
      setCreateError("Supabase insert failed. Continuing with demo success flow.");
      setCreatedPassport(createMockCreatedPassport());
    } finally {
      setCreatingPassport(false);
      setCreated(true);
    }
  };

  const createAnother = () => {
    setForm(createInitialForm());
    setCurrentStep(0);
    setCreated(false);
    setCreatedPassport(createMockCreatedPassport());
    setCreatingPassport(false);
    setCreateError("");
    setDraftSaved(false);
  };

  if (!accessChecked) {
    return <SellerAccessRedirectScreen />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F3F4ED] font-sans text-[#1a1a1a]">
      <Navbar />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 8%, rgba(8,113,231,0.18), transparent 28%), radial-gradient(circle at 84% 18%, rgba(153,69,255,0.11), transparent 30%), radial-gradient(circle at 52% 90%, rgba(20,241,149,0.10), transparent 34%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(243,244,237,0.78)_70%,#F3F4ED_100%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-28 md:px-10 md:pt-32 lg:px-16">
        {!created && <ProgressHeader currentStep={currentStep} />}

        <div
          className={cn(
            "mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.15fr_0.9fr] lg:gap-8",
            created && "items-start",
          )}
        >
          <div className="min-w-0">
            {created ? (
              <SuccessState createdPassport={createdPassport} onCreateAnother={createAnother} />
            ) : (
              <div className={cn(glassCard, "min-h-[680px] p-6 md:p-8")}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.35, ease: EASE }}
                  >
                    <StepContent
                      currentStep={currentStep}
                      form={form}
                      maskedIdentifier={maskedIdentifier}
                      updateForm={updateForm}
                      updateDetail={updateDetail}
                    />
                  </motion.div>
                </AnimatePresence>

                <div className="mt-8 flex flex-col gap-3 border-t border-black/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-h-5 text-[12px] font-medium text-[#0871E7]">
                    {createError || (draftSaved ? "Draft saved" : "")}
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
                    {currentStep > 0 && (
                      <button
                        type="button"
                        disabled={creatingPassport}
                        onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
                        className={secondaryButtonClass}
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </button>
                    )}

                    {currentStep === steps.length - 1 ? (
                      <>
                        <button
                          type="button"
                          disabled={creatingPassport}
                          onClick={saveDraft}
                          className={secondaryButtonClass}
                        >
                          <Save className="h-4 w-4" />
                          {draftSaved ? "Draft saved" : "Save Draft"}
                        </button>
                        <button
                          type="button"
                          disabled={creatingPassport}
                          onClick={() => void createPassport()}
                          className={primaryButtonClass}
                        >
                          <Sparkles className="h-4 w-4" />
                          {creatingPassport ? "Creating..." : "Create Passport"}
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-stretch gap-2 sm:items-end">
                        <button
                          type="button"
                          disabled={!isCurrentStepValid}
                          onClick={() =>
                            setCurrentStep((step) => Math.min(steps.length - 1, step + 1))
                          }
                          className={primaryButtonClass}
                        >
                          Next
                          <ArrowRight className="h-4 w-4" />
                        </button>
                        {disabledHelperText && (
                          <div className="text-right text-[12px] text-[#1a1a1a]/50">
                            {disabledHelperText}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <PassportPreview
            form={form}
            maskedIdentifier={maskedIdentifier}
            createdPassport={created ? createdPassport : undefined}
          />
        </div>
      </div>
    </main>
  );
}
