const DECIMAL_PLACES = 18;
const SCALE = 10n ** BigInt(DECIMAL_PLACES);
const MAX_VALUE = 10n ** 36n;
const MAX_SCALED_VALUE = MAX_VALUE * SCALE;

const
  E = '2.718281828459045235',
  LN_10 = '2.302585092994045684',
  LN_2 = '0.693147180559945309',
  PI = '3.141592653589793238'
;

export class BigNumber {
  private readonly _scaledValue: bigint;

  // Private Utility Methods

  private static absolute(value: bigint): bigint {
    return value < 0n ? -value : value;
  }

  private static assertWithinRange(value: bigint): void {
    if (BigNumber.absolute(value) > MAX_SCALED_VALUE) {
      throw new RangeError(
        `BigNumber Error: The value must be between -${MAX_VALUE} and ${MAX_VALUE}, inclusive.`
      );
    }
  }

  private static divideAndRoundHalfAwayFromZero(
    numerator: bigint,
    denominator: bigint
  ): bigint {
    if (denominator == 0n)
      throw new RangeError('BigNumber Error: Division by zero.');

    const quotient = numerator / denominator;
    const remainder = numerator % denominator;

    if (remainder == 0n)
      return quotient;

    const absoluteRemainder = BigNumber.absolute(remainder);
    const absoluteDenominator = BigNumber.absolute(denominator);

    if (absoluteRemainder * 2n < absoluteDenominator)
      return quotient;

    const resultIsNegative = (numerator < 0n) != (denominator < 0n);
    return quotient + (resultIsNegative ? -1n : 1n);
  }

  private static roundToInteger(value: bigint): bigint {
    const quotient = value / SCALE;
    const remainder = value % SCALE;
    const doubledRemainder = BigNumber.absolute(remainder) * 2n;

    if (doubledRemainder < SCALE)
      return quotient;

    if (value >= 0n)
      return quotient + 1n;

    // Math.round ties toward positive infinity, so a negative value is only
    // rounded away from zero when it is strictly past the halfway point.
    return doubledRemainder == SCALE ? quotient : quotient - 1n;
  }

  private static parseScaledValue(input: string): bigint {
    const value = input.trim();
    const match = /^([+-]?)(?:(\d+)(?:[.,](\d*))?|[.,](\d+))(?:[eE]([+-]?\d+))?$/.exec(value);

    if (!match)
      throw new SyntaxError('BigNumber Error: The given string cannot be parsed as a BigNumber.');

    const sign = match[1] == '-' ? -1n : 1n;
    const integerDigits = match[2] ?? '';
    const decimalDigits = match[3] ?? match[4] ?? '';
    const exponent = BigInt(match[5] ?? '0');
    const normalizedDigits = (integerDigits + decimalDigits).replace(/^0+/, '') || '0';

    if (normalizedDigits == '0')
      return 0n;

    const decimalPower = exponent - BigInt(decimalDigits.length);
    const highestDecimalExponent = BigInt(normalizedDigits.length - 1) + decimalPower;

    if (
      highestDecimalExponent > 36n ||
      (
        highestDecimalExponent == 36n &&
        (normalizedDigits[0] != '1' || /[1-9]/.test(normalizedDigits.substring(1)))
      )
    ) {
      throw new RangeError(
        `BigNumber Error: The value must be between -${MAX_VALUE} and ${MAX_VALUE}, inclusive.`
      );
    }

    const scalePower = decimalPower + BigInt(DECIMAL_PLACES);
    const significand = BigInt(normalizedDigits);
    let scaledMagnitude: bigint;

    if (scalePower >= 0n) {
      scaledMagnitude = significand * (10n ** scalePower);
    } else {
      const digitsToDiscard = -scalePower;

      if (digitsToDiscard > BigInt(normalizedDigits.length)) {
        scaledMagnitude = 0n;
      } else {
        const divisor = 10n ** digitsToDiscard;
        scaledMagnitude = BigNumber.divideAndRoundHalfAwayFromZero(significand, divisor);
      }
    }

    return sign * scaledMagnitude;
  }

  private constructor(scaledValue: bigint) {
    BigNumber.assertWithinRange(scaledValue);
    this._scaledValue = scaledValue;
  }

  // Static Constructors

  static copysign(number: BigNumber, sign: BigNumber): BigNumber {
    const magnitude = BigNumber.absolute(number._scaledValue);
    return new BigNumber(sign._scaledValue < 0n ? -magnitude : magnitude);
  }

  static fromBigInt(value: bigint): BigNumber {
    if (BigNumber.absolute(value) > MAX_VALUE) {
      throw new RangeError(
        `BigNumber Error: The value must be between -${MAX_VALUE} and ${MAX_VALUE}, inclusive.`
      );
    }

    return new BigNumber(value * SCALE);
  }

  static fromString(value: string): BigNumber {
    return new BigNumber(BigNumber.parseScaledValue(value));
  }

  // Static Constants

  static readonly E: BigNumber = BigNumber.fromString(E);
  static readonly EULER: BigNumber = BigNumber.E;
  static readonly INF: BigNumber = BigNumber.fromBigInt(MAX_VALUE);
  static readonly POSITIVE_INFINITY: BigNumber = BigNumber.INF;
  static readonly NEG_INF: BigNumber = BigNumber.fromBigInt(-MAX_VALUE);
  static readonly NEGATIVE_INFINITY: BigNumber = BigNumber.NEG_INF;
  static readonly LN_10: BigNumber = BigNumber.fromString(LN_10);
  static readonly LN_2: BigNumber = BigNumber.fromString(LN_2);
  static readonly PI: BigNumber = BigNumber.fromString(PI);

  // Type Conversion Methods

  toBigInt(): bigint {
    return BigNumber.roundToInteger(this._scaledValue);
  }

  toString(includeTrailingZeros = false): string {
    const sign = this._scaledValue < 0n ? '-' : '';
    const magnitude = BigNumber.absolute(this._scaledValue);
    const integer = magnitude / SCALE;
    const decimal = (magnitude % SCALE).toString().padStart(DECIMAL_PLACES, '0');

    if (includeTrailingZeros)
      return `${sign}${integer}.${decimal}`;

    const trimmedDecimal = decimal.replace(/0+$/, '');
    return trimmedDecimal.length ? `${sign}${integer}.${trimmedDecimal}` : `${sign}${integer}`;
  }

  toInteger(): string {
    return BigNumber.roundToInteger(this._scaledValue).toString();
  }

  // Type Check Methods

  isInteger(): boolean {
    return this._scaledValue % SCALE == 0n;
  }

  isPositive(): boolean {
    return this._scaledValue > 0n;
  }

  // Arithmetic Conversion Methods

  abs(): BigNumber {
    return new BigNumber(BigNumber.absolute(this._scaledValue));
  }

  ceil(): BigNumber {
    const quotient = this._scaledValue / SCALE;
    const remainder = this._scaledValue % SCALE;
    return BigNumber.fromBigInt(quotient + (remainder > 0n ? 1n : 0n));
  }

  floor(): BigNumber {
    const quotient = this._scaledValue / SCALE;
    const remainder = this._scaledValue % SCALE;
    return BigNumber.fromBigInt(quotient - (remainder < 0n ? 1n : 0n));
  }

  inv(): BigNumber {
    return BigNumber.fromBigInt(1n).div(this);
  }

  neg(): BigNumber {
    return new BigNumber(-this._scaledValue);
  }

  round(): BigNumber {
    return BigNumber.fromBigInt(BigNumber.roundToInteger(this._scaledValue));
  }

  trunc(): BigNumber {
    return BigNumber.fromBigInt(this._scaledValue / SCALE);
  }

  // Logic Comparison Methods

  equals(other: BigNumber): boolean {
    return this._scaledValue == other._scaledValue;
  }

  gt(other: BigNumber): boolean {
    return this._scaledValue > other._scaledValue;
  }

  greaterThan(other: BigNumber): boolean {
    return this.gt(other);
  }

  gte(other: BigNumber): boolean {
    return this._scaledValue >= other._scaledValue;
  }

  greaterThanOrEqual(other: BigNumber): boolean {
    return this.gte(other);
  }

  lt(other: BigNumber): boolean {
    return this._scaledValue < other._scaledValue;
  }

  lessThan(other: BigNumber): boolean {
    return this.lt(other);
  }

  lte(other: BigNumber): boolean {
    return this._scaledValue <= other._scaledValue;
  }

  lessThanOrEqual(other: BigNumber): boolean {
    return this.lte(other);
  }

  // Arithmetic Operation Methods

  add(other: BigNumber): BigNumber {
    return new BigNumber(this._scaledValue + other._scaledValue);
  }

  sub(other: BigNumber): BigNumber {
    return new BigNumber(this._scaledValue - other._scaledValue);
  }

  mul(other: BigNumber): BigNumber {
    return new BigNumber(
      BigNumber.divideAndRoundHalfAwayFromZero(
        this._scaledValue * other._scaledValue,
        SCALE
      )
    );
  }

  div(other: BigNumber): BigNumber {
    if (other._scaledValue == 0n)
      throw new RangeError('BigNumber Error: Division by zero.');

    return new BigNumber(
      BigNumber.divideAndRoundHalfAwayFromZero(
        this._scaledValue * SCALE,
        other._scaledValue
      )
    );
  }

  mod(other: BigNumber): BigNumber {
    if (other._scaledValue == 0n)
      throw new RangeError('BigNumber Error: Division by zero.');

    return new BigNumber(this._scaledValue % other._scaledValue);
  }
}
