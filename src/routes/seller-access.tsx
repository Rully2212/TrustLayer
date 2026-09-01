import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, ExternalLink, LockKeyhole, Mail, ShieldCheck, Wallet } from "lucide-react";
import { type ReactNode, useState } from "react";

import { grantDemoSellerAccess, resolveSellerRedirect } from "@/lib/demo-seller-access";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/seller-access")({
  component: SellerAccessPage,
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Seller Access - TrustLayer" },
      {
        name: "description",
        content:
          "Enter the frontend-only TrustLayer demo seller experience before managing product passports.",
      },
    ],
  }),
});

const EASE = [0.16, 1, 0.3, 1] as const;

const primaryButtonClass =
  "group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-[#0871E7] px-6 py-3 text-[14px] font-medium text-white shadow-[inset_0_-4px_4px_rgba(255,255,255,0.39)] outline outline-1 -outline-offset-1 outline-[#0871E7] transition hover:bg-[#0766d4]";

const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white/35 px-6 py-3 text-[14px] font-medium text-[#1a1a1a] transition hover:bg-white/50";

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
            "radial-gradient(circle at 18% 8%, rgba(8,113,231,0.18), transparent 30%), radial-gradient(circle at 80% 26%, rgba(20,241,149,0.11), transparent 34%), radial-gradient(circle at 50% 92%, rgba(8,113,231,0.08), transparent 34%)",
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

function DisabledAccessMethod({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <button
      type="button"
      disabled
      className="flex min-h-[116px] cursor-not-allowed flex-col items-start justify-between rounded-[24px] border border-black/10 bg-white/30 p-5 text-left backdrop-blur-xl"
    >
      <div className="flex w-full items-start justify-between gap-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/45 text-[#1a1a1a]/40">
          {icon}
        </span>
        <span className="rounded-full border border-black/10 bg-white/45 px-3 py-1.5 text-[12px] font-medium text-[#1a1a1a]/45">
          Coming Soon
        </span>
      </div>
      <div className="mt-4 font-instrument text-[30px] italic leading-none text-[#1a1a1a]/45">
        {title}
      </div>
    </button>
  );
}

function SellerAccessPage() {
  const { redirect } = Route.useSearch();
  const [demoSellerReady, setDemoSellerReady] = useState(false);
  const redirectTarget = resolveSellerRedirect(redirect);

  const continueAsDemoSeller = () => {
    setDemoSellerReady(true);
    grantDemoSellerAccess();
    window.location.href = redirectTarget;
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F3F4ED] px-6 pb-16 pt-28 font-sans text-[#1a1a1a]">
      <Navbar />
      <PageBackground />

      <motion.section
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative z-10 w-full max-w-2xl rounded-[36px] border border-black/10 bg-white/35 p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.08)] backdrop-blur-2xl md:p-10"
      >
        <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0871E7]">
          SELLER ACCESS
        </div>
        <h1 className="mx-auto mt-4 max-w-xl font-instrument text-[44px] italic leading-[0.9] tracking-tight text-[#1a1a1a] md:text-[64px]">
          Seller access for product passports.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-[#1a1a1a]/65 md:text-[18px]">
          Create, manage, and share TrustLayer passports for high-value second-hand goods.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/40 px-4 py-2 text-[13px] font-medium text-[#1a1a1a]/65">
          <ShieldCheck className="h-4 w-4 text-[#0871E7]" />
          Frontend-only MVP
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={continueAsDemoSeller} className={primaryButtonClass}>
            <span className="absolute left-[10%] top-[1px] h-4 w-[80%] rounded-[12px] bg-gradient-to-b from-[#DEF0FC] to-transparent transition-transform duration-300 group-hover:scale-x-105" />
            <span className="relative z-10 inline-flex items-center gap-2">
              {demoSellerReady ? "Opening Seller Area" : "Continue as Demo Seller"}
              <ArrowRight className="h-4 w-4" />
            </span>
          </button>
          <a href="/verify" className={secondaryButtonClass}>
            <ExternalLink className="h-4 w-4" />
            Explore Public Verifier
          </a>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DisabledAccessMethod icon={<Mail className="h-4 w-4" />} title="Email sign-in" />
          <DisabledAccessMethod icon={<Wallet className="h-4 w-4" />} title="Wallet sign-in" />
        </div>

        <p className="mx-auto mt-5 max-w-xl text-[13px] leading-relaxed text-[#1a1a1a]/52">
          Seller authentication, wallet ownership, and secure storage will be added in the backend
          version.
        </p>

        <div className="mt-8 rounded-[24px] border border-black/10 bg-white/30 p-5">
          <div className="flex items-center justify-center gap-2 text-[13px] font-medium text-[#1a1a1a]/70">
            <LockKeyhole className="h-4 w-4 text-[#0871E7]" />
            Buyers do not need an account to view or verify public passports.
          </div>
          <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="/passport/TL-000001" className={secondaryButtonClass}>
              View Demo Passport
            </a>
            <a href="/verify" className={secondaryButtonClass}>
              Open Verifier
            </a>
          </div>
        </div>
      </motion.section>
    </main>
  );
}
