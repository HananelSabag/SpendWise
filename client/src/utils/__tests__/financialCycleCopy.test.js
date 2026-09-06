import { describe, expect, it } from "vitest";
import en from "../../translations/en/financialCycle";
import he from "../../translations/he/financialCycle";
import enDashboard from "../../translations/en/dashboard";
import heDashboard from "../../translations/he/dashboard";

const placeholders = (text) =>
  [...text.matchAll(/\{\{(.*?)\}\}/g)].map((match) => match[1]).sort();

describe("financial-cycle user-facing copy", () => {
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
