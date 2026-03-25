import { useState, useEffect, useRef } from "react";

/* ═══ ICONS ═══ */
const I = ({ n, s = 18, c = "currentColor" }) => {
  const p = {
    home: <path d="M3 12l9-8 9 8M5 11v8a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-8"/>,
    inbox: <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></>,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    chart: <path d="M18 20V10M12 20V4M6 20v-6"/>,
    globe: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5z"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    send: <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    mic: <><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>,
    bell: <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>,
    trending: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    heart: <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    paperclip: <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>,
    arrowUp: <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>,
    message: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>,
    refresh: <><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>,
    copy: <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>,
    filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
    reply: <><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/></>,
    share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
    calendarPlus: <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4"/></>,
    upload: <><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></>,
    sparkle: <path d="M12 2l2.09 6.26L20 10.27l-4.47 3.88L16.18 21 12 17.77 7.82 21l.63-6.85L4 10.27l5.91-1.01z" strokeLinejoin="round"/>,
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" style={{ flexShrink: 0, display: "block" }}>{p[n]}</svg>;
};

/* ═══ SHARED ═══ */
const JaneAvatar = ({ size = 32, pulse }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg,#880E4F,#E91E63)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
    <span style={{ color: "#fff", fontWeight: 800, fontSize: size * 0.38 }}>J</span>
    {pulse && <div style={{ position: "absolute", bottom: -1, right: -1, width: size * 0.3, height: size * 0.3, borderRadius: "50%", background: "#4caf50", border: "2px solid #1a0a12", boxShadow: "0 0 6px rgba(76,175,80,.5)" }} />}
  </div>
);
const UserAvatar = ({ size = 32 }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: "#2a1520", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <span style={{ color: "#E91E63", fontWeight: 700, fontSize: size * 0.35 }}>You</span>
  </div>
);
const Dot = ({ p, s = 7 }) => {
  const c = { IG: "#c13584", Instagram: "#c13584", LI: "#0a66c2", LinkedIn: "#0a66c2", X: "#111", FB: "#1877f2", Facebook: "#1877f2", TK: "#010101", TikTok: "#010101" };
  return <div style={{ width: s, height: s, borderRadius: 2, background: c[p] || "#999", flexShrink: 0 }} />;
};
const Bd = ({ children, v = "default" }) => {
  const m = { default: { bg: "rgba(194,24,91,.1)", c: "#AD1457", b: "rgba(194,24,91,.18)" }, muted: { bg: "rgba(0,0,0,.04)", c: "#888", b: "rgba(0,0,0,.06)" }, success: { bg: "rgba(76,175,80,.08)", c: "#2e7d32", b: "rgba(76,175,80,.15)" }, danger: { bg: "rgba(155,44,61,.08)", c: "#9b2c3d", b: "rgba(155,44,61,.15)" }, warning: { bg: "rgba(255,193,7,.1)", c: "#f57f17", b: "rgba(255,193,7,.2)" } };
  const s = m[v] || m.default;
  return <span style={{ background: s.bg, color: s.c, border: `1px solid ${s.b}`, padding: "2px 8px", borderRadius: 5, fontSize: 10.5, fontWeight: 600 }}>{children}</span>;
};
const Btn = ({ children, primary, small, onClick, icon, danger, full }) => (
  <button onClick={onClick} style={{ padding: small ? "7px 13px" : "10px 20px", borderRadius: 8, border: primary ? "none" : danger ? "1.5px solid rgba(155,44,61,.2)" : "1.5px solid #e5e3df", background: primary ? "#111" : danger ? "#fff" : "#fff", color: primary ? "#E91E63" : danger ? "#9b2c3d" : "#444", fontWeight: 600, fontSize: small ? 12 : 13, cursor: "pointer", fontFamily: "var(--f)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, width: full ? "100%" : "auto", transition: "all .15s" }}>
    {icon && <I n={icon} s={small ? 13 : 14} c={primary ? "#E91E63" : danger ? "#9b2c3d" : "#888"} />}{children}
  </button>
);
const Tab = ({ tabs, active, onChange }) => (
  <div style={{ display: "flex", gap: 2, background: "#f5f4f0", borderRadius: 10, padding: 3 }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{ padding: "8px 16px", borderRadius: 8, background: active === t.id ? "#fff" : "transparent", border: "none", fontFamily: "var(--f)", fontSize: 12.5, fontWeight: active === t.id ? 700 : 500, color: active === t.id ? "#111" : "#999", cursor: "pointer", boxShadow: active === t.id ? "0 1px 4px rgba(0,0,0,.08)" : "none", transition: "all .15s", display: "flex", alignItems: "center", gap: 6 }}>
        {t.label}
        {t.count != null && <span style={{ background: active === t.id ? "#C2185B" : "#ddd", color: active === t.id ? "#fff" : "#888", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 99, minWidth: 18, textAlign: "center" }}>{t.count}</span>}
      </button>
    ))}
  </div>
);

/* ═══ DATA ═══ */
const ALL_POSTS_INIT = [
  {id:"q1",status:"queue",platform:"Instagram",type:"Carousel",pillar:"Product",title:"Ethiopian Blend Launch",caption:"Introducing our new single-origin Ethiopian blend — bright citrus notes with a chocolate finish.",time:"Tomorrow, 9:00 AM",day:1,hour:9,hashtags:["#BloomCoffee","#EthiopianCoffee"],g:"linear-gradient(135deg,#880E4F,#C2185B)",created:"2h ago"},
  {id:"q2",status:"queue",platform:"LinkedIn",type:"Article",pillar:"Education",title:"Supply Chain Tips",caption:"3 things most small businesses get wrong about their coffee supply chain.",time:"Tomorrow, 12:30 PM",day:1,hour:12,hashtags:["#SmallBusiness"],g:"linear-gradient(135deg,#4A148C,#7B1FA2)",created:"2h ago"},
  {id:"q3",status:"queue",platform:"X",type:"Thread",pillar:"BTS",title:"Farm Visit Thread",caption:"Just got back from our farm partner in Sidamo. The harvest is going to be special.",time:"Wed, 3:00 PM",day:2,hour:15,hashtags:["#CoffeeFarm"],g:"linear-gradient(135deg,#1a0a12,#37182b)",created:"1h ago"},
  {id:"d1",status:"draft",platform:"Instagram",type:"Reel",pillar:"BTS",title:"Roasting Process Video",caption:"Watch how we roast our beans to perfection.",time:"",day:-1,hour:0,hashtags:["#CoffeeRoasting"],g:"linear-gradient(135deg,#BF360C,#E65100)",comp:60,lastEdited:"Yesterday"},
  {id:"d2",status:"draft",platform:"Instagram",type:"Image",pillar:"Customer",title:"Customer Spotlight: Bola",caption:"\"Bloom Coffee changed my morning routine.\"",time:"",day:-1,hour:0,hashtags:["#CustomerLove"],g:"linear-gradient(135deg,#1B5E20,#4CAF50)",comp:80,lastEdited:"2 days ago"},
  {id:"d3",status:"draft",platform:"Facebook",type:"Promo",pillar:"Promotion",title:"Weekend Flash Sale",caption:"20% off all 500g bags. Code WEEKEND20.",time:"",day:-1,hour:0,hashtags:["#CoffeeSale"],g:"linear-gradient(135deg,#E65100,#FF9800)",comp:40,lastEdited:"3 days ago"},
  {id:"s1",status:"scheduled",platform:"Instagram",type:"Carousel",pillar:"Product",title:"New Sampler Pack",caption:"Try them all — 5 origins in one box.",time:"Thu, 10:00 AM",day:3,hour:10,hashtags:["#CoffeeSampler"],g:"linear-gradient(135deg,#880E4F,#C2185B)",auto:false},
  {id:"s2",status:"scheduled",platform:"Instagram",type:"Story",pillar:"BTS",title:"Morning at Roastery",caption:"6 AM vibes at Bloom HQ.",time:"Fri, 8:00 AM",day:4,hour:8,hashtags:[],g:"linear-gradient(135deg,#4A148C,#7B1FA2)",auto:true},
  {id:"s3",status:"scheduled",platform:"LinkedIn",type:"Post",pillar:"Industry",title:"African Coffee Exports",caption:"Exports hit $3.2B in 2025.",time:"Fri, 12:00 PM",day:4,hour:12,hashtags:["#AfricanCoffee"],g:"linear-gradient(135deg,#0D47A1,#2196F3)",auto:false},
  {id:"s4",status:"scheduled",platform:"Instagram",type:"Image",pillar:"Culture",title:"Team Saturday Vibes",caption:"Tasting, laughing, arguing about brew methods.",time:"Sat, 10:00 AM",day:5,hour:10,hashtags:["#TeamBloom"],g:"linear-gradient(135deg,#1B5E20,#4CAF50)",auto:true},
  {id:"p1",status:"published",platform:"Instagram",type:"Carousel",pillar:"Product",title:"Ethiopian Blend Teaser",caption:"The teaser that started it all.",time:"Mon, 9:00 AM",day:-3,hour:9,hashtags:[],g:"linear-gradient(135deg,#880E4F,#C2185B)",eng:847,reach:"4.2K",saves:123,comments:34,shares:18,top:true,pub:"Mar 17"},
  {id:"p2",status:"published",platform:"Instagram",type:"Story",pillar:"BTS",title:"Farm Visit BTS",caption:"Behind the scenes at Sidamo.",time:"Sun, 10:00 AM",day:-4,hour:10,hashtags:[],g:"linear-gradient(135deg,#4A148C,#7B1FA2)",eng:624,reach:"3.8K",saves:98,comments:21,shares:12,top:false,pub:"Mar 16"},
  {id:"p3",status:"published",platform:"X",type:"Thread",pillar:"Education",title:"Supply Chain Thread",caption:"The thread that went semi-viral.",time:"Sat, 3:00 PM",day:-5,hour:15,hashtags:[],g:"linear-gradient(135deg,#1a0a12,#37182b)",eng:412,reach:"5.1K",saves:0,comments:67,shares:89,top:false,pub:"Mar 15"},
];
const WEEK_DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const WEEK_DATES=["Mar 20","Mar 21","Mar 22","Mar 23","Mar 24","Mar 25","Mar 26"];
const statusColors={queue:"#C2185B",draft:"#888",scheduled:"#4caf50",published:"#1565c0"};
const statusLabels={queue:"Needs Review",draft:"Draft",scheduled:"Scheduled",published:"Published"};

const STATUS_MSGS = ["Monitoring X for trending audio in Lagos...","Analyzing audience engagement patterns...","Watching @starbucks for new campaigns...","Optimizing your posting schedule...","Scanning Instagram for hashtag trends..."];

const NAV = [
  { id: "workspace", icon: "home", label: "Workspace" },
  { id: "messages", icon: "inbox", label: "Customer Messages", count: 2 },
  { id: "schedule", icon: "calendar", label: "Posting Schedule" },
  { id: "performance", icon: "chart", label: "Performance Memos" },
  { id: "intel", icon: "globe", label: "Market Intel" },
  { id: "playbook", icon: "book", label: "Company Playbook" },
  { id: "hr", icon: "settings", label: "HR & Payroll" },
];


const SchedulePage = ({ onJane }) => {
  const [posts, setPosts] = useState(ALL_POSTS);
  const [filter, setFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [selected, setSelected] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [createMode, setCreateMode] = useState("ai");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiThinking, setAiThinking] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [manualCaption, setManualCaption] = useState("");
  const [manualPlatform, setManualPlatform] = useState("Instagram");
  const [manualPillar, setManualPillar] = useState("Product");
  const [manualDate, setManualDate] = useState("");
  const [calendarDay, setCalendarDay] = useState(null);
  const [detailPost, setDetailPost] = useState(null);

  const filtered = posts.filter(p => {
    if (filter !== "all" && p.status !== filter) return false;
    if (platformFilter !== "all" && p.platform.toLowerCase() !== platformFilter) return false;
    return true;
  });

  const queueCount = posts.filter(p => p.status === "queue").length;
  const draftCount = posts.filter(p => p.status === "draft").length;
  const schedCount = posts.filter(p => p.status === "scheduled").length;
  const pubCount = posts.filter(p => p.status === "published").length;

  const toggleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const selectAll = () => setSelected(filtered.map(p => p.id));
  const clearSelect = () => setSelected([]);

  const approvePost = (id) => setPosts(p => p.map(x => x.id === id ? {...x, status: "scheduled"} : x));
  const rejectPost = (id) => setPosts(p => p.filter(x => x.id !== id));
  const deletePost = (id) => setPosts(p => p.filter(x => x.id !== id));
  const bulkApprove = () => { setPosts(p => p.map(x => selected.includes(x.id) && x.status === "queue" ? {...x, status: "scheduled"} : x)); clearSelect(); };
  const bulkDelete = () => { setPosts(p => p.filter(x => !selected.includes(x.id))); clearSelect(); };

  const handleAiCreate = () => {
    if (!aiPrompt.trim()) return;
    setAiThinking(true);
    setTimeout(() => {
      setAiThinking(false);
      setAiResult({
        title: aiPrompt.slice(0, 40) + (aiPrompt.length > 40 ? "..." : ""),
        caption: aiPrompt + "\n\nCrafted in your brand voice with engaging hooks and relevant hashtags.",
        platform: "Instagram",
        pillar: "Product",
        hashtags: ["#BloomCoffee", "#MadeInNigeria"],
      });
    }, 1500);
  };

  const addAiPost = () => {
    if (!aiResult) return;
    setPosts(p => [...p, {
      id: "new" + Date.now(), status: "queue", platform: aiResult.platform, type: "Post",
      pillar: aiResult.pillar, title: aiResult.title, caption: aiResult.caption,
      time: "Pending", day: 1, hour: 10, hashtags: aiResult.hashtags,
      g: "linear-gradient(135deg,#880E4F,#C2185B)", created: "Just now"
    }]);
    setAiPrompt(""); setAiResult(null); setShowCreate(false);
  };

  const addManualPost = () => {
    setPosts(p => [...p, {
      id: "man" + Date.now(), status: "draft", platform: manualPlatform, type: "Post",
      pillar: manualPillar, title: manualCaption.slice(0, 40), caption: manualCaption,
      time: manualDate || "Unscheduled", day: -1, hour: 0, hashtags: [],
      g: "linear-gradient(135deg,#880E4F,#C2185B)", comp: 50, lastEdited: "Just now"
    }]);
    setManualCaption(""); setManualDate(""); setShowCreate(false);
  };

  // Calendar posts for the week view
  const calPosts = posts.filter(p => (p.status === "queue" || p.status === "scheduled") && p.day >= 0 && p.day <= 6);

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",fontFamily:"'Urbanist',sans-serif",background:"#f5f4f0",position:"relative"}}>

      {/* ═══ TOP BAR ═══ */}
      <div style={{padding:"16px 24px",background:"#fff",borderBottom:"1px solid #edecea",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <h1 style={{fontSize:20,fontWeight:800,color:"#111",margin:0}}>Posting Schedule</h1>
          <p style={{fontSize:12.5,color:"#999",margin:"2px 0 0"}}>Plan, review, and track all your content</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {/* Quick stats */}
          <div style={{display:"flex",gap:4,marginRight:8}}>
            {[
              {label:"Review",count:queueCount,color:"#C2185B"},
              {label:"Drafts",count:draftCount,color:"#888"},
              {label:"Scheduled",count:schedCount,color:"#4caf50"},
              {label:"Published",count:pubCount,color:"#1565c0"},
            ].map(s => (
              <button key={s.label} onClick={() => setFilter(filter === s.label.toLowerCase().replace("review","queue") ? "all" : s.label.toLowerCase().replace("review","queue"))} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:7,background:filter===s.label.toLowerCase().replace("review","queue") ? `${s.color}10` : "transparent",border:filter===s.label.toLowerCase().replace("review","queue") ? `1.5px solid ${s.color}30` : "1.5px solid transparent",cursor:"pointer",fontFamily:"inherit"}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:s.color}}/>
                <span style={{fontSize:12,fontWeight:600,color:s.color}}>{s.count}</span>
                <span style={{fontSize:11.5,color:"#999"}}>{s.label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setShowCreate(true)} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 18px",borderRadius:9,border:"none",background:"#C2185B",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 2px 8px rgba(194,24,91,.25)"}}>
            <I n="plus" s={16} c="#fff"/> New Post
          </button>
        </div>
      </div>

      {/* ═══ WEEKLY CALENDAR STRIP ═══ */}
      <div style={{background:"#fff",borderBottom:"1px solid #edecea",padding:"12px 24px 0"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <I n="calendar" s={16} c="#C2185B"/>
            <span style={{fontSize:13,fontWeight:700,color:"#222"}}>This Week</span>
            <span style={{fontSize:12,color:"#999"}}>Mar 20 — 26, 2026</span>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6,paddingBottom:12}}>
          {DAYS_OF_WEEK.map((day, i) => {
            const dayPosts = calPosts.filter(p => p.day === i);
            const isToday = i === 0;
            const isSelected = calendarDay === i;
            return (
              <button key={day} onClick={() => setCalendarDay(calendarDay === i ? null : i)} style={{padding:"8px 6px",borderRadius:10,border:isSelected ? "2px solid #C2185B" : isToday ? "2px solid rgba(194,24,91,.3)" : "1.5px solid #edecea",background:isSelected ? "rgba(194,24,91,.04)" : isToday ? "rgba(194,24,91,.02)" : "#fafaf8",cursor:"pointer",textAlign:"left",fontFamily:"inherit",minHeight:72,display:"flex",flexDirection:"column"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:10.5,fontWeight:700,color:isToday?"#C2185B":"#999",textTransform:"uppercase",letterSpacing:.5}}>{day}</span>
                  <span style={{fontSize:10,color:isToday?"#C2185B":"#bbb"}}>{DATES[i]}</span>
                </div>
                {isToday && <div style={{fontSize:8,fontWeight:700,color:"#C2185B",textTransform:"uppercase",letterSpacing:.5,marginBottom:2}}>Today</div>}
                <div style={{display:"flex",flexDirection:"column",gap:2,flex:1}}>
                  {dayPosts.map(p => (
                    <div key={p.id} style={{display:"flex",alignItems:"center",gap:3,padding:"2px 5px",borderRadius:4,background:`${statusColors[p.status]}08`,borderLeft:`2px solid ${statusColors[p.status]}`}}>
                      <Dot p={p.platform} s={5}/>
                      <span style={{fontSize:8.5,color:"#555",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{p.title}</span>
                    </div>
                  ))}
                  {dayPosts.length === 0 && <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:9,color:"#ddd"}}>Empty</span></div>}
                </div>
                {dayPosts.length > 0 && <div style={{fontSize:9,color:"#999",textAlign:"right",marginTop:2}}>{dayPosts.length} post{dayPosts.length > 1 ? "s" : ""}</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ FILTER BAR + BULK ACTIONS ═══ */}
      <div style={{padding:"10px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fafaf8",borderBottom:"1px solid #f0eeea"}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {/* Status filter chips */}
          {[{id:"all",label:"All"},{id:"queue",label:"Needs Review"},{id:"draft",label:"Drafts"},{id:"scheduled",label:"Scheduled"},{id:"published",label:"Published"}].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{padding:"5px 12px",borderRadius:6,border:filter===f.id?"1.5px solid #222":"1.5px solid #e5e3df",background:filter===f.id?"#222":"#fff",color:filter===f.id?"#fff":"#666",fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{f.label}</button>
          ))}
          <span style={{width:1,height:20,background:"#e5e3df",margin:"0 4px"}}/>
          <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)} style={{padding:"5px 10px",borderRadius:6,border:"1.5px solid #e5e3df",fontSize:11.5,fontFamily:"inherit",outline:"none",color:"#666",cursor:"pointer",background:"#fff"}}>
            <option value="all">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="x">X</option>
            <option value="facebook">Facebook</option>
            <option value="tiktok">TikTok</option>
          </select>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {selected.length > 0 && (
            <React.Fragment>
              <Bd>{selected.length} selected</Bd>
              <button onClick={bulkApprove} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 12px",borderRadius:6,border:"none",background:"#111",color:"#E91E63",fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}><I n="check" s={13} c="#E91E63"/>Approve All</button>
              <button onClick={bulkDelete} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 12px",borderRadius:6,border:"1.5px solid rgba(155,44,61,.2)",background:"#fff",color:"#9b2c3d",fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}><I n="trash" s={13} c="#9b2c3d"/>Delete</button>
              <button onClick={clearSelect} style={{padding:"5px 10px",borderRadius:6,border:"1.5px solid #e5e3df",background:"#fff",color:"#888",fontSize:11.5,cursor:"pointer",fontFamily:"inherit"}}>Clear</button>
            </React.Fragment>
          )}
          {selected.length === 0 && filtered.length > 0 && (
            <button onClick={selectAll} style={{padding:"5px 10px",borderRadius:6,border:"1.5px solid #e5e3df",background:"#fff",color:"#888",fontSize:11.5,cursor:"pointer",fontFamily:"inherit"}}>Select all</button>
          )}
          <span style={{fontSize:11.5,color:"#bbb"}}>{filtered.length} posts</span>
        </div>
      </div>

      {/* ═══ CONTENT LIST ═══ */}
      <div style={{flex:1,overflowY:"auto",padding:"14px 24px 20px"}}>
        {/* Jane context message */}
        {filter === "queue" && queueCount > 0 && (
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,padding:"10px 14px",borderRadius:10,background:"rgba(194,24,91,.03)",border:"1px solid rgba(194,24,91,.1)"}}>
            <JA size={22}/>
            <span style={{fontSize:12.5,color:"#555"}}><strong style={{color:"#C2185B"}}>Jane</strong> drafted {queueCount} posts. Approve here, or reply from WhatsApp.</span>
          </div>
        )}
        {filter === "draft" && (
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,padding:"10px 14px",borderRadius:10,background:"rgba(0,0,0,.02)",border:"1px solid #edecea"}}>
            <I n="edit" s={15} c="#999"/>
            <span style={{fontSize:12.5,color:"#555"}}>Works in progress. Ask Jane to finish any of these, or edit them yourself.</span>
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{textAlign:"center",padding:"48px 20px"}}>
            <div style={{width:48,height:48,borderRadius:12,background:"rgba(0,0,0,.03)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}><I n="calendar" s={22} c="#ccc"/></div>
            <h4 style={{fontSize:14,fontWeight:700,color:"#333",margin:"0 0 4px"}}>No posts here</h4>
            <p style={{fontSize:12.5,color:"#999",margin:"0 0 12px"}}>Create a new post to get started.</p>
            <button onClick={() => setShowCreate(true)} style={{padding:"9px 18px",borderRadius:8,border:"none",background:"#C2185B",color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}><I n="plus" s={14} c="#fff" style={{display:"inline"}}/> New Post</button>
          </div>
        )}

        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {filtered.map(post => {
            const isSelected = selected.includes(post.id);
            return (
              <div key={post.id} style={{borderRadius:11,border:isSelected ? "2px solid #C2185B" : "1px solid #edecea",background:"#fff",overflow:"hidden",transition:"border-color .12s"}}>
                <div style={{display:"flex",gap:12,padding:"12px 14px",alignItems:"center"}}>
                  {/* Checkbox */}
                  <button onClick={() => toggleSelect(post.id)} style={{width:20,height:20,borderRadius:5,border:isSelected?"none":"2px solid #ddd",background:isSelected?"#C2185B":"#fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,padding:0}}>
                    {isSelected && <I n="check" s={12} c="#fff"/>}
                  </button>
                  {/* Thumbnail */}
                  <div style={{width:44,height:44,borderRadius:9,background:post.g,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <I n="image" s={16} c="rgba(255,255,255,.3)"/>
                  </div>
                  {/* Info */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3,flexWrap:"wrap"}}>
                      <Dot p={post.platform}/>
                      <span style={{fontSize:12,fontWeight:600,color:"#222"}}>{post.platform}</span>
                      <Bd>{post.pillar}</Bd>
                      <Bd v="muted">{post.type}</Bd>
                      <Bd v={post.status === "queue" ? "default" : post.status === "draft" ? "muted" : post.status === "scheduled" ? "success" : "info"}>{statusLabels[post.status]}</Bd>
                      {post.auto && <Bd v="warning">Auto</Bd>}
                      {post.top && <Bd v="success">Top Performer</Bd>}
                    </div>
                    <h4 style={{fontSize:13.5,fontWeight:700,color:"#111",margin:"0 0 2px"}}>{post.title}</h4>
                    <p style={{fontSize:12,color:"#666",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{post.caption}</p>
                  </div>
                  {/* Meta */}
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3,flexShrink:0}}>
                    {post.time && <div style={{display:"flex",alignItems:"center",gap:4}}><I n="clock" s={12} c={post.status==="scheduled"?"#4caf50":"#bbb"}/><span style={{fontSize:11.5,color:post.status==="scheduled"?"#2e7d32":"#999",fontWeight:post.status==="scheduled"?600:400}}>{post.time}</span></div>}
                    {post.comp != null && (
                      <div style={{display:"flex",alignItems:"center",gap:5,width:80}}>
                        <div style={{flex:1,height:3,borderRadius:99,background:"#f0eeea",overflow:"hidden"}}><div style={{width:`${post.comp}%`,height:"100%",borderRadius:99,background:post.comp>70?"#4caf50":post.comp>40?"#FFC107":"#C2185B"}}/></div>
                        <span style={{fontSize:10,color:"#999"}}>{post.comp}%</span>
                      </div>
                    )}
                    {post.pub && <span style={{fontSize:11,color:"#bbb"}}>{post.pub}</span>}
                  </div>
                  {/* Actions */}
                  <div style={{display:"flex",gap:4,flexShrink:0}}>
                    {post.status === "queue" && (
                      <React.Fragment>
                        <button onClick={() => approvePost(post.id)} title="Approve" style={{width:32,height:32,borderRadius:7,border:"none",background:"#111",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I n="check" s={14} c="#E91E63"/></button>
                        <button onClick={() => rejectPost(post.id)} title="Reject" style={{width:32,height:32,borderRadius:7,border:"1.5px solid rgba(155,44,61,.15)",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I n="x" s={14} c="#9b2c3d"/></button>
                      </React.Fragment>
                    )}
                    {post.status === "draft" && (
                      <React.Fragment>
                        <button title="Ask Jane" style={{width:32,height:32,borderRadius:7,border:"none",background:"#111",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I n="sparkle" s={14} c="#E91E63"/></button>
                        <button title="Edit" style={{width:32,height:32,borderRadius:7,border:"1.5px solid #e5e3df",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I n="edit" s={14} c="#888"/></button>
                      </React.Fragment>
                    )}
                    {post.status === "scheduled" && (
                      <React.Fragment>
                        <button title="Preview" style={{width:32,height:32,borderRadius:7,border:"1.5px solid #e5e3df",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I n="eye" s={14} c="#888"/></button>
                        <button title="Reschedule" style={{width:32,height:32,borderRadius:7,border:"1.5px solid #e5e3df",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I n="clock" s={14} c="#888"/></button>
                      </React.Fragment>
                    )}
                    {post.status === "published" && (
                      <React.Fragment>
                        <button title="Repurpose" style={{width:32,height:32,borderRadius:7,border:"1.5px solid #e5e3df",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I n="copy" s={14} c="#888"/></button>
                        <button title="Share" style={{width:32,height:32,borderRadius:7,border:"1.5px solid #e5e3df",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I n="share" s={14} c="#888"/></button>
                      </React.Fragment>
                    )}
                    <button onClick={() => deletePost(post.id)} title="Delete" style={{width:32,height:32,borderRadius:7,border:"1.5px solid rgba(155,44,61,.1)",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I n="trash" s={14} c="#ccc"/></button>
                  </div>
                </div>
                {/* Published metrics inline */}
                {post.status === "published" && post.eng && (
                  <div style={{display:"flex",borderTop:"1px solid #f5f4f0",background:"#fafaf8"}}>
                    {[{l:"Engagements",v:post.eng},{l:"Reach",v:post.reach},{l:"Comments",v:post.comments},{l:"Shares",v:post.shares},...(post.saves?[{l:"Saves",v:post.saves}]:[])].map((m,i,arr) => (
                      <div key={m.l} style={{flex:1,padding:"8px 12px",borderRight:i<arr.length-1?"1px solid #f0eeea":"none",textAlign:"center"}}>
                        <div style={{fontSize:13,fontWeight:700,color:"#222"}}>{m.v}</div>
                        <div style={{fontSize:9.5,color:"#999"}}>{m.l}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ BOTTOM JANE BAR ═══ */}
      <div style={{padding:"10px 24px 14px",borderTop:"1px solid #edecea",background:"#fff",display:"flex",gap:8,alignItems:"center"}}>
        <JA size={26}/>
        <input placeholder="Ask Jane about your schedule..." style={{flex:1,padding:"9px 13px",borderRadius:9,border:"1.5px solid #e5e3df",fontSize:13,fontFamily:"inherit",outline:"none",background:"#fafaf8"}}/>
        <button style={{width:32,height:32,borderRadius:7,border:"none",background:"#C2185B",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I n="send" s={13} c="#fff"/></button>
      </div>

      {/* ═══ CREATE POST SLIDE-OVER ═══ */}
      {showCreate && (
        <React.Fragment>
          {/* Backdrop */}
          <div onClick={() => {setShowCreate(false);setAiResult(null);}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.3)",zIndex:100}}/>
          {/* Panel */}
          <div style={{position:"fixed",top:0,right:0,bottom:0,width:460,background:"#fff",boxShadow:"-8px 0 40px rgba(0,0,0,.1)",zIndex:101,display:"flex",flexDirection:"column",fontFamily:"'Urbanist',sans-serif"}}>
            {/* Header */}
            <div style={{padding:"18px 22px",borderBottom:"1px solid #edecea",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <h2 style={{fontSize:17,fontWeight:800,color:"#111",margin:0}}>New Post</h2>
              <button onClick={() => {setShowCreate(false);setAiResult(null);}} style={{width:32,height:32,borderRadius:8,border:"1.5px solid #e5e3df",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I n="x" s={16} c="#888"/></button>
            </div>

            {/* Mode toggle */}
            <div style={{padding:"14px 22px 0",display:"flex",gap:3,background:"#f5f4f0",margin:"0 22px",borderRadius:10,marginTop:16}}>
              <button onClick={() => setCreateMode("ai")} style={{flex:1,padding:"9px",borderRadius:8,background:createMode==="ai"?"#fff":"transparent",border:"none",fontFamily:"inherit",fontSize:13,fontWeight:createMode==="ai"?700:500,color:createMode==="ai"?"#C2185B":"#999",cursor:"pointer",boxShadow:createMode==="ai"?"0 1px 4px rgba(0,0,0,.06)":"none",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                <I n="sparkle" s={14} c={createMode==="ai"?"#C2185B":"#ccc"}/> Ask Jane
              </button>
              <button onClick={() => setCreateMode("manual")} style={{flex:1,padding:"9px",borderRadius:8,background:createMode==="manual"?"#fff":"transparent",border:"none",fontFamily:"inherit",fontSize:13,fontWeight:createMode==="manual"?700:500,color:createMode==="manual"?"#111":"#999",cursor:"pointer",boxShadow:createMode==="manual"?"0 1px 4px rgba(0,0,0,.06)":"none",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                <I n="edit" s={14} c={createMode==="manual"?"#111":"#ccc"}/> Write Manually
              </button>
            </div>

            {/* Content */}
            <div style={{flex:1,overflowY:"auto",padding:"18px 22px"}}>
              {createMode === "ai" ? (
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                    <JA size={28}/>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#C2185B"}}>Jane</div>
                      <div style={{fontSize:11.5,color:"#999"}}>Describe what you want and I'll draft it in your brand voice.</div>
                    </div>
                  </div>
                  <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="e.g. Create a post announcing our new Ethiopian blend launch. Make it exciting with a sense of urgency..." rows={4} style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid #e5e3df",fontSize:13.5,fontFamily:"inherit",outline:"none",resize:"vertical",background:"#fafaf8",boxSizing:"border-box",lineHeight:1.6}}/>
                  <button onClick={handleAiCreate} disabled={!aiPrompt.trim() || aiThinking} style={{marginTop:10,width:"100%",padding:"11px",borderRadius:9,border:"none",background:aiPrompt.trim() && !aiThinking?"#C2185B":"#eee",color:aiPrompt.trim() && !aiThinking?"#fff":"#ccc",fontWeight:700,fontSize:13.5,cursor:aiPrompt.trim() && !aiThinking?"pointer":"default",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    {aiThinking ? "Jane is drafting..." : <React.Fragment><I n="sparkle" s={15} c="#fff"/> Generate Draft</React.Fragment>}
                  </button>

                  {/* AI Result */}
                  {aiResult && (
                    <div style={{marginTop:18,borderRadius:12,border:"1px solid rgba(194,24,91,.15)",background:"rgba(194,24,91,.02)",padding:"16px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:10}}>
                        <JA size={20}/>
                        <span style={{fontSize:12.5,fontWeight:700,color:"#C2185B"}}>Jane's draft</span>
                        <Bd v="success">Ready</Bd>
                      </div>
                      <div style={{background:"#fff",borderRadius:10,border:"1px solid #edecea",padding:"14px",marginBottom:12}}>
                        <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}>
                          <Dot p={aiResult.platform}/><span style={{fontSize:12,fontWeight:600}}>{aiResult.platform}</span><Bd>{aiResult.pillar}</Bd>
                        </div>
                        <p style={{fontSize:13,color:"#333",lineHeight:1.6,margin:"0 0 6px",whiteSpace:"pre-line"}}>{aiResult.caption}</p>
                        <div style={{display:"flex",gap:4}}>{aiResult.hashtags.map(h => <span key={h} style={{fontSize:11,color:"#C2185B",fontWeight:500}}>{h}</span>)}</div>
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={addAiPost} style={{flex:1,padding:"10px",borderRadius:8,border:"none",background:"#111",color:"#E91E63",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><I n="check" s={14} c="#E91E63"/>Add to Queue</button>
                        <button onClick={() => setAiResult(null)} style={{padding:"10px 16px",borderRadius:8,border:"1.5px solid #e5e3df",background:"#fff",color:"#666",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}><I n="refresh" s={14} c="#888"/></button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{marginBottom:14}}>
                    <label style={{display:"block",fontSize:12,fontWeight:600,color:"#444",marginBottom:5}}>Platform</label>
                    <div style={{display:"flex",gap:5}}>
                      {["Instagram","LinkedIn","X","Facebook","TikTok"].map(p => (
                        <button key={p} onClick={() => setManualPlatform(p)} style={{padding:"6px 12px",borderRadius:7,border:manualPlatform===p?"1.5px solid #222":"1.5px solid #e5e3df",background:manualPlatform===p?"#222":"#fff",color:manualPlatform===p?"#fff":"#666",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}>
                          <Dot p={p} s={6}/>{p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{marginBottom:14}}>
                    <label style={{display:"block",fontSize:12,fontWeight:600,color:"#444",marginBottom:5}}>Content Pillar</label>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                      {["Product","Education","BTS","Customer","Promotion","Culture","Industry","Trending"].map(p => (
                        <button key={p} onClick={() => setManualPillar(p)} style={{padding:"5px 11px",borderRadius:6,border:manualPillar===p?"1.5px solid #C2185B":"1.5px solid #e5e3df",background:manualPillar===p?"rgba(194,24,91,.06)":"#fff",color:manualPillar===p?"#C2185B":"#666",fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{p}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{marginBottom:14}}>
                    <label style={{display:"block",fontSize:12,fontWeight:600,color:"#444",marginBottom:5}}>Caption</label>
                    <textarea value={manualCaption} onChange={e => setManualCaption(e.target.value)} placeholder="Write your caption here..." rows={5} style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid #e5e3df",fontSize:13.5,fontFamily:"inherit",outline:"none",resize:"vertical",background:"#fafaf8",boxSizing:"border-box",lineHeight:1.6}}/>
                  </div>
                  <div style={{marginBottom:14}}>
                    <label style={{display:"block",fontSize:12,fontWeight:600,color:"#444",marginBottom:5}}>Media</label>
                    <div style={{border:"2px dashed #ddd",borderRadius:10,padding:"24px 16px",textAlign:"center",cursor:"pointer",background:"#fafaf8"}}>
                      <I n="upload" s={20} c="#ccc"/><p style={{fontSize:12,color:"#999",margin:"6px 0 0"}}>Drop files or click to upload</p>
                    </div>
                  </div>
                  <div style={{marginBottom:14}}>
                    <label style={{display:"block",fontSize:12,fontWeight:600,color:"#444",marginBottom:5}}>Schedule</label>
                    <input type="datetime-local" value={manualDate} onChange={e => setManualDate(e.target.value)} style={{width:"100%",padding:"10px 13px",borderRadius:9,border:"1.5px solid #e5e3df",fontSize:13,fontFamily:"inherit",outline:"none",background:"#fafaf8",boxSizing:"border-box"}}/>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={addManualPost} disabled={!manualCaption.trim()} style={{flex:1,padding:"11px",borderRadius:9,border:"none",background:manualCaption.trim()?"#C2185B":"#eee",color:manualCaption.trim()?"#fff":"#ccc",fontWeight:700,fontSize:13.5,cursor:manualCaption.trim()?"pointer":"default",fontFamily:"inherit"}}>
                      {manualDate ? "Schedule Post" : "Save as Draft"}
                    </button>
                  </div>
                  <div style={{marginTop:12,padding:"10px 14px",borderRadius:9,background:"rgba(194,24,91,.03)",border:"1px solid rgba(194,24,91,.1)",display:"flex",alignItems:"center",gap:8}}>
                    <JA size={20}/>
                    <span style={{fontSize:12,color:"#666"}}>Want Jane to improve this? Switch to <button onClick={() => setCreateMode("ai")} style={{background:"none",border:"none",color:"#C2185B",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:12,padding:0,textDecoration:"underline"}}>Ask Jane</button> mode.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}


/* ═══ SIMPLE SUBPAGES ═══ */
const SubPage = ({ title, icon, desc, children, onJane }) => (
  <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
    <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid #edecea" }}><h2 style={{ fontSize: 17, fontWeight: 800, color: "#111", display: "flex", alignItems: "center", gap: 8 }}><I n={icon} s={18} c="#C2185B" />{title}</h2><p style={{ fontSize: 12.5, color: "#999", marginTop: 2 }}>{desc}</p></div>
    <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px" }}>{children}</div>
    <div style={{ padding: "10px 24px 14px", borderTop: "1px solid #edecea", background: "#fff", display: "flex", gap: 7, alignItems: "center" }}>
      <JaneAvatar size={26} /><input placeholder={`Ask Jane about ${title.toLowerCase()}...`} style={{ flex: 1, padding: "9px 13px", borderRadius: 9, border: "1.5px solid #e5e3df", fontSize: 13, fontFamily: "var(--f)", outline: "none", background: "#fafaf8" }} onKeyDown={e => { if (e.key === "Enter") onJane?.(); }} /><button onClick={onJane} style={{ width: 32, height: 32, borderRadius: 7, border: "none", background: "#C2185B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><I n="send" s={13} c="#fff" /></button>
    </div>
  </div>
);

const MessagesPage = ({ onJane }) => <SubPage title="Customer Messages" icon="inbox" desc="DMs, comments, and mentions across all platforms" onJane={onJane}>{[{ u: "@coffeelover_ng", p: "Instagram", t: "When will the Ethiopian blend be available?", tm: "12m" }, { u: "@jakethebaker", p: "X", t: "Your farm visit post was incredible!", tm: "1h" }, { u: "Adaeze Okonkwo", p: "LinkedIn", t: "Would love to discuss wholesale partnership.", tm: "3h" }, { u: "@morning_brew_fan", p: "Instagram", t: "Do you ship to Abuja?", tm: "5h" }, { u: "Emeka Obi", p: "Facebook", t: "Just ordered the sampler pack!", tm: "8h" }].map((m, i) => <div key={i} style={{ display: "flex", gap: 10, padding: "13px 15px", borderRadius: 11, border: "1px solid #edecea", background: "#fff", marginBottom: 7, cursor: "pointer" }}><div style={{ width: 34, height: 34, borderRadius: "50%", background: "#f5f4f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 11, fontWeight: 700, color: "#888" }}>{m.u[0].toUpperCase()}</span></div><div style={{ flex: 1 }}><div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}><span style={{ fontSize: 12.5, fontWeight: 700 }}>{m.u}</span><span style={{ fontSize: 11, color: "#bbb" }}>via {m.p}</span><span style={{ marginLeft: "auto", fontSize: 11, color: "#bbb" }}>{m.tm}</span></div><p style={{ fontSize: 12.5, color: "#555", margin: 0 }}>{m.t}</p></div></div>)}</SubPage>;

const PerformancePage = ({ onJane }) => <SubPage title="Performance Memos" icon="chart" desc="Jane's analysis of your brand performance" onJane={onJane}><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>{[{ l: "Reach", v: "18.3K", c: "+22%" }, { l: "Engagement", v: "5.2%", c: "+0.8%" }, { l: "Followers", v: "4,821", c: "+127" }].map(s => <div key={s.l} style={{ padding: "16px", background: "#fff", borderRadius: 12, border: "1px solid #edecea" }}><div style={{ fontSize: 11.5, color: "#999", marginBottom: 5 }}>{s.l}</div><div style={{ fontSize: 22, fontWeight: 800, color: "#111" }}>{s.v}</div><div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 3 }}><I n="arrowUp" s={10} c="#4caf50" /><span style={{ fontSize: 11, fontWeight: 600, color: "#4caf50" }}>{s.c}</span></div></div>)}</div><div style={{ background: "#fff", borderRadius: 12, border: "1px solid #edecea", padding: "18px" }}><div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}><JaneAvatar size={22} /><span style={{ fontSize: 13, fontWeight: 700, color: "#C2185B" }}>Jane's Weekly Memo</span></div><div style={{ fontSize: 13, color: "#444", lineHeight: 1.7 }}><p style={{ margin: "0 0 8px" }}>Strong week. <strong>Behind the Scenes</strong> content leads at 7.8% engagement. Ethiopian Blend carousel was top performer (847 engagements).</p><p style={{ margin: "0 0 8px" }}><strong>My recommendation:</strong> Double down on BTS this week. The #PourOverVsFrenchPress trend is fading — pivot to #AfricanCoffeeRevolution.</p><p style={{ margin: 0 }}>Audience most active <strong>8–10 AM WAT</strong>. All posts optimized around that window.</p></div></div></SubPage>;

const IntelPage = ({ onJane }) => <SubPage title="Market Intel" icon="globe" desc="What people say about your brand across the web" onJane={onJane}>{[{ u: "@lagoscoffeegirl", s: "X", t: "Just discovered @bloomcoffee. Beautiful packaging!", se: "positive", tm: "25m" }, { u: "lagoseatstreet.com", s: "Blog", t: "Top 10 Nigerian Coffee Brands — Bloom at #3.", se: "positive", tm: "5h" }, { u: "@abuja_sips", s: "X", t: "Bloom delivery took 5 days to Abuja. Slow.", se: "negative", tm: "1d" }].map((m, i) => <div key={i} style={{ display: "flex", gap: 10, padding: "13px 15px", borderRadius: 11, border: "1px solid #edecea", background: "#fff", marginBottom: 7 }}><div style={{ width: 30, height: 30, borderRadius: 7, background: m.se === "positive" ? "rgba(76,175,80,.06)" : "rgba(155,44,61,.06)", display: "flex", alignItems: "center", justifyContent: "center" }}><I n={m.se === "positive" ? "heart" : "trending"} s={13} c={m.se === "positive" ? "#4caf50" : "#9b2c3d"} /></div><div style={{ flex: 1 }}><div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}><span style={{ fontSize: 12.5, fontWeight: 700 }}>{m.u}</span><span style={{ fontSize: 11, color: "#bbb" }}>{m.s} · {m.tm}</span></div><p style={{ fontSize: 12.5, color: "#555", margin: 0 }}>{m.t}</p></div></div>)}</SubPage>;

const PlaybookPage = ({ onJane }) => <SubPage title="Company Playbook" icon="book" desc="Jane's training manual — everything she knows about your brand" onJane={onJane}>{[{ t: "Brand Identity", items: ["Bloom Coffee Roasters", "Food & Beverage", "Specialty coffee from small farms"] }, { t: "Voice", items: ["Casual, Witty, Bold, Educational"] }, { t: "Pillars", items: ["Product, BTS, Education, Customer, Promos"] }, { t: "Guardrails", items: ["No politics, no competitor mentions", "Emoji: sparingly", "Max 5 hashtags"] }].map(s => <div key={s.t} style={{ background: "#fff", borderRadius: 12, border: "1px solid #edecea", padding: "16px 18px", marginBottom: 8 }}><h3 style={{ fontSize: 13.5, fontWeight: 700, color: "#111", marginBottom: 8 }}>{s.t}</h3>{s.items.map((item, i) => <div key={i} style={{ fontSize: 12.5, color: "#555", padding: "4px 0", borderBottom: i < s.items.length - 1 ? "1px solid #f5f4f0" : "none" }}>{item}</div>)}</div>)}</SubPage>;

const HRPage = ({ onJane }) => <SubPage title="HR & Payroll" icon="settings" desc="Manage Jane's employment, billing, and team access" onJane={onJane}><div style={{ background: "#fff", borderRadius: 12, border: "1px solid #edecea", padding: "18px", marginBottom: 10 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}><div><div style={{ fontSize: 14, fontWeight: 700 }}>Free Plan</div><div style={{ fontSize: 12, color: "#999" }}>3 accounts · 30 posts/month</div></div><Bd>Current</Bd></div><button style={{ width: "100%", padding: "11px", borderRadius: 9, border: "none", background: "#C2185B", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--f)" }}>Upgrade Jane to Pro — ₦15,000/mo</button></div><div style={{ background: "#fff", borderRadius: 12, border: "1px solid #edecea", padding: "16px 18px" }}><h3 style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 10 }}>Team</h3>{[{ n: "Chidi Okonkwo", r: "Admin" }, { n: "Amara Eze", r: "Editor" }].map(m => <div key={m.n} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid #f5f4f0" }}><div style={{ width: 28, height: 28, borderRadius: "50%", background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#E91E63", fontSize: 10, fontWeight: 700 }}>{m.n.split(" ").map(x => x[0]).join("")}</span></div><span style={{ flex: 1, fontSize: 12.5, fontWeight: 600 }}>{m.n}</span><span style={{ fontSize: 11, color: "#999", background: "#f5f4f0", padding: "2px 7px", borderRadius: 4 }}>{m.r}</span></div>)}</div></SubPage>;

/* ═══ MAIN APP ═══ */
export default function App() {
  const [ready, setReady] = useState(false);
  const [nav, setNav] = useState("workspace");
  const [sIdx, setSIdx] = useState(0);
  const [feed, setFeed] = useState(buildFeed);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const feedEnd = useRef(null);

  useEffect(() => { setTimeout(() => setReady(true), 120); }, []);
  useEffect(() => { const iv = setInterval(() => setSIdx(i => (i + 1) % STATUS_MSGS.length), 5000); return () => clearInterval(iv); }, []);
  useEffect(() => { feedEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [feed, typing]);

  const sendMsg = () => {
    if (!input.trim()) return;
    const txt = input.trim(); setInput("");
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setFeed(f => [...f, { id: "u" + Date.now(), type: "user", time: now, content: txt }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const l = txt.toLowerCase();
      let r;
      if (l.includes("post") || l.includes("create") || l.includes("draft")) {
        r = { id: "j" + Date.now(), type: "jane-card", time: now, content: <div><p style={{ margin: "0 0 8px", fontSize: 13, color: "#444" }}>Done! Here's a draft:</p><ApprovalCard post={{ platform: "Instagram", pillar: "Custom", time: "When approved", gradient: "linear-gradient(135deg,#880E4F,#C2185B)", caption: txt + "\n\nCrafted in your brand voice. Ready for review.", hashtags: ["#BloomCoffee", "#MadeInNigeria"] }} /></div> };
      } else if (l.includes("performance") || l.includes("how are we")) {
        r = { id: "j" + Date.now(), type: "jane-card", time: now, content: <InsightCard title="This Week" value="18.3K" change="+22% reach" detail="Instagram drives 68% of reach. Ethiopian Blend carousel was top performer." /> };
      } else if (l.includes("trend")) {
        r = { id: "j" + Date.now(), type: "jane-card", time: now, content: <div><p style={{ margin: "0 0 8px", fontSize: 13, color: "#444" }}>Trending now:</p><TrendCard tag="#AfricanCoffeeRevolution" volume="8.7K" growth="+156%" /></div> };
      } else if (l.includes("schedule") || l.includes("queue") || l.includes("what's pending")) {
        r = { id: "j" + Date.now(), type: "jane", time: now, content: <div><p style={{ margin: 0 }}>You have <strong>3 posts in your queue</strong> waiting for approval, <strong>4 drafts</strong> in progress, and <strong>4 posts scheduled</strong> this week. Want me to walk you through them, or you can check the Posting Schedule page for the full view.</p></div> };
      } else {
        r = { id: "j" + Date.now(), type: "jane", time: now, content: <p style={{ margin: 0 }}>Got it! Working on that now. Any specific angle or tone you'd like?</p> };
      }
      setFeed(f => [...f, r]);
    }, 1500);
  };

  const goWorkspace = () => setNav("workspace");

  const PAGES = {
    messages: <MessagesPage onJane={goWorkspace} />,
    schedule: <SchedulePage onJane={goWorkspace} />,
    performance: <PerformancePage onJane={goWorkspace} />,
    intel: <IntelPage onJane={goWorkspace} />,
    playbook: <PlaybookPage onJane={goWorkspace} />,
    hr: <HRPage onJane={goWorkspace} />,
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800;900&display=swap');:root{--f:'Urbanist',sans-serif}*{box-sizing:border-box;margin:0;padding:0}body{font-family:var(--f)}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#ddd;border-radius:99px}input:focus,textarea:focus,select:focus{outline:none}@keyframes typeBounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}@keyframes statusFade{0%{opacity:0;transform:translateY(3px)}12%{opacity:1;transform:translateY(0)}88%{opacity:1}100%{opacity:0;transform:translateY(-3px)}}`}</style>
      <div style={{ display: "flex", height: "100vh", fontFamily: "var(--f)", background: "#f5f4f0", opacity: ready ? 1 : 0, transition: "opacity .3s" }}>
        {/* SIDEBAR */}
        <div style={{ width: 224, background: "#1a0a12", display: "flex", flexDirection: "column", padding: "18px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 18px", marginBottom: 26 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#C2185B,#E91E63)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontWeight: 900, fontSize: 13 }}>U</span></div>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>URI <span style={{ fontWeight: 400, color: "rgba(255,255,255,.4)" }}>Social</span></span>
          </div>
          <div style={{ margin: "0 12px 18px", padding: "12px 14px", borderRadius: 11, background: "rgba(194,24,91,.08)", border: "1px solid rgba(194,24,91,.12)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 5 }}><JaneAvatar size={28} pulse /><div><div style={{ fontSize: 12.5, fontWeight: 700, color: "#f3d0df" }}>Jane</div><div style={{ fontSize: 10, color: "rgba(255,255,255,.3)" }}>AI Social Manager</div></div></div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.2)", paddingLeft: 37 }}>Hired Mar 1 · 19 days</div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => setNav(n.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 18px", background: nav === n.id ? "rgba(194,24,91,.1)" : "transparent", border: "none", borderLeft: nav === n.id ? "2.5px solid #E91E63" : "2.5px solid transparent", fontFamily: "var(--f)", fontSize: 12.5, color: nav === n.id ? "#fce4ec" : "rgba(255,255,255,.35)", fontWeight: nav === n.id ? 600 : 400, cursor: "pointer", textAlign: "left", transition: "all .12s" }}>
                <I n={n.icon} s={15} c={nav === n.id ? "#E91E63" : "rgba(255,255,255,.22)"} /><span style={{ flex: 1 }}>{n.label}</span>
                {n.count && <span style={{ background: "#E91E63", color: "#fff", fontSize: 9.5, fontWeight: 700, padding: "1px 5px", borderRadius: 4 }}>{n.count}</span>}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "14px 18px 0", marginTop: 14, borderTop: "1px solid rgba(255,255,255,.05)" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#880E4F,#C2185B)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontWeight: 700, fontSize: 11 }}>B</span></div>
            <div><div style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600 }}>Bloom Coffee</div><div style={{ fontSize: 10, color: "rgba(255,255,255,.2)" }}>Free Plan</div></div>
          </div>
        </div>

        {/* MAIN */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "9px 24px", background: "#fff", borderBottom: "1px solid #edecea", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4caf50", boxShadow: "0 0 7px rgba(76,175,80,.4)" }} />
              <span style={{ fontSize: 12.5, color: "#666" }}><strong style={{ color: "#C2185B" }}>Jane</strong> is active: <span key={sIdx} style={{ animation: "statusFade 5s linear", display: "inline-block" }}>{STATUS_MSGS[sIdx]}</span></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ position: "relative", cursor: "pointer" }}><div style={{ width: 32, height: 32, borderRadius: 7, border: "1px solid #e5e3df", display: "flex", alignItems: "center", justifyContent: "center" }}><I n="bell" s={14} c="#666" /></div><div style={{ position: "absolute", top: 5, right: 5, width: 5, height: 5, borderRadius: "50%", background: "#C2185B", border: "2px solid #fff" }} /></div>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1a0a12", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><span style={{ color: "#E91E63", fontWeight: 700, fontSize: 10.5 }}>CO</span></div>
            </div>
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            {nav === "workspace" ? (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px 8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}><div style={{ flex: 1, height: 1, background: "#edecea" }} /><span style={{ fontSize: 11, fontWeight: 600, color: "#ccc", letterSpacing: .5, textTransform: "uppercase" }}>Today — March 20, 2026</span><div style={{ flex: 1, height: 1, background: "#edecea" }} /></div>
                  {feed.map(msg => (
                    <div key={msg.id} style={{ marginBottom: 20 }}>
                      {msg.type === "user" ? (
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                          <div style={{ maxWidth: 500 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 5, marginBottom: 4 }}><span style={{ fontSize: 10.5, color: "#bbb" }}>{msg.time}</span><span style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>You</span></div>
                            <div style={{ padding: "11px 16px", borderRadius: "14px 3px 14px 14px", background: "#1a0a12", color: "#f3d0df", fontSize: 13, lineHeight: 1.6 }}>{msg.content}</div>
                          </div>
                          <UserAvatar size={30} />
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <JaneAvatar size={30} />
                          <div style={{ maxWidth: 500, flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#C2185B" }}>Jane</span>
                              <span style={{ fontSize: 10, color: "#C2185B", background: "rgba(194,24,91,.07)", padding: "1px 6px", borderRadius: 3, fontWeight: 600 }}>AI</span>
                              <span style={{ fontSize: 10.5, color: "#bbb" }}>{msg.time}</span>
                            </div>
                            <div style={{ padding: "11px 16px", borderRadius: "3px 14px 14px 14px", background: "#fff", border: "1px solid #edecea", fontSize: 13, lineHeight: 1.6, color: "#333" }}>{msg.content}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {typing && <div style={{ display: "flex", gap: 10, marginBottom: 20 }}><JaneAvatar size={30} /><div style={{ padding: "12px 18px", borderRadius: "3px 14px 14px 14px", background: "#fff", border: "1px solid #edecea" }}><div style={{ display: "flex", gap: 4 }}>{[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#C2185B", opacity: .4, animation: `typeBounce 1.2s ${i * .15}s infinite` }} />)}</div></div></div>}
                  <div ref={feedEnd} />
                </div>
                <div style={{ padding: "10px 24px 16px", background: "linear-gradient(0deg,#f5f4f0 80%,transparent)" }}>
                  <div style={{ display: "flex", gap: 7, alignItems: "flex-end", background: "#fff", borderRadius: 13, border: "1.5px solid #e5e3df", padding: "5px 5px 5px 16px", boxShadow: "0 3px 16px rgba(0,0,0,.05)" }}>
                    <button style={{ background: "none", border: "none", cursor: "pointer", padding: "7px 3px" }}><I n="paperclip" s={17} c="#bbb" /></button>
                    <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") sendMsg(); }} placeholder="Give Jane a directive..." style={{ flex: 1, border: "none", outline: "none", fontSize: 13.5, fontFamily: "var(--f)", padding: "9px 0", background: "transparent", color: "#222" }} />
                    <button style={{ width: 34, height: 34, borderRadius: 8, background: "none", border: "1.5px solid #e5e3df", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><I n="mic" s={15} c="#999" /></button>
                    <button onClick={sendMsg} style={{ width: 38, height: 38, borderRadius: 9, border: "none", background: input.trim() ? "#C2185B" : "#eee", cursor: input.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .2s" }}><I n="send" s={15} c={input.trim() ? "#fff" : "#ccc"} /></button>
                  </div>
                  <div style={{ textAlign: "center", marginTop: 5 }}><span style={{ fontSize: 10, color: "#ccc" }}>Jane can make mistakes. Always review before publishing.</span></div>
                </div>
              </div>
            ) : PAGES[nav]}
          </div>
        </div>
      </div>
    </>
  );
}
