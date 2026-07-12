/**
 * HelpCenter — the in-app help surface, opened from the Help action.
 *
 * This is deliberately NOT onboarding. Onboarding is the guided first-run
 * (auto-shown once, right after signup); Help is an always-available reference
 * that tells you where each feature lives and how the bank/credit model works.
 * A "Replay setup" button re-opens onboarding for anyone who wants the guided
 * run again.
 *
 * Presentation: bottom sheet on mobile, right-hand side drawer on desktop
 * (shared Modal `sheet` mode), with the same liquid-tab language as the rest
 * of the app.
 */

import React, { useState } from 'react';
import {
  LayoutDashboard, Receipt, Building2, BarChart3, User, PlusCircle,
  Landmark, CreditCard, Compass, Sparkles, PlayCircle, CalendarClock,
} from 'lucide-react';

import { Modal, LiquidTabs } from '../../ui';
import { useTranslation } from '../../../stores';

const HelpCenter = ({ isOpen, onClose }) => {
  const { currentLanguage } = useTranslation();
  const he = currentLanguage === 'he';
  const [tab, setTab] = useState('navigate');

  const tabs = [
    { id: 'navigate', label: he ? 'איפה הכל' : 'Where things are', icon: Compass },
    { id: 'start',    label: he ? 'איך מתחילים' : 'Getting started', icon: Sparkles },
    { id: 'model',    label: he ? 'בנק מול אשראי' : 'Bank vs cards',  icon: Landmark },
  ];

  const pages = [
    { icon: LayoutDashboard, title: he ? 'דשבורד' : 'Dashboard',        desc: he ? 'יתרת עו״ש + סיכום החודש הקלנדרי' : "Checking balance + this calendar month's summary", where: he ? 'טאב הבית' : 'Home tab' },
    { icon: Receipt,         title: he ? 'עסקאות' : 'Transactions',      desc: he ? 'כל העסקאות — הקש על עסקה לפרטים מלאים' : 'All transactions — tap one for full details', where: he ? 'טאב העסקאות' : 'Transactions tab' },
    { icon: Building2,       title: he ? 'סנכרון בנקים' : 'Bank Sync',   desc: he ? 'חיבור וניהול חשבונות בנק וכרטיסי אשראי' : 'Connect & manage bank + card accounts',    where: he ? 'טאב הבנק' : 'Bank tab' },
    { icon: BarChart3,       title: he ? 'תובנות' : 'Insights',          desc: he ? 'חודשים קודמים, דפוסים חוזרים ופילוח' : 'Past months, recurring patterns & breakdown', where: he ? 'תפריט ה־+' : 'The + (FAB) menu' },
    { icon: PlusCircle,      title: he ? 'הוספה מהירה' : 'Quick add',    desc: he ? 'הכנסה או הוצאה חד־פעמית' : 'A one-time income or expense',                          where: he ? 'תפריט ה־+' : 'The + (FAB)' },
    { icon: User,            title: he ? 'פרופיל' : 'Profile',           desc: he ? 'פרטים, העדפות, אבטחה וייצוא' : 'Details, preferences, security & export',            where: he ? 'טאב הפרופיל' : 'Profile tab' },
  ];

  const steps = [
    { icon: Building2,     title: he ? 'חברו חשבון' : 'Connect an account',   desc: he ? 'בטאב הבנק — חשבון בנק לתזרים ויתרה, חברת אשראי לפירוט קניות. או פשוט הוסיפו עסקאות ידנית.' : 'On the Bank tab — a bank account for cash flow & balance, a credit company for itemized purchases. Or just add transactions manually.' },
    { icon: CalendarClock, title: he ? 'בדקו את חלון המשכורת' : 'Review the salary window', desc: he ? 'החודש הקלנדרי מסכם את החשבונות; חלון משכורת־למשכורת מופיע בנפרד כדי להסביר את קצב התזרים.' : 'Calendar months summarize your accounts; the separate salary-to-salary window explains cash-flow pace.' },
    { icon: LayoutDashboard, title: he ? 'עקבו בדשבורד' : 'Track on the dashboard', desc: he ? 'יתרת העו״ש וסיכום החודש תמיד מולכם. לתובנות עמוקות יותר — תפריט ה־+.' : 'Checking balance and the current calendar month stay front and centre. For deeper insight, open the + menu.' },
  ];

  const models = [
    { icon: Landmark,   tint: 'from-indigo-500 to-blue-600',   title: he ? 'חשבון בנק' : 'Bank account',     desc: he ? 'מציג יתרה אמיתית ותזרים — הכסף שנכנס ויצא מהחשבון.' : 'Shows a real balance and cash flow — money in and out of the account.' },
    { icon: CreditCard, tint: 'from-violet-500 to-purple-600', title: he ? 'חברת אשראי' : 'Credit company', desc: he ? 'מציגה רכישות מפורטות. אין לה "יתרה" — רק חיובים.' : 'Shows itemized purchases. It has no balance — only charges.' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      sheet
      drawerWidth={460}
      title={he ? 'מרכז העזרה' : 'Help center'}
    >
      <div className="space-y-4" style={{ direction: he ? 'rtl' : 'ltr' }}>
        <LiquidTabs tabs={tabs} active={tab} onChange={setTab} size="sm" />

        {tab === 'navigate' && (
          <div className="space-y-2">
            <p className="px-1 text-xs text-gray-500 dark:text-gray-400">
              {he ? 'לאן ללכת לכל דבר:' : 'Where to go for each thing:'}
            </p>
            {pages.map(({ icon: Icon, title, desc, where }) => (
              <div key={title} className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
                  <Icon className="h-4.5 w-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                </div>
                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  {where}
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === 'start' && (
          <div className="space-y-2.5">
            {steps.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                  <Icon className="h-4.5 w-[18px]" />
                  <span className="absolute -top-1.5 -end-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-black text-indigo-600 shadow dark:bg-gray-900">
                    {i + 1}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{title}</p>
                  <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'model' && (
          <div className="space-y-2.5">
            {models.map(({ icon: Icon, tint, title, desc }) => (
              <div key={title} className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ${tint}`}>
                  <Icon className="h-4.5 w-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{title}</p>
                  <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
            <p className="rounded-2xl border border-indigo-100 bg-indigo-50 p-3 text-xs leading-relaxed text-indigo-900 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-100">
              {he
                ? 'SpendWise מחבר בין השניים — כשחיוב הכרטיס יורד מהבנק, הוא לא נספר פעמיים.'
                : 'SpendWise links the two — when the card bill hits your bank, it is not counted twice.'}
            </p>
          </div>
        )}

        {/* Onboarding is separate — offer it explicitly, don't force it */}
        <button
          onClick={() => { onClose?.(); try { window.dispatchEvent(new Event('open-onboarding')); } catch (_) {} }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <PlayCircle className="h-4 w-4" />
          {he ? 'הצגת מדריך ההקמה מחדש' : 'Replay the setup guide'}
        </button>
      </div>
    </Modal>
  );
};

export default HelpCenter;
