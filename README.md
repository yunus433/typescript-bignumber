# Typescript BigNumber

A native big decimal NPM library for Typescript using the `BigInt` class. It supports fixed-point decimal arithmetic with 18 decimal places in the range -1e36 to 1e36, inclusive.

[![npm version](https://img.shields.io/npm/v/typescript-bignumber.svg)](https://www.npmjs.com/package/typescript-bignumber)
[![npm downloads](https://img.shields.io/npm/dw/typescript-bignumber)](https://www.npmjs.com/package/typescript-bignumber)

## Features

* Support for fixed-point numbers in the range [-1e36, 1e36] with 18 decimal places.
* Static constructors: `copysign()`, `fromBigInt()`, `fromString()`.
* Static constants: `E`, `EULER`, `INF`, `POSITIVE_INFINITY`, `NEG_INF`, `NEGATIVE_INFINITY`, `LN_10`, `LN_2`, `PI`.
* Type conversion methods: `toBigInt()`, `toString()`, `toInteger()`.
* Type check methods: `isInteger()`, `isPositive()`.
* Arithmetic conversion methods: `abs()`, `ceil()`, `floor()`, `inv()`, `neg()`, `round()`, `trunc()`.
* Logic comparison methods: `equals()`, `gt()`, `greaterThan()`, `gte()`, `greaterThanOrEqual()`, `lt()`, `lessThan()`, `lte()`, `lessThanOrEqual()`.
* Arithmetic operations: `add()`, `sub()`, `mul()`, `div()`, `mod()`.

The library does not include a `fromNumber()` function to preserve precision.

## Installation

Node.js 22 or newer is required.

```sh
npm install typescript-bignumber
```

## Usage

Once imported, you can use `BigNumber` in any Typescript project.

```ts
import { BigNumber } from 'typescript-bignumber';

const x = BigNumber.fromString('1.28');
const y = BigNumber.fromBigInt(2n);

console.log(x.mul(y).toString()); // 2.56
```

## Creating a BigNumber

You can create a new `BigNumber` by using `fromString()` or `fromBigInt()`. The class does not include a public constructor.

```ts
const x = BigNumber.fromString('12.374738');
const y = BigNumber.fromBigInt(12489203475n);
```

`fromString()` supports a dot or comma as the decimal separator and also supports scientific notation.

```ts
const x = BigNumber.fromString('12,374738');
const y = BigNumber.fromString('1.27e-5');
```

If the given number has more than 18 decimal places, it is rounded to the 18th decimal place. Ties are rounded away from zero.

```ts
const x = BigNumber.fromString('1.9999999999999999999');

console.log(x.toString()); // 2
```

`copysign()` takes two `BigNumber` instances and returns the first argument with the sign of the second argument.

```ts
const x = BigNumber.fromString('1.2');
const sign = BigNumber.fromString('-1');

console.log(BigNumber.copysign(x, sign).toString()); // -1.2
```

## Formatting and Conversion

`toString()` serializes the instance without unnecessary trailing zeros. Pass `true` to always include all 18 decimal places.

```ts
const x = BigNumber.fromString('12.54');

console.log(x.toString());     // 12.54
console.log(x.toString(true)); // 12.540000000000000000
```

`toBigInt()` returns the closest `BigInt`. `toInteger()` returns the same rounded integer as a string.

```ts
const x = BigNumber.fromString('12.54');

console.log(x.toBigInt());  // 13n
console.log(x.toInteger()); // 13
```

`toBigInt()`, `toInteger()`, and `round()` follow `Math.round()` behavior. Ties are rounded toward positive infinity.

```ts
console.log(BigNumber.fromString('-1.5').round().toString()); // -1
```

## Static Constants

Commonly used mathematical constants are defined under the class and rounded to 18 decimal places.

```ts
BigNumber.E;     // Also available as BigNumber.EULER
BigNumber.LN_10;
BigNumber.LN_2;
BigNumber.PI;
```

`INF` and `NEG_INF` are the finite upper and lower bounds of the library. They are also available as `POSITIVE_INFINITY` and `NEGATIVE_INFINITY`.

```ts
console.log(BigNumber.INF.toString());
// 1000000000000000000000000000000000000

console.log(BigNumber.NEG_INF.toString());
// -1000000000000000000000000000000000000
```

## Methods

Methods that return a `BigNumber` create a new instance and do not change the existing instance.

| Method | Description |
| --- | --- |
| `abs()` | Returns the absolute value. |
| `ceil()` | Returns the smallest integer greater than or equal to the value. |
| `floor()` | Returns the largest integer less than or equal to the value. |
| `inv()` | Returns the inverse of the value. |
| `neg()` | Returns the negation of the value. |
| `round()` | Returns the value rounded to the closest integer. |
| `trunc()` | Returns the integer part by removing fractional digits. |
| `equals(other)` | Checks if both values are equal. |
| `gt(other)`, `greaterThan(other)` | Checks if the value is greater than `other`. |
| `gte(other)`, `greaterThanOrEqual(other)` | Checks if the value is greater than or equal to `other`. |
| `lt(other)`, `lessThan(other)` | Checks if the value is less than `other`. |
| `lte(other)`, `lessThanOrEqual(other)` | Checks if the value is less than or equal to `other`. |
| `add(other)` | Adds `other` to the value. |
| `sub(other)` | Subtracts `other` from the value. |
| `mul(other)` | Multiplies the value by `other`. |
| `div(other)` | Divides the value by `other`. |
| `mod(other)` | Returns the remainder of division by `other`. |

Multiplication and division results are rounded to 18 decimal places. Ties are rounded away from zero.

`mod()` follows the Javascript remainder operator (`%`), including its behavior with negative numbers.

```ts
const x = BigNumber.fromString('126.289');
const y = BigNumber.fromString('34.433');

console.log(x.add(y).toString()); // 160.722
console.log(x.sub(y).toString()); // 91.856
console.log(x.mul(y).toString()); // 4348.509137
console.log(x.div(y).toString()); // 3.667673452792379403
console.log(x.mod(y).toString()); // 22.99
```

`isInteger()` checks if the value is an integer. `isPositive()` checks if the value is greater than zero; zero is not positive.

## Range and Errors

All values and operation results must be in the range [-1e36, 1e36], inclusive.

* Invalid strings, including `NaN` and infinity, throw a `SyntaxError`.
* Values outside the supported range throw a `RangeError`.
* Division or remainder by zero throws a `RangeError`.
