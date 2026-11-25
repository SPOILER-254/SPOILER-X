"use client";

import { useState } from "react";
import useSWR from "swr";

type PairingStatus = {
  status: "pending" | "processing" | "code_generated" | "connected" | "failed" | "expired";
  code?: string;
};

type PairingRequest = {
  id: number;
  token: string;
};

const fetchStatus = async ([url, token]: [string, string]): Promise<PairingStatus> => {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) throw new Error("Could not check pairing status.");
  return response.json();
};

function Icon({ name, size = 18 }: { name: "phone" | "arrow" | "copy" | "check" | "lock" | "refresh"; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };

  if (name === "phone") return <svg {...common}><path d="M7.2 3.8h9.6a1.6 1.6 0 0 1 1.6 1.6v13.2a1.6 1.6 0 0 1-1.6 1.6H7.2a1.6 1.6 0 0 1-1.6-1.6V5.4a1.6 1.6 0 0 1 1.6-1.6Z" /><path d="M10 17.2h4" /></svg>;
  if (name === "arrow") return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
  if (name === "copy") return <svg {...common}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></svg>;
  if (name === "check") return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
  if (name === "lock") return <svg {...common}><rect x="4.5" y="10" width="15" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></svg>;
  return <svg {...common}><path d="M20 7v5h-5" /><path d="M19 12a7 7 0 1 1-2.1-5" /></svg>;
}

export function PairingConsole() {
  const [phone, setPhone] = useState("");
  const [request, setRequest] = useState<PairingRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: pairing, error: statusError } = useSWR<PairingStatus>(
    request ? [`/api/pair/${request.id}`, request.token] : null,
    fetchStatus,
    { refreshInterval: 2500, revalidateOnFocus: true, shouldRetryOnError: true, errorRetryInterval: 4000 },
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "We couldn’t start pairing. Try again.");
      setRequest({ id: payload.id, token: payload.token });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyCode() {
    if (!pairing?.code) return;
    try {
      await navigator.clipboard.writeText(pairing.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Clipboard access is unavailable. Select and copy the code instead.");
    }
  }

  function startOver() {
    setRequest(null);
    setError("");
    setPhone("");
  }

  const ready = pairing?.status === "code_generated" && Boolean(pairing.code);
  const finished = pairing?.status === "connected";
  const expired = pairing?.status === "expired" || pairing?.status === "failed";

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Spoiler X home">
          <span className="brand-mark" aria-hidden="true">S<span>.</span></span>
          <span className="brand-name">SPOILER<span>X</span></span>
        </a>
        <div className="topbar-right">
          <span className="service-indicator"><span className="indicator-dot" />PAIRING PORTAL</span>
          <span className="topbar-divider" />
          <a className="help-link" href="#steps">How it works <Icon name="arrow" size={15} /></a>
        </div>
      </header>

      <section className="hero-grid" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" />WHATSAPP · DEVICE LINKING</div>
          <h1>One quick link.<br /><span>Your bot is in.</span></h1>
          <p className="hero-description">Connect your WhatsApp number to Spoiler X. We’ll send a one-time pairing code straight from the bot.</p>
          <div className="hero-proof">
            <div className="proof-icon"><Icon name="lock" size={16} /></div>
            <div><strong>Private by design</strong><span>Your number is only used to create this pairing request.</span></div>
          </div>
          <div className="hero-ornament max-[520px]:hidden" aria-hidden="true">
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <div className="orbit-core"><span>SX</span><i /></div>
            <span className="orbit-label orbit-label-top">SECURE LINK</span>
            <span className="orbit-label orbit-label-bottom">WHATSAPP SESSION</span>
            <span className="orbit-coord">01 — 02</span>
          </div>
        </div>

        <div className="pair-card" aria-live="polite">
          <div className="card-topline"><span>NEW CONNECTION</span><span className="card-step">01 <i /> 02</span></div>
          {!request ? (
            <>
              <div className="card-heading-icon"><Icon name="phone" size={22} /></div>
              <h2>Enter your number</h2>
              <p className="card-intro">Use the number linked to your WhatsApp account, including your country code.</p>
              <form onSubmit={handleSubmit} className="pair-form">
                <label htmlFor="phone">PHONE NUMBER</label>
                <div className="phone-field">
                  <span className="phone-prefix">+</span>
                  <input
                    autoComplete="tel"
                    id="phone"
                    inputMode="tel"
                    name="phone"
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="1 415 555 0134"
                    required
                    type="tel"
                    value={phone}
                    aria-describedby="phone-hint"
                  />
                </div>
                <span id="phone-hint" className="field-hint">Country code first · digits only is fine</span>
                {error && <p className="form-error" role="alert">{error}</p>}
                <button className="primary-button" disabled={submitting || phone.trim().length < 6} type="submit">
                  <span>{submitting ? "Starting request…" : "Get pairing code"}</span>
                  {!submitting && <Icon name="arrow" size={18} />}
                </button>
              </form>
              <div className="card-footnote"><Icon name="lock" size={14} /><span>Encrypted in transit · Expires after 5 minutes</span></div>
            </>
          ) : (
            <div className="request-state">
              <div className={`state-symbol ${ready ? "state-symbol-ready" : finished ? "state-symbol-ready" : expired ? "state-symbol-error" : "state-symbol-waiting"}`}>
                {ready || finished ? <Icon name="check" size={24} /> : expired ? <span>!</span> : <span className="spinner" />}
              </div>
              <span className={`state-label ${expired ? "state-label-error" : ""}`}>{finished ? "CONNECTION COMPLETE" : expired ? "REQUEST ENDED" : ready ? "CODE READY" : "WAITING FOR BOT"}</span>
              <h2>{finished ? "You’re connected." : expired ? "Let’s try again." : ready ? "Your code is ready." : "Almost there."}</h2>
              <p className="card-intro">{finished ? "Your WhatsApp session is linked to Spoiler X." : expired ? "This request expired or could not be completed. Start a fresh pairing request." : ready ? "Open WhatsApp on your phone and enter this one-time code." : "Keep this page open. Spoiler X is preparing your secure pairing code."}</p>
              {ready && <div className="code-panel"><span className="code-caption">ONE-TIME PAIRING CODE</span><div className="code-row"><code>{pairing.code}</code><button className="copy-button" type="button" onClick={copyCode} aria-label={copied ? "Pairing code copied" : "Copy pairing code"}><Icon name={copied ? "check" : "copy"} size={17} /><span>{copied ? "Copied" : "Copy"}</span></button></div></div>}
              {!ready && !expired && !finished && <div className="waiting-panel"><span className="waiting-pulse" /><span>Checking for a response</span><span className="waiting-dots" aria-hidden="true">···</span></div>}
              {statusError && !ready && !expired && !finished && <p className="field-hint">Status check paused briefly. We’ll keep trying.</p>}
              {ready && <div className="instructions"><strong>Finish in WhatsApp</strong><span>Settings → Linked devices → Link a device → Link with phone number</span></div>}
              {(expired || finished) && <button className="secondary-button" onClick={startOver} type="button">{finished ? "Pair another number" : "Start a new request"}<Icon name="refresh" size={16} /></button>}
              <div className="card-footnote"><Icon name="lock" size={14} /><span>Keep your pairing code private. It can link your account.</span></div>
            </div>
          )}
        </div>
      </section>

      <section className="steps-section" id="steps">
        <div className="steps-heading"><span className="eyebrow"><span className="eyebrow-line" />THREE SMALL STEPS</span><h2>From number to<br /> connected.</h2></div>
        <div className="steps-list">
          <article className="step-item"><span className="step-number">01</span><div><h3>Enter your WhatsApp number</h3><p>Add the full number with your country code so the bot can find your account.</p></div><span className="step-arrow"><Icon name="arrow" size={17} /></span></article>
          <article className="step-item"><span className="step-number">02</span><div><h3>Get your one-time code</h3><p>Keep this page open while Spoiler X creates a secure pairing request.</p></div><span className="step-arrow"><Icon name="arrow" size={17} /></span></article>
          <article className="step-item"><span className="step-number">03</span><div><h3>Link your device in WhatsApp</h3><p>Enter the code under Linked devices to complete the connection.</p></div><span className="step-arrow"><Icon name="check" size={17} /></span></article>
        </div>
      </section>

      <footer className="footer"><span className="footer-brand">SPOILER<span>X</span></span><span>Connect with care.</span><a href="#top">BACK TO TOP ↑</a></footer>
    </main>
  );
}
