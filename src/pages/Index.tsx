import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const GIST_TRIAL = 'https://gist.githubusercontent.com/securevpn108-bot/44ed10a2807f6133217ad043246653e8/raw/c6fd74092b1cdc0c96b64daf5c53d4d99c825fc3/gistfile1.txt';
const GIST_FULL = 'https://gist.githubusercontent.com/securevpn108-bot/e44e70d388ef1c41b041f61ed42a07bc/raw/6739b118832d22209c7a5b13bc2fa9770214699c/gistfile1.txt';

type Device = { id: string; name: string; icon: string; current: boolean };
type SubHistory = { plan: string; date: string };
type Subscription = { planId: string; name: string; servers: number; maxDevices: number; expires: number; keys: string[] } | null;
type User = {
  name: string;
  password?: string;
  avatar?: string;
  provider?: 'local' | 'google' | 'telegram';
  trialUsed?: boolean;
  prem4Used?: boolean;
  invited?: number;
  devices?: Device[];
  history?: SubHistory[];
  sub?: Subscription;
};

const PLANS = [
  { id: 'trial', icon: '🎁', name: 'Триал', days: 3, servers: 7, maxDevices: 2, price: 0, via: 'app', accent: false, gist: GIST_TRIAL, keys: 3 },
  { id: 'prem4', icon: '🎁', name: 'Премиум 4д', days: 4, servers: 7, maxDevices: 4, price: 0, via: 'app', accent: false, gist: GIST_FULL, keys: 7 },
  { id: 'm1', icon: '💎', name: '1 месяц', days: 30, servers: 7, maxDevices: 4, price: 15, via: 'bot', accent: true, gist: GIST_FULL, keys: 7 },
  { id: 'm3', icon: '💎', name: '3 месяца', days: 90, servers: 7, maxDevices: 4, price: 25, via: 'bot', accent: true, gist: GIST_FULL, keys: 7 },
  { id: 'm6', icon: '💎', name: '6 месяцев', days: 180, servers: 7, maxDevices: 4, price: 100, via: 'bot', accent: true, gist: GIST_FULL, keys: 7 },
  { id: 'm12', icon: '💎', name: '12 месяцев', days: 365, servers: 7, maxDevices: 4, price: 300, via: 'bot', accent: true, gist: GIST_FULL, keys: 7 },
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
  { id: 'keys', label: 'Ключи', icon: 'Key' },
  { id: 'devices', label: 'Устройства', icon: 'Smartphone' },
  { id: 'profile', label: 'Профиль', icon: 'User' },
];

const vibrate = () => navigator.vibrate?.(60);
const isActive = (s: Subscription) => !!s && s.expires > Date.now();
const daysLeft = (s: Subscription) => (s ? Math.max(0, Math.ceil((s.expires - Date.now()) / 86400000)) : 0);
const fmtDate = (t: number) => new Date(t).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

function detectDevice(): { name: string; icon: string } {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return { name: 'iPhone', icon: 'Smartphone' };
  if (/Android/.test(ua)) return { name: 'Android', icon: 'Smartphone' };
  return { name: 'ПК', icon: 'Monitor' };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tg = (window as any).Telegram?.WebApp;

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState('home');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [, setNow] = useState(Date.now());

  const persist = useCallback((u: User) => {
    setUser(u);
    localStorage.setItem('svpn_session', JSON.stringify(u));
    localStorage.setItem(`svpn_user_${u.name.toLowerCase()}`, JSON.stringify(u));
  }, []);

  useEffect(() => {
    if (tg) { try { tg.ready(); tg.expand(); } catch { /* noop */ } }
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

  const deleteAccount = () => {
    if (user) {
      localStorage.removeItem(`svpn_user_${user.name.toLowerCase()}`);
      localStorage.removeItem('svpn_session');
    }
    setUser(null);
    setTab('home');
    toast.success('Аккаунт удалён');
  };

  if (!user) return <Auth mode={authMode} setMode={setAuthMode} onAuth={persist} />;

  return (
    <div className="min-h-screen pb-28 max-w-md mx-auto px-4">
      <Header user={user} />
      <main key={tab} className="animate-fadeup">
        {tab === 'home' && <HomeTab user={user} />}
        {tab === 'plans' && <PlansTab user={user} persist={persist} setTab={setTab} />}
        {tab === 'keys' && <KeysTab user={user} />}
        {tab === 'devices' && <DevicesTab user={user} persist={persist} />}
        {tab === 'profile' && <ProfileTab user={user} persist={persist} onLogout={logout} onDelete={deleteAccount} />}
      </main>
      <NavBar tab={tab} setTab={setTab} />
    </div>
  );
}

function Header({ user }: { user: User }) {
  const active = isActive(user.sub ?? null);
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
        <span className={`w-2 h-2 rounded-full ${active ? 'bg-primary shadow-[0_0_8px_hsl(190_100%_50%)]' : 'bg-muted-foreground'}`} />
        {active ? 'Online' : 'Offline'}
      </div>
    </header>
  );
}

function Auth({ mode, setMode, onAuth }: { mode: 'login' | 'register'; setMode: (m: 'login' | 'register') => void; onAuth: (u: User) => void }) {
  const [name, setName] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');

  const baseUser = (n: string, provider: User['provider'], password?: string): User => ({
    name: n, password, provider, trialUsed: false, prem4Used: false, invited: 0, devices: [], history: [], sub: null,
  });

  const submit = () => {
    if (!name.trim() || !pass.trim()) { vibrate(); toast.error('Заполните все поля'); return; }
    const dbKey = `svpn_user_${name.trim().toLowerCase()}`;
    if (mode === 'register') {
      if (pass !== pass2) { vibrate(); toast.error('Пароли не совпадают'); return; }
      if (localStorage.getItem(dbKey)) { vibrate(); toast.error('Пользователь уже существует'); return; }
      const u = baseUser(name.trim(), 'local', pass);
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

  const social = (provider: 'google' | 'telegram') => {
    let n = provider === 'google' ? 'Google User' : 'Telegram User';
    if (provider === 'telegram' && tg?.initDataUnsafe?.user) {
      const tu = tg.initDataUnsafe.user;
      n = tu.username || `${tu.first_name || 'User'}`;
    }
    const dbKey = `svpn_user_${n.toLowerCase()}`;
    const existing = localStorage.getItem(dbKey);
    const u: User = existing ? JSON.parse(existing) : baseUser(n, provider);
    localStorage.setItem(dbKey, JSON.stringify(u));
    toast.success(`Вход через ${provider === 'google' ? 'Google' : 'Telegram'}`);
    onAuth(u);
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
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" /> или <div className="flex-1 h-px bg-border" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => social('google')} className="h-12 rounded-xl bg-secondary/40 border-border">
              <Icon name="Mail" size={18} className="mr-1" /> Google
            </Button>
            <Button variant="outline" onClick={() => social('telegram')} className="h-12 rounded-xl bg-secondary/40 border-border">
              <Icon name="Send" size={18} className="mr-1" /> Telegram
            </Button>
          </div>
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

function HomeTab({ user }: { user: User }) {
  const sub = user.sub ?? null;
  const active = isActive(sub);
  return (
    <div className="space-y-4">
      <div className="glass rounded-3xl p-6 relative overflow-hidden animate-fadeup">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/20 blur-3xl" />
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Текущий тариф</p>
        <h2 className="font-display font-black text-2xl mt-1 neon-text">{active ? sub!.name : 'Нет подписки'}</h2>
        <div className="flex items-center gap-2 mt-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${active ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'}`}>
            {active ? 'Активна' : 'Не активна'}
          </span>
          {active && <span className="text-xs text-muted-foreground">истекает {fmtDate(sub!.expires)}</span>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon="Server" value={active ? String(sub!.servers) : '0'} label="Серверов" delay={60} />
        <StatCard icon="Smartphone" value={active ? String(sub!.maxDevices) : '0'} label="Устройства" delay={120} />
        <StatCard icon="Clock" value={active ? `${daysLeft(sub)} дн` : '—'} label="Осталось" delay={180} />
      </div>
      <div className="glass rounded-3xl p-5 animate-fadeup" style={{ animationDelay: '240ms' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold">Доступные серверы</h3>
          <Icon name="Wifi" className="text-primary" size={18} />
        </div>
        <div className="space-y-2">
          {SERVERS.slice(0, active ? sub!.servers : 0).map((s) => (
            <div key={s.name} className="flex items-center justify-between py-2 px-3 rounded-xl bg-secondary/40">
              <div className="flex items-center gap-3"><span className="text-xl">{s.flag}</span><span className="text-sm font-medium">{s.name}</span></div>
              <span className="text-xs text-primary font-mono">{s.ping} ms</span>
            </div>
          ))}
          {!active && <p className="text-sm text-muted-foreground text-center py-4">Оформите подписку, чтобы открыть серверы</p>}
        </div>
      </div>
    </div>
  );
}

async function fetchKeys(gist: string, count: number): Promise<string[]> {
  const res = await fetch(gist);
  const text = await res.text();
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  return lines.slice(0, count);
}

function PlansTab({ user, persist, setTab }: { user: User; persist: (u: User) => void; setTab: (t: string) => void }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<typeof PLANS[number] | null>(null);

  const activate = async (plan: typeof PLANS[number]) => {
    setLoading(plan.id);
    try {
      const keys = await fetchKeys(plan.gist, plan.keys);
      if (!keys.length) throw new Error('empty');
      const sub: Subscription = {
        planId: plan.id, name: plan.name, servers: plan.servers, maxDevices: plan.maxDevices,
        expires: Date.now() + plan.days * 86400000, keys,
      };
      const history = [...(user.history ?? []), { plan: plan.name, date: fmtDate(Date.now()) }];
      const updated: User = {
        ...user, sub, history,
        trialUsed: plan.id === 'trial' ? true : user.trialUsed,
        prem4Used: plan.id === 'prem4' ? true : user.prem4Used,
      };
      persist(updated);
      try { tg?.sendData?.(JSON.stringify({ action: 'activate_free', plan: plan.id })); } catch { /* noop */ }
      toast.success(`${plan.name} активирован! Загружено ключей: ${keys.length}`);
      setConfirm(null);
      setTab('keys');
    } catch {
      vibrate();
      toast.error('Не удалось загрузить ключи. Попробуйте ещё раз');
    } finally {
      setLoading(null);
    }
  };

  const onPlanClick = (plan: typeof PLANS[number]) => {
    if (plan.via === 'bot') {
      try { tg?.sendData?.(JSON.stringify({ action: 'buy', plan: plan.id, stars: plan.price })); } catch { /* noop */ }
      toast.info(`Оплата ${plan.price}⭐ откроется в боте`);
      return;
    }
    if (plan.id === 'trial' && user.trialUsed) { vibrate(); toast.error('Триал уже использован'); return; }
    if (plan.id === 'prem4' && user.prem4Used) { vibrate(); toast.error('Премиум 4д уже использован'); return; }
    setConfirm(plan);
  };

  return (
    <div className="space-y-3">
      <h2 className="font-display font-extrabold text-xl mb-1">Тарифы</h2>
      {PLANS.map((p, i) => (
        <button key={p.id} onClick={() => onPlanClick(p)}
          className={`w-full text-left glass rounded-2xl p-4 flex items-center justify-between animate-fadeup transition hover:scale-[1.02] ${p.accent ? 'neon-border' : ''}`}
          style={{ animationDelay: `${i * 60}ms` }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{p.icon}</span>
            <div>
              <div className="font-display font-bold">{p.name}</div>
              <div className="text-xs text-muted-foreground">{p.days} дней · {p.servers} серверов · {p.maxDevices} устр.</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display font-extrabold text-primary">{p.price === 0 ? 'FREE' : `${p.price}⭐`}</div>
            <div className="text-[10px] text-muted-foreground">{p.via === 'app' ? 'в приложении' : 'через бота'}</div>
          </div>
        </button>
      ))}

      {confirm && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 backdrop-blur-sm px-6" onClick={() => setConfirm(null)}>
          <div className="glass rounded-3xl p-6 w-full max-w-sm animate-pop" onClick={(e) => e.stopPropagation()}>
            <div className="text-4xl text-center mb-2">{confirm.icon}</div>
            <h3 className="font-display font-extrabold text-xl text-center">Активировать {confirm.name}?</h3>
            <p className="text-sm text-muted-foreground text-center mt-2">
              {confirm.days} дней · {confirm.servers} серверов · {confirm.keys} ключей
            </p>
            <div className="flex gap-3 mt-5">
              <Button variant="outline" onClick={() => setConfirm(null)} className="flex-1 h-12 rounded-xl border-border">Отмена</Button>
              <Button onClick={() => activate(confirm)} disabled={loading === confirm.id} className="flex-1 h-12 rounded-xl font-bold neon-glow">
                {loading === confirm.id ? 'Загрузка…' : 'Активировать'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KeysTab({ user }: { user: User }) {
  const sub = user.sub ?? null;
  const active = isActive(sub);

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success('Скопировано'); };
  const copyAll = () => { navigator.clipboard.writeText((sub?.keys ?? []).join('\n')); toast.success('Все ключи скопированы'); };

  if (!active) {
    return (
      <div className="space-y-4">
        <h2 className="font-display font-extrabold text-xl">Мои ключи</h2>
        <div className="glass rounded-3xl p-8 text-center animate-fadeup">
          <Icon name="Lock" className="text-muted-foreground mx-auto mb-3" size={40} />
          <p className="text-sm text-muted-foreground">Ключи доступны только при активной подписке</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-extrabold text-xl">Мои ключи</h2>
        <Button size="sm" onClick={copyAll} className="rounded-lg neon-glow"><Icon name="Copy" size={15} className="mr-1" /> Все</Button>
      </div>
      {sub!.keys.map((k, i) => (
        <div key={i} className="glass rounded-2xl p-4 animate-fadeup" style={{ animationDelay: `${i * 50}ms` }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-primary flex items-center gap-1"><span>{SERVERS[i]?.flag}</span> Ключ #{i + 1}</span>
            <button onClick={() => copy(k)} className="text-muted-foreground hover:text-primary"><Icon name="Copy" size={16} /></button>
          </div>
          <p className="text-[11px] font-mono break-all text-muted-foreground bg-secondary/40 rounded-lg p-2">{k}</p>
        </div>
      ))}
    </div>
  );
}

function DevicesTab({ user, persist }: { user: User; persist: (u: User) => void }) {
  const sub = user.sub ?? null;
  const active = isActive(sub);
  const max = active ? sub!.maxDevices : 2;
  const devices = user.devices ?? [];

  const addDevice = () => {
    if (devices.length >= max) { vibrate(); toast.error(`Лимит устройств: ${max}`); return; }
    const det = detectDevice();
    const hasCurrent = devices.some((d) => d.current);
    const newDevice: Device = { id: String(Date.now()), name: det.name, icon: det.icon, current: !hasCurrent };
    persist({ ...user, devices: [...devices, newDevice] });
    toast.success('Устройство добавлено');
  };

  const removeDevice = (id: string) => {
    persist({ ...user, devices: devices.filter((d) => d.id !== id) });
    toast.success('Устройство удалено');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-extrabold text-xl">Устройства</h2>
        <span className="text-xs text-muted-foreground">{devices.length} из {max}</span>
      </div>
      {devices.length === 0 && (
        <div className="glass rounded-3xl p-8 text-center animate-fadeup">
          <Icon name="Smartphone" className="text-muted-foreground mx-auto mb-3" size={36} />
          <p className="text-sm text-muted-foreground">Нет добавленных устройств</p>
        </div>
      )}
      {devices.map((d, i) => (
        <div key={d.id} className="glass rounded-2xl p-4 flex items-center justify-between animate-fadeup" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 grid place-items-center"><Icon name={d.icon} className="text-primary" size={20} /></div>
            <div>
              <div className="font-semibold text-sm">{d.name}</div>
              {d.current && <div className="text-[10px] text-primary">Текущее устройство</div>}
            </div>
          </div>
          <button onClick={() => removeDevice(d.id)} className="text-muted-foreground hover:text-destructive"><Icon name="Trash2" size={18} /></button>
        </div>
      ))}
      <Button onClick={addDevice} className="w-full h-12 rounded-xl font-bold neon-glow"><Icon name="Plus" size={18} className="mr-1" /> Добавить устройство</Button>
    </div>
  );
}

function ProfileTab({ user, persist, onLogout, onDelete }: { user: User; persist: (u: User) => void; onLogout: () => void; onDelete: () => void }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const ref = `https://t.me/SecureVPNbot?start=${user.name}`;
  const copyRef = () => { navigator.clipboard.writeText(ref); toast.success('Ссылка скопирована'); };
  const onAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => { persist({ ...user, avatar: reader.result as string }); toast.success('Аватар обновлён'); };
    reader.readAsDataURL(f);
  };
  const uid = Math.abs(user.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 137).toString().slice(0, 7);

  return (
    <div className="space-y-4">
      <div className="glass rounded-3xl p-6 text-center animate-fadeup">
        <label className="block w-20 h-20 mx-auto rounded-2xl bg-primary/15 grid place-items-center text-4xl neon-glow mb-3 cursor-pointer overflow-hidden">
          {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : '👤'}
          <input type="file" accept="image/*" className="hidden" onChange={onAvatar} />
        </label>
        <h2 className="font-display font-extrabold text-xl">{user.name}</h2>
        <p className="text-xs text-muted-foreground">ID: #{uid}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon="Gift" value={user.trialUsed ? 'Использован' : 'Доступен'} label="Триал" />
        <StatCard icon="Crown" value={user.prem4Used ? 'Использован' : 'Доступен'} label="Премиум 4д" delay={60} />
        <StatCard icon="Users" value={String(user.invited ?? 0)} label="Приглашено" delay={120} />
        <StatCard icon="History" value={String(user.history?.length ?? 0)} label="Подписок" delay={180} />
      </div>

      {!!user.history?.length && (
        <div className="glass rounded-2xl p-4 animate-fadeup" style={{ animationDelay: '200ms' }}>
          <h3 className="font-display font-bold text-sm mb-2">История подписок</h3>
          <div className="space-y-1">
            {user.history.slice().reverse().map((h, i) => (
              <div key={i} className="flex justify-between text-xs py-1.5 border-b border-border/40 last:border-0">
                <span className="font-medium">{h.plan}</span>
                <span className="text-muted-foreground">{h.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-4 animate-fadeup" style={{ animationDelay: '240ms' }}>
        <p className="text-xs text-muted-foreground mb-2">Реферальная ссылка</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-secondary/50 rounded-lg px-3 py-2 text-xs truncate font-mono">{ref}</div>
          <Button size="sm" onClick={copyRef} className="rounded-lg"><Icon name="Copy" size={16} /></Button>
        </div>
      </div>

      <Button variant="outline" onClick={onLogout} className="w-full h-12 rounded-xl border-border">
        <Icon name="LogOut" size={18} className="mr-1" /> Выйти
      </Button>
      <Button variant="outline" onClick={() => setConfirmDel(true)} className="w-full h-12 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10">
        <Icon name="Trash2" size={18} className="mr-1" /> Удалить аккаунт
      </Button>

      {confirmDel && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 backdrop-blur-sm px-6" onClick={() => setConfirmDel(false)}>
          <div className="glass rounded-3xl p-6 w-full max-w-sm animate-pop" onClick={(e) => e.stopPropagation()}>
            <Icon name="TriangleAlert" className="text-destructive mx-auto mb-2" size={40} />
            <h3 className="font-display font-extrabold text-xl text-center">Удалить аккаунт?</h3>
            <p className="text-sm text-muted-foreground text-center mt-2">Все данные, ключи и подписка будут удалены безвозвратно.</p>
            <div className="flex gap-3 mt-5">
              <Button variant="outline" onClick={() => setConfirmDel(false)} className="flex-1 h-12 rounded-xl border-border">Отмена</Button>
              <Button onClick={onDelete} className="flex-1 h-12 rounded-xl font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90">Удалить</Button>
            </div>
          </div>
        </div>
      )}
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
