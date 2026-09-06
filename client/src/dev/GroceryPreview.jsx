/**
 * Dev-only visual harness for the shared grocery list.
 *
 * Every grocery screen sits behind auth, so the only way anyone had been
 * reviewing them was to log in on a phone — which is also how the "manage list"
 * crash and the RTL problems were found. This mounts the REAL screens (page,
 * share sheet, invite preview, welcome, bottom nav) against a fake API, so
 * layout, direction, dark mode and render crashes are all reviewable here
 * without anyone's credentials.
 *
 * It uses the real stores and the real translation files: a missing key, an
 * English leak or an unmirrored glyph shows up here exactly as in the app.
 *
 * Served from /grocery-preview.html and never part of the app bundle (Vite only
 * builds index.html). The fixture is synthetic.
 */

import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import '../index.css';
import { api } from '../api';
import useAuthStore from '../stores/authStore';
import useTranslationStore from '../stores/translationStore';

// ─── Fixture ────────────────────────────────────────────────────────────────

const ME = 1;

const MEMBERS = [
  { user_id: ME, role: 'owner', first_name: 'חננאל', last_name: null, username: 'hananel', avatar: null },
  { user_id: 44, role: 'member', first_name: 'נופר', last_name: 'רומי', username: 'nofar', avatar: null },
  { user_id: 49, role: 'member', first_name: null, last_name: null, username: 'nissimcohen_10867526', avatar: null },
];

const item = (id, name, category_key, over = {}) => ({
  id, name, category_key, quantity: 1, unit: 'unit', note: null,
  image_url: null, product_url: null, is_purchased: false, purchased_at: null,
  purchased_by: null, added_by: ME, version: 1,
  editing_user_id: null, editing_until: null, ...over,
});

const ITEMS = [
  item(1, 'עגבניות שרי', 'produce'),
  item(2, 'מלפפונים', 'produce', { quantity: 2, unit: 'kg' }),
  item(3, 'חלב 3%', 'dairy_eggs', { note: 'תנובה בלבד' }),
  item(4, 'יוגורט יווני', 'dairy_eggs', {
    product_url: 'https://example.com/greek-yogurt',
    image_url: 'https://placehold.co/600x600/png',
  }),
  item(5, 'שוקו', 'dairy_eggs'),
  item(6, 'פרגיות', 'meat_fish', { quantity: 1.5, unit: 'kg' }),
  item(7, 'לחם אחיד', 'bakery', {
    is_purchased: true, purchased_at: new Date().toISOString(), purchased_by: 44,
  }),
];

const STATE = {
  list: { id: 2, name: 'Household', version: 97, role: 'owner', owner_id: ME },
  members: MEMBERS,
  items: ITEMS,
  trip: { id: 3, status: 'active' },
  pendingInvitations: [],
};

/** A brand-new account: their own list, nobody else on it, nothing in it. */
const FRESH_STATE = {
  list: { id: 4, name: 'Household', version: 1, role: 'owner', owner_id: ME },
  members: [MEMBERS[0]],
  items: [],
  trip: { id: 5, status: 'active' },
  pendingInvitations: [],
};

/** Which fixture the fake API answers with. Flipped by the toolbar. */
const fixture = { state: STATE, invitations: true, linkFails: false, multiList: false };

const INVITATION = {
  token: 'preview-token',
  listName: 'Household',
  memberCount: 2,
  status: 'pending',
  expiresAt: new Date(Date.now() + 6 * 864e5).toISOString(),
  expired: false,
  addressedToMe: true,
  isOpenLink: true,
  alreadyMember: false,
  inviter: { firstName: 'משה', lastName: null, username: 'user_10059961', avatar: null },
};

const NOTIFICATIONS = [
  {
    id: 1, type: 'grocery_invite', is_read: false, created_at: new Date().toISOString(),
    data: { inviterName: 'משה', token: 'preview-token', link: '/grocery/invite/preview-token' },
  },
  {
    id: 2, type: 'transaction_created', is_read: true, title: 'Transaction added',
    body: 'A new expense landed', created_at: new Date().toISOString(), data: {},
  },
];

// ─── Fake API ───────────────────────────────────────────────────────────────
// Assigning onto the shared `api` object is enough: every consumer reads
// `api.grocery.<fn>` at call time.

const okp = (data) => Promise.resolve({ success: true, data });
const byId = (id) => ITEMS.find((row) => row.id === id);

api.grocery = {
  getState: () => okp(fixture.state),
  addItem: () => okp({ item: item(99, 'פריט חדש', 'other'), version: 98 }),
  updateItem: (id, payload) => okp({ item: { ...byId(id), ...payload }, version: 98 }),
  setPurchased: (id, purchased) => okp({ item: { ...byId(id), is_purchased: purchased }, version: 98 }),
  deleteItem: () => okp({ version: 98 }),
  claimItem: () => okp({ editingUntil: new Date(Date.now() + 9e4).toISOString() }),
  releaseItem: () => okp({}),
  completeTrip: () => okp({ tripId: 3, carriedOver: 2 }),
  getHistory: () => okp({ trips: [], pagination: { hasMore: false } }),
  getTripDetail: () => okp({ trip: {}, items: [] }),
  getMyInvitations: () => okp(fixture.invitations
    ? [{ token: 'preview-token', inviter_first_name: 'משה', inviter_username: 'user_10059961', list_name: 'Household' }]
    : []),
  previewInvitation: () => okp(INVITATION),
  acceptInvitation: () => okp({ listId: 4 }),
  declineInvitation: () => okp({}),
  getLists: () => okp(fixture.multiList
    ? [
        { id: 2, role: 'owner', isOwn: true, ownerName: 'חננאל', memberCount: 3, openItems: 6, isActive: true },
        { id: 4, role: 'member', isOwn: false, ownerName: 'משה', memberCount: 2, openItems: 0, isActive: false },
      ]
    : [{ id: 2, role: 'owner', isOwn: true, ownerName: 'חננאל', memberCount: 3, openItems: 6, isActive: true }]),
  openList: () => okp({ listId: 4 }),
  setActiveList: () => {},
  getShareLink: () => (fixture.linkFails
    ? Promise.resolve({ success: false, error: { code: 'GROCERY_OWNER_ONLY' } })
    : okp({ inviteUrl: 'https://spend-wise-kappa.vercel.app/grocery/invite/preview-token' })),
  createShareLink: () => okp({ inviteUrl: 'https://spend-wise-kappa.vercel.app/grocery/invite/preview-token' }),
  revokeShareLink: () => okp({ revoked: true }),
  invite: () => okp({}),
  cancelInvite: () => okp({}),
  removeMember: () => okp({}),
  leave: () => okp({}),
  disband: () => okp({}),
  uploadItemImage: () => okp({ imageUrl: 'https://placehold.co/600x600/png' }),
  scrapeUrl: () => okp({}),
  parseHtml: () => okp({}),
};

api.notifications = {
  getAll: () => okp({ notifications: NOTIFICATIONS, unreadCount: 1 }),
  markAllRead: () => okp({}),
  markRead: () => okp({}),
  clearRead: () => okp({}),
};

// ─── Screens ────────────────────────────────────────────────────────────────

import GroceryListPage from '../pages/GroceryListPage';
import GroceryInvitePage from '../pages/GroceryInvitePage';
import WelcomeOnboarding from '../components/common/WelcomeOnboarding';
import MobileBottomNav from '../components/common/MobileBottomNav';
import GroceryModeHeader from '../components/layout/GroceryModeHeader';
import HomePickerScreen from '../components/common/HomePickerScreen';

const SCREENS = ['list', 'invite', 'welcome', 'picker'];

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

const preferences = (seen) => ({
  default_home: 'grocery',
  home_preference_set: true,
  onboarding_seen: seen ? { grocery: true } : {},
});

function Preview() {
  const [lang, setLang] = useState('he');
  const [dark, setDark] = useState(false);
  const [screen, setScreen] = useState('list');
  const [ready, setReady] = useState(false);
  const [fresh, setFresh] = useState(false);
  const [multi, setMulti] = useState(false);

  useEffect(() => {
    let alive = true;
    useTranslationStore.getState().actions.setLanguage(lang).then(() => {
      if (alive) setReady(true);
    });
    return () => { alive = false; };
  }, [lang]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const changeFixture = (nextFresh, nextMulti) => {
    fixture.state = nextFresh ? FRESH_STATE : STATE;
    fixture.invitations = !nextFresh;
    fixture.multiList = nextMulti;
    queryClient.clear();
    setFresh(nextFresh);
    setMulti(nextMulti);
  };

  // The welcome screen renders only while its mode is unseen.
  useEffect(() => {
    useAuthStore.setState({
      user: {
        id: ME,
        email: 'preview@example.com',
        username: 'hananel',
        first_name: 'חננאל',
        preferences: preferences(screen !== 'welcome'),
      },
      isAuthenticated: true,
      isLoading: false,
    });
  }, [screen]);

  if (!ready) return <p style={{ padding: 24, fontFamily: 'system-ui' }}>loading translations…</p>;

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        key={`${screen}:${fresh}:${multi}`}
        initialEntries={['/grocery', '/grocery/invite/preview-token']}
        initialIndex={screen === 'invite' ? 1 : 0}
      >
        <div className={dark ? 'dark' : ''}>
          <div className="fixed inset-x-2 top-2 z-[300] flex flex-wrap gap-1.5 sm:end-auto">
            <button onClick={() => setLang(lang === 'he' ? 'en' : 'he')} className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-white">{lang.toUpperCase()}</button>
            <button onClick={() => setDark(!dark)} className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-white">{dark ? 'dark' : 'light'}</button>
            <button onClick={() => changeFixture(!fresh, multi)} className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-white">{fresh ? 'new user' : 'full'}</button>
            <button onClick={() => changeFixture(fresh, !multi)} className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-white">{multi ? '2 lists' : '1 list'}</button>
            {SCREENS.map((id) => (
              <button
                key={id}
                onClick={() => setScreen(id)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${screen === id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700'}`}
              >
                {id}
              </button>
            ))}
          </div>

          <div className="pt-20 sm:pt-10">
            {screen === 'picker' && <HomePickerScreen />}
            {screen === 'welcome' && <WelcomeOnboarding />}
            <GroceryModeHeader />
            <Routes>
              <Route path="/grocery" element={<GroceryListPage />} />
              <Route path="/grocery/invite/:token" element={<GroceryInvitePage />} />
            </Routes>
            <MobileBottomNav />
          </div>
          <Toaster position="top-center" />
        </div>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById('preview-root')).render(<Preview />);
