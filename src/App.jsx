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
  "Sredni": "text-yellow-400", "Niski": "text-slate-400",
};

const priorityConfig = {
  "Wysoki": { color: "text-red-400", bg: "bg-red-500/20 border border-red-500/30", dot: "bg-red-500" },
  "Sredni": { color: "text-yellow-400", bg: "bg-yellow-500/20 border border-yellow-500/30", dot: "bg-yellow-500" },
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
    city: "", status: "Prospekt", potential: "Sredni",
    revenue: "0 zl", margin: "0%", notes: "",
  });
  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = async () => {
    if (!form.name || !form.person || !form.phone) {
      alert("Wypelnij wymagane pola: Firma, Osoba kontaktowa, Telefon");
      return;
    }
    if (isEdit) {
      const { data, error } = await supabase.from("clients").update({
        name: form.name, person: form.person, phone: form.phone,
        email: form.email, city: form.city, status: form.status,
        potential: form.potential, revenue: form.revenue,
        margin: form.margin, notes: form.notes,
      }).eq("id", initialData.id).select();
      if (error) { alert("Blad zapisu: " + error.message); return; }
      if (data) onSave({...data[0], lastContact: data[0].last_contact});
    } else {
      const { data, error } = await supabase.from("clients").insert([{
        name: form.name, person: form.person, phone: form.phone,
        email: form.email, city: form.city, status: form.status,
        potential: form.potential, revenue: form.revenue,
        margin: form.margin, notes: form.notes,
        last_contact: "Wlasnie dodany",
      }]).select();
      if (error) { alert("Blad zapisu: " + error.message); return; }
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
            <div className="text-slate-400 text-xs mt-0.5">{isEdit ? "Zmien dane klienta" : "Wypelnij dane kontaktowe"}</div>
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
            <Field label="Potencjal" name="potential" value={form.potential} onChange={handleChange} options={["VIP","Wysoki","Sredni","Niski"]} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Obrot (zl)" name="revenue" value={form.revenue} onChange={handleChange} />
            <Field label="Marza (%)" name="margin" value={form.margin} onChange={handleChange} />
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
}

function AddReminderModal({ onClose, onAdd, clients }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    clientName: clients[0]?.name || "",
    title: "", date: today, time: "10:00",
    priority: "Sredni", type: "Telefon",
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
    if (error) { alert("Blad zapisu: " + error.message); return; }
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
            <Field label="Priorytet" name="priority" value={form.priority} onChange={handleChange} options={["Wysoki","Sredni","Niski"]} />
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
    if (!form.title || !form.value) { alert("Wypelnij temat i wartosc szansy"); return; }
    const { data, error } = await supabase.from("opportunities").insert([{
      client_name: form.clientName,
      title: form.title,
      value: Number(form.value),
      stage: form.stage,
      probability: Number(form.probability),
      notes: form.notes,
      date: new Date().toISOString().split("T")[0],
    }]).select();
    if (error) { alert("Blad zapisu: " + error.message); return; }
    if (data) onAdd({...data[0], clientName: data[0].client_name});
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#141929] border border-[#1E2D45] rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-[#1E2D45]">
          <div>
            <div className="text-white font-bold text-lg">💡 Nowa szansa sprzedazy</div>
            <div className="text-slate-400 text-xs mt-0.5">Dodaj szanse do pipeline</div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5">✕</button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <Field label="Klient" name="clientName" value={form.clientName} onChange={handleChange} options={clients.map(c => c.name)} />
          <Field label="Tytul szansy" name="title" value={form.title} onChange={handleChange} required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Wartosc (zl)" name="value" value={form.value} onChange={handleChange} type="number" required />
            <Field label="Prawdopodobienstwo %" name="probability" value={form.probability} onChange={handleChange} type="number" />
          </div>
          <Field label="Etap" name="stage" value={form.stage} onChange={handleChange} options={stages} />
          <Field label="Notatki" name="notes" value={form.notes} onChange={handleChange} type="textarea" />
        </div>
        <div className="p-5 border-t border-[#1E2D45] flex gap-3">
          <button onClick={onClose} className="flex-1 bg-[#0B0F1A] border border-[#1E2D45] text-slate-400 font-semibold text-sm py-3 rounded-xl hover:text-white transition-colors">Anuluj</button>
          <button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-3 rounded-xl transition-colors">✓ Zapisz szanse</button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ clients, reminders, opportunities }) {
  const pending = reminders.filter(r => !r.done);
  const totalPipeline = opportunities.filter(o => !["Wygrana","Utracona"].includes(o.stage)).reduce((s,o) => s + o.value, 0);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-slate-400 text-sm mb-1">{new Date().toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        <div className="text-white text-2xl font-bold">Dzien dobry 👋</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: "👥", label: "Klienci", value: clients.length, sub: "w bazie", color: "bg-blue-500" },
          { icon: "🔔", label: "Przypomnienia", value: pending.length, sub: "oczekujacych", color: "bg-yellow-500" },
          { icon: "💡", label: "Pipeline", value: `${(totalPipeline/1000).toFixed(0)}k zl`, sub: "wartosc szans", color: "bg-purple-500" },
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
        <div className="text-white font-bold text-sm mb-4">📈 Aktywnosc — ostatnie wpisy</div>
        <Bar
          data={{
            labels: ["Nowa", "Kontakt", "Oferta", "Negocjacje", "Wygrana", "Utracona"],
            datasets: [{
              label: "Szanse sprzedazy",
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
          <div className="text-white font-bold text-sm mb-4">🏆 Ranking klientow</div>
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
          <div className="text-white font-bold text-sm mb-4">💡 Top szanse sprzedazy</div>
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
                  <div className="text-emerald-400 font-bold text-xs">{o.value.toLocaleString()} zl</div>
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

function Clients({ clients, setClients, loadActivities, addActivity, setPage }) {
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
            <div className="ml-auto text-slate-500 text-xs flex items-center">{filtered.length} klientow</div>
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
                  <div className="text-emerald-400 text-xs">{c.margin} marzy</div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${statusColors[c.status]}`}>{c.status}</span>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="text-4xl">🔍</div>
                <div className="text-white font-semibold">Brak klientow</div>
                <div className="text-slate-400 text-sm">Zmien filtry lub dodaj nowego klienta</div>
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
                {[["Telefon",selected.phone,"text-blue-400"],["Miasto",selected.city,"text-white"],["Obrot",selected.revenue,"text-emerald-400"],["Marza",selected.margin,"text-emerald-400"]].map(([label,val,cls]) => (
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
                <a href={`tel:${selected.phone}`} className="flex-1 bg-blue-600 text-white font-semibold text-sm py-2.5 rounded-xl text-center">📞 Zadzwon</a>
                <button onClick={() => setShowAdd(true)} className="flex-1 bg-[#0B0F1A] border border-[#1E2D45] text-blue-400 font-semibold text-sm py-2.5 rounded-xl">🔔 + Przyp.</button>
              </div>
              <button onClick={() => setEditClient(selected)} className="w-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold text-sm py-2.5 rounded-xl hover:bg-blue-500/20 transition-colors">
                ✏️ Edytuj klienta
              </button>
              <button onClick={() => setShowHistory(selected)} className="w-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-semibold text-sm py-2.5 rounded-xl hover:bg-purple-500/20 transition-colors">
                📋 Historia aktywnosci
              </button>
              <button onClick={() => { setPage("offers"); setSelected(null); }} className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm py-2.5 rounded-xl hover:bg-emerald-500/20 transition-colors">
                📄 Generuj oferte
              </button>
              <button onClick={async () => {
                if(window.confirm("Czy na pewno chcesz usunac tego klienta?")) {
                  const { error } = await supabase.from("clients").delete().eq("id", selected.id);
                  if (error) { alert("Blad usuwania: " + error.message); return; }
                  setClients(p=>p.filter(c=>c.id!==selected.id));
                  setSelected(null);
                }}}
                className="w-full bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-sm py-2.5 rounded-xl hover:bg-red-500/20 transition-colors">
                🗑️ Usun klienta
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
            <div className="text-slate-400 text-xs mt-0.5">{reminders.filter(r=>!r.done).length} oczekujacych</div>
          </div>
          <button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors">+ Nowe</button>
        </div>
        <div className="flex gap-2">
          {[["all","Wszystkie"],["today","Dzis"],["pending","Oczekujace"],["done","Wykonane"]].map(([val,label]) => (
            <button key={val} onClick={() => setFilterTab(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterTab===val ? "bg-blue-600 text-white" : "bg-[#141929] border border-[#1E2D45] text-slate-400"}`}>
              {label}
              {val==="today" && <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{reminders.filter(r=>r.date===today&&!r.done).length}</span>}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto flex-1">
          {filtered.map(r => {
            const pr = priorityConfig[r.priority] || priorityConfig["Sredni"];
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
}

function Opportunities({ opportunities, setOpportunities, clients }) {
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
            <div className="text-white font-bold text-lg">Szanse sprzedazy</div>
            <div className="text-slate-400 text-xs mt-0.5">{opportunities.filter(o=>activeStages.includes(o.stage)).length} aktywnych szans</div>
          </div>
          <button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors">+ Nowa szansa</button>
        </div>
        <div className="flex gap-3">
          {[
            { label: "Wartosc pipeline", value: `${(totalPipeline/1000).toFixed(0)}k zl`, color: "text-blue-400" },
            { label: "Wartosc wazona", value: `${(totalWeighted/1000).toFixed(0)}k zl`, color: "text-purple-400" },
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
                  <div className="text-slate-500 text-xs">{stageTotal.toLocaleString()} zl</div>
                </div>
                <div className="flex flex-col gap-2 overflow-y-auto flex-1">
                  {stageOpps.map(o => (
                    <div key={o.id} onClick={() => setSelected(selected?.id===o.id ? null : o)}
                      className={`bg-[#141929] border rounded-xl p-3 cursor-pointer transition-all ${selected?.id===o.id ? "border-blue-500/60 bg-blue-500/10" : "border-[#1E2D45] hover:border-slate-600"}`}>
                      <div className="text-white font-semibold text-xs mb-1 leading-tight">{o.title}</div>
                      <div className="text-slate-400 text-xs mb-2">{o.clientName}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-bold text-xs">{o.value.toLocaleString()} zl</span>
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
                <span className="text-xs text-slate-500">Zmien etap:</span>
                {stages.map(s => (
                  <button key={s} onClick={() => changeStage(selected.id, s)}
                    className={`text-xs px-2 py-1 rounded-lg font-semibold transition-colors ${selected.stage===s ? `${stageConfig[s].bg} ${stageConfig[s].color} border ${stageConfig[s].border}` : "bg-[#0B0F1A] text-slate-400 hover:text-white"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-emerald-400 font-bold text-lg">{selected.value.toLocaleString()} zl</div>
              <div className="text-slate-400 text-xs mb-3">{selected.probability}% prawdopodobienstwo</div>
              <button onClick={() => deleteOpp(selected.id)} className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-lg">🗑 Usun</button>
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
    if (!form.title) { alert("Wpisz tytul"); return; }
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
            <div className="text-white font-bold text-lg">📋 Historia aktywnosci</div>
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
            <input placeholder="Tytul (np. Wyslano oferte na izolacje)" value={form.title} onChange={e => setForm(f=>({...f, title: e.target.value}))}
              className="bg-[#141929] border border-[#1E2D45] rounded-xl px-3 py-2 text-white text-sm outline-none placeholder-slate-600" />
            <textarea placeholder="Opis (opcjonalnie)" value={form.description} onChange={e => setForm(f=>({...f, description: e.target.value}))} rows={2}
              className="bg-[#141929] border border-[#1E2D45] rounded-xl px-3 py-2 text-white text-sm outline-none placeholder-slate-600 resize-none" />
            <input placeholder="Wartosc (zl) — opcjonalnie" type="number" value={form.value} onChange={e => setForm(f=>({...f, value: e.target.value}))}
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
              + Dodaj aktywnosc
            </button>
          )}
          {loading && <div className="text-slate-400 text-sm text-center py-8">Ladowanie...</div>}
          {!loading && activities.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📋</div>
              <div className="text-white font-semibold">Brak historii</div>
              <div className="text-slate-400 text-sm mt-1">Dodaj pierwsza aktywnosc</div>
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
                    {a.value > 0 && <span className="text-emerald-400 font-bold text-sm flex-shrink-0">{Number(a.value).toLocaleString()} zl</span>}
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
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Szukaj klientow, przypomnien, szans..."
            className="flex-1 bg-transparent outline-none text-white text-sm placeholder-slate-500" />
          <button onClick={onClose} className="text-slate-500 hover:text-white text-lg">✕</button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {query.length < 2 && <div className="p-6 text-center text-slate-500 text-sm">Wpisz minimum 2 znaki aby wyszukac</div>}
          {query.length >= 2 && results.length === 0 && <div className="p-6 text-center text-slate-500 text-sm">Brak wynikow dla "{query}"</div>}
          {results.map((r, i) => (
            <button key={i} onClick={r.action} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-[#1E2D45] last:border-0">
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
  const num = String(clientId || "").replace(/\D/g, "").slice(-3).padStart(3, "0");
  return `OF/${num}/${day}${month}/${year}`;
}

function OfferPDF({ offer, client, onClose }) {
  const total_netto = offer.items.reduce((s, i) => s + (parseFloat(i.netto) || 0), 0);
  const total_brutto = offer.items.reduce((s, i) => s + (parseFloat(i.brutto) || 0), 0);
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 7);

  const buildHTML = () => {
    const rows = offer.items.map((item, i) => `
      <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f9fafb"}">
        <td style="padding:9px 12px;font-size:13px;border-bottom:1px solid #e5e7eb">${i + 1}</td>
        <td style="padding:9px 12px;font-size:13px;border-bottom:1px solid #e5e7eb;font-weight:600">${item.product}</td>
        <td style="padding:9px 12px;font-size:13px;border-bottom:1px solid #e5e7eb;text-align:center">${item.jm}</td>
        <td style="padding:9px 12px;font-size:13px;border-bottom:1px solid #e5e7eb;text-align:center">${item.qty}</td>
        <td style="padding:9px 12px;font-size:13px;border-bottom:1px solid #e5e7eb;text-align:right">${parseFloat(item.netto_jm||0).toFixed(2)} zl</td>
        <td style="padding:9px 12px;font-size:13px;border-bottom:1px solid #e5e7eb;text-align:right">${parseFloat(item.netto||0).toFixed(2)} zl</td>
        <td style="padding:9px 12px;font-size:13px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700">${parseFloat(item.brutto||0).toFixed(2)} zl</td>
      </tr>`).join("");

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${offer.number}</title></head>
    <body style="font-family:Arial,sans-serif;padding:40px;color:#111;font-size:13px;margin:0">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px">
        <div>
          <div style="font-size:28px;font-weight:900;color:#1d4ed8">HurtBud</div>
          <div style="color:#6b7280;font-size:12px;margin-top:4px">Hurtownia Materialow Budowlanych</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:18px;font-weight:700;color:#111">${offer.number}</div>
          <div style="color:#6b7280;font-size:12px;margin-top:4px">Data: ${new Date().toLocaleDateString("pl-PL")}</div>
          <div style="color:#6b7280;font-size:12px">Wazna do: ${validUntil.toLocaleDateString("pl-PL")}</div>
          <div style="color:#6b7280;font-size:12px">Wystawil: ${offer.author}</div>
        </div>
      </div>
      <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:24px">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;margin-bottom:8px">Klient</div>
        <div style="font-size:18px;font-weight:700;margin-bottom:4px">${client?.name || ""}</div>
        <div style="color:#4b5563;font-size:12px">${client?.person || ""}</div>
        <div style="color:#4b5563;font-size:12px">${client?.city || ""}</div>
        <div style="color:#4b5563;font-size:12px">${client?.phone || ""}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <thead>
          <tr style="background:#1d4ed8;color:white">
            <th style="padding:10px 12px;text-align:left;font-size:12px">Lp.</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px">Produkt</th>
            <th style="padding:10px 12px;text-align:center;font-size:12px">JM</th>
            <th style="padding:10px 12px;text-align:center;font-size:12px">Ilosc</th>
            <th style="padding:10px 12px;text-align:right;font-size:12px">Cena netto/JM</th>
            <th style="padding:10px 12px;text-align:right;font-size:12px">Netto total</th>
            <th style="padding:10px 12px;text-align:right;font-size:12px">Brutto total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr style="border-top:2px solid #1d4ed8">
            <td colspan="5" style="padding:12px;text-align:right;font-weight:700;font-size:13px">RAZEM:</td>
            <td style="padding:12px;text-align:right;font-weight:700;font-size:13px">${total_netto.toFixed(2)} zl</td>
            <td style="padding:12px;text-align:right;font-weight:900;font-size:16px;color:#1d4ed8">${total_brutto.toFixed(2)} zl</td>
          </tr>
        </tfoot>
      </table>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;padding-top:24px;border-top:1px solid #e5e7eb;margin-top:32px">
        <div style="font-size:11px;color:#9ca3af">Oferta wazna 7 dni od daty wystawienia</div>
        <div style="text-align:center">
          <div style="font-family:cursive;font-size:20px;color:#1d4ed8;margin-bottom:4px">${offer.author}</div>
          <div style="width:180px;border-top:1px solid #9ca3af;padding-top:6px;font-size:11px;color:#6b7280;margin:0 auto">${offer.author}</div>
        </div>
      </div>
    </body></html>`;
  };

  const handlePrint = () => {
    const win = window.open("", "_blank");
    win.document.write(buildHTML());
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 300);
  };

  const handleDownloadPDF = () => {
    const html = buildHTML().replace("</head>", "<script>window.onload=function(){window.print();}<\/script></head>");
    const win = window.open("", "_blank");
    win.document.write(html);
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
          <div className="text-gray-500 text-xs">Pobierz PDF → "Zapisz jako PDF"</div>
        </div>
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="text-3xl font-black text-blue-700">HurtBud</div>
              <div className="text-gray-500 text-sm mt-1">Hurtownia Materialow Budowlanych</div>
            </div>
            <div className="text-right">
              <div className="text-gray-800 font-bold text-lg">{offer.number}</div>
              <div className="text-gray-500 text-sm">Data: {new Date().toLocaleDateString("pl-PL")}</div>
              <div className="text-gray-500 text-sm">Wazna do: {validUntil.toLocaleDateString("pl-PL")}</div>
              <div className="text-gray-500 text-sm">Wystawil: {offer.author}</div>
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
                <th className="py-3 px-3 text-center text-sm font-semibold">Ilosc</th>
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
                  <td className="py-2.5 px-3 text-sm text-gray-900 text-right">{parseFloat(item.netto_jm||0).toFixed(2)} zl</td>
                  <td className="py-2.5 px-3 text-sm text-gray-900 text-right">{parseFloat(item.netto||0).toFixed(2)} zl</td>
                  <td className="py-2.5 px-3 text-sm font-bold text-gray-900 text-right">{parseFloat(item.brutto||0).toFixed(2)} zl</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-blue-700">
                <td colSpan={5} className="py-3 px-3 text-right font-bold text-gray-800">RAZEM:</td>
                <td className="py-3 px-3 text-right font-bold text-gray-900">{total_netto.toFixed(2)} zl</td>
                <td className="py-3 px-3 text-right font-black text-blue-700 text-lg">{total_brutto.toFixed(2)} zl</td>
              </tr>
            </tfoot>
          </table>
          <div className="flex justify-between items-end mt-8 pt-6 border-t border-gray-200">
            <div className="text-gray-400 text-xs">Oferta wazna 7 dni od daty wystawienia</div>
            <div className="text-center">
              <div className="text-blue-700 font-bold text-xl mb-1" style={{fontFamily:"cursive"}}>{offer.author}</div>
              <div className="w-48 border-t border-gray-400 pt-2 text-gray-500 text-xs mx-auto">{offer.author}</div>
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
  const [items, setItems] = useState([{ product: "", jm: "szt", qty: "", netto_jm: "", netto: "", brutto: "" }]);
  const [loadingOffers, setLoadingOffers] = useState(true);

  useEffect(() => { loadOffers(); }, []);

  async function loadOffers() {
    setLoadingOffers(true);
    const { data } = await supabase.from("offers").select("*").order("created_at", { ascending: false });
    if (data) setOffers(data.map(o => ({ ...o, client: o.client_data, items: o.items || [] })));
    setLoadingOffers(false);
  }

  const jmOptions = ["szt", "m2", "m3", "opak", "mb", "kg", "t"];

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      const item = updated[index];
      const qty = parseFloat(item.qty) || 1;
      if (field === "netto_jm") {
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
      return updated;
    });
  };

  const addItem = () => setItems(prev => [...prev, { product: "", jm: "szt", qty: "", netto_jm: "", netto: "", brutto: "" }]);
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const total_netto = items.reduce((s, i) => s + (parseFloat(i.netto) || 0), 0);
  const total_brutto = items.reduce((s, i) => s + (parseFloat(i.brutto) || 0), 0);

  const handleSave = async () => {
    if (!selectedClient) { alert("Wybierz klienta"); return; }
    if (items.every(i => !i.product)) { alert("Dodaj przynajmniej jedna pozycje"); return; }
    const filteredItems = items.filter(i => i.product);
    const total_netto = filteredItems.reduce((s, i) => s + (parseFloat(i.netto) || 0), 0);
    const total_brutto = filteredItems.reduce((s, i) => s + (parseFloat(i.brutto) || 0), 0);

    if (editOffer) {
      const { data, error } = await supabase.from("offers").update({
        items: filteredItems,
        client_data: selectedClient,
        client_name: selectedClient.name,
        total_netto,
        total_brutto,
      }).eq("id", editOffer.id).select();
      if (error) { alert("Blad zapisu: " + error.message); return; }
      if (data) {
        const updated = { ...data[0], client: data[0].client_data, items: data[0].items || [] };
        setOffers(prev => prev.map(o => o.id === editOffer.id ? updated : o));
        setPreviewOffer(updated);
      }
    } else {
      const { data, error } = await supabase.from("offers").insert([{
        number: generateOfferNumber(selectedClient.id),
        client_id: selectedClient.id,
        client_name: selectedClient.name,
        client_data: selectedClient,
        items: filteredItems,
        author: "Piotr Handlowiec",
        total_netto,
        total_brutto,
      }]).select();
      if (error) { alert("Blad zapisu: " + error.message); return; }
      if (data) {
        const newOffer = { ...data[0], client: data[0].client_data, items: data[0].items || [] };
        setOffers(prev => [newOffer, ...prev]);
        setPreviewOffer(newOffer);
      }
    }
    setShowCreate(false);
    setEditOffer(null);
    setItems([{ product: "", jm: "szt", qty: "", netto_jm: "", netto: "", brutto: "" }]);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Usunac te oferte?")) return;
    await supabase.from("offers").delete().eq("id", id);
    setOffers(prev => prev.filter(o => o.id !== id));
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
            <div className="text-white font-bold text-lg">◱ Oferty</div>
            <div className="text-slate-400 text-xs mt-0.5">{offers.length} wystawionych ofert</div>
          </div>
          <button onClick={() => { setShowCreate(true); setEditOffer(null); setItems([{ product: "", jm: "szt", qty: "", netto_jm: "", netto: "", brutto: "" }]); }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors">+ Nowa oferta</button>
        </div>

        {showCreate && (
          <div className="bg-[#141929] border border-[#1E2D45] rounded-2xl p-5 flex flex-col gap-4">
            <div className="text-white font-bold text-sm">{editOffer ? "✏️ Edytuj oferte" : "➕ Nowa oferta"}</div>
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-xs uppercase tracking-wider">Klient</label>
              <select
                value={selectedClient?.id || ""}
                onChange={e => {
                  const found = clients.find(c => String(c.id) === String(e.target.value));
                  setSelectedClient(found || null);
                }}
                className="bg-[#0B0F1A] border border-[#1E2D45] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500">
                {clients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.person}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-12 gap-2 text-slate-400 text-xs uppercase tracking-wider px-1">
                <div className="col-span-3">Produkt</div>
                <div className="col-span-1">JM</div>
                <div className="col-span-1">Ilosc</div>
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
                      {parseFloat(item.netto || 0).toFixed(2)} zl
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="w-full bg-[#0B0F1A] border border-emerald-500/20 rounded-xl px-2 py-2 text-emerald-400 text-sm font-semibold">
                      {parseFloat(item.brutto || 0).toFixed(2)} zl
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
                Dodaj pozycje
              </button>
            </div>
            <div className="bg-[#0B0F1A] rounded-xl p-4 flex justify-between items-center">
              <div className="text-slate-400 text-sm">Podsumowanie</div>
              <div className="text-right">
                <div className="text-slate-300 text-sm">Netto: <span className="text-white font-bold">{total_netto.toLocaleString("pl-PL", {minimumFractionDigits: 2})} zl</span></div>
                <div className="text-slate-300 text-sm">Brutto: <span className="text-emerald-400 font-black text-lg">{total_brutto.toLocaleString("pl-PL", {minimumFractionDigits: 2})} zl</span></div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowCreate(false); setEditOffer(null); }} className="flex-1 bg-[#0B0F1A] border border-[#1E2D45] text-slate-400 font-semibold text-sm py-3 rounded-xl">Anuluj</button>
              <button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-3 rounded-xl transition-colors">✓ Generuj oferte</button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 overflow-y-auto flex-1">
          {loadingOffers && (
            <div className="text-center py-16 text-slate-400 text-sm">Ladowanie ofert...</div>
          )}
          {!loadingOffers && offers.length === 0 && !showCreate && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="text-4xl">📄</div>
              <div className="text-white font-semibold">Brak ofert</div>
              <div className="text-slate-400 text-sm">Kliknij "+ Nowa oferta" aby zaczac</div>
            </div>
          )}
          {offers.map(offer => {
            const total = offer.total_brutto || offer.items.reduce((s, i) => s + (parseFloat(i.brutto) || 0), 0);
            return (
              <div key={offer.id} className="bg-[#141929] border border-[#1E2D45] rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">◱</div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-sm">{offer.number}</div>
                  <div className="text-slate-400 text-xs">{offer.client_name} · {new Date(offer.created_at).toLocaleDateString("pl-PL")}</div>
                  <div className="text-slate-500 text-xs">{offer.items.length} pozycji</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-emerald-400 font-black text-base">{Number(total).toLocaleString("pl-PL", {minimumFractionDigits: 2})} zl</div>
                  <div className="text-slate-500 text-xs">brutto</div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setPreviewOffer(offer)} className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">👁</button>
                  <button onClick={() => handleEdit(offer)} className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">✏️</button>
                  <button onClick={() => handleDelete(offer.id)} className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">🗑</button>
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
          <div className="text-white font-semibold">Brak utraconych klientow!</div>
          <div className="text-slate-400 text-sm">Swietna robota!</div>
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



function Avatar({ profile, size = "sm" }) {
  const sizes = { sm: "w-8 h-8 text-sm", md: "w-10 h-10 text-base", lg: "w-16 h-16 text-2xl" };
  const cls = sizes[size] || sizes.sm;
  if (profile?.avatar_url) {
    return <img src={profile.avatar_url} alt="avatar" className={`${cls} rounded-xl object-cover flex-shrink-0`} />;
  }
  const initials = profile?.avatar_initials ||
    ((profile?.first_name ? profile.first_name[0] : "") + (profile?.last_name ? profile.last_name[0] : "")) ||
    (profile?.email ? profile.email[0].toUpperCase() : "?");
  const color = profile?.avatar_color || "#3B82F6";
  return (
    <div className={`${cls} rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ background: color }}>
      {initials.toUpperCase()}
    </div>
  );
}

function ProfileModal({ session, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", avatar_initials: "", avatar_color: "#3B82F6" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const colors = ["#3B82F6","#8B5CF6","#10B981","#F59E0B","#EF4444","#EC4899","#06B6D4","#F97316"];

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    if (data) {
      setProfile(data);
      setForm({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        phone: data.phone || "",
        avatar_initials: data.avatar_initials || "",
        avatar_color: data.avatar_color || "#3B82F6",
      });
      if (data.avatar_url) setAvatarPreview(data.avatar_url);
    }
    setLoading(false);
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    let avatar_url = profile?.avatar_url || null;

    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `avatars/${session.user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatar_url = urlData.publicUrl;
      }
    }

    await supabase.from("profiles").update({
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone,
      avatar_initials: form.avatar_initials,
      avatar_color: form.avatar_color,
      avatar_url,
    }).eq("id", session.user.id);

    setSaving(false);
    onClose();
  };

  if (loading) return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-white">Ladowanie...</div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#141929] border border-[#1E2D45] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#1E2D45]">
          <div>
            <div className="text-white font-bold text-lg">👤 Moj profil</div>
            <div className="text-slate-400 text-xs mt-0.5">{session.user.email}</div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="w-20 h-20 rounded-2xl object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white"
                  style={{ background: form.avatar_color }}>
                  {(form.avatar_initials || (form.first_name?.[0] || "") + (form.last_name?.[0] || "") || session.user.email[0]).toUpperCase()}
                </div>
              )}
              <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center cursor-pointer hover:bg-blue-500 transition-colors">
                📷
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
            <div className="text-slate-400 text-xs">Kliknij 📷 aby dodac zdjecie</div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-xs uppercase tracking-wider">Kolor avatara</label>
            <div className="flex gap-2 flex-wrap">
              {colors.map(c => (
                <button key={c} onClick={() => setForm(f => ({...f, avatar_color: c}))}
                  className={`w-8 h-8 rounded-lg transition-all ${form.avatar_color === c ? "ring-2 ring-white scale-110" : ""}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-xs uppercase tracking-wider">Inicjaly (jesli brak zdjecia)</label>
            <input value={form.avatar_initials} onChange={e => setForm(f => ({...f, avatar_initials: e.target.value.slice(0,2)}))}
              placeholder="np. PH" maxLength={2}
              className="bg-[#0B0F1A] border border-[#1E2D45] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-xs uppercase tracking-wider">Imie</label>
              <input value={form.first_name} onChange={e => setForm(f => ({...f, first_name: e.target.value}))}
                placeholder="Piotr"
                className="bg-[#0B0F1A] border border-[#1E2D45] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-xs uppercase tracking-wider">Nazwisko</label>
              <input value={form.last_name} onChange={e => setForm(f => ({...f, last_name: e.target.value}))}
                placeholder="Kowalski"
                className="bg-[#0B0F1A] border border-[#1E2D45] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-xs uppercase tracking-wider">Telefon</label>
            <input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
              placeholder="+48 500 000 000"
              className="bg-[#0B0F1A] border border-[#1E2D45] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500" />
          </div>

          <div className="bg-[#0B0F1A] rounded-xl p-3">
            <div className="text-slate-500 text-xs mb-1 uppercase tracking-wider">Rola</div>
            <div className={`text-sm font-semibold ${profile?.role === "admin" ? "text-purple-400" : "text-blue-400"}`}>
              {profile?.role === "admin" ? "👑 Administrator" : "💼 Handlowiec"}
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-[#1E2D45] flex gap-3">
          <button onClick={onClose} className="flex-1 bg-[#0B0F1A] border border-[#1E2D45] text-slate-400 font-semibold text-sm py-3 rounded-xl">Anuluj</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-3 rounded-xl transition-colors">
            {saving ? "Zapisuje..." : "✓ Zapisz profil"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminPanel({ session, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  }

  const changeRole = async (userId, role) => {
    await supabase.from("profiles").update({ role }).eq("id", userId);
    setUsers(prev => prev.map(u => u.id === userId ? {...u, role} : u));
  };

  const toggleApprove = async (userId, approved) => {
    await supabase.from("profiles").update({ approved }).eq("id", userId);
    setUsers(prev => prev.map(u => u.id === userId ? {...u, approved} : u));
  };

  const pending = users.filter(u => !u.approved);
  const approved = users.filter(u => u.approved);
  const shown = tab === "pending" ? pending : tab === "approved" ? approved : users;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#141929] border border-[#1E2D45] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#1E2D45]">
          <div>
            <div className="text-white font-bold text-lg">👑 Panel administratora</div>
            <div className="text-slate-400 text-xs mt-0.5">{users.length} uzytkownikow · {pending.length} oczekuje na zatwierdzenie</div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>
        <div className="flex gap-2 px-5 pt-4">
          {[["all","Wszyscy"],["pending","Oczekujacy"],["approved","Zatwierdzeni"]].map(([val,label]) => (
            <button key={val} onClick={() => setTab(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab===val ? "bg-blue-600 text-white" : "bg-[#0B0F1A] border border-[#1E2D45] text-slate-400"}`}>
              {label}
              {val === "pending" && pending.length > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pending.length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="p-5 flex flex-col gap-3">
          {loading && <div className="text-slate-400 text-sm text-center py-8">Ladowanie...</div>}
          {!loading && shown.length === 0 && (
            <div className="text-slate-500 text-sm text-center py-8">Brak uzytkownikow</div>
          )}
          {shown.map(user => (
            <div key={user.id} className={`bg-[#0B0F1A] border rounded-xl p-4 flex items-center gap-4 ${!user.approved ? "border-yellow-500/30" : "border-[#1E2D45]"}`}>
              <Avatar profile={user} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="text-white font-semibold text-sm">
                    {user.first_name || user.last_name ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "Brak danych"}
                  </div>
                  {!user.approved && <span className="text-xs bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-2 py-0.5 rounded-lg">Oczekuje</span>}
                </div>
                <div className="text-slate-400 text-xs truncate">{user.email}</div>
                {user.phone && <div className="text-slate-500 text-xs">{user.phone}</div>}
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                {!user.approved ? (
                  <button onClick={() => toggleApprove(user.id, true)}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
                    ✓ Zatwierdz
                  </button>
                ) : (
                  <button onClick={() => toggleApprove(user.id, false)}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors">
                    ✕ Zablokuj
                  </button>
                )}
                <div className="flex gap-1">
                  <button onClick={() => changeRole(user.id, "handlowiec")}
                    className={`text-xs px-2 py-1 rounded-lg font-semibold transition-colors ${user.role === "handlowiec" ? "bg-blue-500/20 border border-blue-500/30 text-blue-400" : "bg-[#1E2D45] text-slate-400 hover:text-white"}`}>
                    💼
                  </button>
                  <button onClick={() => changeRole(user.id, "admin")}
                    className={`text-xs px-2 py-1 rounded-lg font-semibold transition-colors ${user.role === "admin" ? "bg-purple-500/20 border border-purple-500/30 text-purple-400" : "bg-[#1E2D45] text-slate-400 hover:text-white"}`}>
                    👑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoginScreen() {
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register fields
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regEmail2, setRegEmail2] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPassword2, setRegPassword2] = useState("");
  const [regAccept, setRegAccept] = useState(false);

  const googleIcon = (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
      <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
      <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
    </svg>
  );

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) { setError("Wpisz email i haslo"); return; }
    setLoading(true);
    setError("");
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    if (error) { setError("Bledny email lub haslo"); setLoading(false); return; }
    if (data?.user) {
      const { data: profile } = await supabase.from("profiles").select("approved").eq("id", data.user.id).single();
      if (profile && !profile.approved) {
        await supabase.auth.signOut();
        setError("Twoje konto czeka na zatwierdzenie przez administratora");
        setLoading(false);
      }
    }
  };

  const handleRegister = async () => {
    setError("");
    if (!regFirstName || !regLastName || !regPhone || !regEmail || !regEmail2 || !regPassword || !regPassword2) {
      setError("Wypelnij wszystkie pola"); return;
    }
    if (regEmail !== regEmail2) { setError("Adresy email nie sa takie same"); return; }
    if (regPassword !== regPassword2) { setError("Hasla nie sa takie same"); return; }
    if (regPassword.length < 8) { setError("Haslo musi miec minimum 8 znakow"); return; }
    if (!/[A-Z]/.test(regPassword)) { setError("Haslo musi zawierac wielka litere"); return; }
    if (!/[0-9]/.test(regPassword)) { setError("Haslo musi zawierac cyfre"); return; }
    if (!regAccept) { setError("Musisz zaakceptowac regulamin"); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: { data: { first_name: regFirstName, last_name: regLastName } }
    });
    if (error) { setError(error.message); setLoading(false); return; }
    if (data?.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: regEmail,
        first_name: regFirstName,
        last_name: regLastName,
        phone: regPhone,
        role: "handlowiec",
        approved: false,
      });
    }
    setLoading(false);
    setSuccess("Rejestracja udana! Sprawdz email aby potwierdzic konto. Po weryfikacji administrator zatwierdzi Twoj dostep.");
    setMode("login");
  };

  const inputCls = "bg-[#0B0F1A] border border-[#1E2D45] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 placeholder-slate-600 w-full";

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🏗️</div>
          <div className="text-white font-black text-2xl">BuildCRM</div>
          <div className="text-slate-400 text-sm mt-1">Hurtownia Materialow Budowlanych</div>
        </div>

        <div className="bg-[#141929] border border-[#1E2D45] rounded-2xl p-6 flex flex-col gap-4">

          {mode === "login" ? (
            <>
              <div className="text-white font-bold text-lg text-center">Zaloguj sie</div>

              <button onClick={handleGoogle} disabled={loading}
                className="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-3">
                {googleIcon}
                Zaloguj przez Google
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#1E2D45]" />
                <span className="text-slate-500 text-xs">lub email i haslo</span>
                <div className="flex-1 h-px bg-[#1E2D45]" />
              </div>

              <input value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                type="email" placeholder="Adres email" className={inputCls} />
              <input value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                type="password" placeholder="Haslo"
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                className={inputCls} />

              {error && <div className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</div>}
              {success && <div className="text-emerald-400 text-xs text-center bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">{success}</div>}

              <button onClick={handleLogin} disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-3 rounded-xl transition-colors">
                {loading ? "Logowanie..." : "Zaloguj sie"}
              </button>

              <button onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
                className="text-slate-400 text-xs text-center hover:text-white transition-colors">
                Nie masz konta? Zarejestruj sie
              </button>
            </>
          ) : (
            <>
              <div className="text-white font-bold text-lg text-center">Rejestracja</div>
              <div className="text-slate-400 text-xs text-center">Po rejestracji administrator zatwierdzi Twoj dostep</div>

              <div className="grid grid-cols-2 gap-3">
                <input value={regFirstName} onChange={e => setRegFirstName(e.target.value)}
                  placeholder="Imie *" className={inputCls} />
                <input value={regLastName} onChange={e => setRegLastName(e.target.value)}
                  placeholder="Nazwisko *" className={inputCls} />
              </div>

              <input value={regPhone} onChange={e => setRegPhone(e.target.value)}
                placeholder="Numer telefonu *" type="tel" className={inputCls} />

              <input value={regEmail} onChange={e => setRegEmail(e.target.value)}
                placeholder="Adres email *" type="email" className={inputCls} />
              <input value={regEmail2} onChange={e => setRegEmail2(e.target.value)}
                placeholder="Powtorz adres email *" type="email" className={inputCls} />

              <input value={regPassword} onChange={e => setRegPassword(e.target.value)}
                placeholder="Haslo * (min. 8 znakow, wielka litera, cyfra)" type="password" className={inputCls} />
              <input value={regPassword2} onChange={e => setRegPassword2(e.target.value)}
                placeholder="Powtorz haslo *" type="password"
                onKeyDown={e => e.key === "Enter" && handleRegister()}
                className={inputCls} />

              <div className="bg-[#0B0F1A] rounded-xl p-3 text-slate-400 text-xs">
                <div className="font-semibold text-slate-300 mb-1">Wymagania hasla:</div>
                <div className={regPassword.length >= 8 ? "text-emerald-400" : ""}>✓ Minimum 8 znakow</div>
                <div className={/[A-Z]/.test(regPassword) ? "text-emerald-400" : ""}>✓ Wielka litera</div>
                <div className={/[0-9]/.test(regPassword) ? "text-emerald-400" : ""}>✓ Cyfra</div>
                <div className={regPassword === regPassword2 && regPassword ? "text-emerald-400" : ""}>✓ Hasla sa takie same</div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={regAccept} onChange={e => setRegAccept(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-blue-500" />
                <span className="text-slate-400 text-xs">Akceptuje regulamin aplikacji i zgadzam sie na przetwarzanie moich danych osobowych przez HurtBud w celu obslugi konta CRM</span>
              </label>

              {error && <div className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</div>}

              <button onClick={handleRegister} disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-3 rounded-xl transition-colors">
                {loading ? "Rejestracja..." : "Zarejestruj sie"}
              </button>

              <button onClick={() => { setMode("login"); setError(""); }}
                className="text-slate-400 text-xs text-center hover:text-white transition-colors">
                Masz juz konto? Zaloguj sie
              </button>
            </>
          )}
        </div>
      </div>
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
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      loadAll();
      supabase.from("profiles").select("*").eq("id", session.user.id).single().then(({ data }) => {
        if (data) setUserProfile(data);
      });
    }
  }, [session]);

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
    if (error) { alert("Blad zapisu: " + error.message); return null; }
    return data?.[0];
  }

  const pendingCount = reminders.filter(r => !r.done).length;

  const pages = {
    dashboard: <Dashboard clients={clients} reminders={reminders} opportunities={opportunities} />,
    clients: <Clients clients={clients} setClients={setClients} loadActivities={loadActivities} addActivity={addActivity} setPage={setPage} />,
    reminders: <Reminders reminders={reminders} setReminders={setReminders} clients={clients} />,
    opportunities: <Opportunities opportunities={opportunities} setOpportunities={setOpportunities} clients={clients} />,
    offers: <Offers clients={clients} />,
    lost: <LostClients clients={clients} />,
  };

  const pageLabels = {
    dashboard: "Dashboard", clients: "Klienci",
    reminders: "Przypomnienia", opportunities: "Szanse sprzedazy",
    offers: "Oferty", lost: "Utraceni klienci",
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
              <div className="text-slate-500 text-xs">Region Poludnie</div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
    </div>
  );

  if (authLoading) return (
    <div className="flex h-screen bg-[#0B0F1A] items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🏗️</div>
        <div className="text-white font-bold text-lg">Ladowanie BuildCRM...</div>
        <div className="text-slate-400 text-sm mt-2">Laczenie z baza danych</div>
      </div>
    </div>
  );

  if (!session) return <LoginScreen />;

  if (loading) return (
    <div className="flex h-screen bg-[#0B0F1A] items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🏗️</div>
        <div className="text-white font-bold text-lg">Ladowanie BuildCRM...</div>
        <div className="text-slate-400 text-sm mt-2">Laczenie z baza danych</div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col-reverse md:flex-row h-screen bg-[#0B0F1A] font-sans overflow-hidden">
      {profileModalOpen && <ProfileModal session={session} onClose={() => { setProfileModalOpen(false); supabase.from("profiles").select("*").eq("id", session.user.id).single().then(({data}) => { if(data) setUserProfile(data); }); }} />}
      {adminOpen && userProfile?.role === "admin" && <AdminPanel session={session} onClose={() => setAdminOpen(false)} />}
      {searchOpen && (
        <GlobalSearch clients={clients} reminders={reminders} opportunities={opportunities}
          onClose={() => setSearchOpen(false)} setPage={setPage} />
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
          <div className="text-slate-600 text-xs text-center">BuildCRM v1.0</div>
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
                      <div className="p-6 text-center text-slate-500 text-sm">Brak oczekujacych przypomnien 🎉</div>
                    ) : (
                      reminders.filter(r => !r.done).slice(0, 8).map(r => {
                        const pr = priorityConfig[r.priority] || priorityConfig["Sredni"];
                        return (
                          <div key={r.id} onClick={() => { setPage("reminders"); setNotifOpen(false); }}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer border-b border-[#1E2D45] last:border-0 transition-colors">
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
                    <button onClick={() => { setPage("reminders"); setNotifOpen(false); }}
                      className="w-full text-blue-400 text-sm font-semibold hover:text-blue-300 transition-colors">
                      Zobacz wszystkie →
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <button onClick={() => setProfileOpen(o => !o)} className="flex items-center justify-center hover:opacity-80 transition-opacity">
                <Avatar profile={userProfile} size="sm" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-11 w-64 bg-[#141929] border border-[#1E2D45] rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-[#1E2D45] flex items-center gap-3">
                    <Avatar profile={userProfile} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-semibold truncate">
                        {userProfile?.first_name ? `${userProfile.first_name} ${userProfile.last_name || ""}`.trim() : session?.user?.email}
                      </div>
                      <div className={`text-xs ${userProfile?.role === "admin" ? "text-purple-400" : "text-blue-400"}`}>
                        {userProfile?.role === "admin" ? "👑 Administrator" : "💼 Handlowiec"}
                      </div>
                    </div>
                  </div>
                  <div className="p-2 flex flex-col gap-1">
                    <button onClick={() => { setProfileModalOpen(true); setProfileOpen(false); }}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-slate-300 text-sm hover:bg-white/5 transition-colors flex items-center gap-3">
                      👤 Edytuj profil
                    </button>
                    {userProfile?.role === "admin" && (
                      <button onClick={() => { setAdminOpen(true); setProfileOpen(false); }}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-purple-400 text-sm hover:bg-purple-500/10 transition-colors flex items-center gap-3">
                        👑 Panel admina
                      </button>
                    )}
                    <div className="h-px bg-[#1E2D45] my-1" />
                    <button onClick={() => supabase.auth.signOut()}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-red-400 text-sm hover:bg-red-500/10 transition-colors flex items-center gap-3">
                      🚪 Wyloguj sie
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
