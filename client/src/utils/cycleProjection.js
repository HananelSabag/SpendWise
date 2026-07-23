function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

/**
 * One projection contract for the dashboard and the financial-cycle page.
 * Known-only is deliberately conservative: current balance minus proven future outflow.
 * Forecast adds both uncertain outflow and expected recurring income returned by the engine.
 */
export function getCycleProjection(reset = {}, currentBalance = null) {
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
    (estimatedCardOut + estimatedFixedOut) - (knownCardOut + knownFixedOut),
  );
  const now = currentBalance === null || currentBalance === undefined
    ? null
    : Number(currentBalance);

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

export default getCycleProjection;
