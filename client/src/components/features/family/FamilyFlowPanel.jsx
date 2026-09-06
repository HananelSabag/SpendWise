/**
 * The monthly flow — every row they entered, grouped by what it does.
 *
 * Sections are ordered the way the money moves: what comes in, what is certain
 * to leave, what is owed, what is kept, and last the part they actually control.
 *
 * The person filter is here because "how much leaves MY account" is a real
 * question in a two-income household with charges split across two banks.
 */

import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

import {
  CATEGORY_ICONS, ITEM_KINDS, KIND_META, SUGGESTIONS, TONE, ownerKey,
} from './familyMeta';

function Row({ item, members, formatCurrency, t, onEdit }) {
  const Icon = CATEGORY_ICONS[item.category_key] || CATEGORY_ICONS.other;
  const owner = item.owner_user_id == null
    ? t('overview.joint')
    : (members.find((m) => m.id === item.owner_user_id)?.name || '—');
  const inactive = item.is_active === false;

  return (
    <button
      type="button"
      onClick={() => onEdit(item)}
      className={`flex w-full items-center gap-3 py-2.5 text-start transition ${inactive ? 'opacity-45' : ''}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
        <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-xs font-black text-slate-900 dark:text-white">{item.name}</span>
          {inactive && (
            <span className="shrink-0 rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {t('flow.inactive')}
            </span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-slate-400">
          {[
            t(`category.${item.category_key}`),
            item.charge_day ? t('flow.day', { day: item.charge_day }) : null,
            owner,
          ].filter(Boolean).join(' · ')}
        </span>
      </span>

      <strong className="shrink-0 text-sm font-black tabular-nums text-slate-900 dark:text-white">
        {formatCurrency(item.amount)}
      </strong>
    </button>
  );
}

function Section({ kind, items, members, formatCurrency, t, onAdd, onEdit, filtered }) {
  const meta = KIND_META[kind];
  const palette = TONE[meta.tone];
  const Icon = meta.icon;

  const total = items
    .filter((item) => item.is_active !== false)
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const suggestions = (SUGGESTIONS[kind] || []).slice(0, 6);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2.5">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${palette.bg}`}>
          <Icon className={`h-4 w-4 ${palette.text}`} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-black text-slate-900 dark:text-white">{t(`kind.${kind}`)}</h2>
          <p className="truncate text-[11px] text-slate-400">
            {items.length === 1 ? t('flow.items_one') : t('flow.items', { count: items.length })}
          </p>
        </div>
        <strong className={`shrink-0 text-sm font-black tabular-nums ${palette.text}`}>
          {formatCurrency(total)}
        </strong>
        <button
          type="button"
          onClick={() => onAdd(kind)}
          aria-label={`${t('flow.add')} — ${t(`kind.${kind}`)}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-indigo-100 hover:text-indigo-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-950/50"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {items.length > 0 ? (
        <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((item) => (
            <Row
              key={item.id}
              item={item}
              members={members}
              formatCurrency={formatCurrency}
              t={t}
              onEdit={onEdit}
            />
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-dashed border-slate-200 p-3 dark:border-slate-800">
          <p className="text-[11px] text-slate-400">
            {filtered ? t('flow.emptyFiltered') : t('flow.empty')}
          </p>
          {!filtered && suggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.key}
                  type="button"
                  onClick={() => onAdd(kind, {
                    name: t(`suggestion.${suggestion.key}`),
                    category_key: suggestion.category,
                  })}
                  className="rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300"
                >
                  + {t(`suggestion.${suggestion.key}`)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function FamilyFlowPanel({ items, members, formatCurrency, t, onAdd, onEdit }) {
  const [owner, setOwner] = useState('all');

  const filters = useMemo(() => ([
    { value: 'all', label: t('flow.filterAll') },
    ...members.map((member) => ({ value: String(member.id), label: member.name })),
    { value: 'joint', label: t('overview.joint') },
  ]), [members, t]);

  const visible = useMemo(() => (
    owner === 'all' ? items : items.filter((item) => ownerKey(item) === owner)
  ), [items, owner]);

  const byKind = useMemo(() => {
    const map = Object.fromEntries(ITEM_KINDS.map((kind) => [kind, []]));
    for (const item of visible) {
      if (map[item.kind]) map[item.kind].push(item);
    }
    return map;
  }, [visible]);

  return (
    <div className="space-y-4">
      {filters.length > 2 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setOwner(filter.value)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-black transition ${
                owner === filter.value
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-300'
                  : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {ITEM_KINDS.map((kind) => (
        <Section
          key={kind}
          kind={kind}
          items={byKind[kind]}
          members={members}
          formatCurrency={formatCurrency}
          t={t}
          onAdd={onAdd}
          onEdit={onEdit}
          filtered={owner !== 'all'}
        />
      ))}
    </div>
  );
}
