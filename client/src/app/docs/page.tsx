'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Book, Zap, Activity, Heart, Lock, Bell, Code2, Globe,
    ChevronRight, Search, Shield, ArrowRight, Terminal, CheckCircle2,
    Copy, Eye, Key, Settings, Users, ExternalLink, ChevronDown,
    Info, Lightbulb, TriangleAlert
} from 'lucide-react';

// ─── Sidebar Nav ──────────────────────────────────────────────────────────────
const NAV = [
    {
        section: 'Getting Started',
        icon: Zap,
        color: 'text-blue-400',
        items: [
            { id: 'introduction',    label: 'Introduction' },
            { id: 'quick-start',     label: 'Quick Start (5 mins)' },
            { id: 'how-it-works',   label: 'How It Works' },
        ],
    },
    {
        section: 'Monitors',
        icon: Activity,
        color: 'text-emerald-400',
        items: [
            { id: 'api-monitors',       label: 'API Monitors' },
            { id: 'tcp-monitors',       label: 'TCP Port Monitors' },
            { id: 'dns-monitors',       label: 'DNS Monitoring' },
            { id: 'ssl-monitors',       label: 'SSL Certificates' },
            { id: 'heartbeat-monitors', label: 'Heartbeat Monitors' },
            { id: 'domain-expiry',      label: 'Domain Expiry' },
        ],
    },
    {
        section: 'Alerts',
        icon: Bell,
        color: 'text-amber-400',
        items: [
            { id: 'email-alerts', label: 'Email Alerts' },
            { id: 'multi-channel', label: 'Slack & Discord' },
            { id: 'webhooks',     label: 'Custom Webhooks' },
        ],
    },
    {
        section: 'Integrations',
        icon: Code2,
        color: 'text-purple-400',
        items: [
            { id: 'nodejs',    label: 'Node.js' },
            { id: 'python',    label: 'Python' },
            { id: 'bash-cron', label: 'Bash / Cron' },
        ],
    },
    {
        section: 'Status Pages',
        icon: Globe,
        color: 'text-pink-400',
        items: [
            { id: 'status-page-setup',  label: 'Setup' },
            { id: 'status-page-custom', label: 'Custom Domain' },
        ],
    },
    {
        section: 'API Reference',
        icon: Terminal,
        color: 'text-cyan-400',
        items: [
            { id: 'api-auth',       label: 'Authentication' },
            { id: 'api-monitors',   label: 'Monitors API' },
            { id: 'api-heartbeats', label: 'Heartbeats API' },
            { id: 'api-incidents',  label: 'Incidents API' },
        ],
    },
];

// ─── Code Block ───────────────────────────────────────────────────────────────
function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="relative group rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] my-4">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04] bg-white/[0.02]">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">{lang}</span>
                <button onClick={handleCopy} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-white transition-colors">
                    {copied ? <><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                </button>
            </div>
            <pre className="p-5 text-sm text-gray-300 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">{code}</pre>
        </div>
    );
}

// ─── Alert Box ────────────────────────────────────────────────────────────────
function DocAlert({ type, children }: { type: 'tip' | 'info' | 'warn'; children: React.ReactNode }) {
    const styles = {
        tip:  { bg: 'bg-emerald-500/5 border-emerald-500/20', icon: <Lightbulb className="w-3.5 h-3.5" />, text: 'text-emerald-400', label: 'Tip' },
        info: { bg: 'bg-blue-500/5 border-blue-500/20',       icon: <Info className="w-3.5 h-3.5" />,      text: 'text-blue-400',    label: 'Note' },
        warn: { bg: 'bg-amber-500/5 border-amber-500/20',     icon: <TriangleAlert className="w-3.5 h-3.5" />, text: 'text-amber-400',   label: 'Warning' },
    };
    const s = styles[type];
    return (
        <div className={`border rounded-2xl p-5 my-4 ${s.bg}`}>
            <div className={`flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest ${s.text}`}>
                {s.icon} {s.label}
            </div>
            <div className="text-sm text-gray-400 leading-relaxed">{children}</div>
        </div>
    );
}

// ─── Section Heading ──────────────────────────────────────────────────────────
function H1({ children }: { children: React.ReactNode }) {
    return <h1 className="text-3xl font-black text-white tracking-tight mb-2">{children}</h1>;
}
function H2({ children }: { children: React.ReactNode }) {
    return <h2 className="text-xl font-black text-white tracking-tight mt-10 mb-4 flex items-center gap-3 border-t border-white/[0.04] pt-8">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
    return <p className="text-gray-400 leading-relaxed mb-4">{children}</p>;
}

// ─── Doc Content Pages ────────────────────────────────────────────────────────
const PAGES: Record<string, React.ReactNode> = {
    introduction: (
        <>
            <H1>Introduction to PingForge</H1>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-6">Monitoring that actually works</p>
            <P>PingForge is an all-in-one monitoring platform designed for engineering teams that need reliability without complexity. It provides three core services that cover the entire health surface of your production systems.</P>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 my-8">
                {[
                    { icon: Activity, color: 'blue',    title: 'API Monitoring',      desc: 'Ping your endpoints every minute from our global network. Get alerted the instant something fails.' },
                    { icon: Shield,   color: 'indigo',  title: 'TCP Port',            desc: 'Monitor database ports, SSH, or any network service. Ensure your infrastructure is reachable.' },
                    { icon: Globe,    color: 'emerald', title: 'DNS Analysis',        desc: 'Track DNS record changes (A, CNAME, TXT) and detect hijacking or configuration drifts.' },
                    { icon: Lock,     color: 'purple',  title: 'SSL Certificates',    desc: 'Never let an SSL certificate expire. Get proactive alerts 30, 15, and 7 days before expiry.' },
                    { icon: Heart,    color: 'pink',    title: 'Heartbeats',          desc: 'Ensure your cron jobs and scheduled tasks always run on time. Never miss a silent failure again.' },
                    { icon: Zap,      color: 'amber',   title: 'Domain Expiry',       desc: 'Track domain registration dates via WHOIS. Get alerted before your domain enters redemption.' },
                ].map(({ icon: Icon, color, title, desc }) => (
                    <div key={title} className="bg-white/[0.02] border border-white/[0.05] rounded-[20px] p-5">
                        <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center bg-${color}-500/10 border border-${color}-500/20`}>
                            <Icon className={`w-5 h-5 text-${color}-400`} />
                        </div>
                        <h3 className="text-white font-black mb-2">{title}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                    </div>
                ))}
            </div>
            <H2>Who is it for?</H2>
            <P>PingForge is built for SaaS founders, backend engineers, and DevOps teams who need production-grade monitoring without paying enterprise prices. Whether you are a solo developer or a 50-person startup, PingForge scales with you.</P>
            <DocAlert type="info">PingForge is currently in active development. Features marked "(Soon)" are under construction and scheduled for the next release cycle.</DocAlert>
        </>
    ),

    'quick-start': (
        <>
            <H1>Quick Start</H1>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-6">Monitor your first API in 5 minutes</p>
            <div className="flex items-center gap-3 mb-8">
                {['Create Account', 'Add Monitor', 'Get Alerted'].map((step, i) => (
                    <React.Fragment key={step}>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-black text-white">{i + 1}</div>
                            <span className="text-white font-black text-sm">{step}</span>
                        </div>
                        {i < 2 && <ChevronRight className="w-4 h-4 text-gray-700 flex-shrink-0" />}
                    </React.Fragment>
                ))}
            </div>

            <H2>Step 1 — Create your account</H2>
            <P>Go to <Link href="/register" className="text-blue-400 font-bold hover:underline">PingForge Registration</Link> and sign up with your email. No credit card required for the free tier.</P>

            <H2>Step 2 — Add your first API monitor</H2>
            <P>From the dashboard, click <strong className="text-white">Add Monitor</strong> and fill in the details:</P>
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden my-4">
                <table className="w-full text-sm">
                    <thead className="bg-white/[0.03] border-b border-white/[0.04]">
                        <tr>{['Field', 'Example Value', 'Description'].map(h => <th key={h} className="px-5 py-3 text-left text-[10px] font-black text-gray-600 uppercase tracking-widest">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        {[
                            ['Name', 'Payment API', 'A friendly name for your monitor'],
                            ['URL', 'https://api.acme.com/health', 'The full HTTPS URL to monitor'],
                            ['Check Interval', '5 minutes', 'How often to ping the endpoint'],
                            ['Alert Email', 'you@company.com', 'Where to send DOWN alerts'],
                        ].map(([f, v, d]) => (
                            <tr key={f}>
                                <td className="px-5 py-4 text-white font-black">{f}</td>
                                <td className="px-5 py-4 text-blue-400 font-mono text-xs">{v}</td>
                                <td className="px-5 py-4 text-gray-500">{d}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <H2>Step 3 — Verify it is working</H2>
            <P>Your monitor will run its first check within 30 seconds. You will see the status indicator turn Green (Operational) if your API responds correctly with a 2xx status code.</P>

            <H2>Step 4 — Test the alert (optional)</H2>
            <P>To verify alerts are delivered, temporarily enter a wrong URL in your monitor. You should receive an alert email within 1–2 minutes.</P>
            <DocAlert type="tip">Check your spam folder if the test alert does not arrive. Add alerts@pingforge.com to your allowlist to ensure delivery.</DocAlert>
        </>
    ),

    'how-it-works': (
        <>
            <H1>How PingForge Works</H1>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-6">The engine behind your monitoring</p>
            <P>PingForge runs a distributed Node.js-based monitoring engine. Every minute, a background checker evaluates all active monitors and determines their health status based on the configured rules.</P>
            <H2>API Monitoring Engine</H2>
            <P>When a monitor is due for a check, our engine sends an HTTP request to your endpoint and evaluates the response against your configured assertions. If the response matches your rules, the monitor stays UP. If not, it transitions to DOWN and an incident is created.</P>
            <H2>Heartbeat Engine</H2>
            <P>Heartbeat monitoring works in reverse. Instead of pinging you, we wait for you to ping us. Our background engine runs every minute and checks if any active heartbeat monitors have exceeded their expected window plus grace period. If so, it transitions to DOWN and fires an alert.</P>
            <H2>SSL Engine</H2>
            <P>Our SSL engine periodically connects to your domain over TLS, fetches the certificate chain, and extracts the expiry date. It sends alerts at 30, 15, and 7 days before expiry.</P>
            <DocAlert type="info">All engines run server-side and require no client-side integration except for the heartbeat ping URL.</DocAlert>
        </>
    ),

    'api-monitors': (
        <>
            <H1>API Monitors</H1>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-6">Active endpoint monitoring</p>
            <P>API monitors actively ping your HTTP/HTTPS endpoints at a configured interval and report their availability and latency. This is the most common monitoring type for REST APIs, health check endpoints, and web services.</P>
            <H2>Creating an API Monitor</H2>
            <P>From the dashboard, click <strong className="text-white">+ Add Monitor</strong>. Fill in the <strong className="text-white">Basic</strong> tab with your endpoint details, then use the <strong className="text-white">Advanced</strong> tab for custom headers or a JSON body, and the <strong className="text-white">Assertions</strong> tab to define validation rules.</P>
            <H2>Configuration Options</H2>
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden my-4">
                <table className="w-full text-sm">
                    <thead className="bg-white/[0.03] border-b border-white/[0.04]">
                        <tr>{['Option', 'Default', 'Description'].map(h => <th key={h} className="px-5 py-3 text-left text-[10px] font-black text-gray-600 uppercase tracking-widest">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        {[
                            ['URL', '—', 'The endpoint to ping (HTTPS required for production)'],
                            ['Check Interval', '5 min', 'How often to check: 1, 5, 10, 15, or 30 minutes'],
                            ['HTTP Method', 'GET', 'The HTTP method to use for the request'],
                            ['Timeout', '10s', 'How long to wait before declaring a timeout failure'],
                            ['Custom Headers', 'None', 'Key-value pairs to include in every request'],
                        ].map(([o, d, desc]) => (
                            <tr key={o}>
                                <td className="px-5 py-4 text-white font-black">{o}</td>
                                <td className="px-5 py-4 text-gray-500 font-mono text-xs">{d}</td>
                                <td className="px-5 py-4 text-gray-500">{desc}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <H2>Assertions</H2>
            <P>Assertions let you validate that a response is not just a 200 OK, but that it contains the correct data. For example, you can assert that the response body contains a specific JSON field or that the response time is under 500ms.</P>
        </>
    ),

    'tcp-monitors': (
        <>
            <H1>TCP Port Monitoring</H1>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-6">Infrastructure and network health</p>
            <P>TCP Port monitors ensure that your low-level network services (Databases, SSH, SMTP, Redis) are reachable and accepting connections. Unlike API monitors, TCP monitors work at the transport layer, making them faster and versatile for non-web infrastructure.</P>
            <H2>Configuration</H2>
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden my-4">
                <table className="w-full text-sm">
                    <thead className="bg-white/[0.03] border-b border-white/[0.04]">
                        <tr>{['Option', 'Example', 'Description'].map(h => <th key={h} className="px-5 py-3 text-left text-[10px] font-black text-gray-600 uppercase tracking-widest">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        {[
                            ['Hostname', 'db.production.io', 'The IP address or domain name'],
                            ['Port', '5432', 'The target port (e.g., 80, 443, 3306, 6379)'],
                            ['Timeout', '5s', 'Max time allowed for a handshake'],
                        ].map(([o, d, desc]) => (
                            <tr key={o}>
                                <td className="px-5 py-4 text-white font-black">{o}</td>
                                <td className="px-5 py-4 text-gray-500 font-mono text-xs">{d}</td>
                                <td className="px-5 py-4 text-gray-500">{desc}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <DocAlert type="tip">Use TCP monitoring for your core database instances to detect network isolation issues before they impact your application heartbeat.</DocAlert>
        </>
    ),

    'dns-monitors': (
        <>
            <H1>DNS Monitoring</H1>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-6">Drift detection and record integrity</p>
            <P>DNS monitoring tracks your nameserver records and alerts you if they change. This is essential for detecting DNS hijacking, accidental deletions, or propagation issues during migrations.</P>
            <H2>Baseline Comparison</H2>
            <P>PingForge takes a snapshot of your DNS records when you create the monitor. Every check compares the current records against this baseline. If a mismatch is detected, you get an alert with a diff of the changes.</P>
            <H2>Supported Record Types</H2>
            <div className="flex flex-wrap gap-2 my-4">
                {['A', 'AAAA', 'MX', 'CNAME', 'TXT', 'NS'].map(r => (
                    <span key={r} className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">{r}</span>
                ))}
            </div>
            <DocAlert type="warn">Always update your baseline in the dashboard after performing a legitimate DNS change to avoid "drift" alerts.</DocAlert>
        </>
    ),

    'heartbeat-monitors': (
        <>
            <H1>Heartbeat Monitors</H1>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-6">Passive monitoring for scheduled jobs</p>
            <P>Heartbeat monitors are designed for cron jobs, background tasks, database backups, and any other scheduled process. Instead of PingForge pinging you, your job sends a signal to PingForge when it completes.</P>
            <H2>The Concept: Dead Man's Switch</H2>
            <P>If PingForge does not receive a check-in signal within the expected timeframe (plus a configurable grace period), it triggers an alert. Silence means failure.</P>
            <H2>Signal Types</H2>
            <div className="grid sm:grid-cols-3 gap-4 my-6">
                {[
                    { method: 'GET /ping/{slug}',         color: 'blue',    label: 'Success',   desc: 'Call at the END of your script. Marks job as UP.' },
                    { method: 'GET /ping/{slug}/start',   color: 'purple',  label: 'Start',     desc: 'Call at the BEGINNING. Tracks runtime & prevents false "stuck" alerts.' },
                    { method: 'GET /ping/{slug}/fail',    color: 'red',     label: 'Fail',      desc: 'Call in your catch block. Immediately triggers a DOWN alert.' },
                ].map(s => (
                    <div key={s.method} className="bg-white/[0.02] border border-white/[0.05] rounded-[20px] p-5">
                        <span className={`text-[10px] font-black uppercase tracking-widest text-${s.color}-400 bg-${s.color}-500/10 border border-${s.color}-500/20 px-2 py-1 rounded-lg`}>{s.label}</span>
                        <code className="block text-xs text-gray-400 font-mono mt-3 mb-2 break-all">{s.method}</code>
                        <p className="text-gray-500 text-sm">{s.desc}</p>
                    </div>
                ))}
            </div>
            <H2>Schedule Types</H2>
            <P><strong className="text-white">Interval:</strong> Simple frequency-based scheduling, e.g. "every 1 hour." Good for most use cases.</P>
            <P><strong className="text-white">Cron:</strong> Unix-style cron expressions for complex schedules, e.g. <code className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg font-mono text-xs">0 0 * * 1</code> for "Every Monday at midnight."</P>
            <DocAlert type="tip">Always set a Grace Period of at least 10–30% of your job's interval to absorb network delays and avoid false alerts.</DocAlert>
        </>
    ),

    'ssl-monitors': (
        <>
            <H1>SSL Certificate Monitoring</H1>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-6">Never let a certificate expire</p>
            <P>PingForge automatically checks the SSL certificate chain of your domains and alerts you as expiry approaches. One expired certificate can take your site offline and destroy user trust in seconds.</P>
            <H2>Adding an SSL Monitor</H2>
            <P>From the SSL dashboard, click <strong className="text-white">+ Add Certificate</strong> and enter your bare domain (without https:// or trailing paths).</P>
            <CodeBlock lang="example" code={`Domain: api.yourcompany.com\nNot:    https://api.yourcompany.com/health`} />
            <H2>Alert Milestones</H2>
            <P>PingForge sends proactive email alerts at the following milestones before expiry:</P>
            <div className="flex flex-wrap gap-3 my-4">
                {['30 days', '15 days', '7 days', '3 days'].map(d => (
                    <div key={d} className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-black text-sm">{d} before</div>
                ))}
            </div>
            <DocAlert type="warn">PingForge does not automatically renew certificates. It only alerts you. You must renew the certificate yourself (e.g., via Let's Encrypt or your hosting provider).</DocAlert>
        </>
    ),

    'domain-expiry': (
        <>
            <H1>Domain Expiry Tracking</H1>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-6">WHOIS-based registration monitoring</p>
            <P>Losing a domain to expiration can be catastrophic. PingForge monitors the global WHOIS database for your domain's registration status and alerting you before it's too late.</P>
            <H2>Redemption Protection</H2>
            <P>Our engine identifies domains entering the "Redemption Grace Period" and fires critical alerts. We check your domain registration daily to ensure you have months of lead time.</P>
            <DocAlert type="info">Domain monitoring works across all major TLDs (.com, .net, .org, .io, .app, etc.) and uses direct WHOIS queries.</DocAlert>
        </>
    ),

    'email-alerts': (
        <>
            <H1>Email Alerts</H1>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-6">Standard incident notifications</p>
            <P>PingForge sends immediate email notifications for every incident. Alerts include the monitor name, status, error reason, and a direct link to the incident report.</P>
            <H2>Smart Throttling</H2>
            <P>To prevent "alert fatigue," we group rapid status changes into a single incident thread. You'll receive one "DOWN" email and one "RECOVERED" email when the service is stable again.</P>
        </>
    ),

    'multi-channel': (
        <>
            <H1>Slack & Discord Integration</H1>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-6">Real-time team collaboration</p>
            <P>Connect PingForge to your team's communication tools. We support Incoming Webhooks for both Slack and Discord, providing rich, interactive messages.</P>
            <H2>Rich Payloads</H2>
            <P>Our multi-channel alerts aren't just text. They include color-coded status bars, monitor metadata (URL/Host/Port), and specific error details like DNS diffs or SSL expiry days.</P>
            <DocAlert type="tip">You can assign multiple alert channels to a single monitor to ensure the right people are notified in the right place.</DocAlert>
        </>
    ),

    webhooks: (
        <>
            <H1>Custom Webhooks</H1>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-6">Build your own integrations</p>
            <P>For advanced users, PingForge can POST a JSON payload to any URL you specify. This allows you to trigger PagerDuty, automated rollback scripts, or your own internal dashboards.</P>
            <H2>Payload Structure</H2>
            <CodeBlock lang="json" code={`{
  "event": "monitor.down",
  "displayName": "🚨 Alert: API is DOWN",
  "monitor": { "id": "...", "name": "API", "type": "api" },
  "incident": { "reason": "Timeout after 10s", "startedAt": "..." }
}`} />
        </>
    ),

    nodejs: (
        <>
            <H1>Node.js Integration</H1>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-6">Integrate heartbeats in your Node.js scripts</p>
            <P>Add a single line to your Node.js scripts or cron jobs to send heartbeat signals to PingForge. You can use the built-in <code className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg font-mono text-xs">https</code> module or <code className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg font-mono text-xs">axios</code>.</P>
            <H2>Using fetch (Node 18+)</H2>
            <CodeBlock lang="javascript" code={`const PING_URL = 'https://pingforge.com/api/ping/YOUR_SLUG';

async function runBackup() {
  // Signal job started
  await fetch(PING_URL + '/start').catch(console.error);

  try {
    // ... your backup logic here ...
    await doTheBackup();

    // Signal success
    await fetch(PING_URL).catch(console.error);
  } catch (err) {
    // Signal failure
    await fetch(PING_URL + '/fail').catch(console.error);
    throw err;
  }
}

runBackup();`} />
            <DocAlert type="tip">Always wrap the ping call in .catch(console.error) so a failed ping never crashes your main job.</DocAlert>
        </>
    ),

    python: (
        <>
            <H1>Python Integration</H1>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-6">Integrate heartbeats in your Python scripts</p>
            <CodeBlock lang="python" code={`import requests

PING_URL = 'https://pingforge.com/api/ping/YOUR_SLUG'

def run_backup():
    # Signal job started
    requests.get(PING_URL + '/start', timeout=5)

    try:
        # ... your backup logic here ...
        do_the_backup()

        # Signal success
        requests.get(PING_URL, timeout=5)

    except Exception as e:
        # Signal failure
        requests.get(PING_URL + '/fail', timeout=5)
        raise e

run_backup()`} />
        </>
    ),



    'bash-cron': (
        <>
            <H1>Bash & Cron Integration</H1>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-6">Monitor any shell script or cron job</p>
            <H2>Shell Script</H2>
            <CodeBlock lang="bash" code={`#!/bin/bash
PING_URL="https://pingforge.com/api/ping/YOUR_SLUG"

# Signal start
curl -fsS "\${PING_URL}/start" &>/dev/null

# Run your job
/usr/local/bin/backup.sh

# Check exit code and signal accordingly
if [ $? -eq 0 ]; then
  curl -fsS "\${PING_URL}" &>/dev/null
else
  curl -fsS "\${PING_URL}/fail" &>/dev/null
fi`} />
            <H2>Crontab</H2>
            <CodeBlock lang="bash" code={`# Edit crontab with: crontab -e

# Run backup at 2am, ping PingForge on success
0 2 * * * /scripts/backup.sh && curl -fsS https://pingforge.com/api/ping/YOUR_SLUG`} />
            <DocAlert type="tip">The <code className="font-mono text-xs">-fsS</code> flags tell curl to be silent and fail silently. This prevents a failed ping from appearing as a cron error in your mail.</DocAlert>
        </>
    ),

    'status-page-setup': (
        <>
            <H1>Public Status Page Setup</H1>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-6">Share your uptime with the world</p>
            <P>Each PingForge account gets a free public status page at <code className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg font-mono text-xs">pingforge.com/status/your-company-name</code>. It shows real-time health for all your active monitors.</P>
            <H2>What Is Shown</H2>
            <div className="space-y-3 my-4">
                {[
                    { Icon: Shield,        title: 'Overall System Health Score', desc: 'A weighted score across all monitor types', color: 'text-emerald-400' },
                    { Icon: Activity,      title: 'API Uptime Calendar',         desc: '30-day uptime visualization per endpoint', color: 'text-blue-400' },
                    { Icon: Heart,         title: 'Background Job Status',       desc: 'Real-time heartbeat monitor health',       color: 'text-rose-400' },
                    { Icon: Lock,          'title': 'SSL Certificate Status',      desc: 'Days remaining and validity for each domain', color: 'text-amber-400' },
                    { Icon: TriangleAlert, title: 'Active Incidents',             desc: 'Current outages with reason and start time', color: 'text-rose-500' },
                    { Icon: Book,          title: 'Incident History',            desc: 'Last 7 days of resolved incidents',        color: 'text-blue-500' },
                ].map(({ Icon, title, desc, color }) => (
                    <div key={title} className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.03] border border-white/[0.05]">
                            <Icon className={`w-4 h-4 ${color}`} />
                        </div>
                        <div>
                            <p className="text-white font-black text-sm">{title}</p>
                            <p className="text-gray-500 text-xs">{desc}</p>
                        </div>
                    </div>
                ))}
            </div>
            <DocAlert type="info">The status page URL is based on your company name. Set it accurately in your profile settings since it cannot be changed without affecting the URL.</DocAlert>
        </>
    ),

    'status-page-custom': (
        <>
            <H1>Custom Domain for Status Page</H1>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-6">Coming soon</p>
            <P>This feature will allow you to host your status page at <code className="text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded font-mono text-xs">status.yourcompany.com</code> instead of the default PingForge URL.</P>
            <DocAlert type="warn">Custom domain support is not yet available. It is planned for a future release.</DocAlert>
        </>
    ),

    'api-auth': (
        <>
            <H1>API Authentication</H1>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-6">Secure your API calls</p>
            <P>All PingForge API endpoints require a valid JWT Bearer token. You receive this token when you log in through the platform or the <code className="text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded font-mono text-xs">/api/auth/login</code> endpoint.</P>
            <H2>Get a Token</H2>
            <CodeBlock lang="bash" code={`curl -X POST https://api.pingforge.com/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "you@company.com", "password": "yourpassword"}'`} />
            <H2>Use the Token</H2>
            <CodeBlock lang="bash" code={`curl https://api.pingforge.com/api/monitors \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`} />
            <DocAlert type="warn">Never expose your JWT token in client-side code or public repositories. Tokens expire after 7 days.</DocAlert>
        </>
    ),

    'api-monitors-ref': (
        <>
            <H1>Monitors API</H1>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-6">Programmatically manage your monitors</p>
            <H2>GET /api/monitors</H2>
            <P>Returns all active monitors for the authenticated user.</P>
            <CodeBlock lang="json" code={`{
  "success": true,
  "monitors": [
    {
      "_id": "abc123",
      "name": "Payment API",
      "url": "https://api.company.com/health",
      "status": "UP",
      "lastChecked": "2026-03-28T18:00:00Z",
      "checkInterval": 5
    }
  ]
}`} />
            <H2>POST /api/monitors</H2>
            <P>Creates a new API monitor.</P>
            <CodeBlock lang="json" code={`// Request Body
{
  "name": "Payment API",
  "url": "https://api.company.com/health",
  "checkInterval": 5,
  "alertEmail": "dev@company.com",
  "headers": { "Authorization": "Bearer token" }
}`} />
        </>
    ),

    'api-heartbeats': (
        <>
            <H1>Heartbeats API</H1>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-6">Ping signals and heartbeat management</p>
            <H2>POST Ping Signal</H2>
            <P>These are public endpoints — no authentication required. The slug is your unique heartbeat identifier found on the dashboard.</P>
            <div className="space-y-3 my-4">
                {[
                    ['Success', 'GET', '/api/ping/:slug',        'Job completed successfully'],
                    ['Start',   'GET', '/api/ping/:slug/start',  'Job started'],
                    ['Fail',    'GET', '/api/ping/:slug/fail',   'Job failed'],
                ].map(([type, method, path, desc]) => (
                    <div key={path} className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4">
                        <span className="px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black">{method}</span>
                        <code className="text-gray-300 font-mono text-sm flex-1">{path}</code>
                        <span className="text-gray-500 text-sm">{desc}</span>
                    </div>
                ))}
            </div>
        </>
    ),

    'api-incidents': (
        <>
            <H1>Incidents API</H1>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-6">Access incident history programmatically</p>
            <H2>GET /api/incidents</H2>
            <P>Returns all incidents for the authenticated user, ordered by most recent first.</P>
            <CodeBlock lang="json" code={`{
  "incidents": [
    {
      "_id": "xyz789",
      "reason": "Connection timeout after 10000ms",
      "status": "RESOLVED",
      "startTime": "2026-03-28T14:00:00Z",
      "endTime": "2026-03-28T14:12:00Z",
      "duration": 12,
      "apiId": { "name": "Payment API", "url": "https://api.company.com" }
    }
  ]
}`} />
        </>
    ),
};

// ─── Main Docs Page ───────────────────────────────────────────────────────────
export default function DocsPage() {
    const [activeId, setActiveId] = useState('introduction');
    const [search, setSearch] = useState('');
    const [openSections, setOpenSections] = useState<Record<string, boolean>>(
        Object.fromEntries(NAV.map(n => [n.section, true]))
    );

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const content = PAGES[activeId] ?? PAGES['introduction'];

    return (
        <div className="min-h-screen bg-[#050508]">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]" />
            </div>

            {/* ─── Top Nav ─────────────────────────────────────────────── */}
            <header className="sticky top-0 z-40 border-b border-white/[0.04] bg-[#050508]/90 backdrop-blur-xl">
                <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                                <Shield className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-black text-lg text-white tracking-tight">Ping<span className="text-blue-400">Forge</span></span>
                        </Link>
                        <span className="text-gray-700 text-lg">/</span>
                        <span className="text-gray-400 font-bold text-sm">Documentation</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-sm text-gray-500 hover:text-white font-bold transition-colors">
                            Home
                        </Link>
                        <Link href="/demo" className="flex items-center gap-2 text-sm text-gray-500 hover:text-white font-bold transition-colors">
                            <Eye className="w-4 h-4" /> Live Demo
                        </Link>
                        <Link href="/register" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest transition-colors">
                            Get Started <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-[1400px] mx-auto flex">
                {/* ─── Sidebar ─────────────────────────────────────────── */}
                <aside className="w-68 flex-shrink-0 sticky top-[65px] h-[calc(100vh-65px)] border-r border-white/[0.04] overflow-y-auto no-scrollbar p-6">
                    {/* Search */}
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search docs..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-gray-300 placeholder-gray-700 outline-none focus:border-blue-500/30 focus:bg-white/[0.05] transition-all font-medium"
                        />
                    </div>

                    {/* Nav */}
                    <nav className="space-y-1">
                        {NAV.map(group => {
                            const filteredItems = search
                                ? group.items.filter(i => i.label.toLowerCase().includes(search.toLowerCase()))
                                : group.items;
                            if (search && filteredItems.length === 0) return null;

                            return (
                                <div key={group.section} className="mb-2">
                                    <button
                                        onClick={() => toggleSection(group.section)}
                                        className="w-full flex items-center justify-between py-2 px-2 rounded-xl hover:bg-white/[0.02] transition-colors group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <group.icon className={`w-3.5 h-3.5 ${group.color}`} />
                                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-600">{group.section}</span>
                                        </div>
                                        <ChevronDown className={`w-3 h-3 text-gray-700 transition-transform ${openSections[group.section] ? '' : '-rotate-90'}`} />
                                    </button>

                                    <AnimatePresence>
                                        {openSections[group.section] && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                <div className="ml-2 pl-4 border-l border-white/[0.04] space-y-0.5 py-1">
                                                    {filteredItems.map(item => (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => { setActiveId(item.id); setSearch(''); }}
                                                            className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                                                                activeId === item.id
                                                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                                    : 'text-gray-500 hover:text-white hover:bg-white/[0.03]'
                                                            }`}
                                                        >
                                                            {item.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </nav>
                </aside>

                {/* ─── Main Content ─────────────────────────────────────── */}
                <main className="flex-1 min-w-0 px-12 py-10 max-w-3xl">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeId}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            {content}

                            {/* Page Footer */}
                            <div className="mt-16 pt-8 border-t border-white/[0.04] flex items-center justify-between">
                                <Link href={`/demo`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-400 font-bold transition-colors">
                                    <Eye className="w-4 h-4" /> View Live Demo
                                </Link>
                                <Link href="/register" className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-black transition-colors">
                                    Start Monitoring Free <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
