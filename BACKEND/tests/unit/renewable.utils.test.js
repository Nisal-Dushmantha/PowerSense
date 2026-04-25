const { __testables } = require('../../controllers/renewableController');

describe('renewable helper functions', () => {
  test('getForecastHorizonDays resolves expected values', () => {
    expect(__testables.getForecastHorizonDays('7d')).toBe(7);
    expect(__testables.getForecastHorizonDays('30d')).toBe(30);
    expect(__testables.getForecastHorizonDays('invalid')).toBe(7);
  });

  test('calculateMovingAverageSeries returns smoothed sequence', () => {
    const values = [10, 20, 30, 40];
    const series = __testables.calculateMovingAverageSeries(values, 2);
    expect(series).toEqual([10, 15, 25, 35]);
  });

  test('calculateLinearTrendSlope detects upward trend', () => {
    const slope = __testables.calculateLinearTrendSlope([5, 10, 15, 20]);
    expect(slope).toBeGreaterThan(0);
  });

  test('calculateStandardDeviation returns zero for constant values', () => {
    const std = __testables.calculateStandardDeviation([12, 12, 12]);
    expect(std).toBe(0);
  });

  test('mapWeatherCodeToLabel maps known and unknown weather codes', () => {
    expect(__testables.mapWeatherCodeToLabel(0)).toBe('Clear sky');
    expect(__testables.mapWeatherCodeToLabel(999)).toBe('Unknown');
  });
});
