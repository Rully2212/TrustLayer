import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { AlertCircle, Copy, Download, ShieldCheck } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { passports, seller, verifiedPassport } from "@/lib/mock-passport";
import {
  formatPassportDate,
  getPublishedPassportByPassportId,
  mapPassportAttributesToCategoryDetails,
  type PublicPassportCategoryDetails,
} from "@/lib/supabase-passports";
import type { PassportWithPublicRelations } from "@/lib/database.types";

export const Route = createFileRoute("/passport/$id")({
  component: PublicPassportPage,
  head: () => ({
    meta: [
      { title: "TrustLayer Passport TL-000001" },
      {
        name: "description",
        content:
          "Public TrustLayer product passport verification page for buyers reviewing authenticity, ownership, warranty, condition, and history.",
      },
    ],
  }),
});

const EASE = [0.16, 1, 0.3, 1] as const;

type PublicPassportHistoryItem = {
  title: string;
  description: string;
  date: string;
  status: string;
};

type PublicPassport = {
  passportId: string;
  category: string;
  productName: string;
  brand: string;
  model: string;
  condition: string;
  verificationStatus: string;
  identifierStatus: string;
  warrantyStatus: string;
  qrStatus: string;
  createdAt: string;
  publicLink: string;
  description: string;
  identifierType: string;
  maskedIdentifier: string;
  sellerName: string;
  warrantyPeriod: string;
  warrantyExpiry: string;
  ownerWallet: string;
  solanaCertificate: string;
  solanaNetwork: string;
  lastUpdated: string;
  categoryDetails: PublicPassportCategoryDetails;
  history: PublicPassportHistoryItem[];
};

function createMockCategoryDetails(
  passport: (typeof passports)[number],
): PublicPassportCategoryDetails {
  return {
    storage: passport.category === "Electronics" ? "Not provided" : "N/A",
    color: "Not provided",
    batteryHealth: passport.category === "Electronics" ? "Not provided" : "N/A",
    repairHistory: "Not provided",
    accessoriesIncluded: "Not provided",
  };
}

function createPublicPassport(passportId: string): PublicPassport {
  const passport = passports.find((item) => item.passportId === passportId) ?? passports[0];
  const isDemoPassport = passport.passportId === verifiedPassport.passportId;
  const identifierProtected = passport.identifierStatus === "Protected";
  const maskedIdentifier = isDemoPassport
    ? verifiedPassport.maskedIdentifier
    : identifierProtected
      ? `${passport.passportId.slice(-3)}****${passport.model.slice(0, 2).toUpperCase()}`
      : "Not added";

  return {
    ...passport,
    description: `A public TrustLayer record for ${passport.productName}, shared by the seller for buyer review before purchase.`,
    identifierType: passport.category === "Electronics" ? "IMEI" : "Serial Number",
    maskedIdentifier,
    sellerName: seller.name,
    warrantyPeriod: passport.warrantyStatus === "No Warranty" ? "Not provided" : "Store provided",
    warrantyExpiry: passport.warrantyStatus === "No Warranty" ? "Not provided" : "See seller terms",
    ownerWallet: "Not provided",
    solanaCertificate: passport.solanaStatus,
    solanaNetwork: "Solana Devnet",
    lastUpdated: passport.createdAt,
    categoryDetails: createMockCategoryDetails(passport),
    history: [
      {
        title: "Passport Created",
        description: "This product passport was created by the seller.",
        date: passport.createdAt,
        status: "Completed",
      },
      {
        title: identifierProtected ? "Identifier Protected" : "Identifier Pending",
        description: identifierProtected
          ? "The product identifier was masked publicly and stored as a secure verification reference."
          : "The seller has not added a protected identifier yet.",
        date: identifierProtected ? passport.createdAt : "Pending",
        status: identifierProtected ? "Completed" : "Pending",
      },
      {
        title: "QR Verification Ready",
        description: "This passport can be opened through a public link or QR code.",
        date: passport.qrStatus === "QR Ready" ? passport.createdAt : "Pending",
        status: passport.qrStatus === "QR Ready" ? "Completed" : "Pending",
      },
      {
        title: "Solana Certificate",
        description: "On-chain certificate minting has not been enabled yet.",
        date: "Pending",
        status: "Pending",
      },
    ],
  };
}

function fallbackText(value: string | null, fallback = "Not provided") {
  return value?.trim() || fallback;
}

function mapSupabasePassportToPublicPassport(
  passport: PassportWithPublicRelations,
  fallback: PublicPassport,
): PublicPassport {
  return {
    ...fallback,
    passportId: passport.passport_id,
    category: passport.category,
    productName: passport.product_name,
    brand: fallbackText(passport.brand),
    model: fallbackText(passport.model),
    condition: fallbackText(passport.condition),
    verificationStatus: passport.verification_status,
    identifierStatus: passport.masked_identifier ? "Protected" : "Not Added",
    warrantyStatus: passport.warranty_status,
    qrStatus: passport.qr_status,
    createdAt: formatPassportDate(passport.created_at),
    publicLink: passport.public_link || `trustlayer.app/passport/${passport.passport_id}`,
    description:
      passport.description ||
      `A public TrustLayer record for ${passport.product_name}, shared by the seller for buyer review before purchase.`,
    identifierType: fallbackText(passport.identifier_type),
    maskedIdentifier: fallbackText(passport.masked_identifier),
    sellerName: passport.seller_name,
    warrantyPeriod: fallbackText(passport.warranty_period),
    warrantyExpiry: passport.warranty_expiry
      ? formatPassportDate(passport.warranty_expiry)
      : "Not provided",
    ownerWallet: fallbackText(passport.owner_wallet),
    solanaCertificate: passport.solana_certificate_status,
    lastUpdated: formatPassportDate(passport.updated_at),
    categoryDetails: mapPassportAttributesToCategoryDetails(
      passport.passport_attributes,
      fallback.categoryDetails,
    ),
    history: passport.passport_history.length
      ? passport.passport_history
          .slice()
          .sort((a, b) => new Date(a.event_at).getTime() - new Date(b.event_at).getTime())
          .map((event) => ({
            title: event.title,
            description: event.description || "No additional details provided.",
            date: formatPassportDate(event.event_at),
            status: event.status,
          }))
      : fallback.history,
  };
}

const cardClass =
  "rounded-[32px] border border-black/10 bg-white/30 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.05)] backdrop-blur-xl md:p-8";

const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#0871E7] px-6 py-3 text-[14px] font-medium text-white shadow-[inset_0_-4px_4px_rgba(255,255,255,0.39)] transition hover:bg-[#0766d4]";

const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white/35 px-6 py-3 text-[14px] font-medium text-[#1a1a1a] transition hover:bg-white/50";

const categoryDetailLabels: Record<keyof PublicPassport["categoryDetails"], string> = {
  storage: "Storage / Specs",
  color: "Color",
  batteryHealth: "Battery Health",
  repairHistory: "Repair History",
  accessoriesIncluded: "Accessories Included",
};

function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    void navigator.clipboard
      .writeText(value)
      .then(() => window.alert("Passport link copied."))
      .catch(() => window.alert(value));
    return;
  }

  window.alert(value);
}

function GlintButton({
  children,
  href,
  className,
}: {
  children: ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-full bg-[#0871E7] px-6 py-3 text-[14px] font-medium text-white shadow-[inset_0_-4px_4px_rgba(255,255,255,0.39)] outline outline-1 -outline-offset-1 outline-[#0871E7] transition hover:bg-[#0766d4]",
        className,
      )}
    >
      <span className="absolute left-[10%] top-[1px] h-4 w-[80%] rounded-[12px] bg-gradient-to-b from-[#DEF0FC] to-transparent" />
      <span className="relative z-10">{children}</span>
    </a>
  );
}

function Navbar() {
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
          {[
            ["Home", "/"],
            ["Passports", "/passport/TL-000001"],
            ["Verify", "/verify"],
            ["Dashboard", "/dashboard"],
            ["Create", "/create-passport"],
          ].map(([label, href]) => (
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

function AnimatedSection({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: EASE }}
      className={cn("scroll-mt-44", className)}
    >
      {children}
    </motion.section>
  );
}

function SectionKicker({ children }: { children: ReactNode }) {
  return (
    <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0871E7]">
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-2 font-instrument text-[34px] italic leading-none text-[#1a1a1a] md:text-[44px]">
      {children}
    </h2>
  );
}

function StatusPill({
  children,
  tone = "neutral",
  dot = false,
}: {
  children: ReactNode;
  tone?: "positive" | "neutral";
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium",
        tone === "positive"
          ? "border-[#0871E7]/20 bg-[#0871E7]/10 text-[#0871E7]"
          : "border-black/10 bg-white/50 text-[#1a1a1a]/60",
      )}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            tone === "positive" ? "bg-[#0871E7]" : "bg-[#1a1a1a]/30",
          )}
        />
      )}
      {children}
    </span>
  );
}

function HeroPill({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/40 px-4 py-2 text-[13px] text-[#1a1a1a]/75 backdrop-blur-xl">
      <span
        className={cn("h-1.5 w-1.5 rounded-full", muted ? "bg-[#1a1a1a]/30" : "bg-[#0871E7]")}
      />
      {children}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-black/10 py-3 last:border-0 md:flex-row md:items-start md:justify-between md:gap-6">
      <div className="text-[13px] text-[#1a1a1a]/50">{label}</div>
      <div className="text-[14px] font-medium leading-relaxed text-[#1a1a1a] md:max-w-[62%] md:text-right md:text-[15px]">
        {value}
      </div>
    </div>
  );
}

function DetailCard({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <AnimatedSection id={id} className={cardClass}>
      <SectionTitle>{title}</SectionTitle>
      <div className="mt-5">{children}</div>
    </AnimatedSection>
  );
}

function FakeQr({ className }: { className?: string }) {
  const cells = Array.from({ length: 100 }, (_, index) => {
    const x = index % 10;
    const y = Math.floor(index / 10);
    const corner = (x < 3 && y < 3) || (x > 6 && y < 3) || (x < 3 && y > 6);
    return corner || (x * 13 + y * 7 + (x ^ y) * 5) % 4 === 0;
  });

  return (
    <div
      className={cn("grid aspect-square rounded-[20px] bg-[#1a1a1a] p-3", className)}
      style={{ gridTemplateColumns: "repeat(10, minmax(0, 1fr))", gap: 2 }}
    >
      {cells.map((on, index) => (
        <span key={index} className={cn("rounded-[2px]", on ? "bg-white" : "bg-transparent")} />
      ))}
    </div>
  );
}

function VerificationSummary({ passport }: { passport: PublicPassport }) {
  const checks = [
    [
      "Authenticity",
      passport.verificationStatus,
      passport.verificationStatus === "Draft" ? "neutral" : "positive",
    ],
    [
      "Identifier",
      passport.identifierStatus === "Protected" ? "Identifier Protected" : "Not Added",
      passport.identifierStatus === "Protected" ? "positive" : "neutral",
    ],
    ["Ownership", "Not linked", "neutral"],
    ["Warranty", passport.warrantyStatus, "neutral"],
    ["Solana Certificate", `Solana ${passport.solanaCertificate}`, "neutral"],
  ] as const;

  return (
    <aside id="verification" className="scroll-mt-44 lg:sticky lg:top-36">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
        className="rounded-[32px] border border-black/10 bg-white/40 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)] backdrop-blur-2xl"
      >
        <div>
          <h2 className="font-instrument text-[36px] italic leading-none text-[#1a1a1a]">
            Verification Summary
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-[#1a1a1a]/62">
            Buyer-facing trust signals for this passport.
          </p>
        </div>

        <div className="mt-6 flex items-center gap-4 rounded-[26px] border border-black/10 bg-white/35 p-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#0871E7]/25 bg-[#0871E7]/10 text-[#0871E7]">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <div className="font-instrument text-[34px] italic leading-none text-[#1a1a1a]">
              5 checks
            </div>
            <div className="mt-1 text-[13px] text-[#1a1a1a]/55">available</div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {checks.map(([label, status, tone]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-3 border-b border-black/10 pb-3 last:border-0 last:pb-0"
            >
              <span className="text-[14px] font-medium text-[#1a1a1a]">{label}</span>
              <StatusPill tone={tone}>{status}</StatusPill>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3">
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={() => copyText(passport.publicLink)}
          >
            <Copy className="h-4 w-4" />
            Copy Passport Link
          </button>
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={() => window.alert("Reporting will be available soon.")}
          >
            <AlertCircle className="h-4 w-4" />
            Report Issue
          </button>
        </div>

        <p className="mt-5 text-[12px] leading-relaxed text-[#1a1a1a]/45">
          This passport reflects seller-provided data. Always inspect the item and confirm details
          before purchase.
        </p>
      </motion.div>
    </aside>
  );
}

function HeroCertificate({ passport }: { passport: PublicPassport }) {
  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 1.1, ease: EASE }}
      className="scroll-mt-44 rounded-[36px] border border-black/10 bg-white/35 p-8 shadow-[0_30px_90px_rgba(0,0,0,0.08)] backdrop-blur-2xl md:p-10"
    >
      <div className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#0871E7]">
        TRUSTLAYER PRODUCT PASSPORT
      </div>
      <h1 className="mt-5 max-w-4xl break-words font-instrument text-[48px] italic leading-[0.9] tracking-tight text-[#1a1a1a] md:text-[72px]">
        {passport.productName}
      </h1>
      <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-[#1a1a1a]/65">
        A public verification record for a high-value second-hand product.
      </p>
      <p className="mt-3 max-w-2xl text-[12px] leading-relaxed text-[#1a1a1a]/45">
        This passport reflects seller-provided data. Always inspect the item and confirm details
        before purchase.
      </p>

      <div className="mt-7 flex flex-wrap gap-2.5">
        <HeroPill>{passport.verificationStatus}</HeroPill>
        <HeroPill>
          {passport.identifierStatus === "Protected"
            ? "Identifier Protected"
            : "Identifier Pending"}
        </HeroPill>
        <HeroPill>{passport.qrStatus}</HeroPill>
        <HeroPill muted>Solana {passport.solanaCertificate}</HeroPill>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 rounded-[26px] border border-black/10 bg-white/30 p-5 sm:grid-cols-3">
        {[
          ["Passport ID", passport.passportId],
          ["Created", passport.createdAt],
          ["Last Updated", passport.lastUpdated],
        ].map(([label, value]) => (
          <div key={label}>
            <div className="text-[12px] text-[#1a1a1a]/45">{label}</div>
            <div className="mt-1 text-[14px] font-medium text-[#1a1a1a]">{value}</div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

function PassportHistory({ passport }: { passport: PublicPassport }) {
  return (
    <AnimatedSection className={cardClass}>
      <SectionTitle>Passport History</SectionTitle>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#1a1a1a]/65">
        A timeline of records attached to this product passport.
      </p>

      <div className="mt-7">
        {passport.history.map((item, index) => {
          const completed = item.status === "Completed";

          return (
            <div key={item.title} className="relative flex gap-4 pb-7 last:pb-0">
              {index < passport.history.length - 1 && (
                <div className="absolute left-[7px] top-5 h-full w-px bg-black/10" />
              )}
              <div
                className={cn(
                  "relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-[#F3F4ED]",
                  completed ? "bg-[#0871E7]" : "bg-[#1a1a1a]/25",
                )}
              />
              <div className="min-w-0 flex-1 rounded-[22px] border border-black/10 bg-white/25 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-[15px] font-semibold text-[#1a1a1a]">{item.title}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-[#1a1a1a]/62">
                      {item.description}
                    </p>
                    <div className="mt-3 text-[12px] text-[#1a1a1a]/45">{item.date}</div>
                  </div>
                  <StatusPill tone={completed ? "positive" : "neutral"}>{item.status}</StatusPill>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AnimatedSection>
  );
}

function QrSharePanel({ passport }: { passport: PublicPassport }) {
  return (
    <AnimatedSection className={cardClass}>
      <SectionTitle>QR Verification</SectionTitle>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#1a1a1a]/65">
        Scan or share this passport to let buyers verify the product before purchase.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr] md:items-center">
        <FakeQr className="w-full max-w-[200px]" />
        <div className="min-w-0">
          <div className="break-words rounded-[22px] border border-black/10 bg-white/35 px-4 py-3 text-[14px] font-medium text-[#1a1a1a]">
            {passport.publicLink}
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => copyText(passport.publicLink)}
            >
              <Copy className="h-4 w-4" />
              Copy Link
            </button>
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => window.alert("QR download will be available soon.")}
            >
              <Download className="h-4 w-4" />
              Download QR
            </button>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

function TrustCta() {
  return (
    <AnimatedSection className="rounded-[36px] border border-black/10 bg-white/35 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.05)] backdrop-blur-xl md:p-10">
      <h2 className="font-instrument text-[40px] italic leading-none text-[#1a1a1a] md:text-[56px]">
        Verify before you pay.
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-[#1a1a1a]/65">
        Create or check a TrustLayer passport before purchasing high-value second-hand goods.
      </p>
      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a href="/create-passport" className={primaryButtonClass}>
          Create Product Passport
        </a>
        <a href="/verify" className={secondaryButtonClass}>
          Open Verifier
        </a>
      </div>
    </AnimatedSection>
  );
}

function PublicPassportPage() {
  const { id } = Route.useParams();
  const fallbackPassport = useMemo(() => createPublicPassport(id), [id]);
  const [supabasePassport, setSupabasePassport] = useState<PublicPassport | null>(null);

  useEffect(() => {
    let isMounted = true;

    setSupabasePassport(null);

    void getPublishedPassportByPassportId(id)
      .then((passport) => {
        if (!isMounted || !passport) return;

        setSupabasePassport(mapSupabasePassportToPublicPassport(passport, fallbackPassport));
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.warn("Unable to load Supabase passport data.", error);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fallbackPassport, id]);

  const publicPassport = supabasePassport || fallbackPassport;

  const productRows: [string, string][] = [
    ["Category", publicPassport.category],
    ["Product Name", publicPassport.productName],
    ["Brand", publicPassport.brand],
    ["Model", publicPassport.model],
    ["Condition", publicPassport.condition],
  ];

  const warrantyRows: [string, string][] = [
    ["Warranty Status", publicPassport.warrantyStatus],
    ["Warranty Period", publicPassport.warrantyPeriod],
    ["Warranty Expiry", publicPassport.warrantyExpiry],
    ["Seller", publicPassport.sellerName],
    ["Owner Wallet", publicPassport.ownerWallet],
  ];

  const categoryRows = Object.entries(publicPassport.categoryDetails).map(([key, value]) => [
    categoryDetailLabels[key as keyof typeof publicPassport.categoryDetails],
    value,
  ]) as [string, string][];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F3F4ED] font-sans text-[#1a1a1a]">
      <Navbar />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 14% 4%, rgba(8,113,231,0.18), transparent 28%), radial-gradient(circle at 54% 42%, rgba(20,241,149,0.10), transparent 32%), radial-gradient(circle at 92% 12%, rgba(153,69,255,0.08), transparent 30%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(243,244,237,0.76)_68%,#F3F4ED_100%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-28 md:px-10 md:pt-32 lg:px-16">
        <HeroCertificate passport={publicPassport} />

        <div className="mt-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_380px] lg:gap-8">
          <div className="space-y-8">
            <DetailCard id="passport-details" title="Product Details">
              <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
                {productRows.map(([label, value]) => (
                  <DetailRow key={label} label={label} value={value} />
                ))}
              </div>
              <div className="mt-6 rounded-[24px] border border-black/10 bg-white/25 p-5">
                <div className="text-[13px] text-[#1a1a1a]/50">Description</div>
                <p className="mt-2 text-[15px] leading-relaxed text-[#1a1a1a]/75">
                  {publicPassport.description}
                </p>
              </div>
            </DetailCard>

            <DetailCard title="Identifier Protection">
              <p className="max-w-3xl text-[15px] leading-relaxed text-[#1a1a1a]/65">
                TrustLayer protects sensitive identifiers by masking them publicly. Buyers can
                verify a product without exposing the full IMEI, serial number, or certificate
                number.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_260px] lg:items-center">
                <div>
                  <DetailRow label="Identifier Type" value={publicPassport.identifierType} />
                  <DetailRow label="Public Identifier" value={publicPassport.maskedIdentifier} />
                  <DetailRow label="Privacy Status" value="Identifier Protected" />
                </div>
                <div className="rounded-[26px] border border-[#0871E7]/20 bg-[#0871E7]/5 p-5 text-center">
                  <div className="font-sans text-[32px] font-semibold tracking-tight text-[#0871E7]">
                    {publicPassport.maskedIdentifier}
                  </div>
                  <div className="mt-2 text-[12px] text-[#1a1a1a]/50">
                    Full identifiers are never displayed publicly in the MVP interface.
                  </div>
                </div>
              </div>
            </DetailCard>

            <DetailCard title="Warranty & Ownership">
              <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
                {warrantyRows.map(([label, value]) => (
                  <DetailRow key={label} label={label} value={value} />
                ))}
              </div>
              <p className="mt-5 rounded-[22px] border border-black/10 bg-white/25 p-4 text-[14px] leading-relaxed text-[#1a1a1a]/62">
                Ownership linking will be available when wallet connection is enabled.
              </p>
            </DetailCard>

            <DetailCard title="Category Details">
              <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
                {categoryRows.map(([label, value]) => (
                  <DetailRow key={label} label={label} value={value} />
                ))}
              </div>
            </DetailCard>

            <PassportHistory passport={publicPassport} />
            <QrSharePanel passport={publicPassport} />
            <TrustCta />
          </div>

          <VerificationSummary passport={publicPassport} />
        </div>
      </div>
    </main>
  );
}
