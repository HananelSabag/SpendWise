function finiteNumber(value, fallback = 0) {
  if (value === null || value === undefined) return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

/**
 * One projection contract for the dashboard and the financial-cycle page.
 * Known-only is deliberately conservative: current balance minus proven future outflow.
 * Forecast adds both uncertain outflow and expected recurring income returned by the engine.
 */
export function getCycleProjection(reset = {}, currentBalance = null) {
  reset = reset || {};
  const knownCardOut = finiteNumber(reset.knownCardOut);
  const knownFixedOut = finiteNumber(reset.knownFixedOut ?? reset.fixedOut);
  const estimatedCardOut = finiteNumber(reset.estimatedCardOut, knownCardOut);
  const estimatedFixedOut = finiteNumber(reset.estimatedFixedOut, knownFixedOut);
  const expectedIncome = Math.max(0, finiteNumber(reset.expectedIncoming));
  // Derive the two states from the visible building blocks. Older cached API
  // responses may expose net fields with known-only semantics, while these
  // explicit inputs remain the source of truth shown to the user.
  const knownNetChange = -(knownCardOut + knownFixedOut);
  const estimatedNetChange = expectedIncome - estimatedCardOut - estimatedFixedOut;
  const forecastExtraOut = Math.max(
    0,
    estimatedCardOut + estimatedFixedOut - (knownCardOut + knownFixedOut),
  );
  const now =
    currentBalance === null || currentBalance === undefined ? null : Number(currentBalance);

  return {
    now: Number.isFinite(now) ? now : null,
    knownCardOut,
    knownFixedOut,
    estimatedCardOut,
    estimatedFixedOut,
    expectedIncome,
    knownNetChange,
    estimatedNetChange,
    forecastExtraOut,
    afterKnown: Number.isFinite(now) ? now + knownNetChange : null,
    forecast: Number.isFinite(now) ? now + estimatedNetChange : null,
  };
}

/** Date-ordered explanation of the same inputs used by getCycleProjection. */
export function getCycleUpcoming(reset = {}, useEstimates = false) {
  const rows = [];
  for (const [index, stage] of (reset?.stages || []).entries()) {
    const amount = finiteNumber(stage.amount);
    const known = stage.kind === 'card' || ['known', 'proven'].includes(stage.certainty);
    const income = amount > 0;
    const estimated = (income && stage.kind !== 'card') || !known;
    if (amount !== 0 && (useEstimates || !estimated)) {
      rows.push({ ...stage, amount, estimated, key: `stage-${index}` });
    }
    if (useEstimates && stage.kind === 'card') {
      const growth = Math.max(0, amount - finiteNumber(stage.estimatedAmount, amount));
      if (growth > 0)
        rows.push({
          ...stage,
          amount: -growth,
          estimated: true,
          growth: true,
          key: `growth-${index}`,
        });
    }
  }
  // A confirmed repeating card purchase may raise the aggregate forecast above
  // historical bill growth. Expose that residual rather than hide money in the total.
  if (useEstimates) {
    const p = getCycleProjection(reset);
    const representedExtra = rows
      .filter((row) => row.estimated && row.amount < 0)
      .reduce((sum, row) => sum - row.amount, 0);
    const residual = Math.round((p.forecastExtraOut - representedExtra) * 100) / 100;
    if (residual > 0)
      rows.push({
        key: 'recurring-card-growth',
        kind: 'card_recurring',
        date: reset.completionDate,
        amount: -residual,
        estimated: true,
      });
  }
  return rows.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
}

export default getCycleProjection;
