import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";

export const Route = createFileRoute("/")({
  component: App,
  head: () => ({
    meta: [
      { title: "TrustLayer — Verifiable Product Passports for High-Value Resale" },
      {
        name: "description",
        content:
          "Solana-backed digital passports for second-hand luxury, electronics, collectibles and more. Verify authenticity, ownership and history before purchase.",
      },
    ],
  }),
});

const demoPassport = {
  passportId: "TL-000001",
  category: "Luxury Watch",
  product: "Omega Seamaster Professional",
  condition: "Excellent",
  identifier: "A85****21X",
  verificationStatus: "Seller Verified",
  warrantyStatus: "Active",
  ownerWallet: "9xA3...Qp21",
  solanaStatus: "Certificate Minted",
  qrStatus: "QR Ready",
};

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.8, ease: EASE },
};

function TypingMessages() {
  const messages = ["Scanning ID...", "Match found.", "Passport verified."];
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = messages[idx];
    if (!deleting && text === current) {
      const t = setTimeout(() => setDeleting(true), 2000);
      return () => clearTimeout(t);
    }
    if (deleting && text === "") {
      setDeleting(false);
      setIdx((idx + 1) % messages.length);
      return;
    }
    const t = setTimeout(
      () => {
        setText(
          deleting ? current.substring(0, text.length - 1) : current.substring(0, text.length + 1),
        );
      },
      deleting ? 50 : 100,
    );
    return () => clearTimeout(t);
  }, [text, deleting, idx]);

  return (
    <div className="absolute bottom-[31%] left-[8%] z-30 hidden w-[190px] justify-start rounded-[14px] border border-black/10 bg-white/30 px-3 py-2 text-left shadow-[0_12px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl lg:flex">
      <span className="min-h-[1.5em] break-words font-nokia text-[12px] leading-tight text-[#2A3616]">
        {text}
        <motion.span
          className="w-1.5 h-3 bg-[#2A3616] ml-1 align-middle inline-block"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
      </span>
    </div>
  );
}

function GlintButton({
  children,
  className = "",
  href,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
}) {
  const cls = `relative group overflow-hidden inline-flex items-center justify-center rounded-full bg-[#0871E7] px-7 py-3.5 text-white font-sans text-[15px] font-medium shadow-[inset_0_-4px_4px_rgba(255,255,255,0.39)] outline outline-1 outline-[#0871E7] -outline-offset-1 ${className}`;
  const inner = (
    <>
      <span className="absolute w-[80%] h-4 left-[10%] top-[1px] bg-gradient-to-b from-[#DEF0FC] to-transparent rounded-[12px] transition-transform duration-300 group-hover:scale-x-105" />
      <span className="relative z-10">{children}</span>
    </>
  );
  if (href) {
    return (
      <a href={href} className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

function Navbar() {
  const links: [string, string][] = [
    ["Home", "#home"],
    ["Passports", "#passports"],
    ["Verify", "/verify"],
    ["Dashboard", "/dashboard"],
    ["Create", "/create-passport"],
  ];
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl z-50 pointer-events-none">
      <nav className="pointer-events-auto flex items-center justify-between rounded-full border border-black/10 bg-white/35 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] px-5 py-2">
        <a
          href="/"
          className="font-instrument italic text-[28px] tracking-tight text-[#1a1a1a] leading-none"
        >
          TrustLayer
        </a>
        <div className="hidden md:flex items-center gap-6">
          {links.map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="font-sans text-[14px] text-[#1a1a1a] hover:opacity-60 transition-opacity"
            >
              {label}
            </a>
          ))}
        </div>
        <GlintButton href="/create-passport" className="px-6 py-3 text-[14px]">
          Create Passport
        </GlintButton>
      </nav>
    </div>
  );
}

function QRPattern({ size = 6, cellClass = "bg-white" }: { size?: number; cellClass?: string }) {
  const cells = Array.from({ length: size * size }, (_, i) => {
    const x = i % size;
    const y = Math.floor(i / size);
    const corner = (x < 2 && y < 2) || (x >= size - 2 && y < 2) || (x < 2 && y >= size - 2);
    const on = corner || (x * 13 + y * 7 + (x ^ y) * 3) % 3 === 0;
    return on;
  });
  return (
    <div
      className="grid w-full h-full gap-[2px]"
      style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
    >
      {cells.map((on, i) => (
        <div key={i} className={on ? `${cellClass} rounded-[1px]` : "bg-transparent"} />
      ))}
    </div>
  );
}

function PassportCard() {
  const rows: [string, string][] = [
    ["Passport ID", demoPassport.passportId],
    ["Category", demoPassport.category],
    ["Identifier", demoPassport.identifier],
    ["Condition", demoPassport.condition],
    ["Warranty", demoPassport.warrantyStatus],
    ["Owner", demoPassport.ownerWallet],
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1.2, delay: 0.75, ease: EASE }}
      className="relative bottom-auto right-auto z-30 mx-auto mt-10 w-[90%] max-w-[320px] rounded-[28px] border border-black/10 bg-white/35 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-2xl pointer-events-auto lg:absolute lg:right-[6%] lg:bottom-[10%] lg:w-[260px] xl:w-[280px]"
    >
      <div className="text-[12px] text-[#1a1a1a]/60 font-sans">TrustLayer Passport</div>
      <div className="font-instrument italic text-[26px] leading-tight text-[#1a1a1a] mt-2">
        {demoPassport.product}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-y-1.5 gap-x-3 text-[12px] font-sans">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <span className="text-[#1a1a1a]/55">{k}</span>
            <span className="text-[#1a1a1a] text-right truncate">{v}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="w-16 h-16 rounded-[12px] bg-[#1a1a1a] opacity-90 p-1.5 shrink-0">
          <QRPattern size={7} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["Seller Verified", "On-chain Certificate", "QR Ready"].map((p) => (
            <span
              key={p}
              className="rounded-full bg-white/50 border border-black/10 px-2.5 py-1 text-[10px] text-[#1a1a1a]/80"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Hero() {
  const categories = ["Electronics", "Luxury Goods", "Collectibles", "Music Gear", "Mobility"];
  return (
    <section
      id="home"
      className="scroll-section min-h-screen bg-[#F3F4ED] pt-32 md:pt-40 pb-24 flex items-center justify-center relative overflow-hidden"
    >
      <div className="absolute inset-0 z-0 bg-[#F3F4ED]" />
      <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-[#0871E7]/15 blur-[90px] z-0" />
      <div className="absolute -bottom-40 -right-40 w-[560px] h-[560px] rounded-full bg-[#9945FF]/12 blur-[100px] z-0" />
      <div className="absolute top-[35%] left-[45%] w-[420px] h-[420px] rounded-full bg-[#14F195]/10 blur-[110px] z-0" />
      <div
        className="absolute inset-0 z-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(243,244,237,0.65)_70%,#F3F4ED_100%)]" />
      <div
        className="absolute inset-0 z-0 opacity-[0.04] mix-blend-multiply"
        style={{
          backgroundImage:
            "repeating-radial-gradient(circle at 0 0, rgba(0,0,0,0.6) 0, rgba(0,0,0,0.6) 1px, transparent 1px, transparent 3px)",
        }}
      />

      <div className="absolute left-[8%] top-[28%] z-10 hidden lg:flex rounded-full border border-black/10 bg-white/35 backdrop-blur-xl px-4 py-2 text-[13px] text-[#1a1a1a]/70 shadow">
        Identifier Protected
      </div>
      <div className="absolute right-[9%] top-[26%] z-10 hidden lg:flex rounded-full border border-black/10 bg-white/35 backdrop-blur-xl px-4 py-2 text-[13px] text-[#1a1a1a]/70 shadow">
        Solana Proof Layer
      </div>

      <div className="relative z-20 pointer-events-none text-center px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: EASE }}
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/35 backdrop-blur-xl px-4 py-2 text-[13px] font-sans text-[#1a1a1a]/80 mb-6 shadow-[0_8px_30px_rgba(0,0,0,0.05)]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#14F195]" />
          Solana-Powered Product Passports
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: EASE }}
          className="font-instrument italic text-[42px] md:text-[60px] lg:text-[76px] leading-[0.88] tracking-tight text-[#1a1a1a] max-w-4xl mx-auto mb-6"
        >
          Verify every product <br /> before it changes hands.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: EASE }}
          className="mx-auto max-w-[620px] font-sans text-[16px] font-normal leading-relaxed text-[#1a1a1a]/70 md:text-[18px]"
        >
          Create Solana-backed product passports for high-value resale items. Give buyers a simple
          way to verify authenticity, ownership, warranty, condition, and history before they pay.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.55, ease: EASE }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4 pointer-events-auto"
        >
          <GlintButton href="/create-passport">Create Product Passport</GlintButton>
          <a
            href="/passport/TL-000001"
            className="rounded-full border border-black/10 bg-white/35 backdrop-blur-xl px-7 py-3.5 font-sans text-[15px] font-medium text-[#1a1a1a] hover:bg-white/50 transition"
          >
            View Demo Passport
          </a>
        </motion.div>
      </div>

      <TypingMessages />
      <PassportCard />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, delay: 0.9, ease: EASE }}
        className="absolute bottom-5 left-1/2 z-20 hidden w-full max-w-3xl -translate-x-1/2 flex-wrap items-center justify-center gap-3 px-6 md:flex"
      >
        {categories.map((c) => (
          <span
            key={c}
            className="rounded-full border border-black/10 bg-white/30 backdrop-blur-xl px-4 py-2 text-[13px] font-sans text-[#1a1a1a]/75"
          >
            {c}
          </span>
        ))}
      </motion.div>
    </section>
  );
}

function SectionKicker({ children, dot = "#0871E7" }: { children: React.ReactNode; dot?: string }) {
  return (
    <motion.div
      {...fadeUp}
      className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/40 backdrop-blur-xl px-4 py-2 text-[13px] font-sans text-[#1a1a1a]/80 shadow-[0_8px_30px_rgba(0,0,0,0.05)]"
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
      {children}
    </motion.div>
  );
}

function PassportsSection() {
  const fields: [string, string][] = [
    ["Passport ID", "TL-000001"],
    ["Category", "Luxury Watch"],
    ["Product Name", "Omega Seamaster Professional"],
    ["Masked Identifier", "A85****21X"],
    ["Verification Status", "Seller Verified"],
    ["Warranty Status", "Active"],
    ["Owner Wallet", "9xA3...Qp21"],
    ["Solana Certificate", "Minted"],
    ["History", "3 events recorded"],
  ];
  return (
    <section
      id="passports"
      className="scroll-section bg-[#F3F4ED] relative px-6 md:px-10 lg:px-20 py-28 md:py-36 overflow-hidden"
    >
      <div className="absolute -top-32 left-1/4 w-[420px] h-[420px] rounded-full bg-[#0871E7]/10 blur-[110px] pointer-events-none" />
      <div className="relative max-w-6xl mx-auto">
        <SectionKicker>Product Passports</SectionKicker>
        <motion.h2
          {...fadeUp}
          transition={{ duration: 1, ease: EASE }}
          className="font-instrument italic text-[#1a1a1a] text-[42px] md:text-[64px] leading-[0.9] tracking-tight max-w-3xl mt-6"
        >
          One passport. Every proof buyers need.
        </motion.h2>
        <motion.p
          {...fadeUp}
          transition={{ duration: 1, delay: 0.15, ease: EASE }}
          className="mt-6 font-sans text-[16px] md:text-[17px] text-[#1a1a1a]/70 leading-relaxed max-w-2xl"
        >
          A TrustLayer passport gives every high-value resale item a verifiable identity — combining
          seller records, ownership links, warranty details, condition notes, and Solana-backed
          proof in one public page.
        </motion.p>

        <div className="mt-14 grid grid-cols-1 lg:grid-cols-5 gap-6">
          <motion.div
            {...fadeUp}
            className="lg:col-span-2 rounded-[28px] border border-black/10 bg-white/40 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-6"
          >
            <div className="text-[12px] text-[#1a1a1a]/55 font-sans">TrustLayer Passport</div>
            <div className="font-instrument italic text-[34px] leading-tight text-[#1a1a1a] mt-2">
              Omega Seamaster Professional
            </div>
            <div className="mt-5 flex items-center gap-4">
              <div className="w-24 h-24 rounded-[14px] bg-[#1a1a1a] p-2 shrink-0">
                <QRPattern size={8} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["Seller Verified", "On-chain Certificate", "Active Warranty", "QR Ready"].map(
                  (p) => (
                    <span
                      key={p}
                      className="rounded-full bg-white/60 border border-black/10 px-3 py-1 text-[11px] text-[#1a1a1a]/80"
                    >
                      {p}
                    </span>
                  ),
                )}
              </div>
            </div>
            <div className="mt-6">
              <a
                href="/passport/TL-000001"
                className="inline-flex items-center rounded-full border border-black/10 bg-white/50 hover:bg-white/70 px-5 py-2.5 font-sans text-[13px] font-medium text-[#1a1a1a] transition"
              >
                View Demo Passport →
              </a>
            </div>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
            className="lg:col-span-3 rounded-[28px] border border-black/10 bg-white/35 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.06)] p-6"
          >
            <div className="text-[12px] text-[#1a1a1a]/55 font-sans mb-4">Passport contents</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              {fields.map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between border-b border-black/10 py-3 text-[14px] font-sans"
                >
                  <span className="text-[#1a1a1a]/60">{k}</span>
                  <span className="text-[#1a1a1a] font-medium text-right truncate ml-3">{v}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const categories = [
  {
    title: "Electronics",
    desc: "Smartphones, laptops, cameras, consoles, wearables, tablets, and audio gear.",
  },
  {
    title: "Luxury Goods",
    desc: "Watches, designer bags, jewelry, premium sneakers, and authenticated fashion.",
  },
  {
    title: "Collectibles",
    desc: "Trading cards, art toys, signed items, limited editions, and graded products.",
  },
  {
    title: "Music Gear",
    desc: "Guitars, microphones, keyboards, studio equipment, and vintage instruments.",
  },
  {
    title: "Mobility",
    desc: "E-bikes, scooters, bicycles, drones, and high-value mobility products.",
  },
];

function CategoriesSection() {
  return (
    <section
      id="categories"
      className="scroll-section bg-[#F3F4ED] px-6 md:px-10 lg:px-20 py-28 md:py-36 relative overflow-hidden"
    >
      <div className="absolute top-1/3 -right-40 w-[460px] h-[460px] rounded-full bg-[#9945FF]/10 blur-[110px] pointer-events-none" />
      <div className="relative max-w-6xl mx-auto">
        <SectionKicker dot="#9945FF">Categories</SectionKicker>
        <motion.h2
          {...fadeUp}
          className="font-instrument italic text-[#1a1a1a] text-[42px] md:text-[64px] leading-[0.9] tracking-tight max-w-3xl mt-6"
        >
          Built for high-value resale.
        </motion.h2>
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
          className="mt-6 font-sans text-[16px] md:text-[17px] text-[#1a1a1a]/70 leading-relaxed max-w-2xl"
        >
          TrustLayer is designed for second-hand goods where authenticity, condition, and ownership
          matter.
        </motion.p>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, delay: i * 0.06, ease: EASE }}
              className="rounded-[28px] border border-black/10 bg-white/35 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.06)] p-6 min-h-[220px] flex flex-col justify-between hover:bg-white/50 transition"
            >
              <div className="text-[12px] text-[#1a1a1a]/55 font-sans">0{i + 1}</div>
              <div>
                <h3 className="font-instrument italic text-[34px] leading-none text-[#1a1a1a]">
                  {c.title}
                </h3>
                <p className="mt-3 font-sans text-[14px] text-[#1a1a1a]/70 leading-relaxed">
                  {c.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const verificationSteps = [
  {
    n: "01",
    title: "Authenticity",
    desc: "Scan the passport QR to confirm that the product's certificate matches the original record signed by the verified seller.",
    chip: "Solana Certificate",
  },
  {
    n: "02",
    title: "Ownership",
    desc: "Cross-check the current owner wallet against the passport history. Every transfer can be recorded as a verifiable event.",
    chip: "Wallet Linked",
  },
  {
    n: "03",
    title: "Warranty",
    desc: "Review remaining warranty coverage, purchase details, and any registered service records attached to the passport.",
    chip: "Active Coverage",
  },
  {
    n: "04",
    title: "Condition",
    desc: "Inspect the latest condition grade with timestamped photos and notes from the most recent verified seller.",
    chip: "Graded Excellent",
  },
  {
    n: "05",
    title: "History",
    desc: "Trace the chain of custody, including previous owners, repairs, resale events, and authentication updates.",
    chip: "Full Provenance",
  },
];

function VerificationSection() {
  return (
    <section
      id="verification"
      className="scroll-section relative bg-[#F3F4ED] py-28 md:py-36 px-6 md:px-10 lg:px-20 overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute -top-32 right-1/3 w-[460px] h-[460px] rounded-full bg-[#0871E7]/10 blur-[110px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <div className="max-w-3xl">
          <SectionKicker>Verification</SectionKicker>
          <motion.h2
            {...fadeUp}
            className="font-instrument italic text-[#1a1a1a] text-[42px] md:text-[64px] leading-[0.9] tracking-tight mt-6"
          >
            Check the full trust layer before you pay.
          </motion.h2>
          <motion.p
            {...fadeUp}
            transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
            className="mt-6 font-sans text-[16px] md:text-[17px] text-[#1a1a1a]/70 leading-relaxed max-w-2xl"
          >
            Each passport helps buyers review the most important signals before purchasing a
            second-hand item.
          </motion.p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {verificationSteps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, delay: i * 0.07, ease: EASE }}
              className="relative rounded-[24px] border border-black/10 bg-white/40 backdrop-blur-xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] hover:bg-white/55 transition min-h-[220px] flex flex-col"
            >
              <div className="flex items-center justify-between">
                <span className="font-instrument italic text-[28px] text-[#0871E7] leading-none">
                  {s.n}
                </span>
                <span className="rounded-full bg-white/60 border border-black/10 px-3 py-1 text-[11px] text-[#1a1a1a]/75">
                  {s.chip}
                </span>
              </div>
              <h3 className="font-instrument italic text-[32px] leading-none text-[#1a1a1a] mt-5">
                {s.title}
              </h3>
              <p className="mt-3 font-sans text-[14px] text-[#1a1a1a]/70 leading-relaxed">
                {s.desc}
              </p>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, delay: 0.35, ease: EASE }}
            className="relative rounded-[24px] border border-black/10 bg-gradient-to-br from-[#0871E7] to-[#0a5cc2] p-6 shadow-[0_20px_60px_rgba(8,113,231,0.25)] text-white flex flex-col justify-between min-h-[220px] overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/15 blur-2xl pointer-events-none" />
            <div>
              <div className="text-[12px] font-sans opacity-80">Ready when you are</div>
              <h3 className="font-instrument italic text-[32px] leading-none mt-3">
                Run a trust check.
              </h3>
              <p className="mt-3 font-sans text-[14px] opacity-85 leading-relaxed">
                Paste any TrustLayer link or scan a passport QR to verify authenticity, ownership,
                warranty, condition, and history.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-3 flex-wrap">
              <a
                href="/verify"
                className="rounded-full bg-white text-[#0871E7] px-5 py-2.5 font-sans text-[13px] font-medium hover:bg-white/90 transition"
              >
                Open Verifier
              </a>
              <a
                href="/passport/TL-000001"
                className="rounded-full border border-white/30 bg-white/10 px-5 py-2.5 font-sans text-[13px] font-medium hover:bg-white/20 transition"
              >
                View Demo
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const solanaCards = [
  {
    title: "Certificate Proof",
    desc: "Each passport can be linked to an on-chain certificate record.",
  },
  {
    title: "Ownership Links",
    desc: "Wallet ownership can represent the current holder of a product passport.",
  },
  {
    title: "Transfer History",
    desc: "Resale events can be recorded as verifiable ownership transitions.",
  },
  {
    title: "Future Payments",
    desc: "Solana Pay, escrow, and Blinks can be added later without changing the passport experience.",
  },
];

function SolanaSection() {
  return (
    <section
      id="solana"
      className="scroll-section bg-[#F3F4ED] px-6 md:px-10 lg:px-20 py-28 md:py-36 relative overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-[#14F195]/10 blur-[120px] pointer-events-none" />
      <div className="relative max-w-6xl mx-auto">
        <SectionKicker dot="#14F195">Solana Proof Layer</SectionKicker>
        <motion.h2
          {...fadeUp}
          className="font-instrument italic text-[#1a1a1a] text-[42px] md:text-[64px] leading-[0.9] tracking-tight max-w-3xl mt-6"
        >
          Public proof without slowing resale down.
        </motion.h2>
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
          className="mt-6 font-sans text-[16px] md:text-[17px] text-[#1a1a1a]/70 leading-relaxed max-w-2xl"
        >
          TrustLayer uses Solana as a lightweight proof layer for product passports, certificate
          timestamps, ownership links, and future-ready payment or escrow flows.
        </motion.p>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-5">
          {solanaCards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, delay: i * 0.07, ease: EASE }}
              className="rounded-[28px] border border-black/10 bg-white/35 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.06)] p-7 hover:bg-white/50 transition"
            >
              <div className="flex items-center gap-2 text-[12px] text-[#1a1a1a]/55 font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-[#14F195]" />
                Solana
              </div>
              <h3 className="font-instrument italic text-[34px] leading-none text-[#1a1a1a] mt-4">
                {c.title}
              </h3>
              <p className="mt-3 font-sans text-[15px] text-[#1a1a1a]/70 leading-relaxed">
                {c.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTASection() {
  return (
    <section
      id="create-passport"
      className="scroll-section bg-[#F3F4ED] px-6 md:px-10 lg:px-20 py-28 md:py-36 relative overflow-hidden"
    >
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#0871E7]/10 blur-[120px] pointer-events-none" />
      <motion.div
        {...fadeUp}
        className="relative max-w-4xl mx-auto rounded-[36px] border border-black/10 bg-white/40 backdrop-blur-2xl shadow-[0_30px_80px_rgba(0,0,0,0.08)] p-8 md:p-12 text-center"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/50 px-4 py-2 text-[13px] font-sans text-[#1a1a1a]/80">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0871E7]" />
          Start with TrustLayer
        </div>
        <h2 className="font-instrument italic text-[#1a1a1a] text-[42px] md:text-[64px] leading-[0.9] tracking-tight mt-6">
          Create your first product passport.
        </h2>
        <p className="mt-6 font-sans text-[16px] md:text-[17px] text-[#1a1a1a]/70 leading-relaxed max-w-2xl mx-auto">
          This MVP is currently a frontend prototype. The next step is connecting seller accounts,
          Solana certificates, QR verification, and product passport storage.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
          <GlintButton href="/create-passport">Create Passport</GlintButton>
          <a
            href="/passport/TL-000001"
            className="rounded-full border border-black/10 bg-white/50 backdrop-blur-xl px-7 py-3.5 font-sans text-[15px] font-medium text-[#1a1a1a] hover:bg-white/70 transition"
          >
            View Demo Passport
          </a>
        </div>
      </motion.div>
    </section>
  );
}

function App() {
  return (
    <main>
      <Navbar />
      <Hero />
      <PassportsSection />
      <CategoriesSection />
      <VerificationSection />
      <SolanaSection />
      <FinalCTASection />
    </main>
  );
}
