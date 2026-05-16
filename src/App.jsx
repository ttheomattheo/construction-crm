import { useState } from "react";

const initialClients = [
  { id: 1, name: "Budmax Sp. z o.o.", person: "Marek Kowalski", status: "Aktywny", potential: "VIP", revenue: "138 400 zł", margin: "22%", city: "Warszawa", lastContact: "2 dni temu", phone: "+48 601 234 567", email: "m.kowalski@budmax.pl", notes: "Stały klient od 3 lat. Preferuje kontakt 9-12." },
  { id: 2, name: "Hydrotech Polska", person: "Anna Wiśniewska", status: "Aktywny", potential: "Wysoki", revenue: "94 200 zł", margin: "18%", city: "Kraków", lastContact: "5 dni temu", phone: "+48 602 345 678", email: "a.wisniewska@hydrotech.pl", notes: "Zainteresowana nową ofertą Q3." },
  { id: 3, name: "Invest-Bud Kraków", person: "Piotr Nowak", status: "Prospekt", potential: "Wysoki", revenue: "67 800 zł", margin: "15%", city: "Wrocław", lastContact: "1 tydzień temu", phone: "+48 603 456 789", email: "p.nowak@investbud.pl", notes: "Pierwszy kontakt przez polecenie." },
  { id: 4, name: "Stal-Beton Łódź", person: "Katarzyna Maj", status: "Aktywny", potential: "Średni", revenue: "45 100 zł", margin: "12%", city: "Łódź", lastContact: "3 dni temu", phone: "+48 604 567 890", email: "k.maj@stalbeton.pl", notes: "Kontakt co 2 tygodnie." },
  { id: 5, name: "Prefabet Wrocław", person: "Tomasz Zając", status: "Nieaktywny", potential: "Niski", revenue: "18 300 zł", margin: "8%", city: "Gdańsk", lastContact: "3 tygodnie temu", phone: "+48 605 678 901", email: "t.zajac@prefabet.pl", notes: "Brak odpowiedzi od 3 tygodni." },
  { id: 6, name: "DachPol SA", person: "Ewa Kowalczyk", status: "Aktywny", potential: "Wysoki", revenue: "82 600 zł", margin: "19%", city: "Poznań", lastContact: "1 dzień temu", phone: "+48 606 789 012", email: "e.kowalczyk@dachpol.pl", notes: "Duży projekt Q3 w planach." },
];

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

const navItems = [
  { id: "dashboard", icon: "⊞", label: "Dashboard" },
  { id: "clients", icon: "◎", label: "Klienci" },
  { id: "reminders", icon: "◷", label: "Przypomnienia" },
  { id: "opportunities", icon: "◈", label: "Szanse" },
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
          placeholder={`Wpisz ${label.toLowerCase()}...`} />
      )}
    </div>
  );
}

function AddClientModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: "", person: "", phone: "", email: "",
    city: "", status: "Prospekt", potential: "Średni",
    revenue: "0 zł", margin: "0%", notes: "",
  });

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = () => {
    if (!form.name || !form.person || !form.phone) {
      alert("Wypełnij wymagane pola: Firma, Osoba kontaktowa, Telefon");
      return;
    }
    onAdd({ ...form, id: Date.now(), lastContact: "Właśnie dodany" });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#141929] border border-[#1E2D45] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#1E2D45]">
          <div>
            <div className="text-white font-bold text-lg">➕ Nowy klient</div>
            <div className="text-slate-400 text-xs mt-0.5">Wypełnij dane kontaktowe</div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5">✕</button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-blue-300 text-xs">
            Pola oznaczone <span className="text-red-400">*</span> są wymagane
          </div>

          <Field label="Nazwa firmy" name="name" value={form.name} onChange={handleChange} required />
          <Field label="Osoba kontaktowa" name="person" value={form.person} onChange={handleChange} required />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefon" name="phone" value={form.phone} onChange={handleChange} required />
            <Field label="Email" name="email" value={form.email} onChange={handleChange} type="email" />
          </div>

          <Field label="Miasto" name="city" value={form.city} onChange={handleChange} />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status" name="status" value={form.status} onChange={handleChange}
              options={["Aktywny", "Prospekt", "Nieaktywny", "Utracony"]} />
            <Field label="Potencjał" name="potential" value={form.potential} onChange={handleChange}
              options={["VIP", "Wysoki", "Średni", "Niski"]} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Obrót (zł)" name="revenue" value={form.revenue} onChange={handleChange} />
            <Field label="Marża (%)" name="margin" value={form.margin} onChange={handleChange} />
          </div>

          <Field label="Notatki" name="notes" value={form.notes} onChange={handleChange} type="textarea" />
        </div>

        <div className="p-5 border-t border-[#1E2D45] flex gap-3">
          <button onClick={onClose}
            className="flex-1 bg-[#0B0F1A] border border-[#1E2D45] text-slate-400 font-semibold text-sm py-3 rounded-xl hover:text-white transition-colors">
            Anuluj
          </button>
          <button onClick={handleSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-3 rounded-xl transition-colors">
            ✓ Zapisz klienta
          </button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ clients }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-slate-400 text-sm mb-1">Piątek, 16 maja 2026</div>
        <div className="text-white text-2xl font-bold">Dzień dobry 👋</div>
      </div>
      <div className="flex gap-4 flex-wrap">
        {[
          { icon: "👥", label: "Klienci", value: clients.length, sub: "w bazie", color: "bg-blue-500" },
          { icon: "✅", label: "Aktywni", value: clients.filter(c => c.status === "Aktywny").length, sub: "aktywnych klientów", color: "bg-emerald-500" },
          { icon: "🔵", label: "Prospekty", value: clients.filter(c => c.status === "Prospekt").length, sub: "do rozwinięcia", color: "bg-purple-500" },
          { icon: "🔔", label: "Alerty dziś", value: "3", sub: "2 pilne", color: "bg-yellow-500" },
        ].map((card) => (
          <div key={card.label} className="bg-[#141929] border border-[#1E2D45] rounded-2xl p-5 flex-1 min-w-40 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${card.color}`} />
            <div className="text-slate-400 text-xs uppercase tracking-widest mb-3">{card.icon} {card.label}</div>
            <div className="text-white text-2xl font-bold mb-1">{card.value}</div>
            <div className="text-slate-500 text-xs">{card.sub}</div>
          </div>
        ))}
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
          <div className="text-white font-bold text-sm mb-4">🔔 Dziś do zrobienia</div>
          {[
            { client: "Budmax Sp. z o.o.", title: "Wysłać ofertę na izolacje", time: "14:00", color: "bg-red-500" },
            { client: "Hydrotech Polska", title: "Follow-up po spotkaniu", time: "16:30", color: "bg-yellow-500" },
            { client: "Invest-Bud", title: "Zadzwonić ws. dostawy", time: "Jutro 9:00", color: "bg-emerald-500" },
          ].map((r,i) => (
            <div key={i} className="flex gap-3 mb-3 items-start">
              <div className={`w-2 h-2 rounded-full ${r.color} mt-1.5 flex-shrink-0`} />
              <div>
                <div className="text-white text-xs font-medium">{r.title}</div>
                <div className="text-slate-500 text-xs mt-0.5">{r.client} · {r.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Clients({ clients, setClients }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.person.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.status === filter;
    return matchSearch && matchFilter;
  });

  const handleAdd = (newClient) => {
    setClients(prev => [...prev, newClient]);
  };

  const handleDelete = (id) => {
    if (window.confirm("Czy na pewno chcesz usunąć tego klienta?")) {
      setClients(prev => prev.filter(c => c.id !== id));
      setSelected(null);
    }
  };

  return (
    <>
      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
      <div className="flex gap-4 h-full">
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex gap-3">
            <div className="flex-1 bg-[#141929] border border-[#1E2D45] rounded-xl flex items-center gap-3 px-4">
              <span className="text-slate-500">🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Szukaj klienta..."
                className="flex-1 bg-transparent outline-none text-white text-sm py-3 placeholder-slate-500" />
            </div>
            <button onClick={() => setShowAdd(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl w-12 rounded-xl transition-colors">+</button>
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
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold flex-shrink-0">
                  {c.name.charAt(0)}
                </div>
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
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black text-lg">
                    {selected.name.charAt(0)}
                  </div>
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
                {[
                  ["Telefon", selected.phone, "text-blue-400"],
                  ["Miasto", selected.city, "text-white"],
                  ["Obrót", selected.revenue, "text-emerald-400"],
                  ["Marża", selected.margin, "text-emerald-400"],
                ].map(([label, val, cls]) => (
                  <div key={label} className="bg-[#0B0F1A] rounded-xl p-3">
                    <div className="text-slate-500 text-xs mb-1 uppercase tracking-wider">{label}</div>
                    <div className={`font-semibold text-sm ${cls}`}>{val}</div>
                  </div>
                ))}
              </div>
              {selected.email && (
                <div className="bg-[#0B0F1A] rounded-xl p-3">
                  <div className="text-slate-500 text-xs mb-1 uppercase tracking-wider">Email</div>
                  <div className="text-blue-400 text-sm">{selected.email}</div>
                </div>
              )}
              {selected.notes && (
                <div className="bg-[#0B0F1A] rounded-xl p-3">
                  <div className="text-slate-500 text-xs mb-2 uppercase tracking-wider">Notatki</div>
                  <div className="text-slate-300 text-xs leading-relaxed">{selected.notes}</div>
                </div>
              )}
              <div className="flex gap-2">
                <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors">📞 Zadzwoń</button>
                <button className="flex-1 bg-[#0B0F1A] border border-[#1E2D45] text-blue-400 font-semibold text-sm py-2.5 rounded-xl">+ Przyp.</button>
              </div>
              <button onClick={() => handleDelete(selected.id)}
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

function ComingSoon({ title, icon }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="text-6xl">{icon}</div>
      <div className="text-white font-bold text-xl">{title}</div>
      <div className="text-slate-400 text-sm">Ten moduł budujemy w następnym etapie</div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [clients, setClients] = useState(initialClients);

  const pages = {
    dashboard: <Dashboard clients={clients} />,
    clients: <Clients clients={clients} setClients={setClients} />,
    reminders: <ComingSoon title="Przypomnienia" icon="🔔" />,
    opportunities: <ComingSoon title="Szanse sprzedaży" icon="💡" />,
    lost: <ComingSoon title="Utraceni klienci" icon="⊗" />,
  };

  const pageLabels = {
    dashboard: "Dashboard", clients: "Klienci",
    reminders: "Przypomnienia", opportunities: "Szanse sprzedaży", lost: "Utraceni klienci",
  };

  return (
    <div className="flex h-screen bg-[#0B0F1A] font-sans overflow-hidden">
      <div className="w-52 bg-[#141929] border-r border-[#1E2D45] flex flex-col py-6 flex-shrink-0">
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
              {item.id === "reminders" && <span className="ml-auto bg-red-500 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">3</span>}
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
          <div className="text-white font-bold text-base">{pageLabels[page]}</div>
          <div className="w-9 h-9 bg-yellow-500/20 border border-yellow-500/30 rounded-xl flex items-center justify-center relative cursor-pointer">
            🔔
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6">
          {pages[page]}
        </div>
      </div>
    </div>
  );
}