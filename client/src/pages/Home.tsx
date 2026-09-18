import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  CircleGauge,
  Clock3,
  Filter,
  Flame,
  HeartHandshake,
  Home as HomeIcon,
  Leaf,
  LockKeyhole,
  Menu as MenuIcon,
  MessageSquareWarning,
  MoreHorizontal,
  PanelLeft,
  PieChart,
  Plus,
  Recycle,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  UsersRound,
  UtensilsCrossed,
  Vote,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type View = "dashboard" | "menu" | "complaints" | "roommates" | "waste";
type Role = "student" | "admin";

type Complaint = {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: "In progress" | "Open" | "Resolved";
  assigned: string;
  created: string;
  anonymous: boolean;
};

type WasteEntry = {
  id: number;
  meal: string;
  amount: number;
  date: string;
};

const initialComplaints: Complaint[] = [
  {
    id: 1,
    title: "Water heater not working",
    description: "The second-floor shower block has no hot water since yesterday.",
    category: "Plumbing",
    priority: "High",
    status: "In progress",
    assigned: "Rakesh · Plumbing",
    created: "Today, 9:14 AM",
    anonymous: false,
  },
  {
    id: 2,
    title: "Flickering light in study room",
    description: "Light above desk 18 keeps flickering during evening study hours.",
    category: "Electrical",
    priority: "Medium",
    status: "Open",
    assigned: "Auto-routing pending",
    created: "Yesterday, 6:42 PM",
    anonymous: true,
  },
  {
    id: 3,
    title: "Loose cupboard hinge",
    description: "The hinge on the wardrobe in room B-214 is coming loose.",
    category: "Carpentry",
    priority: "Low",
    status: "Resolved",
    assigned: "Amit · Carpentry",
    created: "Sep 14, 11:03 AM",
    anonymous: false,
  },
];

const initialWaste: WasteEntry[] = [
  { id: 1, meal: "Lunch · Sep 17", amount: 11.4, date: "Sep 17" },
  { id: 2, meal: "Dinner · Sep 17", amount: 7.8, date: "Sep 17" },
  { id: 3, meal: "Breakfast · Sep 18", amount: 4.2, date: "Sep 18" },
];

const menuItems = [
  { id: "lunch", meal: "Lunch", time: "12:30 — 2:00 PM", dish: "Paneer Butter Masala", meta: "Jeera rice · Dal tadka · Salad", votes: 168, color: "lime", icon: "PB" },
  { id: "dinner", meal: "Dinner", time: "7:30 — 9:00 PM", dish: "Veg Biryani", meta: "Raita · Mirchi ka salan · Gulab jamun", votes: 142, color: "orange", icon: "VB" },
  { id: "breakfast", meal: "Tomorrow · Breakfast", time: "7:30 — 9:00 AM", dish: "Masala Dosa", meta: "Coconut chutney · Sambar · Filter coffee", votes: 119, color: "sky", icon: "MD" },
];

const roommateMatches = [
  { name: "Aarav Mehta", initials: "AM", room: "B-308", score: 96, tags: ["Early riser", "Quiet hours", "Non-smoker"], note: "Both prefer a tidy, low-noise room." },
  { name: "Nisha Kapoor", initials: "NK", room: "C-112", score: 91, tags: ["Vegetarian", "Night owl", "Music friendly"], note: "Similar routines and shared food preferences." },
  { name: "Kabir Shah", initials: "KS", room: "A-204", score: 84, tags: ["Sports", "Social", "Non-smoker"], note: "Good fit if you prefer an active, social floor." },
];

const navItems: { id: View; label: string; icon: typeof HomeIcon; badge?: string }[] = [
  { id: "dashboard", label: "Overview", icon: HomeIcon },
  { id: "menu", label: "Menu & votes", icon: Vote, badge: "3" },
  { id: "complaints", label: "Maintenance", icon: MessageSquareWarning, badge: "2" },
  { id: "roommates", label: "Roommate match", icon: UsersRound },
  { id: "waste", label: "Food waste", icon: Recycle },
];

function getStored<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveStored(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The prototype can still be used if local storage is disabled.
  }
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "lime" | "orange" | "blue" | "red" }) {
  const tones = {
    neutral: "bg-slate-100 text-slate-600",
    lime: "bg-[#e7f6ba] text-[#4b641d]",
    orange: "bg-[#fff0d6] text-[#a35b0c]",
    blue: "bg-[#e4f1fb] text-[#27618a]",
    red: "bg-[#ffe5e4] text-[#a33c37]",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${tones[tone]}`}>{children}</span>;
}

function MetricCard({ icon: Icon, label, value, detail, trend, tone }: { icon: typeof CircleGauge; label: string; value: string; detail: string; trend: string; tone: "lime" | "orange" | "blue" | "red" }) {
  const toneClasses = {
    lime: "bg-[#f1f8d9] text-[#5c7a1c]",
    orange: "bg-[#fff2db] text-[#a36017]",
    blue: "bg-[#e9f4fb] text-[#27698f]",
    red: "bg-[#ffebea] text-[#a4433f]",
  };
  return (
    <div className="metric-card group">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className={`icon-tile ${toneClasses[tone]}`}><Icon size={18} strokeWidth={2.1} /></div>
        <span className={`flex items-center gap-1 text-[11px] font-bold ${tone === "red" ? "text-[#bd5a52]" : "text-[#5e7c25]"}`}><ArrowUpRight size={13} />{trend}</span>
      </div>
      <div className="text-[28px] font-extrabold tracking-[-0.04em] text-[#13251d]">{value}</div>
      <div className="mt-1 text-[12px] font-semibold text-[#334c40]">{label}</div>
      <div className="mt-2 text-[11px] text-[#83948d]">{detail}</div>
    </div>
  );
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="mt-2 font-display text-[34px] font-extrabold leading-tight tracking-[-0.045em] text-[#13251d] md:text-[40px]">{title}</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#70837b]">{description}</p>
      </div>
      {action}
    </div>
  );
}

function Home() {
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [role, setRole] = useState<Role>("student");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [votes, setVotes] = useState<Record<string, boolean>>(() => getStored("messmate-votes", { lunch: true }));
  const [complaints, setComplaints] = useState<Complaint[]>(() => getStored("messmate-complaints", initialComplaints));
  const [wasteEntries, setWasteEntries] = useState<WasteEntry[]>(() => getStored("messmate-waste", initialWaste));
  const [search, setSearch] = useState("");
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [showWasteForm, setShowWasteForm] = useState(false);
  const [complaintDraft, setComplaintDraft] = useState({ title: "", description: "", category: "Electrical", priority: "Medium", anonymous: false });
  const [wasteDraft, setWasteDraft] = useState({ meal: "Lunch", amount: "" });

  useEffect(() => saveStored("messmate-votes", votes), [votes]);
  useEffect(() => saveStored("messmate-complaints", complaints), [complaints]);
  useEffect(() => saveStored("messmate-waste", wasteEntries), [wasteEntries]);

  const openComplaints = complaints.filter((item) => item.status !== "Resolved").length;
  const overdueComplaints = complaints.filter((item) => item.status === "Open").length;
  const filteredComplaints = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return complaints;
    return complaints.filter((item) => `${item.title} ${item.category} ${item.status}`.toLowerCase().includes(query));
  }, [complaints, search]);

  const navigate = (view: View) => {
    setActiveView(view);
    setMobileOpen(false);
    setSearch("");
  };

  const handleVote = (id: string, dish: string) => {
    setVotes((current) => ({ ...current, [id]: !current[id] }));
    toast.success(votes[id] ? `Vote removed from ${dish}` : `Your vote for ${dish} is counted`, { description: "Menu insights update in real time." });
  };

  const handleComplaintSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!complaintDraft.title.trim() || !complaintDraft.description.trim()) {
      toast.error("Add a short title and description first.");
      return;
    }
    const assignment = complaintDraft.category === "Plumbing" ? "Rakesh · Plumbing" : complaintDraft.category === "Carpentry" ? "Amit · Carpentry" : "Auto-routing pending";
    const newComplaint: Complaint = { ...complaintDraft, id: Date.now(), status: "Open", assigned: assignment, created: "Just now" };
    setComplaints((current) => [newComplaint, ...current]);
    setComplaintDraft({ title: "", description: "", category: "Electrical", priority: "Medium", anonymous: false });
    setShowComplaintForm(false);
    toast.success("Complaint submitted", { description: `${complaintDraft.category} issue added to the right queue.` });
  };

  const handleWasteSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(wasteDraft.amount);
    if (!amount || amount <= 0) {
      toast.error("Enter the approximate waste in kilograms.");
      return;
    }
    setWasteEntries((current) => [{ id: Date.now(), meal: wasteDraft.meal, amount, date: "Today" }, ...current]);
    setWasteDraft({ meal: "Lunch", amount: "" });
    setShowWasteForm(false);
    toast.success("Waste log added", { description: "Your entry will be included in the weekly trend." });
  };

  const markResolved = (id: number) => {
    setComplaints((current) => current.map((item) => item.id === id ? { ...item, status: "Resolved" } : item));
    toast.success("Complaint marked resolved");
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark"><Leaf size={20} strokeWidth={2.4} /></div>
          <div><div className="brand-name">messmate<span>/</span></div><div className="brand-sub">HOSTEL HUB</div></div>
          <button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <div className="side-context"><div className="campus-dot" /><div><div className="side-context-title">Greenfield Campus</div><div className="side-context-sub">North hostel · 248 residents</div></div><ChevronDown size={14} className="ml-auto text-[#9cad9f]" /></div>
        <div className="side-label">WORKSPACE</div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} onClick={() => navigate(item.id)} className={`nav-item ${activeView === item.id ? "nav-item-active" : ""}`}><Icon size={17} strokeWidth={activeView === item.id ? 2.35 : 1.9} /><span>{item.label}</span>{item.badge && <span className="nav-badge">{item.badge}</span>}</button>;
          })}
        </nav>
        <div className="side-label side-label-lower">SYSTEM</div>
        <button className="nav-item" onClick={() => toast.info("Settings are ready for the next build.")}><Settings2 size={17} /><span>Settings</span></button>
        <div className="sidebar-footer"><div className="privacy-card"><div className="flex items-center gap-2 text-[11px] font-bold text-[#cde58c]"><LockKeyhole size={14} /> LOCAL-FIRST DATA</div><p>Your demo data stays in this browser.</p><div className="privacy-line"><span /><span /><span /><span /><span /><span /><span /></div></div><div className="profile-row"><div className="avatar avatar-lime">RS</div><div className="min-w-0"><div className="truncate text-[12px] font-bold text-white">Riya Sharma</div><div className="text-[10px] text-[#8ea198]">Room B-214 · Student</div></div><MoreHorizontal size={16} className="ml-auto text-[#90a299]" /></div></div>
      </aside>

      {mobileOpen && <button className="sidebar-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}

      <main className="main-content">
        <header className="topbar">
          <div className="flex items-center gap-3"><button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><PanelLeft size={19} /></button><div className="topbar-path"><span>Greenfield Campus</span><ArrowRight size={13} /><b>{navItems.find((item) => item.id === activeView)?.label}</b></div></div>
          <div className="topbar-actions">
            <div className="role-switch"><button className={role === "student" ? "role-active" : ""} onClick={() => setRole("student")}>Student</button><button className={role === "admin" ? "role-active" : ""} onClick={() => setRole("admin")}>Warden view</button></div>
            <div className="notification-wrap"><button className="icon-button" onClick={() => setNotificationsOpen((open) => !open)} aria-label="Notifications"><Bell size={18} /><span className="notification-dot" /></button>{notificationsOpen && <div className="notification-popover"><div className="flex items-center justify-between"><b>Notifications</b><Pill tone="lime">3 new</Pill></div><div className="notification-item"><div className="mini-icon bg-[#edf7d0] text-[#688923]"><CheckCircle2 size={14} /></div><div><b>Menu vote counted</b><p>Paneer Butter Masala is leading.</p></div></div><div className="notification-item"><div className="mini-icon bg-[#fff0d8] text-[#ae6d1b]"><Clock3 size={14} /></div><div><b>Complaint update</b><p>Water heater is in progress.</p></div></div></div>}</div>
            <div className="topbar-avatar">RS</div>
          </div>
        </header>

        <div className="content-wrap">
          {activeView === "dashboard" && <Dashboard role={role} votes={votes} complaints={complaints} wasteEntries={wasteEntries} onNavigate={navigate} />}
          {activeView === "menu" && <MenuView votes={votes} onVote={handleVote} />}
          {activeView === "complaints" && <ComplaintsView role={role} complaints={filteredComplaints} search={search} setSearch={setSearch} showForm={showComplaintForm} setShowForm={setShowComplaintForm} draft={complaintDraft} setDraft={setComplaintDraft} onSubmit={handleComplaintSubmit} onResolve={markResolved} />}
          {activeView === "roommates" && <RoommatesView />}
          {activeView === "waste" && <WasteView entries={wasteEntries} showForm={showWasteForm} setShowForm={setShowWasteForm} draft={wasteDraft} setDraft={setWasteDraft} onSubmit={handleWasteSubmit} />}
        </div>
        <footer className="page-footer"><span>MessMate / Hostel Hub</span><span className="footer-separator">·</span><span>Prototype mode · data stored locally</span><span className="ml-auto hidden items-center gap-1.5 md:flex"><ShieldCheck size={13} /> Privacy by design</span></footer>
      </main>
    </div>
  );
}

function Dashboard({ role, votes, complaints, wasteEntries, onNavigate }: { role: Role; votes: Record<string, boolean>; complaints: Complaint[]; wasteEntries: WasteEntry[]; onNavigate: (view: View) => void }) {
  const open = complaints.filter((item) => item.status !== "Resolved").length;
  const waste = wasteEntries.reduce((total, item) => total + item.amount, 0);
  return <>
    <div className="welcome-strip"><div><div className="eyebrow text-[#81933f]">THURSDAY · 18 SEPTEMBER 2026</div><h1 className="mt-2 font-display text-[31px] font-extrabold leading-tight tracking-[-0.05em] text-[#173226] md:text-[38px]">Good morning, Riya <span className="wave">✦</span></h1><p className="mt-2 text-[13px] text-[#667c6e]">{role === "admin" ? "Here is your operational pulse across North Hostel." : "Here is what’s happening around North Hostel today."}</p></div><div className="pulse-card"><div className="pulse-orbit"><div className="pulse-core"><CircleGauge size={20} /></div></div><div><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#71865b]">HOSTEL PULSE</div><div className="mt-1 text-[19px] font-extrabold tracking-[-0.03em] text-[#2e4a35]">Looking good</div><div className="mt-1 text-[11px] text-[#7b8e7d]">78% operations on track</div></div></div></div>
    <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4"><MetricCard icon={UtensilsCrossed} label="Predicted plates today" value="214" detail="87% confidence · +6 vs yesterday" trend="2.8%" tone="lime" /><MetricCard icon={TrendingDown} label="Food waste this week" value="32%" detail="18.6 kg saved vs last week" trend="down" tone="orange" /><MetricCard icon={MessageSquareWarning} label="Open complaints" value={String(open).padStart(2, "0")} detail="2 need attention today" trend="1 resolved" tone="blue" /><MetricCard icon={HeartHandshake} label="Community pulse" value="4.8/5" detail="From 86 resident check-ins" trend="0.4" tone="red" /></div>
    <div className="grid gap-5 xl:grid-cols-[1.42fr_0.92fr]">
      <section className="panel overflow-hidden"><div className="panel-heading"><div><div className="eyebrow">OPERATIONS SNAPSHOT</div><h2 className="panel-title">A calmer week starts with the right signals.</h2></div><button className="text-button" onClick={() => onNavigate("waste")}>View reports <ArrowUpRight size={15} /></button></div><div className="chart-area"><div className="chart-topline"><div><span className="chart-value">18.6 <small>kg</small></span><span className="chart-muted"> total waste this week</span></div><Pill tone="lime"><TrendingDown size={12} /> 32% less</Pill></div><div className="chart-wrap"><div className="y-labels"><span>30kg</span><span>20kg</span><span>10kg</span><span>0kg</span></div><div className="chart-grid"><div className="grid-line" /><div className="grid-line" /><div className="grid-line" /><div className="grid-line" /><svg className="line-chart" viewBox="0 0 620 205" preserveAspectRatio="none" role="img" aria-label="Food waste trend"><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b8d96a" stopOpacity=".38" /><stop offset="1" stopColor="#b8d96a" stopOpacity="0" /></linearGradient></defs><path d="M0,57 C40,69 54,91 92,85 S140,61 181,77 S219,117 270,102 S312,89 355,116 S402,155 442,136 S488,91 523,106 S572,74 620,83 L620,205 L0,205 Z" fill="url(#chartFill)" /><path d="M0,57 C40,69 54,91 92,85 S140,61 181,77 S219,117 270,102 S312,89 355,116 S402,155 442,136 S488,91 523,106 S572,74 620,83" fill="none" stroke="#93b842" strokeWidth="3" strokeLinecap="round" /><circle cx="620" cy="83" r="5" fill="#fff" stroke="#93b842" strokeWidth="3" /></svg><div className="x-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></div></div></div><div className="chart-footnote"><span><span className="legend-dot" /> Food waste (kg)</span><span>Target: under 25 kg / week</span></div></section>
      <section className="panel"><div className="panel-heading"><div><div className="eyebrow">TODAY'S MENU</div><h2 className="panel-title">What residents chose</h2></div><button className="icon-button subtle" onClick={() => onNavigate("menu")} aria-label="View menu"><ArrowUpRight size={16} /></button></div><div className="menu-preview"><div className="dish-art dish-art-lime"><span>PB</span></div><div className="min-w-0 flex-1"><div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8b9b8f]">LUNCH · 12:30 PM</div><div className="mt-1 truncate text-[15px] font-extrabold text-[#1b3428]">Paneer Butter Masala</div><div className="mt-1 text-[11px] text-[#819189]">Jeera rice · Dal tadka · Salad</div></div><div className="vote-count"><Vote size={13} /> {168 + (votes.lunch ? 1 : 0)}</div></div><div className="menu-progress"><div className="flex justify-between text-[11px] font-semibold text-[#74887b]"><span>Expected attendance</span><span>214 / 248</span></div><div className="progress-track mt-2"><div className="progress-fill" style={{ width: "86%" }} /></div></div><div className="mini-menu-row"><div className="mini-dish-art dish-art-orange">VB</div><div className="min-w-0"><div className="truncate text-[12px] font-bold text-[#2a4436]">Veg Biryani</div><div className="text-[10px] text-[#8a9a91]">Dinner · 142 votes</div></div><ChevronDown size={15} className="ml-auto rotate-[-90deg] text-[#a3afa8]" /></div><button className="full-button" onClick={() => onNavigate("menu")}>Open menu voting <ArrowRight size={15} /></button></section>
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="panel"><div className="panel-heading"><div><div className="eyebrow">ATTENTION NEEDED</div><h2 className="panel-title">Small issues, clear ownership.</h2></div><button className="text-button" onClick={() => onNavigate("complaints")}>All complaints <ArrowUpRight size={15} /></button></div><div className="issue-list"><IssueRow icon={Wrench} tone="orange" title="Water heater not working" meta="Plumbing · assigned to Rakesh" status="In progress" /><IssueRow icon={CircleAlert} tone="red" title="Flickering light in study room" meta="Electrical · routing pending" status="Needs attention" /><IssueRow icon={CheckCircle2} tone="lime" title="Loose cupboard hinge" meta="Carpentry · resolved today" status="Resolved" /></div></section>
      <section className="panel action-panel"><div className="eyebrow">QUICK ACTIONS</div><h2 className="panel-title mt-2">Make hostel life smoother.</h2><div className="quick-grid"><button onClick={() => onNavigate("menu")}><div className="quick-icon bg-[#eaf4ca] text-[#698a28]"><Vote size={17} /></div><span>Vote on menu</span><ArrowRight size={14} /></button><button onClick={() => onNavigate("complaints")}><div className="quick-icon bg-[#ffedda] text-[#a86520]"><Wrench size={17} /></div><span>Report an issue</span><ArrowRight size={14} /></button><button onClick={() => onNavigate("roommates")}><div className="quick-icon bg-[#e3f0fb] text-[#3b6d8c]"><UsersRound size={17} /></div><span>Find a roommate</span><ArrowRight size={14} /></button><button onClick={() => onNavigate("waste")}><div className="quick-icon bg-[#f5eade] text-[#93694b]"><Recycle size={17} /></div><span>Log food waste</span><ArrowRight size={14} /></button></div></section>
    </div>
  </>;
}

function IssueRow({ icon: Icon, tone, title, meta, status }: { icon: typeof Wrench; tone: "orange" | "red" | "lime"; title: string; meta: string; status: string }) {
  const tones = { orange: "bg-[#fff0d9] text-[#a96721]", red: "bg-[#ffe9e8] text-[#ad4b44]", lime: "bg-[#ecf6d4] text-[#6d8b2e]" };
  return <div className="issue-row"><div className={`issue-icon ${tones[tone]}`}><Icon size={16} /></div><div className="min-w-0 flex-1"><div className="truncate text-[12px] font-bold text-[#294337]">{title}</div><div className="mt-1 truncate text-[10px] text-[#8a9b91]">{meta}</div></div><Pill tone={tone === "lime" ? "lime" : tone === "orange" ? "orange" : "red"}>{status}</Pill></div>;
}

function MenuView({ votes, onVote }: { votes: Record<string, boolean>; onVote: (id: string, dish: string) => void }) {
  return <><PageHeader eyebrow="MENU & VOTES" title="Shape tomorrow's plate." description="Your vote helps the mess cook what residents actually want — and gives the kitchen a clearer headcount." action={<div className="flex items-center gap-2"><div className="headcount-chip"><UsersRound size={15} /> <b>214</b> likely eating</div></div>} /><div className="menu-notice"><div className="notice-icon"><Sparkles size={19} /></div><div><b>Smart suggestion for tomorrow</b><p>Masala Dosa is trending 18% higher than last week. Voting closes at 8:00 PM.</p></div><div className="ml-auto hidden items-center gap-2 text-[11px] font-bold text-[#688927] md:flex"><BarChart3 size={15} /> Live insights</div></div><div className="mb-5 grid gap-4 lg:grid-cols-3">{menuItems.map((item) => <MenuCard key={item.id} item={item} voted={Boolean(votes[item.id])} onVote={onVote} />)}</div><div className="panel"><div className="panel-heading"><div><div className="eyebrow">HOW THE SIGNAL WORKS</div><h2 className="panel-title">Every vote makes the kitchen smarter.</h2></div><Pill tone="blue"><ShieldCheck size={12} /> Privacy-safe voting</Pill></div><div className="signal-grid"><SignalStep number="01" icon={Vote} title="Residents vote" text="Students choose the meals they are most likely to eat." /><SignalStep number="02" icon={BarChart3} title="AI reads the pattern" text="Votes, past attendance, weekday and exams become a demand signal." /><SignalStep number="03" icon={UtensilsCrossed} title="Kitchen cooks better" text="The mess gets a likely headcount — less waste, fewer shortages." /></div></div></>;
}

function MenuCard({ item, voted, onVote }: { item: (typeof menuItems)[number]; voted: boolean; onVote: (id: string, dish: string) => void }) {
  const arts = { lime: "dish-art-lime", orange: "dish-art-orange", sky: "dish-art-sky" };
  return <div className={`menu-card ${voted ? "menu-card-voted" : ""}`}><div className={`large-dish-art ${arts[item.color as keyof typeof arts]}`}><span>{item.icon}</span><div className="dish-spark">✦</div></div><div className="p-5"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8c9b91]">{item.meal}</span>{voted && <Pill tone="lime"><Check size={11} /> Voted</Pill>}</div><div className="mt-2 text-[17px] font-extrabold tracking-[-0.03em] text-[#1e382a]">{item.dish}</div><p className="mt-1 text-[11px] leading-5 text-[#84958c]">{item.meta}</p><div className="mt-5 flex items-end justify-between"><div><div className="text-[20px] font-extrabold text-[#294536]">{item.votes + (voted ? 1 : 0)}</div><div className="text-[10px] font-semibold text-[#8b9a91]">resident votes</div></div><button className={`vote-button ${voted ? "vote-button-active" : ""}`} onClick={() => onVote(item.id, item.dish)}>{voted ? "Voted" : "Vote"}<Vote size={14} /></button></div></div></div>;
}

function SignalStep({ number, icon: Icon, title, text }: { number: string; icon: typeof Vote; title: string; text: string }) {
  return <div className="signal-step"><div className="signal-number">{number}</div><div className="signal-icon"><Icon size={18} /></div><div><div className="text-[13px] font-bold text-[#2b4638]">{title}</div><p className="mt-1 text-[11px] leading-5 text-[#83958b]">{text}</p></div></div>;
}

function ComplaintsView({ role, complaints, search, setSearch, showForm, setShowForm, draft, setDraft, onSubmit, onResolve }: { role: Role; complaints: Complaint[]; search: string; setSearch: (value: string) => void; showForm: boolean; setShowForm: (value: boolean) => void; draft: { title: string; description: string; category: string; priority: string; anonymous: boolean }; setDraft: React.Dispatch<React.SetStateAction<{ title: string; description: string; category: string; priority: string; anonymous: boolean }>>; onSubmit: (event: React.FormEvent) => void; onResolve: (id: number) => void }) {
  return <><PageHeader eyebrow="MAINTENANCE" title={role === "admin" ? "Keep the campus moving." : "Report it. Track it. Done."} description={role === "admin" ? "A single queue for every repair, with clear ownership and escalation." : "No more shouting into a WhatsApp thread. Submit an issue and see exactly who owns it."} action={<button className="primary-button" onClick={() => setShowForm(!showForm)}>{showForm ? <X size={16} /> : <Plus size={16} />}{showForm ? "Close form" : "Report an issue"}</button>} /><div className="maintenance-metrics"><div><div className="metric-mini-label">TOTAL THIS MONTH</div><b>28</b><span> +8% vs Aug</span></div><div><div className="metric-mini-label">AVG. FIRST RESPONSE</div><b>2h 14m</b><span className="good"> 18% faster</span></div><div><div className="metric-mini-label">RESOLUTION RATE</div><b>91%</b><span className="good"> +4.2%</span></div><div><div className="metric-mini-label">AI ROUTING ACCURACY</div><b>94.6%</b><span className="good"> last 30 days</span></div></div>{showForm && <form className="panel complaint-form" onSubmit={onSubmit}><div className="panel-heading"><div><div className="eyebrow">NEW COMPLAINT</div><h2 className="panel-title">Give the issue a clear starting point.</h2></div><div className="form-ai"><Sparkles size={14} /> AI will route it</div></div><div className="form-grid"><label><span>Short title</span><input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="e.g. Fan stopped working" /></label><label><span>Category</span><select value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}><option>Electrical</option><option>Plumbing</option><option>Carpentry</option><option>Cleaning</option><option>Other</option></select></label><label className="form-span-2"><span>What happened?</span><textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Add enough detail for the right person to act quickly." rows={3} /></label><label><span>Priority</span><select value={draft.priority} onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value }))}><option>Low</option><option>Medium</option><option>High</option></select></label><label className="checkbox-label"><input type="checkbox" checked={draft.anonymous} onChange={(event) => setDraft((current) => ({ ...current, anonymous: event.target.checked }))} /><span>Post anonymously</span></label></div><div className="form-footer"><div className="text-[11px] text-[#8b9a91]"><Camera size={14} /> Photo uploads will be available in the connected version.</div><button className="primary-button" type="submit">Submit complaint <Send size={14} /></button></div></form>}<div className="panel"><div className="panel-heading"><div><div className="eyebrow">ISSUE QUEUE</div><h2 className="panel-title">Everything has a next step.</h2></div><div className="list-tools"><div className="search-box"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search issues" /></div><button className="filter-button"><Filter size={14} /> Filter</button></div></div><div className="complaints-table"><div className="complaints-head"><span>ISSUE</span><span>OWNER</span><span>STATUS</span><span className="text-right">ACTION</span></div>{complaints.map((item) => <ComplaintRow key={item.id} complaint={item} onResolve={onResolve} role={role} />)}{complaints.length === 0 && <div className="empty-state"><CircleAlert size={23} /><b>No issues match that search.</b><span>Try a different keyword.</span></div>}</div></div></>;
}

function ComplaintRow({ complaint, onResolve, role }: { complaint: Complaint; onResolve: (id: number) => void; role: Role }) {
  const statusTone = complaint.status === "Resolved" ? "lime" : complaint.status === "Open" ? "red" : "orange";
  return <div className="complaint-row"><div className="complaint-main"><div className={`complaint-type-icon ${complaint.category === "Plumbing" ? "bg-[#e5f1fb] text-[#3f7697]" : complaint.category === "Electrical" ? "bg-[#fff0d8] text-[#a96b21]" : "bg-[#f0edfb] text-[#6b61a0]"}`}>{complaint.category === "Plumbing" ? <Wrench size={15} /> : complaint.category === "Electrical" ? <CircleAlert size={15} /> : <HomeIcon size={15} />}</div><div className="min-w-0"><div className="truncate text-[12px] font-bold text-[#294236]">{complaint.title}</div><div className="mt-1 flex items-center gap-2 text-[10px] text-[#8a9b91]"><span>{complaint.category}</span><span>·</span><span>{complaint.created}</span>{complaint.anonymous && <Pill>Anonymous</Pill>}</div></div></div><div className="owner-cell"><div className="avatar avatar-small">{initials(complaint.assigned.split(" · ")[0])}</div><div><div className="text-[11px] font-bold text-[#40584b]">{complaint.assigned.split(" · ")[0]}</div><div className="text-[10px] text-[#93a098]">{complaint.assigned.split(" · ")[1] || "Queue"}</div></div></div><div><Pill tone={statusTone}>{complaint.status}</Pill></div><div className="text-right">{role === "admin" && complaint.status !== "Resolved" ? <button className="row-action" onClick={() => onResolve(complaint.id)}>Resolve <Check size={13} /></button> : <button className="row-kebab" onClick={() => toast.info(complaint.description)} aria-label="View complaint"><MoreHorizontal size={17} /></button>}</div></div>;
}

function RoommatesView() {
  return <><PageHeader eyebrow="ROOMMATE MATCH" title="Find your kind of easy." description="A simple, preference-based match for a calmer shared room. No secret profiling, no awkward guesswork." action={<Pill tone="blue"><ShieldCheck size={13} /> Preference-led, not profiling</Pill>} /><div className="match-hero"><div><div className="eyebrow text-[#a3bd65]">YOUR MATCH PROFILE</div><h2 className="mt-2 font-display text-[25px] font-extrabold tracking-[-0.04em] text-white">You value a room that feels like home.</h2><p className="mt-2 max-w-lg text-[12px] leading-5 text-[#a9bbb2]">Based on your preferences: tidy, moderate social energy, early-to-mid schedule, vegetarian-friendly.</p><div className="mt-4 flex flex-wrap gap-2"><span className="match-tag">Tidy space</span><span className="match-tag">Quiet after 11 PM</span><span className="match-tag">Vegetarian</span></div></div><div className="match-score"><div className="score-ring"><div><b>87</b><span>match base</span></div></div><div className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-[#bedb7a]">Profile ready</div></div></div><div className="match-heading"><div><div className="eyebrow">SUGGESTED FOR YOU</div><h2 className="panel-title">Three people who could make a good room.</h2></div><button className="filter-button"><Filter size={14} /> Preferences</button></div><div className="grid gap-4 lg:grid-cols-3">{roommateMatches.map((match) => <div className="match-card" key={match.name}><div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className="match-avatar">{match.initials}</div><div><div className="text-[13px] font-extrabold text-[#2c4538]">{match.name}</div><div className="mt-1 text-[10px] text-[#91a098]">Currently in {match.room}</div></div></div><div className="compatibility"><b>{match.score}%</b><span>fit</span></div></div><p className="mt-5 text-[11px] leading-5 text-[#7f9188]">{match.note}</p><div className="mt-4 flex flex-wrap gap-1.5">{match.tags.map((tag) => <span className="match-chip" key={tag}>{tag}</span>)}</div><button className="match-button" onClick={() => toast.success(`Interest sent to ${match.name}`, { description: "You can compare responses in your matches." })}>Show interest <ArrowRight size={14} /></button></div>)}</div><div className="privacy-note"><LockKeyhole size={17} /><div><b>Your preferences stay yours.</b><p>Matches use only what you choose to share. You can edit or remove your profile at any time.</p></div><button onClick={() => toast.info("Profile editing is ready for the next build.")} className="text-button ml-auto">Edit profile <ArrowRight size={14} /></button></div></>;
}

function WasteView({ entries, showForm, setShowForm, draft, setDraft, onSubmit }: { entries: WasteEntry[]; showForm: boolean; setShowForm: (value: boolean) => void; draft: { meal: string; amount: string }; setDraft: React.Dispatch<React.SetStateAction<{ meal: string; amount: string }>>; onSubmit: (event: React.FormEvent) => void }) {
  const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
  return <><PageHeader eyebrow="FOOD WASTE" title="Make every serving count." description="A simple log for the kitchen team and residents to see where waste is trending — and what to change next." action={<button className="primary-button" onClick={() => setShowForm(!showForm)}>{showForm ? <X size={16} /> : <Plus size={16} />}{showForm ? "Close form" : "Log waste"}</button>} /><div className="grid gap-4 md:grid-cols-3"><div className="waste-kpi waste-kpi-dark"><div className="eyebrow text-[#a6c568]">THIS WEEK</div><div className="mt-3 text-[34px] font-extrabold tracking-[-0.06em] text-white">{total.toFixed(1)}<span className="ml-1 text-[15px] font-bold text-[#a6c568]">kg</span></div><div className="mt-1 text-[11px] text-[#a5b7ae]">total logged waste</div><div className="waste-sparkline"><span style={{ height: "58%" }} /><span style={{ height: "78%" }} /><span style={{ height: "45%" }} /><span style={{ height: "62%" }} /><span style={{ height: "34%" }} /><span style={{ height: "22%" }} /></div></div><div className="waste-kpi"><div className="metric-mini-label">REDUCTION TARGET</div><div className="mt-3 text-[30px] font-extrabold tracking-[-0.05em] text-[#2c4637]">25.0 <span className="text-[14px] text-[#82928a]">kg</span></div><div className="mt-1 text-[11px] text-[#86968d]">weekly ceiling</div><div className="progress-track mt-5"><div className="progress-fill" style={{ width: `${Math.min(100, (total / 25) * 100)}%` }} /></div><div className="mt-2 flex justify-between text-[10px] font-semibold text-[#7d9085]"><span>{Math.round((total / 25) * 100)}% used</span><span>on track</span></div></div><div className="waste-kpi"><div className="metric-mini-label">EST. SAVINGS</div><div className="mt-3 text-[30px] font-extrabold tracking-[-0.05em] text-[#2c4637]">₹4,860</div><div className="mt-1 text-[11px] text-[#86968d]">this month from less waste</div><div className="mt-5 flex items-center gap-2 text-[11px] font-bold text-[#698a28]"><TrendingDown size={15} /> 32% improvement</div></div></div>{showForm && <form className="panel mt-5 waste-form" onSubmit={onSubmit}><div><div className="eyebrow">QUICK LOG</div><h2 className="panel-title mt-2">Add a kitchen observation.</h2></div><div className="waste-form-controls"><label><span>Meal</span><select value={draft.meal} onChange={(event) => setDraft((current) => ({ ...current, meal: event.target.value }))}><option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option></select></label><label><span>Approx. waste (kg)</span><input type="number" min="0" step="0.1" value={draft.amount} onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))} placeholder="e.g. 6.5" /></label><button className="primary-button self-end" type="submit">Add entry <Plus size={14} /></button></div></form>}<div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]"><section className="panel"><div className="panel-heading"><div><div className="eyebrow">RECENT LOGS</div><h2 className="panel-title">See what is changing.</h2></div><Pill tone="lime"><Leaf size={12} /> Live local log</Pill></div><div className="waste-log-list">{entries.map((entry) => <div className="waste-log-row" key={entry.id}><div className="waste-meal-icon"><UtensilsCrossed size={15} /></div><div className="flex-1"><div className="text-[12px] font-bold text-[#365040]">{entry.meal}</div><div className="mt-1 text-[10px] text-[#94a29a]">Logged in this browser · {entry.date}</div></div><b className="text-[14px] text-[#4f7021]">{entry.amount.toFixed(1)} kg</b></div>)}</div></section><section className="panel"><div className="panel-heading"><div><div className="eyebrow">WHY IT MATTERS</div><h2 className="panel-title">Waste is a signal, not a score.</h2></div><PieChart size={20} className="text-[#8ca94a]" /></div><div className="why-grid"><div><b>01</b><span>Better quantity</span><p>Demand patterns help the kitchen cook the right amount.</p></div><div><b>02</b><span>Better choices</span><p>Menu votes connect what residents want with what gets made.</p></div><div><b>03</b><span>Better planet</span><p>Less food in the bin means fewer resources wasted upstream.</p></div></div></section></div></>;
}

export default Home;
