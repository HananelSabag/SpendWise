/**
 * ShoppingBottomSheet — Add / Edit shopping wishlist item
 *
 * Smart features:
 * - Paste URL → auto-scrape image + title (server proxy → client relay fallback)
 * - Manual image URL input when scraping fails or user wants custom image
 * - Auto-detect category from product name (keywords)
 * - Quick-price chips (₪50 / ₪100 / ₪200 / ₪500 / ₪1000)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Link2, StickyNote, Tag, DollarSign, Check,
  ImageIcon, X, Loader2, Camera, AlertCircle, Pencil, Wand2, RotateCcw,
} from 'lucide-react';
import BottomSheet from '../../common/BottomSheet';
import { cn } from '../../../utils/helpers';
import { useTranslation } from '../../../stores';
import { api } from '../../../api';

// ── Categories ────────────────────────────────────────────────────────────────
export const CATEGORIES = [
  { value: 'ריהוט',      key: 'furniture',   emoji: '🛋️', color: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-500'  },
  { value: 'מטבח',       key: 'kitchen',     emoji: '🍳', color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  { value: 'חדר שינה',   key: 'bedroom',     emoji: '🛏️', color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  { value: 'אלקטרוניקה', key: 'electronics', emoji: '📱', color: 'bg-blue-100 text-blue-700 border-blue-200',       dot: 'bg-blue-500'   },
  { value: 'ביגוד',      key: 'clothing',    emoji: '👕', color: 'bg-pink-100 text-pink-700 border-pink-200',       dot: 'bg-pink-500'   },
  { value: 'אחר',        key: 'other',       emoji: '📦', color: 'bg-gray-100 text-gray-600 border-gray-200',       dot: 'bg-gray-400'   },
];

const QUICK_PRICES = [50, 100, 200, 500, 1000];

const EMPTY = { name: '', category: 'אחר', price_ils: '', buy_url: '', notes: '', image_url: '' };

// ── Smart category detection ─────────────────────────────────────────────────
const detectCategory = (name) => {
  if (!name) return null;
  const n = name.toLowerCase();
  if (/טלפון|סמארטפון|מחשב|לפטופ|אוזניות|טאבלט|שעון חכם|מסך|מקלדת|עכבר|אייפד|אייפון|גלקסי|שאומי|ראוטר|טלוויזיה/.test(n)) return 'אלקטרוניקה';
  if (/חולצה|מכנסיים|שמלה|נעליים|גרביים|ג'קט|מעיל|תיק|כובע|צעיף|חגורה|ג׳ינס|טרנינג|קפוצ'ון/.test(n)) return 'ביגוד';
  if (/תנור|מקרר|מיקסר|כיריים|מכונת קפה|מיקרוגל|בלנדר|מיחם|מטחנה|מצנם|סיר|מחבת|אוגר/.test(n)) return 'מטבח';
  if (/מיטה|שמיכה|כרית|ארון|שידה|מזרן|ציפית|גיליון|מצעים|מנורת לילה/.test(n)) return 'חדר שינה';
  if (/ספה|כורסא|כסא|שולחן|מדף|ספרייה|ארגז|מזנון|מראה|וילון/.test(n)) return 'ריהוט';
  return null;
};

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputBase = cn(
  'w-full rounded-2xl border border-gray-200 bg-white/80 px-4 py-3.5 text-sm font-medium text-gray-800',
  'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400',
  'transition-all duration-200',
  'shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
  'dark:bg-gray-800/80 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500',
);

// ── Sub-components ────────────────────────────────────────────────────────────
const SectionLabel = ({ icon: Icon, label, required, optional }) => (
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5 text-blue-500" strokeWidth={2} />
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-400 mr-0.5">*</span>}
      </span>
    </div>
    {optional && (
      <span className="text-[10px] text-gray-400 font-medium bg-gray-100 dark:bg-gray-700/60 px-2 py-0.5 rounded-full">
        אופציונלי
      </span>
    )}
  </div>
);

const ErrorMsg = ({ msg }) => (
  <AnimatePresence>
    {msg && (
      <motion.p
        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
        className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1"
      >
        <AlertCircle className="w-3 h-3 shrink-0" /> {msg}
      </motion.p>
    )}
  </AnimatePresence>
);

// ── Main component ────────────────────────────────────────────────────────────
const ShoppingBottomSheet = ({ isOpen, onClose, onSave, editItem = null, isSaving = false }) => {
  const { t, isRTL } = useTranslation('shopping');

  const [form,           setForm]           = useState(EMPTY);
  const [errors,         setErrors]         = useState({});
  const [scrapeState,    setScrapeState]    = useState('idle'); // idle|loading|success|failed
  const [scrapeReason,   setScrapeReason]   = useState(null);
  const [showManualImg,  setShowManualImg]  = useState(false);
  const [manualImgUrl,   setManualImgUrl]   = useState('');

  const nameRef       = useRef(null);
  const manualImgRef  = useRef(null);
  const fileInputRef  = useRef(null);
  const scrapeTimer   = useRef(null);
  const catAutoSet    = useRef(false);
  const isPaste       = useRef(false); // distinguishes paste from manual typing

  // ── Reset on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setForm(editItem ? {
      name:      editItem.name       ?? '',
      category:  editItem.category   ?? 'אחר',
      price_ils: editItem.price_ils != null ? String(editItem.price_ils) : '',
      buy_url:   editItem.buy_url    ?? '',
      notes:     editItem.notes      ?? '',
      image_url: editItem.image_url  ?? '',
    } : EMPTY);
    setErrors({});
    setScrapeState('idle');
    setScrapeReason(null);
    setShowManualImg(false);
    setManualImgUrl('');
    catAutoSet.current = !!editItem; // preserve category when editing
    setTimeout(() => nameRef.current?.focus(), 300);
  }, [isOpen, editItem]);

  // ── Field helpers ──────────────────────────────────────────────────────────
  const set = useCallback((field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => { if (!p[field]) return p; const n = { ...p }; delete n[field]; return n; });
  }, []);

  // ── Auto-detect category from title ────────────────────────────────────────
  const maybeSetCategory = useCallback((title) => {
    if (catAutoSet.current) return;
    const detected = detectCategory(title);
    if (detected) {
      setForm(p => p.category === 'אחר' ? { ...p, category: detected } : p);
      catAutoSet.current = true;
    }
  }, []);

  // ── Scraping ───────────────────────────────────────────────────────────────
  const applyScrapedData = useCallback((data) => {
    setForm(p => ({
      ...p,
      image_url: data.image_url || p.image_url || '',
      name:      p.name.trim() ? p.name : (data.title || p.name),
    }));
    if (data.title) maybeSetCategory(data.title);
    setScrapeState('success');
  }, [maybeSetCategory]);

  const tryClientRelay = useCallback(async (url) => {
    try {
      const res = await fetch(url, {
        method: 'GET', headers: { 'Accept': 'text/html' },
        credentials: 'omit', signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const reader = res.body.getReader();
      const chunks = [];
      let received = 0;
      while (received < 256 * 1024) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) { chunks.push(value); received += value.length; }
        const partial = new TextDecoder().decode(new Uint8Array(chunks.reduce((a, c) => [...a, ...c], [])));
        if (partial.includes('</head>')) break;
      }
      reader.cancel().catch(() => {});
      const html = new TextDecoder().decode(new Uint8Array(chunks.reduce((a, c) => [...a, ...c], [])));
      const parsed = await api.shopping.parseHtml(html, url);
      const data = parsed?.data;
      if (data?.success && (data.image_url || data.title)) {
        applyScrapedData(data);
      } else {
        setScrapeReason('no_data'); setScrapeState('failed');
      }
    } catch (err) {
      const isCors = err?.name === 'TypeError' ||
        /cors|failed to fetch/i.test(err?.message || '');
      setScrapeReason(isCors ? 'blocked' : 'generic');
      setScrapeState('failed');
    }
  }, [applyScrapedData]);

  // Core scrape logic — called by paste auto-trigger OR manual button
  const doScrape = useCallback(async (url) => {
    const target = url?.trim();
    if (!target || !/^https?:\/\/.{4}/i.test(target)) return;
    clearTimeout(scrapeTimer.current);
    setScrapeState('loading'); setScrapeReason(null);
    try {
      const result = await api.shopping.scrapeUrl(target);
      const data   = result?.data;
      if (data?.success && (data.image_url || data.title)) { applyScrapedData(data); return; }
      if (data?.allowClientFallback) { await tryClientRelay(target); return; }
      const r = data?.reason;
      setScrapeReason(r === 'timeout' ? 'timeout' : r === 'no_data' ? 'no_data' : 'generic');
      setScrapeState('failed');
    } catch { setScrapeReason('generic'); setScrapeState('failed'); }
  }, [applyScrapedData, tryClientRelay]);

  // onChange — just syncs field value; only fires scrape when triggered by paste
  const handleUrlChange = useCallback((value) => {
    set('buy_url', value);
    if (!value.trim()) { setScrapeState('idle'); isPaste.current = false; return; }
    if (isPaste.current) {
      isPaste.current = false;
      // short debounce so the field value settles before the request
      clearTimeout(scrapeTimer.current);
      scrapeTimer.current = setTimeout(() => doScrape(value), 400);
    }
  }, [set, doScrape]);

  // onPaste — marks the next onChange as paste-triggered
  const handleUrlPaste = useCallback(() => { isPaste.current = true; }, []);

  useEffect(() => () => clearTimeout(scrapeTimer.current), []);

  // ── Manual image ───────────────────────────────────────────────────────────
  const openManualImg = useCallback(() => {
    setShowManualImg(true);
    setTimeout(() => manualImgRef.current?.focus(), 120);
  }, []);

  const applyManualImg = useCallback(() => {
    const url = manualImgUrl.trim();
    if (!url) return;
    set('image_url', url);
    setShowManualImg(false);
    setManualImgUrl('');
  }, [manualImgUrl, set]);

  // ── Device image upload (canvas compression) ──────────────────────────────
  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // allow re-selecting the same file
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 480;
        let { width: w, height: h } = img;
        if (w > h ? w > MAX : h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else       { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        set('image_url', canvas.toDataURL('image/jpeg', 0.82));
        setScrapeState('idle'); // clear any scrape status
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }, [set]);

  // ── Validation + submit ────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = t('validation.nameRequired');
    if (form.buy_url && !/^https?:\/\//i.test(form.buy_url.trim())) e.buy_url = t('validation.urlInvalid');
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate() || isSaving) return;
    await onSave({
      name:      form.name.trim(),
      category:  form.category,
      price_ils: form.price_ils !== '' ? parseFloat(form.price_ils) : 0,
      buy_url:   form.buy_url.trim()   || null,
      notes:     form.notes.trim()     || null,
      image_url: form.image_url.trim() || null,
    });
  };

  // ── Derived state ──────────────────────────────────────────────────────────
  const hasImage   = !!form.image_url;
  const isLoading  = scrapeState === 'loading';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={editItem ? t('sheet.editTitle') : t('sheet.addTitle')}
      height="auto"
    >
      <div className="flex flex-col gap-4 pb-6" dir={isRTL ? 'rtl' : 'ltr'}>

        {/* ══ 1. URL + IMAGE ════════════════════════════════════════════════ */}
        <div>
          <SectionLabel icon={Link2} label={t('fields.url.label')} optional />

          {/* URL input */}
          <div className="relative">
            <input
              type="url"
              value={form.buy_url}
              onChange={e => handleUrlChange(e.target.value)}
              onPaste={handleUrlPaste}
              placeholder="https://..."
              autoComplete="url"
              className={cn(inputBase, 'text-left pr-12', errors.buy_url && 'border-red-400 focus:ring-red-400/40')}
              dir="ltr"
            />
            {/* Fetch / status button — right inside the input */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {isLoading ? (
                <div className="w-8 h-8 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" strokeWidth={2.5} />
                </div>
              ) : scrapeState === 'success' ? (
                <button type="button" onClick={() => doScrape(form.buy_url)}
                  title="משוך שוב"
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                </button>
              ) : scrapeState === 'failed' ? (
                <button type="button" onClick={() => doScrape(form.buy_url)}
                  title="נסה שוב"
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors">
                  <RotateCcw className="w-4 h-4" strokeWidth={2.5} />
                </button>
              ) : form.buy_url && /^https?:\/\/.{4}/i.test(form.buy_url) ? (
                <button type="button" onClick={() => doScrape(form.buy_url)}
                  title="משוך פרטי מוצר"
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">
                  <Wand2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
              ) : null}
            </div>
          </div>
          <ErrorMsg msg={errors.buy_url} />
          {/* Paste hint — only when field is empty */}
          {!form.buy_url && (
            <p className="mt-1.5 text-[11px] text-gray-400 flex items-center gap-1">
              <Wand2 className="w-3 h-3" />
              {t('scrape.pasteHint') || 'הדבק קישור — הפרטים יימשכו אוטומטית'}
            </p>
          )}

          {/* Image area */}
          <AnimatePresence mode="wait">
            {/* Loading skeleton */}
            {isLoading && (
              <motion.div key="skeleton"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-3"
              >
                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800 h-28 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  <p className="text-xs text-blue-400 font-semibold">{t('scrape.fetching')}</p>
                </div>
              </motion.div>
            )}

            {/* Image preview */}
            {hasImage && !isLoading && (
              <motion.div key="preview"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-3"
              >
                <div className="relative rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shadow-sm">
                  <img
                    src={form.image_url} alt="product preview"
                    className="w-full h-44 object-cover"
                    onError={() => set('image_url', '')}
                  />
                  {/* Source badge */}
                  <div className={cn(
                    'absolute top-2 start-2 flex items-center gap-1 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm',
                    scrapeState === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                  )}>
                    <Check className="w-3 h-3" strokeWidth={3} />
                    {scrapeState === 'success' ? t('scrape.imageFound') : 'תמונה'}
                  </div>
                  {/* Action buttons */}
                  <div className="absolute top-2 end-2 flex gap-1.5">
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="h-7 px-2.5 rounded-full bg-black/50 hover:bg-black/70 text-white text-[10px] font-bold flex items-center gap-1 transition-colors">
                      <Camera className="w-3 h-3" /> {t('scrape.changeImage') || 'שנה'}
                    </button>
                    <button type="button" onClick={() => set('image_url', '')}
                      className="w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors">
                      <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* No image — placeholder card */}
            {!hasImage && !isLoading && (
              <motion.div key="no-image"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-3"
              >
                <AnimatePresence mode="wait">
                  {/* Manual image URL input (expanded) */}
                  {showManualImg ? (
                    <motion.div key="manual-input"
                      initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="rounded-2xl border border-blue-200 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-900/20 p-3"
                    >
                      <p className="text-[11px] text-blue-500 font-bold mb-2 flex items-center gap-1">
                        <Camera className="w-3 h-3" /> הכנס קישור לתמונה
                      </p>
                      <div className="flex gap-2">
                        <input
                          ref={manualImgRef}
                          type="url"
                          value={manualImgUrl}
                          onChange={e => setManualImgUrl(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && applyManualImg()}
                          placeholder="https://... קישור לתמונה"
                          className={cn(inputBase, 'flex-1 text-left py-2.5 text-sm border-blue-200 dark:border-blue-700')}
                          dir="ltr"
                        />
                        <button type="button" onClick={applyManualImg}
                          disabled={!manualImgUrl.trim()}
                          className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 disabled:opacity-40 shadow-sm transition-opacity">
                          <Check className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                        <button type="button" onClick={() => { setShowManualImg(false); setManualImgUrl(''); }}
                          className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 flex items-center justify-center shrink-0">
                          <X className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    /* No-image card — upload from device OR paste URL */
                    <motion.div key="placeholder-pill"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className={cn(
                        'rounded-2xl border-2 border-dashed p-3',
                        scrapeState === 'failed'
                          ? 'border-orange-200 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-900/10'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30'
                      )}>
                      {/* Status line */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                          scrapeState === 'failed' ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-gray-100 dark:bg-gray-700'
                        )}>
                          {scrapeState === 'failed'
                            ? <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
                            : <ImageIcon className="w-3.5 h-3.5 text-gray-400" />}
                        </div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                          {scrapeState === 'failed'
                            ? (scrapeReason === 'blocked'  ? t('scrape.failedBlocked')
                              : scrapeReason === 'timeout' ? t('scrape.failedTimeout')
                              :                              t('scrape.failedNoData'))
                            : 'ללא תמונה'}
                        </p>
                      </div>
                      {/* Two action buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <motion.button type="button" whileTap={{ scale: 0.96 }}
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm">
                          <Camera className="w-3.5 h-3.5 shrink-0" />
                          העלה מהמכשיר
                        </motion.button>
                        <motion.button type="button" whileTap={{ scale: 0.96 }}
                          onClick={openManualImg}
                          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-xs font-bold transition-colors">
                          <Link2 className="w-3.5 h-3.5 shrink-0" />
                          קישור לתמונה
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ══ 2. NAME ═══════════════════════════════════════════════════════ */}
        <div>
          <SectionLabel icon={ShoppingCart} label={t('fields.name.label')} required />
          <input
            ref={nameRef}
            type="text"
            value={form.name}
            onChange={e => {
              set('name', e.target.value);
              maybeSetCategory(e.target.value);
            }}
            onBlur={() => !form.name.trim() && setErrors(p => ({ ...p, name: t('validation.nameRequired') }))}
            placeholder={t('fields.name.placeholder')}
            autoComplete="off"
            className={cn(inputBase, 'text-right', errors.name && 'border-red-400 focus:ring-red-400/40')}
          />
          <ErrorMsg msg={errors.name} />
        </div>

        {/* ══ 3. CATEGORY ═══════════════════════════════════════════════════ */}
        <div>
          <SectionLabel icon={Tag} label={t('fields.category.label')} />
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => {
              const active = form.category === cat.value;
              return (
                <motion.button key={cat.value} type="button" whileTap={{ scale: 0.93 }}
                  onClick={() => { set('category', cat.value); catAutoSet.current = true; }}
                  className={cn(
                    'relative flex flex-col items-center gap-1.5 px-2 py-3 rounded-2xl border',
                    'transition-all duration-150 min-h-[64px] justify-center',
                    active
                      ? cn(cat.color, 'shadow-md scale-[1.03] border-current')
                      : 'bg-white/70 border-gray-200 text-gray-400 dark:bg-gray-800/70 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  {active && (
                    <span className="absolute top-1.5 start-1.5 w-3.5 h-3.5 rounded-full bg-current/20 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" strokeWidth={3} />
                    </span>
                  )}
                  <span className={cn('text-xl leading-none', !active && 'grayscale opacity-60')}>{cat.emoji}</span>
                  <span className="text-[11px] font-bold leading-tight text-center">{t(`categories.${cat.key}`)}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ══ 4. PRICE ══════════════════════════════════════════════════════ */}
        <div>
          <SectionLabel icon={DollarSign} label={t('fields.price.label')} optional />
          <div className="relative">
            <input
              type="number" min="0" step="0.01"
              value={form.price_ils}
              onChange={e => set('price_ils', e.target.value)}
              placeholder="0"
              autoComplete="off"
              inputMode="decimal"
              className={cn(inputBase, 'pl-10 text-left')}
              dir="ltr"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 pointer-events-none">₪</span>
          </div>
          {/* Quick-price chips */}
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {QUICK_PRICES.map(p => (
              <button key={p} type="button"
                onClick={() => set('price_ils', form.price_ils === String(p) ? '' : String(p))}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-bold border transition-all duration-150',
                  form.price_ils === String(p)
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                )}>
                ₪{p.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* ══ 5. NOTES ══════════════════════════════════════════════════════ */}
        <div>
          <SectionLabel icon={StickyNote} label={t('fields.notes.label')} optional />
          <textarea
            rows={2}
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder={t('fields.notes.placeholder')}
            className={cn(inputBase, 'resize-none text-right')}
          />
        </div>

        {/* ══ 6. SUBMIT ═════════════════════════════════════════════════════ */}
        <motion.button
          type="button" whileTap={{ scale: 0.97 }}
          onClick={handleSubmit} disabled={isSaving}
          className={cn(
            'w-full min-h-[52px] rounded-2xl font-bold text-white text-base',
            'bg-gradient-to-l from-blue-600 to-indigo-600',
            'shadow-lg shadow-blue-500/30',
            'flex items-center justify-center gap-2',
            'transition-opacity duration-200',
            isSaving && 'opacity-60 cursor-not-allowed'
          )}
        >
          {isSaving
            ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <><Check className="w-5 h-5" strokeWidth={2.5} />{editItem ? t('sheet.saveChanges') : t('sheet.addToList')}</>
          }
        </motion.button>

        {/* Hidden file input for device image upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

      </div>
    </BottomSheet>
  );
};

export default ShoppingBottomSheet;
