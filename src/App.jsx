import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const statusColors = {
  "Aktywny":    "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  "Prospekt":   "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  "Nieaktywny": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  "Utracony":   "bg-red-500/20 text-red-400 border border-red-500/30",
};

const potentialColors = {
  "VIP": "text-purple-400", "Wysoki": "text-emerald-400",
  "Średni": "text-yellow-400", "Niski": "text-slate-400",
};

const priorityConfig = {
  "Wysoki": { color: "text-red-400", bg: "bg-red-500/20 border border-red-500/30", dot: "bg-red-500" },
  "Średni": { color: "text-yellow-400", bg: "bg-yellow-500/20 border border-yellow-500/30", dot: "bg-yellow-500" },
  "Niski":  { color: "text-emerald-400", bg: "bg-emerald-500/20 border border-emerald-500/30", dot: "bg-emerald-500" },
};

const typeIcons = {
  "Telefon": "📞", "Email": "📧", "Wizyta": "🚗", "Spotkanie": "🤝", "WhatsApp": "💬",
};

const stages = ["Nowa", "Kontakt", "Oferta", "Negocjacje", "Wygrana", "Utracona"];

const stageConfig = {
  "Nowa":       { color: "text-blue-400",    bg: "bg-blue-500/20",    border: "border-blue-500/30",    dot: "bg-blue-500" },
  "Kontakt":    { color: "text-purple-400",  bg: "bg-purple-500/20",  border: "border-purple-500/30",  dot: "bg-purple-500" },
  "Oferta":     { color: "text-yellow-400",  bg: "bg-yellow-500/20",  border: "border-yellow-500/30",  dot: "bg-yellow-500" },
  "Negocjacje": { color: "text-orange-400",  bg: "bg-orange-500/20",  border: "border-orange-500/30",  dot: "bg-orange-500" },
  "Wygrana":    { color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30", dot: "bg-emerald-500" },
  "Utracona":   { color: "text-red-400",     bg: "bg-red-500/20",     border: "border-red-500/30",     dot: "bg-red-500" },
};

const navItems = [
  { id: "dashboard", icon: "⊞", label: "Dashboard" },
  { id: "clients", icon: "◎", label: "Klienci" },
  { id: "reminders", icon: "◷", label: "Przypomnienia" },
  { id: "opportunities", icon: "◈", label: "Szanse" },
  { id: "offers", icon: "◱", label: "Oferty" },
  { id: "lost", icon: "⊗", label: "Utraceni" },
];

function Field({ label, name, value, onChange, type = "text", options, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-slate-400 text-xs uppercase tracking-wider font-medium">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {options ? (
        <select name={name} value={value} onChange={onChange}
          className="bg-[#0B0F1A] border border-[#1E2D45] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500 transition-colors">
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === "textarea" ? (
        <textarea name={name} value={value} onChange={onChange} rows={3}
          className="bg-[#0B0F1A] border border-[#1E2D45] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500 transition-colors resize-none placeholder-slate-600"
          placeholder={`Wpisz ${label.toLowerCase()}...`} />
      ) : (
        <input name={name} value={value} onChange={onChange} type={type}
          className="bg-[#0B0F1A] border border-[#1E2D45] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500 transition-colors placeholder-slate-600"
          placeholder={type === "date" || type === "time" ? "" : `Wpisz ${label.toLowerCase()}...`} />
      )}
    </div>
  );
}

function ClientModal({ onClose, onSave, initialData = null }) {
  const isEdit = !!initialData;
  const [form, setForm] = useState(initialData || {
    name: "", person: "", phone: "", email: "",
    city: "", status: "Prospekt", potential: "Średni",
    revenue: "0 zł", margin: "0%", notes: "",
  });
  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = async () => {
    if (!form.name || !form.person || !form.phone) {
      alert("Wypełnij wymagane pola: Firma, Osoba kontaktowa, Telefon");
      return;
    }
    if (isEdit) {
      const { data, error } = await supabase.from("clients").update({
        name: form.name, person: form.person, phone: form.phone,
        email: form.email, city: form.city, status: form.status,
        potential: form.potential, revenue: form.revenue,
        margin: form.margin, notes: form.notes,
      }).eq("id", initialData.id).select();
      if (error) { alert("Błąd zapisu: " + error.message); return; }
      if (data) onSave({...data[0], lastContact: data[0].last_contact});
    } else {
      const { data, error } = await supabase.from("clients").insert([{
        name: form.name, person: form.person, phone: form.phone,
        email: form.email, city: form.city, status: form.status,
        potential: form.potential, revenue: form.revenue,
        margin: form.margin, notes: form.notes,
        last_contact: "Właśnie dodany",
      }]).select();
      if (error) { alert("Błąd zapisu: " + error.message); return; }
      if (data) onSave({...data[0], lastContact: data[0].last_contact});
    }
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#141929] border border-[#1E2D45] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#1E2D45]">
          <div>
            <div className="text-white font-bold text-lg">{isEdit ? "✏️ Edytuj klienta" : "➕ Nowy klient"}</div>
            <div className="text-slate-400 text-xs mt-0.5">{isEdit ? "Zmień dane klienta" : "Wypełnij dane kontaktowe"}</div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5">✕</button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <Field label="Nazwa firmy" name="name" value={form.name} onChange={handleChange} required />
          <Field label="Osoba kontaktowa" name="person" value={form.person} onChange={handleChange} required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefon" name="phone" value={form.phone} onChange={handleChange} required />
            <Field label="Email" name="email" value={form.email} onChange={handleChange} type="email" />
          </div>
          <Field label="Miasto" name="city" value={form.city} onChange={handleChange} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status" name="status" value={form.status} onChange={handleChange} options={["Aktywny","Prospekt","Nieaktywny","Utracony"]} />
            <Field label="Potencjał" name="potential" value={form.potential} onChange={handleChange} options={["VIP","Wysoki","Średni","Niski"]} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Obrót (zł)" name="revenue" value={form.revenue} onChange={handleChange} />
            <Field label="Marża (%)" name="margin" value={form.margin} onChange={handleChange} />
          </div>
          <Field label="Notatki" name="notes" value={form.notes} onChange={handleChange} type="textarea" />
        </div>
        <div className="p-5 border-t border-[#1E2D45] flex gap-3">
          <button onClick={onClose} className="flex-1 bg-[#0B0F1A] border border-[#1E2D45] text-slate-400 font-semibold text-sm py-3 rounded-xl hover:text-white transition-colors">Anuluj</button>
          <button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-3 rounded-xl transition-colors">{isEdit ? "✓ Zapisz zmiany" : "✓ Zapisz klienta"}</button>
        </div>
      </div>
    </div>
  );
}function AddReminderModal({ onClose, onAdd, clients }) {
  const [form, setForm] = useState({
    clientName: clients[0]?.name || "",
    title: "", date: "2026-05-16", time: "10:00",
    priority: "Średni", type: "Telefon",
  });
  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = async () => {
    if (!form.title) { alert("Wpisz temat przypomnienia"); return; }
    const { data, error } = await supabase.from("reminders").insert([{
      client_name: form.clientName,
      title: form.title,
      date: form.date,
      time: form.time,
      priority: form.priority,
      type: form.type,
      done: false,
    }]).select();
    if (error) { alert("Błąd zapisu: " + error.message); return; }
    if (data) onAdd({...data[0], clientName: data[0].client_name});
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#141929] border border-[#1E2D45] rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-[#1E2D45]">
          <div>
            <div className="text-white font-bold text-lg">🔔 Nowe przypomnienie</div>
            <div className="text-slate-400 text-xs mt-0.5">Zaplanuj kontakt z klientem</div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5">✕</button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <Field label="Klient" name="clientName" value={form.clientName} onChange={handleChange} options={clients.map(c => c.name)} />
          <Field label="Temat" name="title" value={form.title} onChange={handleChange} required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data" name="date" value={form.date} onChange={handleChange} type="date" />
            <Field label="Godzina" name="time" value={form.time} onChange={handleChange} type="time" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priorytet" name="priority" value={form.priority} onChange={handleChange} options={["Wysoki","Średni","Niski"]} />
            <Field label="Typ kontaktu" name="type" value={form.type} onChange={handleChange} options={["Telefon","Email","Wizyta","Spotkanie","WhatsApp"]} />
          </div>
        </div>
        <div className="p-5 border-t border-[#1E2D45] flex gap-3">
          <button onClick={onClose} className="flex-1 bg-[#0B0F1A] border border-[#1E2D45] text-slate-400 font-semibold text-sm py-3 rounded-xl hover:text-white transition-colors">Anuluj</button>
          <button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-3 rounded-xl transition-colors">✓ Zapisz</button>
        </div>
      </div>
    </div>
  );
}

function AddOpportunityModal({ onClose, onAdd, clients }) {
  const [form, setForm] = useState({
    clientName: clients[0]?.name || "",
    title: "", value: "", stage: "Nowa",
    probability: 20, notes: "",
  });
  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = async () => {
    if (!form.title || !form.value) { alert("Wypełnij temat i wartość szansy"); return; }
    const { data, error } = await supabase.from("opportunities").insert([{
      client_name: form.clientName,
      title: form.title,
      value: Number(form.value),
      stage: form.stage,
      probability: Number(form.probability),
      notes: form.notes,
      date: new Date().toISOString().split("T")[0],
    }]).select();
    if (error) { alert("Błąd zapisu: " + error.message); return; }
    if (data) onAdd({...data[0], clientName: data[0].client_name});
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#141929] border border-[#1E2D45] rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-[#1E2D45]">
          <div>
            <div className="text-white font-bold text-lg">💡 Nowa szansa sprzedaży</div>
            <div className="text-slate-400 text-xs mt-0.5">Dodaj szansę do pipeline</div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5">✕</button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <Field label="Klient" name="clientName" value={form.clientName} onChange={handleChange} options={clients.map(c => c.name)} />
          <Field label="Tytuł szansy" name="title" value={form.title} onChange={handleChange} required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Wartość (zł)" name="value" value={form.value} onChange={handleChange} type="number" required />
            <Field label="Prawdopodobieństwo %" name="probability" value={form.probability} onChange={handleChange} type="number" />
          </div>
          <Field label="Etap" name="stage" value={form.stage} onChange={handleChange} options={stages} />
          <Field label="Notatki" name="notes" value={form.notes} onChange={handleChange} type="textarea" />
        </div>
        <div className="p-5 border-t border-[#1E2D45] flex gap-3">
          <button onClick={onClose} className="flex-1 bg-[#0B0F1A] border border-[#1E2D45] text-slate-400 font-semibold text-sm py-3 rounded-xl hover:text-white transition-colors">Anuluj</button>
          <button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-3 rounded-xl transition-colors">✓ Zapisz szansę</button>
        </div>
      </div>
    </div>
  );
}function Dashboard({ clients, reminders, opportunities }) {
  const pending = reminders.filter(r => !r.done);
  const totalPipeline = opportunities.filter(o => !["Wygrana","Utracona"].includes(o.stage)).reduce((s,o) => s + o.value, 0);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-slate-400 text-sm mb-1">{new Date().toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        <div className="text-white text-2xl font-bold">Dzień dobry 👋</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: "👥", label: "Klienci", value: clients.length, sub: "w bazie", color: "bg-blue-500" },
          { icon: "🔔", label: "Przypomnienia", value: pending.length, sub: "oczekujących", color: "bg-yellow-500" },
          { icon: "💡", label: "Pipeline", value: `${(totalPipeline/1000).toFixed(0)}k zł`, sub: "wartość szans", color: "bg-purple-500" },
          { icon: "🔴", label: "Pilne", value: pending.filter(r=>r.priority==="Wysoki").length, sub: "wysokie priorytety", color: "bg-red-500" },
        ].map((card) => (
          <div key={card.label} className="bg-[#141929] border border-[#1E2D45] rounded-2xl p-4 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${card.color}`} />
            <div className="text-slate-400 text-xs uppercase tracking-widest mb-3">{card.icon} {card.label}</div>
            <div className="text-white text-2xl font-bold mb-1">{card.value}</div>
            <div className="text-slate-500 text-xs">{card.sub}</div>
          </div>
        ))}
      </div>
      <div className="bg-[#141929] border border-[#1E2D45] rounded-2xl p-5">
          <div className="text-white font-bold text-sm mb-4">📈 Aktywność — ostatnie wpisy</div>
          <Bar
            data={{
              labels: ["Nowa", "Kontakt", "Oferta", "Negocjacje", "Wygrana", "Utracona"],
              datasets: [{
                label: "Szanse sprzedaży",
                data: [
                  opportunities.filter(o=>o.stage==="Nowa").length,
                  opportunities.filter(o=>o.stage==="Kontakt").length,
                  opportunities.filter(o=>o.stage==="Oferta").length,
                  opportunities.filter(o=>o.stage==="Negocjacje").length,
                  opportunities.filter(o=>o.stage==="Wygrana").length,
                  opportunities.filter(o=>o.stage==="Utracona").length,
                ],
                backgroundColor: ["#3B7EF6", "#F59E0B", "#10B981", "#8B5CF6"],
                borderRadius: 8,
              }]
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { color: "#64748B" }, grid: { color: "#1E2D45" } },
                y: { ticks: { color: "#64748B" }, grid: { color: "#1E2D45" }, beginAtZero: true },
              }
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#141929] border border-[#1E2D45] rounded-2xl p-5">
          <div className="text-white font-bold text-sm mb-4">🏆 Ranking klientów</div>
          {clients.slice(0,5).map((c,i) => (
            <div key={c.id} className="flex items-center gap-3 mb-3">
              <div className={`font-black text-base w-5 ${i===0?"text-yellow-400":"text-slate-500"}`}>{i+1}</div>
              <div className="flex-1">
                <div className="text-white text-sm">{c.name}</div>
                <div className="h-1.5 bg-[#0B0F1A] rounded mt-1.5">
                  <div className="h-full bg-blue-500 rounded" style={{width:`${100-i*18}%`}} />
                </div>
              </div>
              <div className="text-emerald-400 font-bold text-sm">{c.revenue}</div>
            </div>
          ))}
        </div>
        <div className="bg-[#141929] border border-[#1E2D45] rounded-2xl p-5">
          <div className="text-white font-bold text-sm mb-4">💡 Top szanse sprzedaży</div>
          {opportunities.filter(o=>!["Wygrana","Utracona"].includes(o.stage)).slice(0,4).map((o) => {
            const sc = stageConfig[o.stage];
            return (
              <div key={o.id} className="flex items-center gap-3 mb-3">
                <div className={`w-2 h-2 rounded-full ${sc.dot} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs font-medium truncate">{o.title}</div>
                  <div className="text-slate-500 text-xs">{o.clientName}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-emerald-400 font-bold text-xs">{o.value.toLocaleString()} zł</div>
                  <div className="text-slate-500 text-xs">{o.probability}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Clients({ clients, setClients, loadActivities, addActivity }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [showHistory, setShowHistory] = useState(null);
  const filtered = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.person.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.status === filter;
    return matchSearch && matchFilter;
  });
  return (
    <>
      {showAdd && <ClientModal onClose={() => setShowAdd(false)} onSave={(c) => setClients(p => [...p, c])} />}
      {editClient && <ClientModal onClose={() => setEditClient(null)} onSave={(c) => { setClients(p => p.map(x => x.id === c.id ? c : x)); setSelected(c); setEditClient(null); }} initialData={editClient} />}
      {showHistory && <ActivityModal client={showHistory} onClose={() => setShowHistory(null)} loadActivities={loadActivities} addActivity={addActivity} />}
      <div className="flex gap-4 h-full">
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex gap-3">
            <div className="flex-1 bg-[#141929] border border-[#1E2D45] rounded-xl flex items-center gap-3 px-4">
              <span className="text-slate-500">🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Szukaj klienta..."
                className="flex-1 bg-transparent outline-none text-white text-sm py-3 placeholder-slate-500" />
            </div>
            <button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl w-12 rounded-xl transition-colors">+</button>
          </div>
          <div className="flex gap-2">
            {[["all","Wszyscy"],["Aktywny","Aktywni"],["Prospekt","Prospekty"],["Nieaktywny","Nieaktywni"]].map(([val,label]) => (
              <button key={val} onClick={() => setFilter(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${filter===val ? "bg-blue-600 text-white" : "bg-[#141929] border border-[#1E2D45] text-slate-400"}`}>
                {label}
              </button>
            ))}
            <div className="ml-auto text-slate-500 text-xs flex items-center">{filtered.length} klientów</div>
          </div>
          <div className="flex flex-col gap-2 overflow-y-auto">
            {filtered.map(c => (
              <div key={c.id} onClick={() => setSelected(c)}
                className={`bg-[#141929] border rounded-xl p-4 cursor-pointer flex items-center gap-4 ${selected?.id===c.id ? "border-blue-500/60 bg-blue-500/10" : "border-[#1E2D45] hover:border-slate-600"}`}>
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold flex-shrink-0">{c.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-semibold text-sm truncate">{c.name}</span>
                    <span className={`text-xs font-semibold ${potentialColors[c.potential]}`}>{c.potential}</span>
                  </div>
                  <div className="text-slate-400 text-xs">{c.person} · {c.city}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-white font-bold text-sm">{c.revenue}</div>
                  <div className="text-emerald-400 text-xs">{c.margin} marży</div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${statusColors[c.status]}`}>{c.status}</span>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="text-4xl">🔍</div>
                <div className="text-white font-semibold">Brak klientów</div>
                <div className="text-slate-400 text-sm">Zmień filtry lub dodaj nowego klienta</div>
              </div>
            )}
          </div>
        </div>
        {selected && (
          <div className="w-80 bg-[#141929] border border-[#1E2D45] rounded-2xl flex flex-col overflow-hidden flex-shrink-0">
            <div className="bg-[#0B0F1A] p-4 border-b border-[#1E2D45]">
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3 items-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black text-lg">{selected.name.charAt(0)}</div>
                  <div>
                    <div className="text-white font-bold text-sm">{selected.name}</div>
                    <div className="text-slate-400 text-xs mt-0.5">{selected.person}</div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white text-lg">✕</button>
              </div>
              <div className="flex gap-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${statusColors[selected.status]}`}>{selected.status}</span>
                <span className={`text-xs font-semibold ${potentialColors[selected.potential]}`}>{selected.potential}</span>
              </div>
            </div>
            <div className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {[["Telefon",selected.phone,"text-blue-400"],["Miasto",selected.city,"text-white"],["Obrót",selected.revenue,"text-emerald-400"],["Marża",selected.margin,"text-emerald-400"]].map(([label,val,cls]) => (
                  <div key={label} className="bg-[#0B0F1A] rounded-xl p-3">
                    <div className="text-slate-500 text-xs mb-1 uppercase tracking-wider">{label}</div>
                    <div className={`font-semibold text-sm ${cls}`}>{val}</div>
                  </div>
                ))}
              </div>
              {selected.notes && (
                <div className="bg-[#0B0F1A] rounded-xl p-3">
                  <div className="text-slate-500 text-xs mb-2 uppercase tracking-wider">Notatki</div>
                  <div className="text-slate-300 text-xs leading-relaxed">{selected.notes}</div>
                </div>
              )}
              <div className="flex gap-2">
                <a href={`tel:${selected.phone}`} className="flex-1 bg-blue-600 text-white font-semibold text-sm py-2.5 rounded-xl text-center">📞 Zadzwoń</a>
                <button onClick={() => setShowAdd(true)} className="flex-1 bg-[#0B0F1A] border border-[#1E2D45] text-blue-400 font-semibold text-sm py-2.5 rounded-xl">🔔 + Przyp.</button>
              </div>
              <button onClick={() => setEditClient(selected)} className="w-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold text-sm py-2.5 rounded-xl hover:bg-blue-500/20 transition-colors">
                ✏️ Edytuj klienta
              </button>
              <button onClick={() => setShowHistory(selected)} className="w-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-semibold text-sm py-2.5 rounded-xl hover:bg-purple-500/20 transition-colors">
                📋 Historia aktywności
              </button>
              <button onClick={() => { setPage("offers"); setSelected(null); }} className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm py-2.5 rounded-xl hover:bg-emerald-500/20 transition-colors">
                📄 Generuj ofertę
              </button>
              <button onClick={async () => { 
                if(window.confirm("Czy na pewno chcesz usunąć tego klienta?")) { 
                  const { error } = await supabase.from("clients").delete().eq("id", selected.id);
                  
                  if (error) { alert("Błąd usuwania: " + error.message); return; }
                  setClients(p=>p.filter(c=>c.id!==selected.id)); 
                  setSelected(null); 
                }}}
                className="w-full bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-sm py-2.5 rounded-xl hover:bg-red-500/20 transition-colors">
                🗑️ Usuń klienta
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Reminders({ reminders, setReminders, clients }) {
  const [showAdd, setShowAdd] = useState(false);
  const [filterTab, setFilterTab] = useState("all");
  const today = new Date().toISOString().split("T")[0];
  const filtered = reminders.filter(r => {
    if (filterTab === "today") return r.date === today && !r.done;
    if (filterTab === "pending") return !r.done;
    if (filterTab === "done") return r.done;
    return true;
  });
  const toggleDone = async (id) => {
    const reminder = reminders.find(r => r.id === id);
    await supabase.from("reminders").update({ done: !reminder.done }).eq("id", id);
    setReminders(p => p.map(r => r.id === id ? {...r, done: !r.done} : r));
  };
  const deleteReminder = async (id) => {
    await supabase.from("reminders").delete().eq("id", id);
    setReminders(p => p.filter(r => r.id !== id));
  };
  return (
    <>
      {showAdd && <AddReminderModal onClose={() => setShowAdd(false)} onAdd={(r) => setReminders(p => [...p, r])} clients={clients} />}
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-bold text-lg">Przypomnienia</div>
            <div className="text-slate-400 text-xs mt-0.5">{reminders.filter(r=>!r.done).length} oczekujących</div>
          </div>
          <button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors">+ Nowe</button>
        </div>
        <div className="flex gap-2">
          {[["all","Wszystkie"],["today","Dziś"],["pending","Oczekujące"],["done","Wykonane"]].map(([val,label]) => (
            <button key={val} onClick={() => setFilterTab(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterTab===val ? "bg-blue-600 text-white" : "bg-[#141929] border border-[#1E2D45] text-slate-400"}`}>
              {label}
              {val==="today" && <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{reminders.filter(r=>r.date===today&&!r.done).length}</span>}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto flex-1">
          {filtered.map(r => {
            const pr = priorityConfig[r.priority];
            return (
              <div key={r.id} className={`bg-[#141929] border border-[#1E2D45] rounded-xl p-4 flex items-center gap-4 ${r.done?"opacity-50":""}`}>
                <div className={`w-1 h-12 rounded-full ${pr.dot} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm mb-1 ${r.done?"line-through text-slate-500":"text-white"}`}>{r.title}</div>
                  <div className="text-slate-400 text-xs">{r.clientName}</div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-slate-500 text-xs">📅 {r.date} {r.time}</span>
                    <span className="text-slate-500 text-xs">{typeIcons[r.type]} {r.type}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${pr.bg} ${pr.color}`}>{r.priority}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => toggleDone(r.id)}
                    className={`w-9 h-9 rounded-xl font-bold text-sm transition-colors ${r.done?"bg-slate-700 text-slate-400":"bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"}`}>
                    {r.done?"↩":"✓"}
                  </button>
                  <button onClick={() => deleteReminder(r.id)} className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}function Opportunities({ opportunities, setOpportunities, clients }) {
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const activeStages = ["Nowa", "Kontakt", "Oferta", "Negocjacje"];
  const totalPipeline = opportunities.filter(o => activeStages.includes(o.stage)).reduce((s,o) => s + o.value, 0);
  const totalWeighted = opportunities.filter(o => activeStages.includes(o.stage)).reduce((s,o) => s + o.value * o.probability / 100, 0);

  const changeStage = async (id, stage) => {
    await supabase.from("opportunities").update({ stage }).eq("id", id);
    setOpportunities(p => p.map(o => o.id === id ? {...o, stage} : o));
  };

  const deleteOpp = async (id) => {
    await supabase.from("opportunities").delete().eq("id", id);
    setOpportunities(p => p.filter(o => o.id !== id));
    setSelected(null);
  };

  return (
    <>
      {showAdd && <AddOpportunityModal onClose={() => setShowAdd(false)} onAdd={(o) => setOpportunities(p => [...p, o])} clients={clients} />}
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-bold text-lg">Szanse sprzedaży</div>
            <div className="text-slate-400 text-xs mt-0.5">{opportunities.filter(o=>activeStages.includes(o.stage)).length} aktywnych szans</div>
          </div>
          <button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors">+ Nowa szansa</button>
        </div>
        <div className="flex gap-3">
          {[
            { label: "Wartość pipeline", value: `${(totalPipeline/1000).toFixed(0)}k zł`, color: "text-blue-400" },
            { label: "Wartość ważona", value: `${(totalWeighted/1000).toFixed(0)}k zł`, color: "text-purple-400" },
            { label: "Wygrane", value: opportunities.filter(o=>o.stage==="Wygrana").length, color: "text-emerald-400" },
            { label: "Utracone", value: opportunities.filter(o=>o.stage==="Utracona").length, color: "text-red-400" },
          ].map(card => (
            <div key={card.label} className="bg-[#141929] border border-[#1E2D45] rounded-xl p-3 flex-1 text-center">
              <div className="text-slate-500 text-xs mb-1">{card.label}</div>
              <div className={`font-bold text-lg ${card.color}`}>{card.value}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 flex-1 overflow-x-auto pb-2">
          {activeStages.map(stage => {
            const sc = stageConfig[stage];
            const stageOpps = opportunities.filter(o => o.stage === stage);
            const stageTotal = stageOpps.reduce((s,o) => s + o.value, 0);
            return (
              <div key={stage} className="min-w-52 flex-1 flex flex-col gap-3">
                <div className="bg-[#141929] border border-[#1E2D45] rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${sc.dot}`} />
                    <span className={`font-bold text-sm ${sc.color}`}>{stage}</span>
                    <span className="ml-auto bg-[#0B0F1A] text-slate-400 text-xs px-2 py-0.5 rounded-lg">{stageOpps.length}</span>
                  </div>
                  <div className="text-slate-500 text-xs">{stageTotal.toLocaleString()} zł</div>
                </div>
                <div className="flex flex-col gap-2 overflow-y-auto flex-1">
                  {stageOpps.map(o => (
                    <div key={o.id} onClick={() => setSelected(selected?.id===o.id ? null : o)}
                      className={`bg-[#141929] border rounded-xl p-3 cursor-pointer transition-all ${selected?.id===o.id ? "border-blue-500/60 bg-blue-500/10" : "border-[#1E2D45] hover:border-slate-600"}`}>
                      <div className="text-white font-semibold text-xs mb-1 leading-tight">{o.title}</div>
                      <div className="text-slate-400 text-xs mb-2">{o.clientName}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-bold text-xs">{o.value.toLocaleString()} zł</span>
                        <span className="text-slate-500 text-xs">{o.probability}%</span>
                      </div>
                      <div className="h-1 bg-[#0B0F1A] rounded mt-2">
                        <div className={`h-full ${sc.dot} rounded`} style={{width:`${o.probability}%`}} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {selected && (
          <div className="bg-[#141929] border border-[#1E2D45] rounded-2xl p-4 flex gap-4 items-start">
            <div className="flex-1">
              <div className="text-white font-bold text-sm mb-1">{selected.title}</div>
              <div className="text-slate-400 text-xs mb-3">{selected.clientName} · Dodano: {selected.date}</div>
              {selected.notes && <div className="text-slate-300 text-xs leading-relaxed mb-3">{selected.notes}</div>}
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs text-slate-500">Zmień etap:</span>
                {stages.map(s => (
                  <button key={s} onClick={() => changeStage(selected.id, s)}
                    className={`text-xs px-2 py-1 rounded-lg font-semibold transition-colors ${selected.stage===s ? `${stageConfig[s].bg} ${stageConfig[s].color} border ${stageConfig[s].border}` : "bg-[#0B0F1A] text-slate-400 hover:text-white"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-emerald-400 font-bold text-lg">{selected.value.toLocaleString()} zł</div>
              <div className="text-slate-400 text-xs mb-3">{selected.probability}% prawdopodobieństwo</div>
              <button onClick={() => deleteOpp(selected.id)} className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-lg">🗑 Usuń</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function ActivityModal({ client, onClose, loadActivities, addActivity }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "Kontakt", title: "", description: "", value: "", date: new Date().toISOString().slice(0,16)
  });

  useEffect(() => {
    loadActivities(client.id).then(data => {
      setActivities(data);
      setLoading(false);
    });
  }, [client.id]);

  const typeConfig = {
    "Kontakt":  { icon: "📞", color: "text-blue-400",   bg: "bg-blue-500/20" },
    "Oferta":   { icon: "📋", color: "text-yellow-400", bg: "bg-yellow-500/20" },
    "Dostawa":  { icon: "🚛", color: "text-emerald-400",bg: "bg-emerald-500/20" },
    "Zapytanie":{ icon: "❓", color: "text-purple-400", bg: "bg-purple-500/20" },
  };

  const handleAdd = async () => {
    if (!form.title) { alert("Wpisz tytuł"); return; }
    const result = await addActivity(client.id, form);
    if (result) {
      setActivities(p => [result, ...p]);
      setForm({ type: "Kontakt", title: "", description: "", value: "", date: new Date().toISOString().slice(0,16) });
      setShowForm(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#141929] border border-[#1E2D45] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[#1E2D45]">
          <div>
            <div className="text-white font-bold text-lg">📋 Historia aktywności</div>
            <div className="text-slate-400 text-xs mt-0.5">{client.name}</div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        {showForm && (
          <div className="p-4 border-b border-[#1E2D45] flex flex-col gap-3 bg-[#0B0F1A]">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-slate-400 text-xs uppercase tracking-wider">Typ</label>
                <select value={form.type} onChange={e => setForm(f=>({...f, type: e.target.value}))}
                  className="bg-[#141929] border border-[#1E2D45] rounded-xl px-3 py-2 text-white text-sm outline-none">
                  {Object.keys(typeConfig).map(t => <option key={t} value={t}>{typeConfig[t].icon} {t}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-slate-400 text-xs uppercase tracking-wider">Data</label>
                <input type="datetime-local" value={form.date} onChange={e => setForm(f=>({...f, date: e.target.value}))}
                  className="bg-[#141929] border border-[#1E2D45] rounded-xl px-3 py-2 text-white text-sm outline-none" />
              </div>
            </div>
            <input placeholder="Tytuł (np. Wysłano ofertę na izolacje)" value={form.title} onChange={e => setForm(f=>({...f, title: e.target.value}))}
              className="bg-[#141929] border border-[#1E2D45] rounded-xl px-3 py-2 text-white text-sm outline-none placeholder-slate-600" />
            <textarea placeholder="Opis (opcjonalnie)" value={form.description} onChange={e => setForm(f=>({...f, description: e.target.value}))} rows={2}
              className="bg-[#141929] border border-[#1E2D45] rounded-xl px-3 py-2 text-white text-sm outline-none placeholder-slate-600 resize-none" />
            <input placeholder="Wartość (zł) — opcjonalnie" type="number" value={form.value} onChange={e => setForm(f=>({...f, value: e.target.value}))}
              className="bg-[#141929] border border-[#1E2D45] rounded-xl px-3 py-2 text-white text-sm outline-none placeholder-slate-600" />
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 bg-[#0B0F1A] border border-[#1E2D45] text-slate-400 text-sm py-2 rounded-xl">Anuluj</button>
              <button onClick={handleAdd} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm py-2 rounded-xl font-semibold">✓ Zapisz</button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="w-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm py-2.5 rounded-xl font-semibold hover:bg-blue-500/20 transition-colors">
              + Dodaj aktywność
            </button>
          )}
          {loading && <div className="text-slate-400 text-sm text-center py-8">Ładowanie...</div>}
          {!loading && activities.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📋</div>
              <div className="text-white font-semibold">Brak historii</div>
              <div className="text-slate-400 text-sm mt-1">Dodaj pierwszą aktywność</div>
            </div>
          )}
          {activities.map(a => {
            const tc = typeConfig[a.type] || typeConfig["Kontakt"];
            return (
              <div key={a.id} className="bg-[#0B0F1A] border border-[#1E2D45] rounded-xl p-3 flex gap-3">
                <div className={`w-10 h-10 rounded-xl ${tc.bg} flex items-center justify-center text-xl flex-shrink-0`}>{tc.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-white font-semibold text-sm">{a.title}</span>
                    {a.value > 0 && <span className="text-emerald-400 font-bold text-sm flex-shrink-0">{Number(a.value).toLocaleString()} zł</span>}
                  </div>
                  {a.description && <div className="text-slate-400 text-xs mb-1">{a.description}</div>}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${tc.color}`}>{tc.icon} {a.type}</span>
                    <span className="text-slate-600 text-xs">{new Date(a.date).toLocaleDateString('pl-PL', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GlobalSearch({ clients, reminders, opportunities, onClose, setPage }) {
  const [query, setQuery] = useState("");

  const results = query.length < 2 ? [] : [
    ...clients.filter(c => c.name?.toLowerCase().includes(query.toLowerCase()) || c.person?.toLowerCase().includes(query.toLowerCase())).map(c => ({ type: "Klient", icon: "◎", label: c.name, sub: c.person, color: "text-blue-400", action: () => { setPage("clients"); onClose(); }})),
    ...reminders.filter(r => r.title?.toLowerCase().includes(query.toLowerCase()) || r.clientName?.toLowerCase().includes(query.toLowerCase())).map(r => ({ type: "Przypomnienie", icon: "◷", label: r.title, sub: r.clientName, color: "text-yellow-400", action: () => { setPage("reminders"); onClose(); }})),
    ...opportunities.filter(o => o.title?.toLowerCase().includes(query.toLowerCase()) || o.clientName?.toLowerCase().includes(query.toLowerCase())).map(o => ({ type: "Szansa", icon: "◈", label: o.title, sub: o.clientName, color: "text-purple-400", action: () => { setPage("opportunities"); onClose(); }})),
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4">
      <div className="bg-[#141929] border border-[#1E2D45] rounded-2xl w-full max-w-lg">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1E2D45]">
          <span className="text-slate-400 text-lg">🔍</span>
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Szukaj klientów, przypomnień, szans..."
            className="flex-1 bg-transparent outline-none text-white text-sm placeholder-slate-500"
          />
          <button onClick={onClose} className="text-slate-500 hover:text-white text-lg">✕</button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {query.length < 2 && (
            <div className="p-6 text-center text-slate-500 text-sm">Wpisz minimum 2 znaki aby wyszukać</div>
          )}
          {query.length >= 2 && results.length === 0 && (
            <div className="p-6 text-center text-slate-500 text-sm">Brak wyników dla "{query}"</div>
          )}
          {results.map((r, i) => (
            <button key={i} onClick={r.action}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-[#1E2D45] last:border-0">
              <span className={`text-lg ${r.color}`}>{r.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">{r.label}</div>
                <div className="text-slate-500 text-xs">{r.sub}</div>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-lg bg-white/5 ${r.color}`}>{r.type}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function generateOfferNumber(clientId) {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);
  const clientNum = String(clientId).substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, "0");
  return `OF/${clientNum}/${day}${month}/${year}`;
}

function OfferPDF({ offer, client, onClose }) {
  const total_netto = offer.items.reduce((s, i) => s + (parseFloat(i.netto) || 0), 0);
  const total_brutto = offer.items.reduce((s, i) => s + (parseFloat(i.brutto) || 0), 0);
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 7);

  const css = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; color: #111; font-size: 13px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
    .brand { font-size: 28px; font-weight: 900; color: #1d4ed8; }
    .brand-sub { color: #6b7280; font-size: 12px; margin-top: 4px; }
    .offer-meta { text-align: right; color: #374151; }
    .offer-meta .num { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
    .offer-meta div { font-size: 12px; color: #6b7280; margin-top: 2px; }
    .client-box { background: #f9fafb; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
    .client-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin-bottom: 8px; }
    .client-name { font-size: 18px; font-weight: 700; color: #111; margin-bottom: 4px; }
    .client-detail { font-size: 12px; color: #4b5563; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background: #1d4ed8; color: white; }
    th { padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; }
    th.right { text-align: right; }
    th.center { text-align: center; }
    td { padding: 9px 12px; font-size: 12px; border-bottom: 1px solid #e5e7eb; color: #111; }
    td.right { text-align: right; }
    td.center { text-align: center; }
    tr.alt { background: #f9fafb; }
    tfoot td { font-weight: 700; padding: 12px; border-top: 2px solid #1d4ed8; border-bottom: none; }
    tfoot .total-brutto { color: #1d4ed8; font-size: 16px; font-weight: 900; text-align: right; }
    tfoot .total-netto { text-align: right; }
    tfoot .label { text-align: right; font-weight: 700; }
    .footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 24px; border-top: 1px solid #e5e7eb; margin-top: 32px; }
    .footer-note { font-size: 11px; color: #9ca3af; }
    .signature { text-align: center; }
    .signature-name-cursive { font-size: 18px; font-family: cursive; color: #1d4ed8; margin-bottom: 4px; }
    .signature-line { width: 180px; border-top: 1px solid #9ca3af; padding-top: 6px; font-size: 11px; color: #6b7280; margin: 0 auto; }
  `;

  const tableRows = offer.items.map((item, i) => `
    <tr class="${i % 2 === 1 ? "alt" : ""}">
      <td>${i + 1}</td>
      <td><strong>${item.product}</strong></td>
      <td class="center">${item.jm}</td>
      <td class="center">${item.qty}</td>
      <td class="right">${parseFloat(item.netto_jm || 0).toLocaleString("pl-PL", {minimumFractionDigits: 2})} zł</td>
      <td class="right">${parseFloat(item.netto || 0).toLocaleString("pl-PL", {minimumFractionDigits: 2})} zł</td>
      <td class="right"><strong>${parseFloat(item.brutto || 0).toLocaleString("pl-PL", {minimumFractionDigits: 2})} zł</strong></td>
    </tr>
  `).join("");

  const html = `
    <html><head><title>${offer.number}</title><style>${css}</style></head>
    <body>
      <div class="header">
        <div>
          <div class="brand">HurtBud</div>
          <div class="brand-sub">Hurtownia Materiałów Budowlanych</div>
        </div>
        <div class="offer-meta">
          <div class="num">${offer.number}</div>
          <div>Data: ${new Date().toLocaleDateString("pl-PL")}</div>
          <div>Ważna do: ${validUntil.toLocaleDateString("pl-PL")}</div>
          <div>Wystawił: ${offer.author}</div>
        </div>
      </div>
      <div class="client-box">
        <div class="client-label">Klient</div>
        <div class="client-name">${client?.name || ""}</div>
        <div class="client-detail">${client?.person || ""}</div>
        <div class="client-detail">${client?.city || ""}</div>
        <div class="client-detail">${client?.phone || ""}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Lp.</th>
            <th>Produkt</th>
            <th class="center">JM</th>
            <th class="center">Ilość</th>
            <th class="right">Cena netto/JM</th>
            <th class="right">Netto total</th>
            <th class="right">Brutto total</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="5" class="label">RAZEM:</td>
            <td class="total-netto">${total_netto.toLocaleString("pl-PL", {minimumFractionDigits: 2})} zł</td>
            <td class="total-brutto">${total_brutto.toLocaleString("pl-PL", {minimumFractionDigits: 2})} zł</td>
          </tr>
        </tfoot>
      </table>
      <div class="footer">
        <div class="footer-note">Oferta ważna 7 dni od daty wystawienia</div>
        <div class="signature">
          <div class="signature-name-cursive">${offer.author}</div>
          <div class="signature-line">${offer.author}</div>
        </div>
      </div>
    </body></html>
  `;

  const handlePrint = () => {
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
  };

  const handleDownloadPDF = () => {
    const win = window.open("", "_blank");
    win.document.write(html.replace("</style>", `
      @media print { @page { margin: 0; } body { padding: 20px; } }
      </style>
      <script>window.onload=function(){window.print();setTimeout(function(){window.close();},1000);}<\/script>
    `));
    win.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto text-black">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
          <div className="flex gap-3">
            <button onClick={handleDownloadPDF} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors">⬇️ Pobierz PDF</button>
            <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors">🖨️ Drukuj</button>
            <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-sm px-4 py-2 rounded-xl transition-colors">✕ Zamknij</button>
          </div>
          <div className="text-gray-500 text-xs">Pobierz PDF → wybierz "Zapisz jako PDF"</div>
        </div>
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="text-3xl font-black text-blue-700">HurtBud</div>
              <div className="text-gray-500 text-sm mt-1">Hurtownia Materiałów Budowlanych</div>
            </div>
            <div className="text-right">
              <div className="text-gray-800 font-bold text-lg">{offer.number}</div>
              <div className="text-gray-500 text-sm">Data: {new Date().toLocaleDateString("pl-PL")}</div>
              <div className="text-gray-500 text-sm">Ważna do: {validUntil.toLocaleDateString("pl-PL")}</div>
              <div className="text-gray-500 text-sm">Wystawił: {offer.author}</div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">Klient</div>
            <div className="text-gray-900 font-bold text-lg">{client?.name}</div>
            <div className="text-gray-600 text-sm">{client?.person}</div>
            <div className="text-gray-600 text-sm">{client?.city}</div>
            <div className="text-gray-600 text-sm">{client?.phone}</div>
          </div>
          <table className="w-full mb-6">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="py-3 px-3 text-left text-sm font-semibold">Lp.</th>
                <th className="py-3 px-3 text-left text-sm font-semibold">Produkt</th>
                <th className="py-3 px-3 text-center text-sm font-semibold">JM</th>
                <th className="py-3 px-3 text-center text-sm font-semibold">Ilość</th>
                <th className="py-3 px-3 text-right text-sm font-semibold">Cena netto/JM</th>
                <th className="py-3 px-3 text-right text-sm font-semibold">Netto total</th>
                <th className="py-3 px-3 text-right text-sm font-semibold">Brutto total</th>
              </tr>
            </thead>
            <tbody>
              {offer.items.map((item, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="py-2.5 px-3 text-sm text-gray-600">{i + 1}</td>
                  <td className="py-2.5 px-3 text-sm text-gray-900 font-medium">{item.product}</td>
                  <td className="py-2.5 px-3 text-sm text-gray-600 text-center">{item.jm}</td>
                  <td className="py-2.5 px-3 text-sm text-gray-600 text-center">{item.qty}</td>
                  <td className="py-2.5 px-3 text-sm text-gray-900 text-right">{parseFloat(item.netto_jm || 0).toLocaleString("pl-PL", {minimumFractionDigits: 2})} zł</td>
                  <td className="py-2.5 px-3 text-sm text-gray-900 text-right">{parseFloat(item.netto || 0).toLocaleString("pl-PL", {minimumFractionDigits: 2})} zł</td>
                  <td className="py-2.5 px-3 text-sm font-bold text-gray-900 text-right">{parseFloat(item.brutto || 0).toLocaleString("pl-PL", {minimumFractionDigits: 2})} zł</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-blue-700">
                <td colSpan={5} className="py-3 px-3 text-right font-bold text-gray-800">RAZEM:</td>
                <td className="py-3 px-3 text-right font-bold text-gray-900">{total_netto.toLocaleString("pl-PL", {minimumFractionDigits: 2})} zł</td>
                <td className="py-3 px-3 text-right font-black text-blue-700 text-lg">{total_brutto.toLocaleString("pl-PL", {minimumFractionDigits: 2})} zł</td>
              </tr>
            </tfoot>
          </table>
          <div className="flex justify-between items-end mt-8 pt-6 border-t border-gray-200">
            <div className="text-gray-400 text-xs">Oferta ważna 7 dni od daty wystawienia</div>
            <div className="text-center">
              <div className="text-blue-700 font-bold text-lg mb-1" style={{fontFamily:"cursive"}}>{offer.author}</div>
              <div className="w-48 border-t border-gray-400 pt-2 text-gray-500 text-xs mx-auto">{offer.author}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
  const handlePrint = () => {
    const printContents = document.getElementById("offer-print-wrapper").innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>${offer.number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #1d4ed8; color: white; padding: 10px 12px; text-align: left; font-size: 13px; }
            td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #e5e7eb; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-black { font-weight: 900; }
            .font-bold { font-weight: 700; }
            .text-blue-700 { color: #1d4ed8; }
            .text-3xl { font-size: 28px; }
            .text-lg { font-size: 18px; }
            .bg-gray-50 { background: #f9fafb; }
            .rounded-xl { border-radius: 12px; }
            .p-4 { padding: 16px; }
            .mb-8 { margin-bottom: 32px; }
            .mb-6 { margin-bottom: 24px; }
            .mb-2 { margin-bottom: 8px; }
            .mt-8 { margin-top: 32px; }
            .pt-6 { padding-top: 24px; }
            .border-t { border-top: 1px solid #e5e7eb; }
            .border-t-2 { border-top: 2px solid #1d4ed8; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .items-end { align-items: flex-end; }
            .items-start { align-items: flex-start; }
            .text-gray-500 { color: #6b7280; }
            .text-gray-400 { color: #9ca3af; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-800 { color: #1f2937; }
            .text-gray-900 { color: #111827; }
            .text-sm { font-size: 13px; }
            .text-xs { font-size: 11px; }
            .uppercase { text-transform: uppercase; }
            .tracking-wider { letter-spacing: 0.05em; }
            .w-48 { width: 192px; }
            .border-t { border-top: 1px solid #9ca3af; }
            .pt-2 { padding-top: 8px; }
            tfoot td { font-weight: bold; }
            @media print { body { padding: 16px; } }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const handleDownloadPDF = () => {
    const printContents = document.getElementById("offer-print-wrapper").innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>${offer.number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #1d4ed8; color: white; padding: 10px 12px; text-align: left; font-size: 13px; }
            td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #e5e7eb; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-black { font-weight: 900; }
            .font-bold { font-weight: 700; }
            .text-blue-700 { color: #1d4ed8; }
            .text-3xl { font-size: 28px; }
            .text-lg { font-size: 18px; }
            .bg-gray-50 { background: #f9fafb; }
            .rounded-xl { border-radius: 12px; }
            .p-4 { padding: 16px; }
            .mb-8 { margin-bottom: 32px; }
            .mb-6 { margin-bottom: 24px; }
            .mb-2 { margin-bottom: 8px; }
            .mt-8 { margin-top: 32px; }
            .pt-6 { padding-top: 24px; }
            .border-t { border-top: 1px solid #e5e7eb; }
            .border-t-2 { border-top: 2px solid #1d4ed8; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .items-end { align-items: flex-end; }
            .items-start { align-items: flex-start; }
            .text-gray-500 { color: #6b7280; }
            .text-gray-400 { color: #9ca3af; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-800 { color: #1f2937; }
            .text-gray-900 { color: #111827; }
            .text-sm { font-size: 13px; }
            .text-xs { font-size: 11px; }
            .uppercase { text-transform: uppercase; }
            .tracking-wider { letter-spacing: 0.05em; }
            .w-48 { width: 192px; }
            .pt-2 { padding-top: 8px; }
            tfoot td { font-weight: bold; }
          </style>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function(){ window.close(); }, 500);
            }
          </script>
        </head>
        <body>${printContents}</body>
      </html>
    `);
    win.document.close();
  };
  const total_netto = offer.items.reduce((s, i) => s + (parseFloat(i.netto) || 0), 0);
  const total_brutto = offer.items.reduce((s, i) => s + (parseFloat(i.brutto) || 0), 0);
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 7);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto text-black">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
          <div className="flex gap-3">
            <button onClick={handleDownloadPDF} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors">⬇️ Pobierz PDF</button>
            <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors">🖨️ Drukuj</button>
            <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-sm px-4 py-2 rounded-xl transition-colors">✕ Zamknij</button>
          </div>
          <div className="text-gray-500 text-xs">PDF → wybierz "Zapisz jako PDF"</div>
        </div>
        <div id="offer-print-wrapper" className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="text-3xl font-black text-blue-700">HurtBud</div>
              <div className="text-gray-500 text-sm mt-1">Hurtownia Materiałów Budowlanych</div>
            </div>
            <div className="text-right">
              <div className="text-gray-800 font-bold text-lg">{offer.number}</div>
              <div className="text-gray-500 text-sm">Data: {new Date().toLocaleDateString("pl-PL")}</div>
              <div className="text-gray-500 text-sm">Ważna do: {validUntil.toLocaleDateString("pl-PL")}</div>
              <div className="text-gray-500 text-sm">Wystawił: {offer.author}</div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">Klient</div>
            <div className="text-gray-900 font-bold text-lg">{client?.name}</div>
            <div className="text-gray-600 text-sm">{client?.person}</div>
            <div className="text-gray-600 text-sm">{client?.city}</div>
            <div className="text-gray-600 text-sm">{client?.phone}</div>
          </div>
          <table className="w-full mb-6">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="py-3 px-3 text-left text-sm font-semibold rounded-tl-lg">Lp.</th>
                <th className="py-3 px-3 text-left text-sm font-semibold">Produkt</th>
                <th className="py-3 px-3 text-center text-sm font-semibold">JM</th>
                <th className="py-3 px-3 text-center text-sm font-semibold">Ilość</th>
                <th className="py-3 px-3 text-right text-sm font-semibold">Netto</th>
                <th className="py-3 px-3 text-right text-sm font-semibold rounded-tr-lg">Brutto</th>
              </tr>
            </thead>
            <tbody>
              {offer.items.map((item, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="py-2.5 px-3 text-sm text-gray-600">{i + 1}</td>
                  <td className="py-2.5 px-3 text-sm text-gray-900 font-medium">{item.product}</td>
                  <td className="py-2.5 px-3 text-sm text-gray-600 text-center">{item.jm}</td>
                  <td className="py-2.5 px-3 text-sm text-gray-600 text-center">{item.qty}</td>
                  <td className="py-2.5 px-3 text-sm text-gray-900 text-right">{parseFloat(item.netto || 0).toLocaleString("pl-PL", {minimumFractionDigits: 2})} zł</td>
                  <td className="py-2.5 px-3 text-sm text-gray-900 font-semibold text-right">{parseFloat(item.brutto || 0).toLocaleString("pl-PL", {minimumFractionDigits: 2})} zł</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-blue-700">
                <td colSpan={4} className="py-3 px-3 text-right font-bold text-gray-800">RAZEM:</td>
                <td className="py-3 px-3 text-right font-bold text-gray-900">{total_netto.toLocaleString("pl-PL", {minimumFractionDigits: 2})} zł</td>
                <td className="py-3 px-3 text-right font-black text-blue-700 text-lg">{total_brutto.toLocaleString("pl-PL", {minimumFractionDigits: 2})} zł</td>
              </tr>
            </tfoot>
          </table>
          <div className="flex justify-between items-end mt-8 pt-6 border-t border-gray-200">
            <div className="text-gray-400 text-xs">Oferta ważna 7 dni od daty wystawienia</div>
            <div className="text-center">
              <div className="text-gray-800 font-bold text-base mb-1" style={{fontFamily: "cursive"}}>{offer.author}</div>
              <div className="w-48 border-t border-gray-400 pt-2 text-gray-500 text-xs">{offer.author}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Offers({ clients }) {
  const [offers, setOffers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedClient, setSelectedClient] = useState(clients[0] || null);
  const [previewOffer, setPreviewOffer] = useState(null);
  const [editOffer, setEditOffer] = useState(null);
  const [items, setItems] = useState([{ product: "", jm: "szt", qty: "", netto: "", brutto: "" }]);

  const jmOptions = ["szt", "m2", "m3", "opak", "mb", "kg", "t"];

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      const item = updated[index];
      const qty = parseFloat(item.qty) || 1;
      if (field === "netto_jm") {
        updated[index].netto_jm = value;
        const nettoTotal = (parseFloat(value) || 0) * qty;
        updated[index].netto = nettoTotal.toFixed(2);
        updated[index].brutto = (nettoTotal * 1.23).toFixed(2);
      }
      if (field === "qty") {
        const nettoJm = parseFloat(item.netto_jm) || 0;
        const nettoTotal = nettoJm * (parseFloat(value) || 1);
        updated[index].netto = nettoTotal.toFixed(2);
        updated[index].brutto = (nettoTotal * 1.23).toFixed(2);
      }
      if (field === "brutto_jm") {
        updated[index].brutto_jm = value;
        const bruttoTotal = (parseFloat(value) || 0) * qty;
        updated[index].brutto = bruttoTotal.toFixed(2);
        updated[index].netto = (bruttoTotal / 1.23).toFixed(2);
      }
      return updated;
    });
  };

  const addItem = () => setItems(prev => [...prev, { product: "", jm: "szt", qty: "", netto: "", brutto: "" }]);
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const total_netto = items.reduce((s, i) => s + (parseFloat(i.netto) || 0), 0);
  const total_brutto = items.reduce((s, i) => s + (parseFloat(i.brutto) || 0), 0);

  const handleSave = () => {
    if (!selectedClient) { alert("Wybierz klienta"); return; }
    if (items.every(i => !i.product)) { alert("Dodaj przynajmniej jedną pozycję"); return; }
    const offerData = {
      id: editOffer ? editOffer.id : Date.now(),
      number: editOffer ? editOffer.number : generateOfferNumber(selectedClient.id),
      client: selectedClient,
      items: items.filter(i => i.product),
      author: "Piotr Handlowiec",
      date: new Date().toISOString(),
    };
    if (editOffer) {
      setOffers(prev => prev.map(o => o.id === editOffer.id ? offerData : o));
    } else {
      setOffers(prev => [offerData, ...prev]);
    }
    setPreviewOffer(offerData);
    setShowCreate(false);
    setEditOffer(null);
    setItems([{ product: "", jm: "szt", qty: "", netto: "", brutto: "" }]);
  };

  const handleEdit = (offer) => {
    setSelectedClient(offer.client);
    setItems(offer.items);
    setEditOffer(offer);
    setShowCreate(true);
  };

  return (
    <>
      {previewOffer && <OfferPDF offer={previewOffer} client={previewOffer.client} onClose={() => setPreviewOffer(null)} />}
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-bold text-lg">📄 Oferty</div>
            <div className="text-slate-400 text-xs mt-0.5">{offers.length} wystawionych ofert</div>
          </div>
          <button onClick={() => { setShowCreate(true); setEditOffer(null); setItems([{ product: "", jm: "szt", qty: "", netto: "", brutto: "" }]); }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors">+ Nowa oferta</button>
        </div>

        {showCreate && (
          <div className="bg-[#141929] border border-[#1E2D45] rounded-2xl p-5 flex flex-col gap-4">
            <div className="text-white font-bold text-sm">{editOffer ? "✏️ Edytuj ofertę" : "➕ Nowa oferta"}</div>
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-xs uppercase tracking-wider">Klient</label>
              <select value={selectedClient?.id || ""} onChange={e => setSelectedClient(clients.find(c => c.id === e.target.value) || clients.find(c => String(c.id) === e.target.value))}
                className="bg-[#0B0F1A] border border-[#1E2D45] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500">
                {clients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.person}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-12 gap-2 text-slate-400 text-xs uppercase tracking-wider px-1">
                <div className="col-span-3">Produkt</div>
                <div className="col-span-1">JM</div>
                <div className="col-span-1">Ilość</div>
                <div className="col-span-2">Netto/JM</div>
                <div className="col-span-2">Netto total</div>
                <div className="col-span-2">Brutto total</div>
                <div className="col-span-1"></div>
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3">
                    <input value={item.product} onChange={e => handleItemChange(i, "product", e.target.value)}
                      placeholder="Nazwa produktu" className="w-full bg-[#0B0F1A] border border-[#1E2D45] rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500 placeholder-slate-600" />
                  </div>
                  <div className="col-span-1">
                    <select value={item.jm} onChange={e => handleItemChange(i, "jm", e.target.value)}
                      className="w-full bg-[#0B0F1A] border border-[#1E2D45] rounded-xl px-2 py-2 text-white text-sm outline-none focus:border-blue-500">
                      {jmOptions.map(j => <option key={j} value={j}>{j}</option>)}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <input value={item.qty} onChange={e => handleItemChange(i, "qty", e.target.value)}
                      type="number" placeholder="0" className="w-full bg-[#0B0F1A] border border-[#1E2D45] rounded-xl px-2 py-2 text-white text-sm outline-none focus:border-blue-500 placeholder-slate-600" />
                  </div>
                  <div className="col-span-2">
                    <input value={item.netto_jm || ""} onChange={e => handleItemChange(i, "netto_jm", e.target.value)}
                      type="number" placeholder="0.00" className="w-full bg-[#0B0F1A] border border-[#1E2D45] rounded-xl px-2 py-2 text-white text-sm outline-none focus:border-blue-500 placeholder-slate-600" />
                  </div>
                  <div className="col-span-2">
                    <div className="w-full bg-[#0B0F1A] border border-[#1E2D45] rounded-xl px-2 py-2 text-slate-300 text-sm">
                      {parseFloat(item.netto || 0).toFixed(2)} zł
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="w-full bg-[#0B0F1A] border border-emerald-500/20 rounded-xl px-2 py-2 text-emerald-400 text-sm font-semibold">
                      {parseFloat(item.brutto || 0).toFixed(2)} zł
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {items.length > 1 && (
                      <button onClick={() => removeItem(i)} className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">✕</button>
                    )}
                  </div>
                </div>
              ))}
              <button onClick={addItem} className="flex items-center gap-2 text-blue-400 text-sm font-semibold hover:text-blue-300 transition-colors py-1">
                <span className="w-7 h-7 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center font-bold">+</span>
                Dodaj pozycję
              </button>
            </div>
            <div className="bg-[#0B0F1A] rounded-xl p-4 flex justify-between items-center">
              <div className="text-slate-400 text-sm">Podsumowanie</div>
              <div className="text-right">
                <div className="text-slate-300 text-sm">Netto: <span className="text-white font-bold">{total_netto.toLocaleString("pl-PL", {minimumFractionDigits: 2})} zł</span></div>
                <div className="text-slate-300 text-sm">Brutto: <span className="text-emerald-400 font-black text-lg">{total_brutto.toLocaleString("pl-PL", {minimumFractionDigits: 2})} zł</span></div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowCreate(false); setEditOffer(null); }} className="flex-1 bg-[#0B0F1A] border border-[#1E2D45] text-slate-400 font-semibold text-sm py-3 rounded-xl">Anuluj</button>
              <button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-3 rounded-xl transition-colors">✓ Generuj ofertę</button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 overflow-y-auto flex-1">
          {offers.length === 0 && !showCreate && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="text-4xl">📄</div>
              <div className="text-white font-semibold">Brak ofert</div>
              <div className="text-slate-400 text-sm">Kliknij "+ Nowa oferta" aby zacząć</div>
            </div>
          )}
          {offers.map(offer => {
            const total = offer.items.reduce((s, i) => s + (parseFloat(i.brutto) || 0), 0);
            return (
              <div key={offer.id} className="bg-[#141929] border border-[#1E2D45] rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">📄</div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-sm">{offer.number}</div>
                  <div className="text-slate-400 text-xs">{offer.client?.name} · {new Date(offer.date).toLocaleDateString("pl-PL")}</div>
                  <div className="text-slate-500 text-xs">{offer.items.length} pozycji</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-emerald-400 font-black text-base">{total.toLocaleString("pl-PL", {minimumFractionDigits: 2})} zł</div>
                  <div className="text-slate-500 text-xs">brutto</div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setPreviewOffer(offer)} className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">👁</button>
                  <button onClick={() => handleEdit(offer)} className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">✏️</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function LostClients({ clients }) {
  const lost = clients.filter(c => c.status === "Utracony");
  return (
    <div className="flex flex-col gap-4">
      <div className="text-white font-bold text-lg">Utraceni klienci</div>
      {lost.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="text-4xl">🎉</div>
          <div className="text-white font-semibold">Brak utraconych klientów!</div>
          <div className="text-slate-400 text-sm">Świetna robota!</div>
        </div>
      ) : (
        lost.map(c => (
          <div key={c.id} className="bg-[#141929] border border-red-500/20 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 font-bold flex-shrink-0">{c.name.charAt(0)}</div>
            <div className="flex-1">
              <div className="text-white font-semibold text-sm">{c.name}</div>
              <div className="text-slate-400 text-xs">{c.person} · {c.city}</div>
            </div>
            <div className="text-red-400 font-bold text-sm">{c.revenue}</div>
            <button className="text-xs bg-blue-500/20 border border-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg">Odzyskaj</button>
          </div>
        ))
      )}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [clients, setClients] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [c, r, o] = await Promise.all([
      supabase.from("clients").select("*").order("created_at", { ascending: false }),
      supabase.from("reminders").select("*").order("created_at", { ascending: false }),
      supabase.from("opportunities").select("*").order("created_at", { ascending: false }),
    ]);
    if (c.data) setClients(c.data.map(x => ({...x, lastContact: x.last_contact})));
    if (r.data) setReminders(r.data.map(x => ({...x, clientName: x.client_name})));
    if (o.data) setOpportunities(o.data.map(x => ({...x, clientName: x.client_name})));
    setLoading(false);
  }

  async function loadActivities(clientId) {
    const { data } = await supabase.from("activities").select("*").eq("client_id", clientId).order("date", { ascending: false });
    return data || [];
  }

  async function addActivity(clientId, activity) {
    const { data, error } = await supabase.from("activities").insert([{
      client_id: clientId,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      value: activity.value || 0,
      date: activity.date || new Date().toISOString(),
    }]).select();
    if (error) { alert("Błąd zapisu: " + error.message); return null; }
    return data?.[0];
  }

  const pendingCount = reminders.filter(r => !r.done).length;

  const pages = {
    dashboard: <Dashboard clients={clients} reminders={reminders} opportunities={opportunities} />,
    clients: <Clients clients={clients} setClients={setClients} loadActivities={loadActivities} addActivity={addActivity} />,
    reminders: <Reminders reminders={reminders} setReminders={setReminders} clients={clients} />,
    opportunities: <Opportunities opportunities={opportunities} setOpportunities={setOpportunities} clients={clients} />,
    offers: <Offers clients={clients} />,
    lost: <LostClients clients={clients} />,
  };

  const pageLabels = {
    dashboard: "Dashboard", clients: "Klienci",
    reminders: "Przypomnienia", opportunities: "Szanse sprzedaży", lost: "Utraceni klienci",
  };

  if (menuOpen) return (
    <div className="fixed inset-0 z-50 flex">
      <div className="w-72 bg-[#141929] border-r border-[#1E2D45] flex flex-col py-6 h-full">
        <div className="px-5 pb-6 border-b border-[#1E2D45] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-lg">🏗️</div>
            <div>
              <div className="text-white font-black text-sm">BuildCRM</div>
              <div className="text-slate-500 text-xs">Handlowiec</div>
            </div>
          </div>
          <button onClick={() => setMenuOpen(false)} className="text-slate-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>
        <nav className="flex-1 px-3 pt-4">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setPage(item.id); setMenuOpen(false); }}
              className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl mb-1 text-sm font-medium transition-all ${page===item.id ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
              <span className="text-xl">{item.icon}</span>
              {item.label}
              {item.id==="reminders" && pendingCount>0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">{pendingCount}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="px-4 pt-4 border-t border-[#1E2D45]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 font-bold">P</div>
            <div>
              <div className="text-white text-sm font-semibold">Piotr Handlowiec</div>
              <div className="text-slate-500 text-xs">Region Południe</div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
    </div>
  );

  if (loading) return (
    <div className="flex h-screen bg-[#0B0F1A] items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🏗️</div>
        <div className="text-white font-bold text-lg">Ładowanie BuildCRM...</div>
        <div className="text-slate-400 text-sm mt-2">Łączenie z bazą danych</div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col-reverse md:flex-row h-screen bg-[#0B0F1A] font-sans overflow-hidden">
      {searchOpen && (
        <GlobalSearch
          clients={clients}
          reminders={reminders}
          opportunities={opportunities}
          onClose={() => setSearchOpen(false)}
          setPage={setPage}
        />
      )}
      <div className="hidden md:flex w-52 bg-[#141929] border-r border-[#1E2D45] flex-col py-6 flex-shrink-0">
        <div className="px-5 pb-6 border-b border-[#1E2D45]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-lg">🏗️</div>
            <div>
              <div className="text-white font-black text-sm">BuildCRM</div>
              <div className="text-slate-500 text-xs">Handlowiec</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 pt-4">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setPage(item.id)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all ${page===item.id ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
              <span>{item.icon}</span>
              {item.label}
              {item.id==="reminders" && pendingCount>0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">{pendingCount}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="px-4 pt-4 border-t border-[#1E2D45]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 font-bold text-sm">P</div>
            <div>
              <div className="text-white text-xs font-semibold">Piotr Handlowiec</div>
              <div className="text-slate-500 text-xs">Region Południe</div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-[#141929] border-b border-[#1E2D45] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(true)} className="md:hidden w-9 h-9 bg-[#1E2D45] rounded-xl flex items-center justify-center text-white text-lg">☰</button>
            <div className="text-white font-bold text-base">{pageLabels[page]}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSearchOpen(true)} className="bg-[#0B0F1A] border border-[#1E2D45] rounded-xl px-3 py-2 text-slate-400 text-sm flex items-center gap-2 hover:border-slate-600 transition-colors">
              <span>🔍</span>
              <span className="hidden md:block">Szukaj...</span>
            </button>
            <div className="relative">
              <button onClick={() => setNotifOpen(o => !o)} className="w-9 h-9 bg-yellow-500/20 border border-yellow-500/30 rounded-xl flex items-center justify-center relative cursor-pointer hover:bg-yellow-500/30 transition-colors">
                🔔
                {pendingCount>0 && <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-11 w-80 bg-[#141929] border border-[#1E2D45] rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E2D45]">
                    <div className="text-white font-bold text-sm">🔔 Przypomnienia</div>
                    <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{pendingCount}</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {reminders.filter(r => !r.done).length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-sm">Brak oczekujących przypomnień 🎉</div>
                    ) : (
                      reminders.filter(r => !r.done).slice(0, 8).map(r => {
                        const pr = priorityConfig[r.priority];
                        return (
                          <div key={r.id} onClick={() => { setPage("reminders"); setNotifOpen(false); }} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer border-b border-[#1E2D45] last:border-0 transition-colors">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${pr.dot}`} />
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-sm font-medium truncate">{r.title}</div>
                              <div className="text-slate-500 text-xs">{r.clientName} · {r.date} {r.time}</div>
                            </div>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${pr.bg} ${pr.color} flex-shrink-0`}>{r.priority}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="px-4 py-3 border-t border-[#1E2D45]">
                    <button onClick={() => { setPage("reminders"); setNotifOpen(false); }} className="w-full text-blue-400 text-sm font-semibold hover:text-blue-300 transition-colors">
                      Zobacz wszystkie →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 pb-20 md:pb-6">
          {pages[page]}
        </div>
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#141929] border-t border-[#1E2D45] flex z-50">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setPage(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 relative ${page===item.id ? "text-blue-400" : "text-slate-500"}`}>
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
              {item.id==="reminders" && pendingCount>0 && (
                <span className="absolute top-1 right-4 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}