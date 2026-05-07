import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────
// SUPABASE CONFIG
// ─────────────────────────────────────────────
const SUPABASE_URL = "https://zxirotjoryljabwxxzfg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4aXJvdGpvcnlsamFid3h4emZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMzE3NjcsImV4cCI6MjA5MzcwNzc2N30.Fu_Y0bfhlLp94qmLIzR-fKgHKz6jxt5leq2duLCwvGk";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const APP_NAME = "Sales Nav List Saver";
const APP_VERSION = "Beta v0.1";

const FILTER_TYPES = {
  COMPANY_HEADCOUNT:        { label: "Company headcount",    section: "Company"    },
  CURRENT_COMPANY:          { label: "Current company",      section: "Company"    },
  PAST_COMPANY:             { label: "Past company",         section: "Company"    },
  COMPANY_TYPE:             { label: "Company type",         section: "Company"    },
  COMPANY_HEADQUARTERS:     { label: "HQ location",          section: "Company"    },
  INDUSTRY:                 { label: "Industry",             section: "Company"    },
  CURRENT_TITLE:            { label: "Current job title",    section: "Role"       },
  PAST_TITLE:               { label: "Past job title",       section: "Role"       },
  FUNCTION:                 { label: "Function",             section: "Role"       },
  SENIORITY_LEVEL:          { label: "Seniority level",      section: "Role"       },
  YEARS_IN_CURRENT_ROLE:    { label: "Years in role",        section: "Role"       },
  YEARS_AT_COMPANY:         { label: "Years at company",     section: "Role"       },
  YEARS_OF_EXPERIENCE:      { label: "Years of experience",  section: "Role"       },
  REGION:                   { label: "Geography",            section: "Personal"   },
  GEO_REGION:               { label: "Geography",            section: "Personal"   },
  SCHOOL:                   { label: "School",               section: "Personal"   },
  PROFILE_LANGUAGE:         { label: "Profile language",     section: "Personal"   },
  FIRST_NAME:               { label: "First name",           section: "Personal"   },
  LAST_NAME:                { label: "Last name",            section: "Personal"   },
  NETWORK:                  { label: "Connection degree",    section: "Spotlights" },
  CONNECTION_OF:            { label: "Connection of",        section: "Spotlights" },
  FOLLOWING_YOUR_COMPANY:   { label: "Follows your company", section: "Spotlights" },
  POSTED_ON_LINKEDIN:       { label: "Posted on LinkedIn",   section: "Spotlights" },
  CHANGED_JOBS:             { label: "Changed jobs",         section: "Spotlights" },
  MENTIONED_IN_NEWS:        { label: "Mentioned in news",    section: "Spotlights" },
  SAVED_LEADS:              { label: "Lead list",            section: "Workflow"   },
  ACCOUNT_LISTS:            { label: "Account list",         section: "Workflow"   },
  TAGS:                     { label: "Tags",                 section: "Workflow"   },
  PERSONA:                  { label: "Persona",              section: "Workflow"   },
  ACCOUNT_HEADCOUNT:        { label: "Headcount",            section: "Company"   },
  ACCOUNT_HEADCOUNT_GROWTH: { label: "Headcount growth",     section: "Company"   },
  ANNUAL_REVENUE:           { label: "Annual revenue",       section: "Company"   },
  FORTUNE:                  { label: "Fortune ranking",      section: "Company"   },
  TECHNOLOGIES_USED:        { label: "Technologies used",    section: "Company"   },
  JOB_OPPORTUNITIES:        { label: "Hiring on LinkedIn",   section: "Company"   },
};

const SECTION_ORDER = ["Company", "Role", "Personal", "Spotlights", "Workflow", "Other"];

const SECTION_COLORS = {
  Company:    { bg: "#ebf3fb", border: "#c2d9f0", text: "#0a66c2", tag: "#d4e8f7" },
  Role:       { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", tag: "#dcfce7" },
  Personal:   { bg: "#fdf4ff", border: "#e9d5ff", text: "#7e22ce", tag: "#f3e8ff" },
  Spotlights: { bg: "#fffbeb", border: "#fde68a", text: "#b45309", tag: "#fef3c7" },
  Workflow:   { bg: "#fff1f2", border: "#fecdd3", text: "#be123c", tag: "#ffe4e6" },
  Other:      { bg: "#f9fafb", border: "#e5e7eb", text: "#374151", tag: "#f3f4f6" },
};

const TAG_COLORS = [
  { bg: "#dbeafe", text: "#1e40af", border: "#bfdbfe" },
  { bg: "#dcfce7", text: "#166534", border: "#bbf7d0" },
  { bg: "#fce7f3", text: "#9d174d", border: "#fbcfe8" },
  { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
  { bg: "#ede9fe", text: "#5b21b6", border: "#ddd6fe" },
  { bg: "#ffedd5", text: "#9a3412", border: "#fed7aa" },
];

// ─────────────────────────────────────────────
// PARSER
// ─────────────────────────────────────────────
function parseValues(valStr) {
  const values = [];
  let depth = 0, start = -1;
  for (let i = 0; i < valStr.length; i++) {
    if (valStr[i] === "(" && depth === 0) { start = i; depth++; }
    else if (valStr[i] === "(") depth++;
    else if (valStr[i] === ")") {
      depth--;
      if (depth === 0 && start !== -1) {
        const block = valStr.slice(start + 1, i);
        const fields = {};
        let cur = "", inQuote = false;
        for (let j = 0; j < block.length; j++) {
          if (block[j] === '"') inQuote = !inQuote;
          else if (block[j] === "," && !inQuote) {
            const idx = cur.indexOf(":");
            if (idx > 0) fields[cur.slice(0, idx).trim()] = cur.slice(idx + 1).trim().replace(/^"|"$/g, "");
            cur = "";
          } else cur += block[j];
        }
        if (cur) { const idx = cur.indexOf(":"); if (idx > 0) fields[cur.slice(0, idx).trim()] = cur.slice(idx + 1).trim().replace(/^"|"$/g, ""); }
        if (fields.selectionType) {
          const raw = fields.text || fields.id || "";
          const text = decodeURIComponent(raw.replace(/%20/g, " ").replace(/%2F/g, "/").replace(/%22/g, '"').replace(/\+/g, " "));
          values.push({ id: fields.id || null, text, selectionType: fields.selectionType });
        }
        start = -1;
      }
    }
  }
  return values;
}

function parseSNUrl(rawUrl) {
  try {
    const u = new URL(rawUrl.trim());
    let q = u.searchParams.get("query") || "";
    try { q = decodeURIComponent(q); } catch (e) {}
    try { q = decodeURIComponent(q); } catch (e) {}
    const fm = q.match(/filters:List\((.+)/s);
    if (!fm) return { filters: [], valid: true, empty: true, isAccount: u.pathname.includes("account"), rawUrl: rawUrl.trim() };
    const rest = fm[1];
    let depth = 1, end = 0;
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === "(") depth++;
      else if (rest[i] === ")") { depth--; if (depth === 0) { end = i; break; } }
    }
    const filtersStr = rest.slice(0, end);
    const filters = [];
    let d = 0, s = -1;
    for (let i = 0; i < filtersStr.length; i++) {
      if (filtersStr[i] === "(" && d === 0) { s = i; d++; }
      else if (filtersStr[i] === "(") d++;
      else if (filtersStr[i] === ")") {
        d--;
        if (d === 0 && s !== -1) {
          const block = filtersStr.slice(s + 1, i);
          const typeM = block.match(/^type:([^,]+)/);
          const vmStart = block.indexOf("values:List(");
          if (typeM && vmStart !== -1) {
            const valContent = block.slice(vmStart + "values:List(".length);
            let vd = 1, ve = 0;
            for (let j = 0; j < valContent.length; j++) {
              if (valContent[j] === "(") vd++;
              else if (valContent[j] === ")") { vd--; if (vd === 0) { ve = j; break; } }
            }
            const vals = parseValues(valContent.slice(0, ve));
            if (vals.length > 0) filters.push({ type: typeM[1].trim(), values: vals });
          }
          s = -1;
        }
      }
    }
    return { filters, valid: true, empty: false, isAccount: u.pathname.includes("account"), rawUrl: rawUrl.trim() };
  } catch (e) {
    return { filters: [], valid: false, rawUrl: rawUrl?.trim() || "" };
  }
}

// ─────────────────────────────────────────────
// FILTER VISUAL
// ─────────────────────────────────────────────
function FilterVisual({ filters, isAccount }) {
  const grouped = {};
  filters.forEach(f => {
    const sec = FILTER_TYPES[f.type]?.section || "Other";
    if (!grouped[sec]) grouped[sec] = [];
    grouped[sec].push(f);
  });
  const totalValues = filters.reduce((n, f) => n + f.values.length, 0);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <span style={{
          background: "#0a66c2", color: "#fff", fontSize: 10, fontWeight: 800,
          padding: "3px 10px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.05em",
        }}>{isAccount ? "Account Search" : "Lead Search"}</span>
        <span style={{ fontSize: 12, color: "#6b7280" }}>
          {filters.length} filter type{filters.length !== 1 ? "s" : ""} · {totalValues} value{totalValues !== 1 ? "s" : ""}
        </span>
      </div>
      {filters.length === 0 ? (
        <p style={{ color: "#9ca3af", fontSize: 13 }}>No filters found in this URL.</p>
      ) : SECTION_ORDER.map(sec => {
        if (!grouped[sec]) return null;
        const colors = SECTION_COLORS[sec];
        return (
          <div key={sec} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af", marginBottom: 6 }}>{sec}</div>
            {grouped[sec].map((f, fi) => (
              <div key={fi} style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 6, padding: "8px 12px", marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.text, marginBottom: 5 }}>{FILTER_TYPES[f.type]?.label || f.type}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {f.values.map((v, vi) => (
                    <span key={vi} style={{
                      background: v.selectionType === "EXCLUDED" ? "#fee2e2" : colors.tag,
                      border: `1px solid ${v.selectionType === "EXCLUDED" ? "#fca5a5" : colors.border}`,
                      color: v.selectionType === "EXCLUDED" ? "#991b1b" : colors.text,
                      borderRadius: 4, padding: "2px 8px", fontSize: 12, fontWeight: 600,
                      display: "inline-flex", alignItems: "center", gap: 3,
                    }}>
                      {v.selectionType === "EXCLUDED" && <span style={{ fontSize: 9, opacity: 0.7 }}>NOT </span>}
                      {v.text}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// SAVE MODAL
// ─────────────────────────────────────────────
function SaveModal({ parsed, onSave, onClose, saving }) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [savedBy, setSavedBy] = useState("");
  const nameRef = useRef(null);
  useEffect(() => { nameRef.current?.focus(); }, []);

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 12, padding: "28px", width: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: "#111", marginBottom: 4 }}>Save to Team Library</div>
        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 20 }}>
          {parsed.isAccount ? "Account" : "Lead"} Search · {parsed.filters.length} filters · syncs to whole team
        </div>

        <label style={labelStyle}>Your Name *</label>
        <input value={savedBy} onChange={e => setSavedBy(e.target.value)}
          placeholder="e.g. Ben, Maria…"
          style={{ ...inputStyle, marginBottom: 12 }} />

        <label style={labelStyle}>Search Name *</label>
        <input ref={nameRef} value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && name.trim() && savedBy.trim() && onSave({ name, notes, tags, savedBy })}
          placeholder="e.g. Coaches US Owner/Partner 51-500"
          style={{ ...inputStyle, marginBottom: 12 }} />

        <label style={labelStyle}>Notes (optional)</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="What is this search for? Any context for the team..."
          rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", marginBottom: 12 }} />

        <label style={labelStyle}>Tags (optional)</label>
        <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
          <input value={tagInput} onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
            placeholder="e.g. Q2, Outbound, US — press Enter"
            style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
          <button onClick={addTag} style={secondaryBtn}>Add</button>
        </div>
        {tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
            {tags.map((t, i) => {
              const c = TAG_COLORS[i % TAG_COLORS.length];
              return (
                <span key={t} style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 4, padding: "2px 8px", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
                  {t}
                  <button onClick={() => setTags(tags.filter(x => x !== t))} style={{ background: "none", border: "none", cursor: "pointer", color: c.text, fontSize: 13, padding: 0 }}>×</button>
                </span>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={secondaryBtn} disabled={saving}>Cancel</button>
          <button
            onClick={() => onSave({ name, notes, tags, savedBy })}
            disabled={!name.trim() || !savedBy.trim() || saving}
            style={{ ...primaryBtn, opacity: name.trim() && savedBy.trim() && !saving ? 1 : 0.5, cursor: name.trim() && savedBy.trim() && !saving ? "pointer" : "default" }}>
            {saving ? "Saving…" : "Save to Team Library"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// LIBRARY CARD
// ─────────────────────────────────────────────
function LibraryCard({ entry, isActive, onClick, onDelete, onCopy, copiedUrl }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const date = new Date(entry.saved_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div onClick={onClick}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = "#93c5fd"; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = "#e5e7eb"; }}
      style={{
        background: "#fff", border: `1.5px solid ${isActive ? "#0a66c2" : "#e5e7eb"}`,
        borderRadius: 8, padding: "12px 14px", marginBottom: 8, cursor: "pointer",
        transition: "border-color 0.15s", boxShadow: isActive ? "0 0 0 3px #dbeafe" : "0 1px 3px rgba(0,0,0,0.05)",
      }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#111", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.name}</div>
          <div style={{ fontSize: 11, color: "#6b7280", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{
              background: entry.is_account ? "#fff7ed" : "#eff6ff",
              color: entry.is_account ? "#c2410c" : "#1d4ed8",
              border: `1px solid ${entry.is_account ? "#fed7aa" : "#bfdbfe"}`,
              borderRadius: 3, padding: "1px 5px", fontSize: 10, fontWeight: 700,
            }}>{entry.is_account ? "Account" : "Lead"}</span>
            {entry.filter_count} filters · {entry.value_count} values
            {entry.saved_by && <span style={{ color: "#9ca3af" }}>· by {entry.saved_by}</span>}
          </div>
        </div>
        <div style={{ fontSize: 10, color: "#9ca3af", flexShrink: 0 }}>{date}</div>
      </div>

      {entry.notes && (
        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6, fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          "{entry.notes}"
        </div>
      )}

      {entry.tags?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 7 }}>
          {entry.tags.map((t, i) => {
            const c = TAG_COLORS[i % TAG_COLORS.length];
            return <span key={t} style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 3, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>{t}</span>;
          })}
        </div>
      )}

      <div style={{ display: "flex", gap: 5, marginTop: 10 }} onClick={e => e.stopPropagation()}>
        <button onClick={() => onCopy(entry.url)} style={{ ...tinyBtn, background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" }}>
          {copiedUrl === entry.url ? "✓ Copied" : "📋 Copy URL"}
        </button>
        <a href={entry.url} target="_blank" rel="noreferrer" style={{ ...tinyBtn, background: "#eff6ff", color: "#0a66c2", border: "1px solid #bfdbfe", textDecoration: "none" }}>↗ Open in SN</a>
        <div style={{ flex: 1 }} />
        {confirmDelete ? (
          <>
            <button onClick={() => setConfirmDelete(false)} style={{ ...tinyBtn, background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb" }}>Cancel</button>
            <button onClick={() => onDelete(entry.id)} style={{ ...tinyBtn, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>Confirm delete</button>
          </>
        ) : (
          <button onClick={() => setConfirmDelete(true)} style={{ ...tinyBtn, background: "#fff", color: "#9ca3af", border: "1px solid #e5e7eb" }}>🗑️</button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("visualizer");
  const [urlInput, setUrlInput] = useState("");
  const [parsed, setParsed] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeEntry, setActiveEntry] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [justSaved, setJustSaved] = useState(false);
  const [dbError, setDbError] = useState(null);

  // Load library from Supabase
  async function fetchLibrary() {
    setLoading(true);
    const { data, error } = await supabase
      .from("searches")
      .select("*")
      .order("saved_at", { ascending: false });
    if (error) { setDbError(error.message); }
    else { setLibrary(data || []); setDbError(null); }
    setLoading(false);
  }

  useEffect(() => {
    fetchLibrary();

    // Real-time subscription — any change syncs instantly
    const channel = supabase
      .channel("searches-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "searches" }, () => {
        fetchLibrary();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  function handleParse() {
    if (!urlInput.trim()) return;
    setParsed(parseSNUrl(urlInput.trim()));
    setJustSaved(false);
  }

  async function handleSave({ name, notes, tags, savedBy }) {
    if (!parsed?.valid || !name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("searches").insert({
      name: name.trim(),
      notes: notes.trim() || null,
      tags: tags.length > 0 ? tags : null,
      url: parsed.rawUrl,
      is_account: parsed.isAccount,
      filters: parsed.filters,
      filter_count: parsed.filters.length,
      value_count: parsed.filters.reduce((n, f) => n + f.values.length, 0),
      saved_by: savedBy.trim() || "Team",
    });
    setSaving(false);
    if (error) { alert("Error saving: " + error.message); return; }
    setShowSaveModal(false);
    setJustSaved(true);
  }

  async function handleDelete(id) {
    await supabase.from("searches").delete().eq("id", id);
    if (activeEntry?.id === id) setActiveEntry(null);
  }

  function handleCopy(url) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    });
  }

  // Filter library
  const allTags = [...new Set(library.flatMap(e => e.tags || []))];
  const filtered = library.filter(e => {
    const q = searchQ.toLowerCase();
    const matchQ = !q || e.name.toLowerCase().includes(q) ||
      (e.notes || "").toLowerCase().includes(q) ||
      (e.filters || []).some(f =>
        (FILTER_TYPES[f.type]?.label || f.type).toLowerCase().includes(q) ||
        (f.values || []).some(v => v.text.toLowerCase().includes(q))
      );
    const matchTag = !filterTag || (e.tags || []).includes(filterTag);
    return matchQ && matchTag;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f3f2ef", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>

      {/* TOP NAV */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #e0e0e0",
        padding: "0 24px", display: "flex", alignItems: "center",
        height: 56, boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 28 }}>
          <div style={{
            background: "linear-gradient(135deg, #0a66c2, #0d8fd4)",
            borderRadius: 6, width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(10,102,194,0.3)",
          }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 13 }}>SN</span>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#111", lineHeight: 1.1 }}>{APP_NAME}</div>
            <div style={{ fontSize: 10, color: "#0a66c2", fontWeight: 700, letterSpacing: "0.04em" }}>
              {APP_VERSION} · Team · {loading ? "syncing…" : `${library.length} saved`}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", height: "100%", alignItems: "stretch" }}>
          {[["visualizer", "🔍 Visualizer"], ["library", `📚 Library${library.length > 0 ? ` (${library.length})` : ""}`]].map(([v, label]) => (
            <button key={v} onClick={() => setView(v)} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: view === v ? 700 : 500,
              color: view === v ? "#0a66c2" : "#555",
              borderBottom: view === v ? "2.5px solid #0a66c2" : "2.5px solid transparent",
              padding: "0 16px", fontFamily: "inherit",
            }}>{label}</button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Live sync indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#6b7280" }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: dbError ? "#ef4444" : "#22c55e", boxShadow: dbError ? "none" : "0 0 0 2px #bbf7d0" }} />
          {dbError ? "Offline" : "Live sync"}
        </div>
      </div>

      {dbError && (
        <div style={{ background: "#fef2f2", borderBottom: "1px solid #fca5a5", padding: "8px 24px", fontSize: 12, color: "#b91c1c" }}>
          ⚠️ Database error: {dbError} — changes may not save
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>

        {/* ══ VISUALIZER ══ */}
        {view === "visualizer" && (
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            <div style={{ flex: "0 0 340px" }}>
              <div style={card}>
                <div style={sectionLabel}>Paste Sales Navigator URL</div>
                <textarea
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://www.linkedin.com/sales/search/people?query=..."
                  rows={4}
                  style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 6, padding: "9px 12px", fontSize: 11, outline: "none", resize: "vertical", fontFamily: "'JetBrains Mono', monospace", color: "#374151", background: "#f9fafb", boxSizing: "border-box", lineHeight: 1.5 }}
                />
                <button onClick={handleParse} style={{ ...primaryBtn, width: "100%", marginTop: 10, padding: "10px" }}>
                  Visualize Filters →
                </button>
              </div>

              <div style={{ ...card, background: "#eff6ff", border: "1px solid #bfdbfe", marginTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1d4ed8", marginBottom: 6 }}>💡 How to use</div>
                <ol style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: "#1e40af", lineHeight: 1.8 }}>
                  <li>Run your search in Sales Navigator</li>
                  <li>Copy the URL from your browser</li>
                  <li>Paste it above and click Visualize</li>
                  <li>Save it — syncs to the whole team instantly</li>
                </ol>
              </div>

              {library.length > 0 && (
                <div style={{ ...card, marginTop: 12 }}>
                  <div style={{ ...sectionLabel, marginBottom: 10 }}>Recent team saves</div>
                  {library.slice(0, 3).map(e => (
                    <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</div>
                        {e.saved_by && <div style={{ fontSize: 10, color: "#9ca3af" }}>by {e.saved_by}</div>}
                      </div>
                      <button onClick={() => handleCopy(e.url)} style={{ ...tinyBtn, background: "none", border: "none", color: "#0a66c2", fontSize: 11 }}>
                        {copiedUrl === e.url ? "✓" : "📋"}
                      </button>
                    </div>
                  ))}
                  {library.length > 3 && (
                    <button onClick={() => setView("library")} style={{ background: "none", border: "none", color: "#0a66c2", fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, marginTop: 6, padding: 0 }}>
                      View all {library.length} →
                    </button>
                  )}
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              {!parsed && (
                <div style={{ ...card, textAlign: "center", padding: "60px 20px", border: "2px dashed #e5e7eb", background: "#fafafa" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#374151", marginBottom: 6 }}>Paste a Sales Navigator URL to get started</div>
                  <div style={{ fontSize: 13, color: "#9ca3af" }}>Your filters will be visualized exactly like Sales Navigator's filter panel</div>
                </div>
              )}

              {parsed && !parsed.valid && (
                <div style={{ ...card, background: "#fef2f2", border: "1px solid #fca5a5" }}>
                  <div style={{ fontWeight: 700, color: "#b91c1c", marginBottom: 4 }}>⚠️ Invalid URL</div>
                  <div style={{ fontSize: 13, color: "#b91c1c" }}>Make sure you're pasting a full Sales Navigator search URL.</div>
                </div>
              )}

              {parsed?.valid && (
                <>
                  <div style={{ ...card, display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "12px 16px", flexWrap: "wrap" }}>
                    <button onClick={() => handleCopy(parsed.rawUrl)} style={secondaryBtn}>{copiedUrl === parsed.rawUrl ? "✓ Copied!" : "📋 Copy URL"}</button>
                    <a href={parsed.rawUrl} target="_blank" rel="noreferrer" style={{ ...secondaryBtn, textDecoration: "none" }}>↗ Open in Sales Nav</a>
                    <div style={{ flex: 1 }} />
                    {justSaved ? (
                      <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 700 }}>✓ Saved — team can see it now!</span>
                    ) : (
                      <button onClick={() => setShowSaveModal(true)} style={{ ...primaryBtn, display: "flex", alignItems: "center", gap: 6 }}>
                        💾 Save to Team Library
                      </button>
                    )}
                  </div>
                  <div style={card}>
                    <FilterVisual filters={parsed.filters} isAccount={parsed.isAccount} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ══ LIBRARY ══ */}
        {view === "library" && (
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            <div style={{ flex: "0 0 340px" }}>
              <div style={card}>
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  placeholder="🔍  Search by name, filter, value…"
                  style={{ ...inputStyle, marginBottom: allTags.length > 0 ? 10 : 0 }} />
                {allTags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    <button onClick={() => setFilterTag("")} style={{ ...tinyBtn, background: !filterTag ? "#0a66c2" : "#f3f4f6", color: !filterTag ? "#fff" : "#374151", border: `1px solid ${!filterTag ? "#0a66c2" : "#e5e7eb"}` }}>All</button>
                    {allTags.map(t => (
                      <button key={t} onClick={() => setFilterTag(filterTag === t ? "" : t)} style={{ ...tinyBtn, background: filterTag === t ? "#0a66c2" : "#f3f4f6", color: filterTag === t ? "#fff" : "#374151", border: `1px solid ${filterTag === t ? "#0a66c2" : "#e5e7eb"}` }}>{t}</button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ fontSize: 11, color: "#9ca3af", margin: "8px 0 10px", paddingLeft: 2 }}>
                {loading ? "Loading team library…" : `${filtered.length} of ${library.length} search${library.length !== 1 ? "es" : ""}`}
              </div>

              {!loading && library.length === 0 ? (
                <div style={{ ...card, textAlign: "center", padding: "40px 20px", border: "2px dashed #e5e7eb", background: "#fafafa" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#374151", marginBottom: 4 }}>Team library is empty</div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 14 }}>Visualize a URL and save it — the whole team will see it instantly</div>
                  <button onClick={() => setView("visualizer")} style={primaryBtn}>Go to Visualizer →</button>
                </div>
              ) : (
                <div style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto", paddingRight: 4 }}>
                  {filtered.map(e => (
                    <LibraryCard key={e.id} entry={e} isActive={activeEntry?.id === e.id}
                      onClick={() => setActiveEntry(e)} onDelete={handleDelete}
                      onCopy={handleCopy} copiedUrl={copiedUrl} />
                  ))}
                  {filtered.length === 0 && library.length > 0 && (
                    <div style={{ textAlign: "center", padding: "30px 0", color: "#9ca3af", fontSize: 13 }}>No results for "{searchQ}"</div>
                  )}
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              {!activeEntry ? (
                <div style={{ ...card, textAlign: "center", padding: "60px 20px", border: "2px dashed #e5e7eb", background: "#fafafa" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>👈</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#374151", marginBottom: 6 }}>Select a search to preview</div>
                  <div style={{ fontSize: 13, color: "#9ca3af" }}>Click any saved search on the left to see its filters</div>
                </div>
              ) : (
                <div style={card}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #f3f4f6" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: "#111", marginBottom: 4 }}>{activeEntry.name}</div>
                      {activeEntry.saved_by && <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>Saved by {activeEntry.saved_by} · {new Date(activeEntry.saved_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>}
                      {activeEntry.notes && <div style={{ fontSize: 12, color: "#6b7280", fontStyle: "italic", marginBottom: 8 }}>"{activeEntry.notes}"</div>}
                      {activeEntry.tags?.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {activeEntry.tags.map((t, i) => {
                            const c = TAG_COLORS[i % TAG_COLORS.length];
                            return <span key={t} style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 3, padding: "2px 7px", fontSize: 11, fontWeight: 700 }}>{t}</span>;
                          })}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 12 }}>
                      <button onClick={() => handleCopy(activeEntry.url)} style={secondaryBtn}>{copiedUrl === activeEntry.url ? "✓ Copied!" : "📋 Copy URL"}</button>
                      <a href={activeEntry.url} target="_blank" rel="noreferrer" style={{ ...primaryBtn, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>↗ Open in SN</a>
                    </div>
                  </div>
                  <FilterVisual filters={activeEntry.filters || []} isAccount={activeEntry.is_account} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showSaveModal && parsed?.valid && (
        <SaveModal parsed={parsed} onSave={handleSave} onClose={() => setShowSaveModal(false)} saving={saving} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SHARED STYLES
// ─────────────────────────────────────────────
const card = { background: "#fff", borderRadius: 8, border: "1px solid #e5e7eb", padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" };
const sectionLabel = { fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 };
const inputStyle = { width: "100%", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 12px", fontSize: 13, outline: "none", fontFamily: "inherit", color: "#374151", boxSizing: "border-box", background: "#fff" };
const primaryBtn = { background: "#0a66c2", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" };
const secondaryBtn = { background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
const tinyBtn = { borderRadius: 5, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
const labelStyle = { display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 };
