import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  Check,
  ClipboardCheck,
  Copy,
  ExternalLink,
  Link2,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { passports, seller, type SellerPassport, verifiedPassport } from "@/lib/mock-passport";
import { isSupabaseConfigured } from "@/lib/supabase";
import { formatPassportDate, getPublishedPassportByPassportId } from "@/lib/supabase-passports";
import { cn } from "@/lib/utils";
import type { PassportWithPublicRelations } from "@/lib/database.types";

export const Route = createFileRoute("/verify")({
  component: VerifierPage,
  validateSearch: (search: Record<string, unknown>) => ({
    passportId: typeof search.passportId === "string" ? search.passportId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Verify Product Passport - TrustLayer" },
      {
        name: "description",
        content:
          "Verify a TrustLayer public product passport by entering a passport ID or public passport link.",
      },
    ],
  }),
});

const EASE = [0.16, 1, 0.3, 1] as const;
type ResultState = "idle" | "success" | "not-found" | "invalid";

type NormalizedInput =
  | { status: "valid-format"; passportId: string }
  | { status: "invalid-format" }
  | { status: "empty" };

type VerificationPassport = SellerPassport & {
  maskedIdentifier: string;
  sellerName: string;
  ownershipStatus: string;
  solanaCertificate: string;
};

function fallbackText(value: string | null, fallback = "Not provided") {
  return value?.trim() || fallback;
}

function createVerificationPassport(passport: SellerPassport): VerificationPassport {
  const isDemoPassport = passport.passportId === verifiedPassport.passportId;

  return {
    ...passport,
    maskedIdentifier: isDemoPassport
      ? verifiedPassport.maskedIdentifier
      : passport.identifierStatus === "Protected"
        ? "Protected"
        : "Not added",
    sellerName: seller.name,
    ownershipStatus: "Not linked",
    solanaCertificate: passport.solanaStatus,
  };
}

function mapSupabaseVerificationPassport(
  passport: PassportWithPublicRelations,
): VerificationPassport {
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
    maskedIdentifier: fallbackText(passport.masked_identifier, "Not added"),
    sellerName: passport.seller_name,
    ownershipStatus: "Not linked",
    solanaCertificate: passport.solana_certificate_status,
  };
}

const primaryButtonClass =
  "group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-[#0871E7] px-6 py-3 text-[14px] font-medium text-white shadow-[inset_0_-4px_4px_rgba(255,255,255,0.39)] outline outline-1 -outline-offset-1 outline-[#0871E7] transition hover:bg-[#0766d4] disabled:cursor-not-allowed disabled:bg-[#0871E7]/35 disabled:outline-[#0871E7]/20 disabled:shadow-none";

const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white/35 px-6 py-3 text-[14px] font-medium text-[#1a1a1a] transition hover:bg-white/50";

const resultMotion = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
  transition: { duration: 0.35, ease: EASE },
};

function normalizeInput(value: string): NormalizedInput {
  const trimmed = value.trim();

  if (!trimmed) return { status: "empty" };

  const withoutProtocol = trimmed.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  const passportIdMatch = withoutProtocol.match(/^TL-\d{6}$/i);

  if (passportIdMatch) {
    return { status: "valid-format", passportId: passportIdMatch[0].toUpperCase() };
  }

  const linkMatch = withoutProtocol.match(/^trustlayer\.app\/passport\/(TL-\d{6})(?:[/?#].*)?$/i);

  if (linkMatch) {
    return { status: "valid-format", passportId: linkMatch[1].toUpperCase() };
  }

  return { status: "invalid-format" };
}

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
            "radial-gradient(circle at 16% 6%, rgba(8,113,231,0.17), transparent 28%), radial-gradient(circle at 72% 24%, rgba(20,241,149,0.10), transparent 32%), radial-gradient(circle at 88% 84%, rgba(153,69,255,0.08), transparent 30%)",
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

function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "positive" | "neutral";
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
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "positive" ? "bg-[#0871E7]" : "bg-[#1a1a1a]/30",
        )}
      />
      {children}
    </span>
  );
}

function ResultFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      {...resultMotion}
      className={cn(
        "mt-12 scroll-mt-44 rounded-[36px] border border-black/10 bg-white/35 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.06)] backdrop-blur-xl md:p-8",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

function IdleResult() {
  const rows = [
    ["Passport ID lookup", "Enter a TrustLayer ID directly."],
    ["Public link verification", "Paste a public passport link."],
    ["Buyer-facing trust summary", "Review key signals before payment."],
  ];

  return (
    <ResultFrame>
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white/45 text-[#0871E7]">
            <Search className="h-5 w-5" />
          </div>
          <h2 className="mt-5 font-instrument text-[38px] italic leading-none text-[#1a1a1a]">
            Ready to verify
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#1a1a1a]/65">
            Enter a TrustLayer passport link or ID to begin.
          </p>
        </div>
        <div className="min-w-0 rounded-[28px] border border-black/10 bg-white/30 p-4 md:w-[340px]">
          <div className="space-y-3">
            {rows.map(([title, body]) => (
              <div key={title} className="flex items-start gap-3 rounded-[20px] bg-white/35 p-3">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0871E7]/10 text-[#0871E7]">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-[14px] font-medium text-[#1a1a1a]">{title}</div>
                  <div className="mt-1 text-[12px] leading-relaxed text-[#1a1a1a]/55">{body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ResultFrame>
  );
}

function SuccessResult({
  passport,
  onCopy,
  copied,
  onVerifyAnother,
}: {
  passport: VerificationPassport;
  onCopy: () => void;
  copied: boolean;
  onVerifyAnother: () => void;
}) {
  const summaryRows: [string, string][] = [
    ["Passport ID", passport.passportId],
    ["Product", passport.productName],
    ["Category", passport.category],
    ["Brand / Model", `${passport.brand} / ${passport.model}`],
    ["Condition", passport.condition],
    ["Masked Identifier", passport.maskedIdentifier],
    ["Seller", passport.sellerName],
    ["Public Link", passport.publicLink],
  ];

  const checks: [string, string, "positive" | "neutral"][] = [
    [
      "Authenticity",
      passport.verificationStatus,
      passport.verificationStatus === "Seller Verified" ? "positive" : "neutral",
    ],
    [
      "Identifier",
      passport.identifierStatus,
      passport.identifierStatus === "Protected" ? "positive" : "neutral",
    ],
    ["Ownership", passport.ownershipStatus, "neutral"],
    ["Warranty", passport.warrantyStatus, "neutral"],
    ["Solana Certificate", passport.solanaCertificate, "neutral"],
  ];

  return (
    <ResultFrame className="border-[#0871E7]/20 bg-[#0871E7]/[0.04] shadow-[0_24px_80px_rgba(8,113,231,0.08)]">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#0871E7] text-white shadow-[0_18px_44px_rgba(8,113,231,0.24)]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-instrument text-[40px] italic leading-none text-[#1a1a1a]">
              Passport Verified
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#1a1a1a]/62">
              This TrustLayer passport is valid and available for review.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:max-w-[390px] md:justify-end">
          <StatusPill
            tone={passport.verificationStatus === "Seller Verified" ? "positive" : "neutral"}
          >
            {passport.verificationStatus}
          </StatusPill>
          <StatusPill tone={passport.identifierStatus === "Protected" ? "positive" : "neutral"}>
            Identifier {passport.identifierStatus}
          </StatusPill>
          <StatusPill tone={passport.qrStatus === "QR Ready" ? "positive" : "neutral"}>
            {passport.qrStatus}
          </StatusPill>
          <StatusPill>Solana {passport.solanaCertificate}</StatusPill>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-3 rounded-[28px] border border-black/10 bg-white/35 p-5 md:grid-cols-2">
        {summaryRows.map(([label, value], index) => (
          <div
            key={label}
            className={cn(
              "min-w-0 border-b border-black/10 pb-3",
              index === summaryRows.length - 1 && "border-b-0",
              index >= summaryRows.length - 2 && "md:border-b-0",
            )}
          >
            <div className="text-[12px] text-[#1a1a1a]/45">{label}</div>
            <div className="mt-1 break-words text-[14px] font-medium text-[#1a1a1a]">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-[28px] border border-black/10 bg-white/35 p-5">
        <h3 className="font-instrument text-[32px] italic leading-none text-[#1a1a1a]">
          Trust checks
        </h3>
        <div className="mt-4 space-y-3">
          {checks.map(([label, status, tone]) => (
            <div
              key={label}
              className="flex flex-col gap-2 border-b border-black/10 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="text-[14px] font-medium text-[#1a1a1a]">{label}</span>
              <StatusPill tone={tone}>{status}</StatusPill>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <a href={`/passport/${passport.passportId}`} className={primaryButtonClass}>
          <span className="relative z-10 inline-flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Open Public Passport
          </span>
        </a>
        <button type="button" onClick={onCopy} className={secondaryButtonClass}>
          {copied ? <ClipboardCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Link Copied" : "Copy Passport Link"}
        </button>
        <button type="button" onClick={onVerifyAnother} className={secondaryButtonClass}>
          <RefreshCw className="h-4 w-4" />
          Verify Another
        </button>
      </div>
    </ResultFrame>
  );
}

function NotFoundResult({
  onTryAgain,
  onPasteExample,
}: {
  onTryAgain: () => void;
  onPasteExample: () => void;
}) {
  const suggestions = [
    "Check for typos",
    "Make sure the link is complete",
    "Try pasting the Passport ID only",
  ];

  return (
    <ResultFrame>
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/45 text-[#1a1a1a]/55">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-instrument text-[38px] italic leading-none text-[#1a1a1a]">
            Passport not found
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#1a1a1a]/65">
            We could not find a TrustLayer passport that matches this ID or link.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-[28px] border border-black/10 bg-white/30 p-5">
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <div key={suggestion} className="flex items-center gap-3 text-[14px] text-[#1a1a1a]/68">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0871E7]" />
              {suggestion}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={onTryAgain} className={secondaryButtonClass}>
          Try Again
        </button>
        <button type="button" onClick={onPasteExample} className={primaryButtonClass}>
          <span className="relative z-10">Paste Example</span>
        </button>
      </div>
    </ResultFrame>
  );
}

function InvalidFormatResult({
  onClear,
  onPasteExample,
}: {
  onClear: () => void;
  onPasteExample: () => void;
}) {
  return (
    <ResultFrame>
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/45 text-[#1a1a1a]/55">
          <Link2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-instrument text-[38px] italic leading-none text-[#1a1a1a]">
            Invalid format
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#1a1a1a]/65">
            Please enter a valid TrustLayer passport ID or a public passport link.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-[28px] border border-black/10 bg-white/30 p-5">
        <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0871E7]">
          Accepted examples
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {["TL-000001", "trustlayer.app/passport/TL-000001"].map((example) => (
            <div
              key={example}
              className="break-words rounded-[18px] border border-black/10 bg-white/35 px-4 py-3 text-[13px] font-medium text-[#1a1a1a]"
            >
              {example}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={onClear} className={secondaryButtonClass}>
          Clear Input
        </button>
        <button type="button" onClick={onPasteExample} className={primaryButtonClass}>
          <span className="relative z-10">Paste Example</span>
        </button>
      </div>
    </ResultFrame>
  );
}

function VerificationResult({
  state,
  passport,
  copied,
  onCopy,
  onClear,
  onPasteExample,
  onVerifyAnother,
}: {
  state: ResultState;
  passport: VerificationPassport;
  copied: boolean;
  onCopy: () => void;
  onClear: () => void;
  onPasteExample: () => void;
  onVerifyAnother: () => void;
}) {
  return (
    <section id="verification-result" className="scroll-mt-44">
      <AnimatePresence mode="wait">
        {state === "idle" && <IdleResult key="idle" />}
        {state === "success" && (
          <SuccessResult
            key="success"
            passport={passport}
            copied={copied}
            onCopy={onCopy}
            onVerifyAnother={onVerifyAnother}
          />
        )}
        {state === "not-found" && (
          <NotFoundResult key="not-found" onTryAgain={onClear} onPasteExample={onPasteExample} />
        )}
        {state === "invalid" && (
          <InvalidFormatResult key="invalid" onClear={onClear} onPasteExample={onPasteExample} />
        )}
      </AnimatePresence>
    </section>
  );
}

function VerificationInputCard({
  inputRef,
  inputValue,
  onInputChange,
  onVerify,
  onClear,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  inputValue: string;
  onInputChange: (value: string) => void;
  onVerify: () => void | Promise<void>;
  onClear: () => void;
}) {
  const isDisabled = !inputValue.trim();

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
      id="verify-passport"
      className="mt-10 scroll-mt-44 rounded-[36px] border border-black/10 bg-white/35 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.06)] backdrop-blur-2xl md:p-8"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isDisabled) void onVerify();
      }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="font-instrument text-[38px] italic leading-none text-[#1a1a1a]">
            Verify Passport
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[#1a1a1a]/62">
            Enter a Passport ID or paste a TrustLayer passport link.
          </p>
        </div>
        <div className="rounded-full border border-black/10 bg-white/35 px-4 py-2 text-[13px] text-[#1a1a1a]/62">
          Frontend-only MVP
        </div>
      </div>

      <div className="mt-7">
        <label className="mb-2 block text-[13px] font-medium text-[#1a1a1a]/60">
          Passport ID or Public Link
        </label>
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="TL-000001 or trustlayer.app/passport/TL-000001"
          className="w-full rounded-[18px] border border-black/10 bg-white/40 px-4 py-4 text-[15px] text-[#1a1a1a] outline-none transition placeholder:text-[#1a1a1a]/35 focus:border-[#0871E7]/40 focus:ring-2 focus:ring-[#0871E7]/25"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {["Example ID: TL-000001", "Example Link: trustlayer.app/passport/TL-000001"].map(
          (chip) => (
            <span
              key={chip}
              className="rounded-full border border-black/10 bg-white/35 px-3 py-1.5 text-[12px] text-[#1a1a1a]/62 backdrop-blur-xl"
            >
              {chip}
            </span>
          ),
        )}
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" disabled={isDisabled} className={primaryButtonClass}>
          <span className="relative z-10 inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Verify Passport
          </span>
        </button>
        <button type="button" onClick={onClear} className={secondaryButtonClass}>
          Clear
        </button>
      </div>

      <p className="mt-5 text-[13px] leading-relaxed text-[#1a1a1a]/50">
        You can paste either a full public link or a TrustLayer passport ID.
      </p>
    </motion.form>
  );
}

function HowVerificationWorks() {
  const cards = [
    {
      title: "Enter the passport",
      body: "Paste a TrustLayer link or enter a passport ID.",
    },
    {
      title: "Check trust signals",
      body: "Review authenticity, identifier protection, ownership, warranty, and certificate status.",
    },
    {
      title: "Open the public passport",
      body: "See the full buyer-facing passport page and review the product record.",
    },
    {
      title: "Decide with confidence",
      body: "Use the available trust signals before paying for a high-value second-hand item.",
    },
  ];

  return (
    <section id="how-verification-works" className="mt-24 scroll-mt-44">
      <div className="max-w-3xl">
        <h2 className="font-instrument text-[42px] italic leading-none tracking-tight text-[#1a1a1a] md:text-[56px]">
          How verification works
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#1a1a1a]/65">
          TrustLayer gives buyers a simple way to review seller-provided product passports before
          purchase.
        </p>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, delay: index * 0.06, ease: EASE }}
            className="rounded-[28px] border border-black/10 bg-white/30 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.05)] backdrop-blur-xl"
          >
            <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0871E7]">
              0{index + 1}
            </div>
            <h3 className="mt-5 font-instrument text-[34px] italic leading-none text-[#1a1a1a]">
              {card.title}
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[#1a1a1a]/65">{card.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: EASE }}
      id="verifier-cta"
      className="mt-20 scroll-mt-44 rounded-[36px] border border-black/10 bg-white/40 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.05)] backdrop-blur-2xl md:p-10"
    >
      <h2 className="font-instrument text-[40px] italic leading-none text-[#1a1a1a] md:text-[56px]">
        Create or verify with confidence.
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-[#1a1a1a]/65">
        Create a new passport for your own item, or open a verified public passport before
        purchasing.
      </p>
      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a href="/create-passport" className={primaryButtonClass}>
          <span className="relative z-10">Create Product Passport</span>
        </a>
        <a href={`/passport/${verifiedPassport.passportId}`} className={secondaryButtonClass}>
          Open Demo Passport
        </a>
      </div>
    </motion.section>
  );
}

function VerifierPage() {
  const search = Route.useSearch();
  const [inputValue, setInputValue] = useState("");
  const [resultState, setResultState] = useState<ResultState>("idle");
  const [copied, setCopied] = useState(false);
  const [activePassport, setActivePassport] = useState<VerificationPassport>(() =>
    createVerificationPassport(passports[0]),
  );
  const inputRef = useRef<HTMLInputElement | null>(null);

  const trustPills = useMemo(
    () => ["Buyer Verification Tool", "Works with Public Passport Links", "QR Ready"],
    [],
  );

  useEffect(() => {
    if (!search.passportId) return;

    setInputValue(search.passportId);
    setResultState("idle");
    setCopied(false);
  }, [search.passportId]);

  const resetToIdle = () => {
    setInputValue("");
    setResultState("idle");
    setCopied(false);
  };

  const verifyAnother = () => {
    resetToIdle();
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const pasteExample = () => {
    setInputValue(verifiedPassport.passportId);
    setResultState("idle");
    setCopied(false);
  };

  const verifyPassport = async () => {
    const normalized = normalizeInput(inputValue);
    setCopied(false);

    if (normalized.status === "empty") {
      setResultState("idle");
      return;
    }

    if (normalized.status === "invalid-format") {
      setResultState("invalid");
      return;
    }

    if (isSupabaseConfigured) {
      try {
        const result = await getPublishedPassportByPassportId(normalized.passportId);

        if (import.meta.env.DEV) {
          console.log("Verify Supabase passport result", result);
        }

        if (!result) {
          setResultState("not-found");
          return;
        }

        setActivePassport(mapSupabaseVerificationPassport(result));
        setResultState("success");
        return;
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn("Unable to verify Supabase passport.", error);
          console.log("Verify Supabase passport result", null);
        }

        setResultState("not-found");
        return;
      }
    }

    const matchedPassport = passports.find(
      (passport) => passport.passportId === normalized.passportId,
    );

    if (!matchedPassport) {
      setResultState("not-found");
      return;
    }

    setActivePassport(createVerificationPassport(matchedPassport));
    setResultState("success");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F3F4ED] font-sans text-[#1a1a1a]">
      <Navbar />
      <PageBackground />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-28 md:px-10 md:pt-32 lg:px-16">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="max-w-4xl"
        >
          <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0871E7]">
            VERIFY A PRODUCT PASSPORT
          </div>
          <h1 className="mt-5 max-w-4xl font-instrument text-[44px] italic leading-[0.9] tracking-tight text-[#1a1a1a] md:text-[68px]">
            Check the trust layer before you pay.
          </h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-[#1a1a1a]/65 md:text-[18px]">
            Paste a TrustLayer passport link or enter a passport ID to verify a high-value
            second-hand product before purchasing.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {trustPills.map((pill) => (
              <span
                key={pill}
                className="rounded-full border border-black/10 bg-white/35 px-4 py-2 text-[13px] text-[#1a1a1a]/70 backdrop-blur-xl"
              >
                {pill}
              </span>
            ))}
          </div>
        </motion.section>

        <VerificationInputCard
          inputRef={inputRef}
          inputValue={inputValue}
          onInputChange={(value) => {
            setInputValue(value);
            setCopied(false);
          }}
          onVerify={verifyPassport}
          onClear={resetToIdle}
        />

        <VerificationResult
          state={resultState}
          passport={activePassport}
          copied={copied}
          onCopy={() =>
            copyText(activePassport.publicLink, () => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1800);
            })
          }
          onClear={resetToIdle}
          onPasteExample={pasteExample}
          onVerifyAnother={verifyAnother}
        />

        <HowVerificationWorks />
        <FinalCta />
      </div>
    </main>
  );
}
