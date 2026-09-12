import { describe, expect, it } from "vitest";
import en from "../../translations/en/financialCycle";
import he from "../../translations/he/financialCycle";
import enDashboard from "../../translations/en/dashboard";
import heDashboard from "../../translations/he/dashboard";
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const placeholders = (text) =>
  [...text.matchAll(/\{\{(.*?)\}\}/g)].map((match) => match[1]).sort();

describe("financial-cycle user-facing copy", () => {
  it('resolves every literal dashboard/cycle label in the live views in both languages', () => {
    const src = resolve(process.cwd(), 'src');
    const directory = resolve(src, 'components/features/financialCycleV2');
    const paths = readdirSync(directory).filter(file => file.endsWith('.jsx')).map(file => resolve(directory, file));
    paths.push(...['pages/ModernDashboard.jsx', 'pages/FinancialCyclePageV2.jsx',
      'components/features/dashboard/ModernRecentTransactionsWidget.jsx',
      'components/features/dashboard/DashboardError.jsx',
      'components/features/dashboard/OverdraftRunwayCard.jsx',
      'components/features/dashboard/FinancialCycleSnapshotV2.jsx',
    ].map(file => resolve(src, file)));
    for (const path of paths) {
      const text = readFileSync(path, 'utf8');
      for (const [, key] of text.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g)) {
        for (const [language, dictionary] of [['he', heDashboard], ['en', enDashboard]]) {
          const value = key.split('.').reduce((node, part) => node?.[part], dictionary);
          expect(typeof value, `${language}.${key} in ${path}`).toBe('string');
        }
      }
    }
  });
  it("has a nonempty Hebrew and English translation for every cycle and overdraft label", () => {
    for (const [english, hebrew] of [
      [en, he],
      [enDashboard.overdraft, heDashboard.overdraft],
    ]) {
      expect(Object.keys(hebrew).sort()).toEqual(Object.keys(english).sort());
      for (const key of Object.keys(english)) {
        expect(english[key].trim(), `en.${key}`).not.toBe("");
        expect(hebrew[key].trim(), `he.${key}`).not.toBe("");
        expect(placeholders(hebrew[key]), key).toEqual(
          placeholders(english[key]),
        );
      }
    }
  });

  it("uses the same cycle copy in the dashboard and the detail page", () => {
    expect(enDashboard.cycleV2).toBe(en);
    expect(heDashboard.cycleV2).toBe(he);
    expect(enDashboard.monthlyAccounting).toBeUndefined();
    expect(heDashboard.monthlyAccounting).toBeUndefined();
  });
});
