import React, { useState, useEffect } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useAuth, useTranslation, useTranslationStore } from '../../../stores';
import { cn } from '../../../utils/helpers';
import queryClient from '../../../config/queryClient';

const Row = ({ label, value, onChange, options }) => (
  <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700 last:border-0 gap-4">
    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">{label}</span>
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-sm ps-3 pe-8 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none cursor-pointer appearance-none transition-colors duration-150"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
    </div>
  </div>
);

export const PreferencesTab = ({ user, authToasts }) => {
  const { updateProfile } = useAuth();
  const { t }             = useTranslation('profile');
  const [isLoading, setIsLoading] = useState(false);

  const resolveDefaultHome = (u) => {
    if (u?.preferences?.default_home) return u.preferences.default_home;
    if (u?.preferences?.shopping_list_as_default_page) return 'shopping';
    return 'dashboard';
  };

  // Currency is deliberately NOT a preference: all synced bank data is ILS,
  // and a display-currency picker that only swaps the symbol shows wrong
  // amounts (₪14,632 rendered as "$14,632").
  const buildPrefs = (u) => ({
    language_preference: u?.language_preference  || 'en',
    theme_preference:    u?.theme_preference      || 'system',
    default_home:        resolveDefaultHome(u),
  });

  const [prefs, setPrefs]       = useState(() => buildPrefs(user));
  const [original, setOriginal] = useState(() => buildPrefs(user));

  useEffect(() => {
    const p = buildPrefs(user);
    setPrefs(p);
    setOriginal(p);
  }, [user?.language_preference, user?.theme_preference, user?.preferences?.default_home, user?.preferences?.shopping_list_as_default_page]);

  const isDirty = Object.keys(prefs).some(k => prefs[k] !== original[k]);

  const handleSave = async () => {
    if (!isDirty) return;
    setIsLoading(true);
    try {
      const { default_home, ...flatPrefs } = prefs;
      const result = await updateProfile({
        ...flatPrefs,
        preferences: {
          ...(user?.preferences || {}),
          default_home,
          home_preference_set: true,
          shopping_list_as_default_page: default_home === 'shopping',
        },
      });
      if (!result.success) throw new Error(result.error?.message);

      if (prefs.theme_preference === 'dark')      document.documentElement.classList.add('dark');
      else if (prefs.theme_preference === 'light') document.documentElement.classList.remove('dark');
      else document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (prefs.language_preference !== user?.language_preference)
        useTranslationStore.getState().actions?.setLanguage?.(prefs.language_preference);

      // Update session flags so nav/header switch immediately (React Query cache is still stale)
      try {
        sessionStorage.removeItem('sw_home_redirect');
        sessionStorage.setItem('sw_picker_done', '1');
        sessionStorage.setItem('sw_app_mode', default_home);
      } catch (_) {}

      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      setOriginal(prefs);
      authToasts.preferencesUpdated?.();
      // The new default-home preference applies on the next visit — saving a setting should not
      // yank the user off the profile page they are on.
    } catch {
      authToasts.profileUpdateFailed?.();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className={cn(
        'bg-white dark:bg-gray-800 rounded-2xl border-2 shadow-sm px-5 py-2 transition-colors duration-200',
        isDirty ? 'border-indigo-200 dark:border-indigo-700/60' : 'border-gray-100 dark:border-gray-700'
      )}>
        <Row
          label={t('preferences.language.language') || 'Language'}
          value={prefs.language_preference}
          onChange={v => setPrefs(p => ({ ...p, language_preference: v }))}
          options={[{ value: 'en', label: 'English' }, { value: 'he', label: 'עברית (Hebrew)' }]}
        />
        <Row
          label={t('preferences.display.theme') || 'Theme'}
          value={prefs.theme_preference}
          onChange={v => setPrefs(p => ({ ...p, theme_preference: v }))}
          options={[
            { value: 'system', label: t('preferences.themeOptions.system') || 'System' },
            { value: 'light',  label: t('preferences.themeOptions.light')  || 'Light'  },
            { value: 'dark',   label: t('preferences.themeOptions.dark')   || 'Dark'   },
          ]}
        />
        {/* Default home picker */}
        <div className="py-3 border-t border-gray-100 dark:border-gray-700 mt-1">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('preferences.defaultHome') || 'Open the app on'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'dashboard', emoji: '📊', label: t('preferences.homeOptions.dashboard') || 'Dashboard' },
              { id: 'shopping',  emoji: '🛒', label: t('preferences.homeOptions.shopping')  || 'Shopping' },
            ].map(opt => {
              const active = prefs.default_home === opt.id || (opt.id === 'dashboard' && !['shopping'].includes(prefs.default_home));
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPrefs(p => ({ ...p, default_home: opt.id }))}
                  className={cn(
                    'flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-xs font-bold transition-all duration-150',
                    active
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                      : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                  )}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <span>{opt.label}</span>
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isLoading || !isDirty}
        className={cn(
          'h-11 px-6 rounded-xl text-sm font-semibold text-white transition-all duration-150 flex items-center gap-2',
          isDirty && !isLoading
            ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/25 cursor-pointer'
            : 'bg-indigo-300 dark:bg-indigo-800 cursor-not-allowed opacity-60'
        )}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {t('preferences.savePreferences') || 'Save Preferences'}
      </button>
    </div>
  );
};

export default PreferencesTab;
