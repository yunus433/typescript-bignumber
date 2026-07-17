import { BigNumber } from './BigNumber';

const number = (value: string): BigNumber => BigNumber.fromString(value);
const MAX = '1000000000000000000000000000000000000';
const UNIT = '0.000000000000000001';

describe('construction and formatting', () => {
  test.each([
    ['0', '0'],
    [' -0012.3400 ', '-12.34'],
    ['+.5', '0.5'],
    [',5', '0.5'],
    ['12.', '12'],
    ['1,25', '1.25'],
    ['1e3', '1000'],
    ['1.25E-2', '0.0125'],
    ['000e999999', '0'],
  ])('parses %s', (input, expected) => {
    expect(number(input).toString()).toBe(expected);
  });

  test.each([
    '', ' ', '.', ',', '+', '-', '1.2.3', '1e', '1e+', '1 2',
    '0x10', '1_000', 'NaN', 'Infinity',
  ])('rejects invalid input %p', (input) => {
    expect(() => number(input)).toThrow(SyntaxError);
  });

  test('accepts the inclusive range limits', () => {
    expect(number(MAX).toString()).toBe(MAX);
    expect(number(`-${MAX}`).toString()).toBe(`-${MAX}`);
    expect(BigNumber.fromBigInt(10n ** 36n).toString()).toBe(MAX);
  });

  test.each(['1e37', '-1e37', '1.0000000000000000001e36'])(
    'rejects out-of-range strings',
    (input) => {
      expect(() => number(input)).toThrow(RangeError);
    }
  );

  test('rejects an out-of-range bigint', () => {
    expect(() => BigNumber.fromBigInt(10n ** 36n + 1n)).toThrow(RangeError);
  });

  test.each([
    ['0.1234567890123456784', '0.123456789012345678'],
    ['0.1234567890123456785', '0.123456789012345679'],
    ['-0.1234567890123456784', '-0.123456789012345678'],
    ['-0.1234567890123456785', '-0.123456789012345679'],
    ['0.0000000000000000004', '0'],
    ['0.0000000000000000005', UNIT],
    ['-0.0000000000000000005', `-${UNIT}`],
  ])('rounds %s to 18 decimal places', (input, expected) => {
    expect(number(input).toString()).toBe(expected);
  });

  test.each([
    ['0', '0.000000000000000000'],
    ['12', '12.000000000000000000'],
    ['-12.34', '-12.340000000000000000'],
  ])('optionally includes trailing zeros for %s', (input, expected) => {
    expect(number(input).toString(true)).toBe(expected);
  });
});

describe('constants and conversions', () => {
  test.each([
    [BigNumber.E, '2.718281828459045235'],
    [BigNumber.PI, '3.141592653589793238'],
    [BigNumber.LN_2, '0.693147180559945309'],
    [BigNumber.LN_10, '2.302585092994045684'],
    [BigNumber.INF, MAX],
    [BigNumber.NEG_INF, `-${MAX}`],
  ])('exposes the expected constant', (value, expected) => {
    expect(value.toString()).toBe(expected);
  });

  test('exposes equivalent constant aliases', () => {
    expect(BigNumber.EULER.equals(BigNumber.E)).toBe(true);
    expect(BigNumber.POSITIVE_INFINITY.equals(BigNumber.INF)).toBe(true);
    expect(BigNumber.NEGATIVE_INFINITY.equals(BigNumber.NEG_INF)).toBe(true);
  });

  test.each([
    ['1.49', 1n],
    ['1.5', 2n],
    ['-1.49', -1n],
    ['-1.5', -1n],
    ['-1.500000000000000001', -2n],
  ])('converts %s to its rounded integer', (input, expected) => {
    expect(number(input).toBigInt()).toBe(expected);
    expect(number(input).toInteger()).toBe(expected.toString());
  });
});

describe('checks and comparisons', () => {
  test.each([
    ['2', true, true],
    ['0.5', false, true],
    ['0', true, false],
    ['-2', true, false],
  ])('checks %s', (input, integer, positive) => {
    const value = number(input);
    expect(value.isInteger()).toBe(integer);
    expect(value.isPositive()).toBe(positive);
  });

  test('compares values and supports comparison aliases', () => {
    const low = number('-1.5');
    const high = number('2');

    expect(low.equals(number('-1.5'))).toBe(true);
    expect(high.gt(low)).toBe(true);
    expect(high.greaterThan(low)).toBe(true);
    expect(high.gte(high)).toBe(true);
    expect(high.greaterThanOrEqual(high)).toBe(true);
    expect(low.lt(high)).toBe(true);
    expect(low.lessThan(high)).toBe(true);
    expect(low.lte(low)).toBe(true);
    expect(low.lessThanOrEqual(low)).toBe(true);
  });
});

describe('unary operations', () => {
  test('calculates absolute, negated, and inverse values', () => {
    const value = number('-4');

    expect(value.abs().toString()).toBe('4');
    expect(value.neg().toString()).toBe('4');
    expect(value.inv().toString()).toBe('-0.25');
    expect(value.toString()).toBe('-4');
  });

  test.each([
    ['1.2', '2', '1', '1', '1'],
    ['1.5', '2', '1', '1', '2'],
    ['-1.2', '-1', '-2', '-1', '-1'],
    ['-1.5', '-1', '-2', '-1', '-1'],
    ['-1.500000000000000001', '-1', '-2', '-1', '-2'],
  ])('rounds %s', (input, ceil, floor, trunc, round) => {
    const value = number(input);
    expect(value.ceil().toString()).toBe(ceil);
    expect(value.floor().toString()).toBe(floor);
    expect(value.trunc().toString()).toBe(trunc);
    expect(value.round().toString()).toBe(round);
  });

  test('copies a sign', () => {
    expect(BigNumber.copysign(number('-2'), number('1')).toString()).toBe('2');
    expect(BigNumber.copysign(number('2'), number('-1')).toString()).toBe('-2');
    expect(BigNumber.copysign(number('-2'), number('0')).toString()).toBe('2');
  });
});

describe('arithmetic', () => {
  test.each([
    ['2.2', '3.1', '5.3'],
    ['2.2', '-3.1', '-0.9'],
    ['-2.2', '3.1', '0.9'],
    ['-2.2', '-3.1', '-5.3'],
    ['0.999999999999999999', UNIT, '1'],
  ])('adds %s and %s', (left, right, expected) => {
    expect(number(left).add(number(right)).toString()).toBe(expected);
  });

  test.each([
    ['2.2', '3.1', '-0.9'],
    ['2.2', '-3.1', '5.3'],
    ['-2.2', '3.1', '-5.3'],
    ['-2.2', '-3.1', '0.9'],
  ])('subtracts %s and %s', (left, right, expected) => {
    expect(number(left).sub(number(right)).toString()).toBe(expected);
  });

  test.each([
    ['2.5', '4', '10'],
    ['-2.5', '4', '-10'],
    ['-2.5', '-4', '10'],
    [UNIT, '0.5', UNIT],
    [`-${UNIT}`, '0.5', `-${UNIT}`],
  ])('multiplies %s by %s', (left, right, expected) => {
    expect(number(left).mul(number(right)).toString()).toBe(expected);
  });

  test.each([
    ['1', '2', '0.5'],
    ['1', '3', '0.333333333333333333'],
    ['2', '3', '0.666666666666666667'],
    ['-2', '3', '-0.666666666666666667'],
    ['2', '-3', '-0.666666666666666667'],
  ])('divides %s by %s', (left, right, expected) => {
    expect(number(left).div(number(right)).toString()).toBe(expected);
  });

  test.each([
    ['5.5', '2', '1.5'],
    ['-5.5', '2', '-1.5'],
    ['5.5', '-2', '1.5'],
    ['-5.5', '-2', '-1.5'],
    ['6', '2', '0'],
  ])('calculates %s modulo %s', (left, right, expected) => {
    expect(number(left).mod(number(right)).toString()).toBe(expected);
  });

  test.each([
    () => number(MAX).add(number(UNIT)),
    () => number(`-${MAX}`).sub(number(UNIT)),
    () => number(MAX).mul(number('2')),
    () => number(MAX).div(number('0.5')),
  ])('rejects arithmetic overflow', (operation) => {
    expect(operation).toThrow(RangeError);
  });

  test.each([
    () => number('1').div(number('0')),
    () => number('1').mod(number('0')),
    () => number('0').inv(),
  ])('rejects division by zero', (operation) => {
    expect(operation).toThrow(RangeError);
  });
});

describe('value invariants', () => {
  const values = ['-2.5', '-1', '0', '0.25', '3'].map(number);
  const zero = number('0');
  const one = number('1');

  test.each(values)('preserves identities for %s', (value) => {
    expect(value.add(zero).equals(value)).toBe(true);
    expect(value.sub(value).equals(zero)).toBe(true);
    expect(value.mul(one).equals(value)).toBe(true);
    expect(value.mul(zero).equals(zero)).toBe(true);
  });

  test('addition and multiplication are commutative for safe values', () => {
    for (const left of values) {
      for (const right of values) {
        expect(left.add(right).equals(right.add(left))).toBe(true);
        expect(left.mul(right).equals(right.mul(left))).toBe(true);
      }
    }
  });

  test.each(['0', '-0', '0.0000000000000000004'])(
    'uses one canonical zero for %s',
    (input) => {
      const zeroValue = number(input);
      expect(zeroValue.toString()).toBe('0');
      expect(zeroValue.isPositive()).toBe(false);
    }
  );
});
