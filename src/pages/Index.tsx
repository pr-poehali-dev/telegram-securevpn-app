import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type User = { name: string; password: string; avatar?: string };

const PLANS = [
  { id: 'trial', icon: '🎁', name: 'Триал', days: 3, servers: 3, price: 0, via: 'app', accent: false },
  { id: 'prem4', icon: '🎁', name: 'Премиум 4д', days: 4, servers: 7, price: 0, via: 'app', accent: false },
  { id: 'm1', icon: '💎', name: '1 месяц', days: 30, servers: 7, price: 15, via: 'bot', accent: true },
  { id: 'm3', icon: '💎', name: '3 месяца', days: 90, servers: 7, price: 25, via: 'bot', accent: true },
  { id: 'm6', icon: '💎', name: '6 месяцев', days: 180, servers: 7, price: 100, via: 'bot', accent: true },
  { id: 'm12', icon: '💎', name: '12 месяцев', days: 365, servers: 7, price: 300, via: 'bot', accent: true },
];

const SERVERS = [
  { flag: '🇳🇱', name: 'Нидерланды', ping: 24 },
  { flag: '🇩🇪', name: 'Германия', ping: 31 },
  { flag: '🇫🇮', name: 'Финляндия', ping: 18 },
  { flag: '🇺🇸', name: 'США', ping: 92 },
  { flag: '🇸🇬', name: 'Сингапур', ping: 110 },
  { flag: '🇫🇷', name: 'Франция', ping: 38 },
  { flag: '🇬🇧', name: 'Британия', ping: 44 },
];

const TABS = [
  { id: 'home', label: 'Главная', icon: 'Home' },
  { id: 'plans', label: 'Тарифы', icon: 'Sparkles' },
  { id: 'devices', label: 'Устройства', icon: 'Smartphone' },
  { id: 'stats', label: 'Статистика', icon: 'BarChart3' },
  { id: 'profile', label: 'Профиль', icon: 'User' },
];

const vibrate = () => navigator.vibrate?.(60);

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState('home');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const saved = localStorage.getItem('svpn_session');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 3000);
    return () => clearInterval(t);
  }, []);

  const logout = () => {
    localStorage.removeItem('svpn_session');
    setUser(null);
    setTab('home');
  };

  if (!user) return <Auth mode={authMode} setMode={setAuthMode} onAuth={(u) => { setUser(u); localStorage.setItem('svpn_session', JSON.stringify(u)); }} />;

  return (
    <div className="min-h-screen pb-28 max-w-md mx-auto px-4">
      <Header user={user} now={now} />
      <main key={tab} className="animate-fadeup">
        {tab === 'home' && <HomeTab />}
        {tab === 'plans' && <PlansTab />}
        {tab === 'devices' && <DevicesTab />}
        {tab === 'stats' && <StatsTab />}
        {tab === 'profile' && <ProfileTab user={user} setUser={setUser} onLogout={logout} />}
      </main>
      <NavBar tab={tab} setTab={setTab} />
    </div>
  );
}

function Header({ user, now }: { user: User; now: number }) {
  return (
    <header className="flex items-center justify-between pt-6 pb-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/15 grid place-items-center text-2xl neon-border">🛡️</div>
        <div>
          <h1 className="font-display font-extrabold text-lg leading-none neon-text">SecureVPN</h1>
          <p className="text-xs text-muted-foreground">Привет, {user.name}</p>
        </div>
      </div>
      <div className="glass rounded-full px-3 py-1.5 flex items-center gap-2 text-xs animate-livepulse">
        <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(190_100%_50%)]" />
        Online
      </div>
    </header>
  );
}

function Auth({ mode, setMode, onAuth }: { mode: 'login' | 'register'; setMode: (m: 'login' | 'register') => void; onAuth: (u: User) => void }) {
  const [name, setName] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');

  const submit = () => {
    if (!name.trim() || !pass.trim()) { vibrate(); toast.error('Заполните все поля'); return; }
    const dbKey = `svpn_user_${name.trim().toLowerCase()}`;
    if (mode === 'register') {
      if (pass !== pass2) { vibrate(); toast.error('Пароли не совпадают'); return; }
      if (localStorage.getItem(dbKey)) { vibrate(); toast.error('Пользователь уже существует'); return; }
      const u: User = { name: name.trim(), password: pass };
      localStorage.setItem(dbKey, JSON.stringify(u));
      toast.success('Аккаунт создан!');
      onAuth(u);
    } else {
      const raw = localStorage.getItem(dbKey);
      if (!raw) { vibrate(); toast.error('Пользователь не найден'); return; }
      const u: User = JSON.parse(raw);
      if (u.password !== pass) { vibrate(); toast.error('Неверный пароль'); return; }
      toast.success('С возвращением!');
      onAuth(u);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-5">
      <div className="w-full max-w-sm animate-pop">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/15 grid place-items-center text-4xl neon-glow mb-4">🛡️</div>
          <h1 className="font-display font-black text-3xl neon-text">SecureVPN</h1>
          <p className="text-muted-foreground text-sm mt-1">Защищённый доступ в один клик</p>
        </div>
        <div className="glass rounded-3xl p-6 space-y-4">
          <div className="flex gap-2 p-1 bg-secondary/60 rounded-xl">
            {(['login', 'register'] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${mode === m ? 'bg-primary text-primary-foreground neon-glow' : 'text-muted-foreground'}`}>
                {m === 'login' ? 'Вход' : 'Регистрация'}
              </button>
            ))}
          </div>
          <Input placeholder="Имя пользователя" value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary/60 border-border h-12 rounded-xl" />
          <Input type="password" placeholder="Пароль" value={pass} onChange={(e) => setPass(e.target.value)} className="bg-secondary/60 border-border h-12 rounded-xl" />
          {mode === 'register' && (
            <Input type="password" placeholder="Повторите пароль" value={pass2} onChange={(e) => setPass2(e.target.value)} className="bg-secondary/60 border-border h-12 rounded-xl animate-fadeup" />
          )}
          <Button onClick={submit} className="w-full h-12 rounded-xl font-bold text-base neon-glow">
            {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, delay = 0 }: { icon: string; value: string; label: string; delay?: number }) {
  return (
    <div className="glass rounded-2xl p-4 animate-fadeup" style={{ animationDelay: `${delay}ms` }}>
      <Icon name={icon} className="text-primary mb-2" size={22} />
      <div className="font-display font-extrabold text-xl">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function HomeTab() {
  return (
    <div className="space-y-4">
      <div className="glass rounded-3xl p-6 relative overflow-hidden animate-fadeup">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/20 blur-3xl" />
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Текущий тариф</p>
        <h2 className="font-display font-black text-2xl mt-1 neon-text">Триал · 3 дня</h2>
        <div className="flex items-center gap-2 mt-3">
          <span className="px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold">Активна</span>
          <span className="text-xs text-muted-foreground">истекает 29 июня 2026</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon="Server" value="3" label="Серверов" delay={60} />
        <StatCard icon="Smartphone" value="2" label="Устройства" delay={120} />
        <StatCard icon="Clock" value="3 дн" label="Осталось" delay={180} />
      </div>
      <div className="glass rounded-3xl p-5 animate-fadeup" style={{ animationDelay: '240ms' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold">Доступные серверы</h3>
          <Icon name="Wifi" className="text-primary" size={18} />
        </div>
        <div className="space-y-2">
          {SERVERS.slice(0, 3).map((s) => (
            <div key={s.name} className="flex items-center justify-between py-2 px-3 rounded-xl bg-secondary/40">
              <div className="flex items-center gap-3"><span className="text-xl">{s.flag}</span><span className="text-sm font-medium">{s.name}</span></div>
              <span className="text-xs text-primary font-mono">{s.ping} ms</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlansTab() {
  return (
    <div className="space-y-3">
      <h2 className="font-display font-extrabold text-xl mb-1">Тарифы</h2>
      {PLANS.map((p, i) => (
        <div key={p.id} className={`glass rounded-2xl p-4 flex items-center justify-between animate-fadeup ${p.accent ? 'neon-border' : ''}`} style={{ animationDelay: `${i * 60}ms` }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{p.icon}</span>
            <div>
              <div className="font-display font-bold">{p.name}</div>
              <div className="text-xs text-muted-foreground">{p.days} дней · {p.servers} серверов</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display font-extrabold text-primary">{p.price === 0 ? 'FREE' : `${p.price}⭐`}</div>
            <div className="text-[10px] text-muted-foreground">{p.via === 'app' ? 'в приложении' : 'через бота'}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DevicesTab() {
  const devices = [
    { name: 'iPhone 15 Pro', icon: 'Smartphone', current: true },
    { name: 'MacBook Air', icon: 'Laptop', current: false },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-extrabold text-xl">Устройства</h2>
        <span className="text-xs text-muted-foreground">2 из 2</span>
      </div>
      {devices.map((d, i) => (
        <div key={d.name} className="glass rounded-2xl p-4 flex items-center justify-between animate-fadeup" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 grid place-items-center"><Icon name={d.icon} className="text-primary" size={20} /></div>
            <div>
              <div className="font-semibold text-sm">{d.name}</div>
              {d.current && <div className="text-[10px] text-primary">Текущее устройство</div>}
            </div>
          </div>
          <Icon name="Trash2" className="text-muted-foreground" size={18} />
        </div>
      ))}
      <Button className="w-full h-12 rounded-xl font-bold neon-glow"><Icon name="Plus" size={18} className="mr-1" /> Добавить устройство</Button>
    </div>
  );
}

function StatsTab() {
  const days = [40, 65, 30, 80, 55, 90, 70];
  return (
    <div className="space-y-4">
      <h2 className="font-display font-extrabold text-xl">Статистика</h2>
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon="ArrowDownUp" value="12.4 ГБ" label="Трафик за неделю" />
        <StatCard icon="ShieldCheck" value="148" label="Сессий защищено" delay={80} />
      </div>
      <div className="glass rounded-3xl p-5 animate-fadeup" style={{ animationDelay: '120ms' }}>
        <h3 className="font-display font-bold mb-4">Активность за неделю</h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {days.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-md bg-gradient-to-t from-primary/30 to-primary neon-glow" style={{ height: `${v}%` }} />
              <span className="text-[10px] text-muted-foreground">{['П','В','С','Ч','П','С','В'][i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ user, setUser, onLogout }: { user: User; setUser: (u: User) => void; onLogout: () => void }) {
  const ref = `https://t.me/SecureVPNbot?start=${user.name}`;
  const copyRef = () => { navigator.clipboard.writeText(ref); toast.success('Ссылка скопирована'); };
  const onAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const updated = { ...user, avatar: reader.result as string };
      setUser(updated);
      localStorage.setItem('svpn_session', JSON.stringify(updated));
      localStorage.setItem(`svpn_user_${user.name.toLowerCase()}`, JSON.stringify(updated));
      toast.success('Аватар обновлён');
    };
    reader.readAsDataURL(f);
  };
  return (
    <div className="space-y-4">
      <div className="glass rounded-3xl p-6 text-center animate-fadeup">
        <label className="block w-20 h-20 mx-auto rounded-2xl bg-primary/15 grid place-items-center text-4xl neon-glow mb-3 cursor-pointer overflow-hidden">
          {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : '👤'}
          <input type="file" accept="image/*" className="hidden" onChange={onAvatar} />
        </label>
        <h2 className="font-display font-extrabold text-xl">{user.name}</h2>
        <p className="text-xs text-muted-foreground">ID: #{Math.abs(user.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 137).toString().slice(0, 7)}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon="Gift" value="Использован" label="Триал" />
        <StatCard icon="Users" value="0" label="Приглашено" delay={80} />
      </div>
      <div className="glass rounded-2xl p-4 animate-fadeup" style={{ animationDelay: '120ms' }}>
        <p className="text-xs text-muted-foreground mb-2">Реферальная ссылка</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-secondary/50 rounded-lg px-3 py-2 text-xs truncate font-mono">{ref}</div>
          <Button size="sm" onClick={copyRef} className="rounded-lg"><Icon name="Copy" size={16} /></Button>
        </div>
      </div>
      <Button variant="outline" onClick={onLogout} className="w-full h-12 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10">
        <Icon name="LogOut" size={18} className="mr-1" /> Выйти
      </Button>
    </div>
  );
}

function NavBar({ tab, setTab }: { tab: string; setTab: (t: string) => void }) {
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md glass rounded-2xl px-2 py-2 flex justify-between z-50">
      {TABS.map((t) => (
        <button key={t.id} onClick={() => setTab(t.id)}
          className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl transition ${tab === t.id ? 'text-primary' : 'text-muted-foreground'}`}>
          <Icon name={t.icon} size={20} className={tab === t.id ? 'neon-text' : ''} />
          <span className="text-[10px] font-medium">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}