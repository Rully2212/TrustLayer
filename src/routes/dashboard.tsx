import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  AlertCircle,
  Check,
  ClipboardCheck,
  Copy,
  ExternalLink,
  LogOut,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import {
  clearDemoSellerAccess,
  hasDemoSellerAccess,
  sellerAccessUrl,
} from "@/lib/demo-seller-access";
import { passports, seller, type SellerPassport } from "@/lib/mock-passport";
import { listRecentDashboardPassports } from "@/lib/supabase-passports";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  component: SellerDashboard,
  head: () => ({
    meta: [
      { title: "Seller Dashboard - TrustLayer" },
      {
        name: "description",
        content:
          "Manage frontend-only TrustLayer product passports, public links, QR readiness, and verification status.",
      },
    ],
  }),
});

const EASE = [0.16, 1, 0.3, 1] as const;

type CategoryFilter = string;

type StatusFilter = string;

const defaultCategoryOptions: CategoryFilter[] = [
  "All Categories",
  "Electronics",
  "Luxury Goods",
  "Collectibles",
  "Music Gear",
  "Mobility",
];

const defaultStatusOptions: StatusFilter[] = [
  "All Statuses",
  "Seller Verified",
  "Draft",
  "QR Ready",
  "Not Minted",
];

const primaryButtonClass =
  "group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-[#0871E7] px-6 py-3 text-[14px] font-medium text-white shadow-[inset_0_-4px_4px_rgba(255,255,255,0.39)] outline outline-1 -outline-offset-1 outline-[#0871E7] transition hover:bg-[#0766d4]";

const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white/35 px-6 py-3 text-[14px] font-medium text-[#1a1a1a] transition hover:bg-white/50";

const smallActionClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white/35 px-3 text-[12px] font-medium text-[#1a1a1a] transition hover:bg-white/50";

function copyText(value: string, onCopied: () => void) {
  if (navigator.clipboard?.writeText) {
    void navigator.clipboard
      .writeText(value)
      .then(onCopied)
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
    <a href={href} className={cn(primaryButtonClass, className)}>
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
        <GlintButton href="/create-passport" className="px-6 py-3">
          Create Passport
        </GlintButton>
      </nav>
    </div>
  );
}

function PageBackground() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 8%, rgba(8,113,231,0.17), transparent 28%), radial-gradient(circle at 78% 24%, rgba(20,241,149,0.10), transparent 32%), radial-gradient(circle at 90% 84%, rgba(153,69,255,0.07), transparent 30%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.11]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(243,244,237,0.76)_68%,#F3F4ED_100%)]" />
    </>
  );
}

function AnimatedCard({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StatusPill({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "positive" | "neutral" | "warning";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium",
        tone === "positive" && "border-[#0871E7]/20 bg-[#0871E7]/10 text-[#0871E7]",
        tone === "neutral" && "border-black/10 bg-white/50 text-[#1a1a1a]/60",
        tone === "warning" && "border-black/10 bg-[#1a1a1a]/5 text-[#1a1a1a]/55",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "positive" && "bg-[#0871E7]",
          tone === "neutral" && "bg-[#1a1a1a]/30",
          tone === "warning" && "bg-[#1a1a1a]/35",
        )}
      />
      {children}
    </span>
  );
}

function statusTone(status: string): "positive" | "neutral" | "warning" {
  if (["Seller Verified", "Protected", "QR Ready"].includes(status)) return "positive";
  if (["Draft", "Not Added", "Not Ready"].includes(status)) return "warning";
  return "neutral";
}

function DashboardHeader() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE }}
      className="scroll-mt-44 max-w-4xl"
    >
      <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0871E7]">
        SELLER DASHBOARD
      </div>
      <h1 className="mt-5 max-w-4xl font-instrument text-[44px] italic leading-[0.9] tracking-tight text-[#1a1a1a] md:text-[68px]">
        Manage your product passports.
      </h1>
      <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-[#1a1a1a]/65 md:text-[18px]">
        Track, share, and manage TrustLayer passports for your high-value second-hand inventory.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <GlintButton href="/create-passport">Create Product Passport</GlintButton>
        <a href="/verify" className={secondaryButtonClass}>
          Verify a Passport
        </a>
      </div>
    </motion.section>
  );
}

function SellerProfileCard({ onSignOut }: { onSignOut: () => void }) {
  return (
    <AnimatedCard className="mt-10 scroll-mt-44 rounded-[36px] border border-black/10 bg-white/35 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.06)] backdrop-blur-2xl md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-[#0871E7]/20 bg-[#0871E7]/10 font-instrument text-[34px] italic text-[#0871E7]">
            KS
          </div>
          <div>
            <h2 className="font-instrument text-[40px] italic leading-none text-[#1a1a1a]">
              {seller.storeName}
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-2 text-[14px] text-[#1a1a1a]/62 sm:grid-cols-3">
              <span>Seller: {seller.name}</span>
              <span>Country: {seller.country}</span>
              <span>Joined: {seller.joinedAt}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          <StatusPill tone="positive">{seller.verificationStatus}</StatusPill>
          <StatusPill tone="positive">QR Enabled</StatusPill>
          <StatusPill tone="neutral">Frontend-only MVP</StatusPill>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/35 px-4 py-2 text-[12px] font-medium text-[#1a1a1a]/65 transition hover:bg-white/50"
          >
            <LogOut className="h-3.5 w-3.5 text-[#0871E7]" />
            Sign out demo seller
          </button>
        </div>
      </div>
      <p className="mt-6 rounded-[22px] border border-black/10 bg-white/25 p-4 text-[13px] leading-relaxed text-[#1a1a1a]/55">
        Wallet connection and seller authentication will be added later.
      </p>
    </AnimatedCard>
  );
}

function StatsGrid({ dashboardPassports }: { dashboardPassports: SellerPassport[] }) {
  const stats = [
    {
      label: "Total Passports",
      value: dashboardPassports.length,
      description: "Created product passports",
    },
    {
      label: "QR Ready",
      value: dashboardPassports.filter((passport) => passport.qrStatus === "QR Ready").length,
      description: "Ready to share with buyers",
    },
    {
      label: "Seller Verified",
      value: dashboardPassports.filter(
        (passport) => passport.verificationStatus === "Seller Verified",
      ).length,
      description: "Passports with seller verification",
    },
    {
      label: "Solana Minted",
      value: dashboardPassports.filter((passport) => passport.solanaStatus === "Minted").length,
      description: "On-chain certificates enabled later",
    },
  ];

  return (
    <section className="mt-10 grid scroll-mt-44 grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <AnimatedCard
          key={stat.label}
          delay={index * 0.04}
          className="rounded-[28px] border border-black/10 bg-white/30 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.05)] backdrop-blur-xl"
        >
          <div className="text-[13px] font-medium text-[#1a1a1a]/55">{stat.label}</div>
          <div className="mt-4 font-instrument text-[48px] italic leading-none text-[#1a1a1a]">
            {stat.value}
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-[#1a1a1a]/58">{stat.description}</p>
        </AnimatedCard>
      ))}
    </section>
  );
}

function SearchFilterBar({
  searchQuery,
  categoryFilter,
  statusFilter,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onClear,
  categoryOptions,
  statusOptions,
}: {
  searchQuery: string;
  categoryFilter: CategoryFilter;
  statusFilter: StatusFilter;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: CategoryFilter) => void;
  onStatusChange: (value: StatusFilter) => void;
  onClear: () => void;
  categoryOptions: CategoryFilter[];
  statusOptions: StatusFilter[];
}) {
  return (
    <AnimatedCard className="mt-10 scroll-mt-44 rounded-[28px] border border-black/10 bg-white/35 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.05)] backdrop-blur-xl md:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1a1a1a]/35" />
          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by product, passport ID, category, or brand..."
            className="h-12 w-full rounded-[18px] border border-black/10 bg-white/40 px-11 text-[14px] text-[#1a1a1a] outline-none transition placeholder:text-[#1a1a1a]/35 focus:border-[#0871E7]/40 focus:ring-2 focus:ring-[#0871E7]/25"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(event) => onCategoryChange(event.target.value as CategoryFilter)}
          className="h-12 w-full min-w-[180px] rounded-[18px] border border-black/10 bg-white/40 px-4 text-[14px] text-[#1a1a1a] outline-none transition focus:border-[#0871E7]/40 focus:ring-2 focus:ring-[#0871E7]/25 lg:w-[190px]"
        >
          {categoryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => onStatusChange(event.target.value as StatusFilter)}
          className="h-12 w-full min-w-[180px] rounded-[18px] border border-black/10 bg-white/40 px-4 text-[14px] text-[#1a1a1a] outline-none transition focus:border-[#0871E7]/40 focus:ring-2 focus:ring-[#0871E7]/25 lg:w-[180px]"
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onClear}
          className={cn(secondaryButtonClass, "w-full lg:w-auto")}
        >
          Clear Filters
        </button>
      </div>
    </AnimatedCard>
  );
}

function PassportActions({
  passport,
  copied,
  onCopy,
}: {
  passport: SellerPassport;
  copied: boolean;
  onCopy: (passport: SellerPassport) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <a href={`/passport/${passport.passportId}`} className={smallActionClass}>
        <ExternalLink className="h-3.5 w-3.5" />
        View Public
      </a>
      <button type="button" onClick={() => onCopy(passport)} className={smallActionClass}>
        {copied ? <ClipboardCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy Link"}
      </button>
      <a href={`/verify?passportId=${passport.passportId}`} className={smallActionClass}>
        <ShieldCheck className="h-3.5 w-3.5" />
        Verify
      </a>
      <button
        type="button"
        onClick={() => window.alert("Passport management actions coming soon.")}
        className={smallActionClass}
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
        More
      </button>
    </div>
  );
}

function PassportRow({
  passport,
  copied,
  onCopy,
}: {
  passport: SellerPassport;
  copied: boolean;
  onCopy: (passport: SellerPassport) => void;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: EASE }}
      className="rounded-[28px] border border-black/10 bg-white/30 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.04)] backdrop-blur-xl transition hover:bg-white/45 md:p-6"
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_1fr_1.35fr_0.95fr] xl:items-start xl:gap-8">
        <div className="min-w-0">
          <h3 className="break-words font-instrument text-[32px] italic leading-none text-[#1a1a1a]">
            {passport.productName}
          </h3>
          <div className="mt-2 text-[13px] font-medium text-[#0871E7]">{passport.passportId}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusPill tone={statusTone(passport.verificationStatus)}>
              {passport.verificationStatus}
            </StatusPill>
            <StatusPill tone={statusTone(passport.qrStatus)}>{passport.qrStatus}</StatusPill>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[13px]">
          <div>
            <div className="text-[#1a1a1a]/45">Category</div>
            <div className="mt-1 font-medium text-[#1a1a1a]">{passport.category}</div>
          </div>
          <div>
            <div className="text-[#1a1a1a]/45">Condition</div>
            <div className="mt-1 font-medium text-[#1a1a1a]">{passport.condition}</div>
          </div>
          <div className="col-span-2">
            <div className="text-[#1a1a1a]/45">Brand / Model</div>
            <div className="mt-1 break-words font-medium text-[#1a1a1a]">
              {passport.brand} / {passport.model}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusPill tone={statusTone(passport.identifierStatus)}>
            Identifier: {passport.identifierStatus}
          </StatusPill>
          <StatusPill tone={statusTone(passport.warrantyStatus)}>
            Warranty: {passport.warrantyStatus}
          </StatusPill>
          <StatusPill tone={statusTone(passport.solanaStatus)}>
            Solana: {passport.solanaStatus}
          </StatusPill>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-[12px] text-[#1a1a1a]/45">Created</div>
            <div className="mt-1 text-[13px] font-medium text-[#1a1a1a]">{passport.createdAt}</div>
          </div>
          <PassportActions passport={passport} copied={copied} onCopy={onCopy} />
        </div>
      </div>
    </motion.article>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-[32px] border border-black/10 bg-white/30 p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.05)] backdrop-blur-xl">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white/45 text-[#0871E7]">
        <Search className="h-5 w-5" />
      </div>
      <h3 className="mt-5 font-instrument text-[38px] italic leading-none text-[#1a1a1a]">
        No passports found
      </h3>
      <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-[#1a1a1a]/65">
        Try adjusting your filters or create a new product passport.
      </p>
      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button type="button" onClick={onClear} className={secondaryButtonClass}>
          Clear Filters
        </button>
        <a href="/create-passport" className={primaryButtonClass}>
          <span className="relative z-10">Create Passport</span>
        </a>
      </div>
    </div>
  );
}

function PassportList({
  filteredPassports,
  copiedPassportId,
  onCopy,
  onClearFilters,
}: {
  filteredPassports: SellerPassport[];
  copiedPassportId: string;
  onCopy: (passport: SellerPassport) => void;
  onClearFilters: () => void;
}) {
  return (
    <section id="passports" className="mt-12 scroll-mt-44">
      <div className="max-w-3xl">
        <h2 className="font-instrument text-[42px] italic leading-none tracking-tight text-[#1a1a1a] md:text-[56px]">
          Product Passports
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#1a1a1a]/65">
          Manage public passport links, QR readiness, and verification status for your inventory.
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {filteredPassports.length ? (
          filteredPassports.map((passport) => (
            <PassportRow
              key={passport.passportId}
              passport={passport}
              copied={copiedPassportId === passport.passportId}
              onCopy={onCopy}
            />
          ))
        ) : (
          <EmptyState onClear={onClearFilters} />
        )}
      </div>
    </section>
  );
}

function NextStepsPanel() {
  const items = [
    {
      title: "Mint Solana certificates",
      status: "Coming Soon",
      body: "On-chain certificate minting will be added after backend and wallet integration.",
    },
    {
      title: "Add wallet ownership",
      status: "Planned",
      body: "Link passports to seller and owner wallets.",
    },
    {
      title: "Enable QR downloads",
      status: "Coming Soon",
      body: "Export QR codes for marketplace listings, receipts, and product tags.",
    },
    {
      title: "Add seller authentication",
      status: "Planned",
      body: "Protect passport management with verified seller accounts.",
    },
  ];

  return (
    <AnimatedCard className="mt-12 scroll-mt-44 rounded-[32px] border border-black/10 bg-white/30 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.05)] backdrop-blur-xl md:p-8">
      <h2 className="font-instrument text-[42px] italic leading-none text-[#1a1a1a]">Next steps</h2>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.title} className="rounded-[24px] border border-black/10 bg-white/30 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h3 className="font-instrument text-[30px] italic leading-none text-[#1a1a1a]">
                {item.title}
              </h3>
              <StatusPill tone="neutral">{item.status}</StatusPill>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-[#1a1a1a]/62">{item.body}</p>
          </div>
        ))}
      </div>
    </AnimatedCard>
  );
}

function FinalCta() {
  return (
    <AnimatedCard className="mt-16 scroll-mt-44 rounded-[36px] border border-black/10 bg-white/40 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.05)] backdrop-blur-2xl md:p-10">
      <h2 className="font-instrument text-[40px] italic leading-none text-[#1a1a1a] md:text-[56px]">
        Create your next passport.
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-[#1a1a1a]/65">
        Add another high-value second-hand item and generate a buyer-ready passport link.
      </p>
      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a href="/create-passport" className={primaryButtonClass}>
          <span className="relative z-10 inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Product Passport
          </span>
        </a>
        <a href="/verify" className={secondaryButtonClass}>
          Open Verifier
        </a>
      </div>
    </AnimatedCard>
  );
}

function SellerAccessRedirectScreen() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F3F4ED] px-6 pb-16 pt-28 font-sans text-[#1a1a1a]">
      <Navbar />
      <PageBackground />
      <div className="relative z-10 w-full max-w-lg rounded-[32px] border border-black/10 bg-white/35 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.05)] backdrop-blur-xl">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#0871E7]/20 bg-[#0871E7]/10 text-[#0871E7]">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h1 className="mt-5 font-instrument text-[42px] italic leading-none text-[#1a1a1a]">
          Seller access required.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#1a1a1a]/62">
          Opening the frontend-only demo seller access page before showing the dashboard.
        </p>
      </div>
    </main>
  );
}

function SellerDashboard() {
  const [accessChecked, setAccessChecked] = useState(false);
  const [dashboardPassports, setDashboardPassports] = useState<SellerPassport[]>(() =>
    isSupabaseConfigured ? [] : [...passports],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All Categories");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All Statuses");
  const [copiedPassportId, setCopiedPassportId] = useState("");

  useEffect(() => {
    if (hasDemoSellerAccess()) {
      setAccessChecked(true);
      return;
    }

    window.location.href = sellerAccessUrl("/dashboard");
  }, []);

  useEffect(() => {
    if (!accessChecked) return;

    if (!isSupabaseConfigured) {
      setDashboardPassports([...passports]);
      return;
    }

    let isMounted = true;

    void listRecentDashboardPassports()
      .then((items) => {
        if (!isMounted) return;

        setDashboardPassports(items);
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.warn("Unable to load Supabase dashboard passports.", error);
        }

        if (isMounted) {
          setDashboardPassports([...passports]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessChecked]);

  const categoryOptions = useMemo(() => {
    const categories = dashboardPassports
      .map((passport) => passport.category)
      .filter((category) => category.trim());

    return Array.from(new Set([...defaultCategoryOptions, ...categories]));
  }, [dashboardPassports]);

  const statusOptions = useMemo(() => {
    const statuses = dashboardPassports.flatMap((passport) => [
      passport.verificationStatus,
      passport.qrStatus,
      passport.solanaStatus,
    ]);

    return Array.from(new Set([...defaultStatusOptions, ...statuses.filter(Boolean)]));
  }, [dashboardPassports]);

  const filteredPassports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return dashboardPassports.filter((passport) => {
      const searchable = [
        passport.productName,
        passport.passportId,
        passport.category,
        passport.brand,
        passport.model,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesCategory =
        categoryFilter === "All Categories" || passport.category === categoryFilter;
      const matchesStatus =
        statusFilter === "All Statuses" ||
        [passport.verificationStatus, passport.qrStatus, passport.solanaStatus].includes(
          statusFilter,
        );

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [categoryFilter, dashboardPassports, searchQuery, statusFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("All Categories");
    setStatusFilter("All Statuses");
  };

  const copyPassportLink = (passport: SellerPassport) => {
    copyText(passport.publicLink, () => {
      setCopiedPassportId(passport.passportId);
      window.setTimeout(() => setCopiedPassportId(""), 1800);
    });
  };

  const signOutDemoSeller = () => {
    clearDemoSellerAccess();
    window.location.href = "/seller-access";
  };

  if (!accessChecked) {
    return <SellerAccessRedirectScreen />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F3F4ED] font-sans text-[#1a1a1a]">
      <Navbar />
      <PageBackground />

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-32 md:px-10 md:pt-36 lg:px-16">
        <DashboardHeader />
        <SellerProfileCard onSignOut={signOutDemoSeller} />
        <StatsGrid dashboardPassports={dashboardPassports} />

        <SearchFilterBar
          searchQuery={searchQuery}
          categoryFilter={categoryFilter}
          statusFilter={statusFilter}
          categoryOptions={categoryOptions}
          statusOptions={statusOptions}
          onSearchChange={setSearchQuery}
          onCategoryChange={setCategoryFilter}
          onStatusChange={setStatusFilter}
          onClear={clearFilters}
        />

        <PassportList
          filteredPassports={[...filteredPassports]}
          copiedPassportId={copiedPassportId}
          onCopy={copyPassportLink}
          onClearFilters={clearFilters}
        />

        <NextStepsPanel />
        <FinalCta />

        <div className="mt-10 flex items-start gap-3 rounded-[24px] border border-black/10 bg-white/25 p-4 text-[13px] leading-relaxed text-[#1a1a1a]/50 backdrop-blur-xl">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#0871E7]" />
          This dashboard uses frontend-only mock data. Backend storage, seller authentication,
          wallet ownership, and certificate minting are intentionally not connected in this MVP.
        </div>
      </div>
    </main>
  );
}
