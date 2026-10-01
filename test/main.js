import assert from 'assert';
import { calculate, validate } from '../index.js';
import { convert, query } from '../lib/authorities.js';

describe('calculate', () => {
  it('should generate a passport code', () => {
    const code = calculate('abcd56789', 'X', new Date('1 Jan 1970'), new Date('31 Dec 2019'));
    assert.equal(code, 'ABCD567899D<<7001017X1912319<<<<<<<<<<<<<<<6');
  });

  it('should generate a passport code from an object', () => {
    const code = calculate({
      serial: 'abcd56789',
      gender: 'X',
      dateOfBirth: new Date('1 Jan 1970'),
      dateOfExpiry: new Date('31 Dec 2019')
    });

    assert.equal(code, 'ABCD567899D<<7001017X1912319<<<<<<<<<<<<<<<6');
  });

  it('should automatically define default values', () => {
    const code = calculate();
    assert.equal(code.length, 44);
    assert(code.startsWith('0000000000D<<'));
  });
});

describe('validate', () => {
  it('should automatically define default values', () => {
    const args = validate({});

    assert(args.dateOfBirth);
    assert(args.dateOfExpiry);
    assert.equal(args.gender, 'x');
    assert(args.authority);
    assert(args.authority.id);
    assert(args.authority.name);

    assert.equal(args.dateOfBirth.constructor, Date);
    assert.equal(args.dateOfExpiry.constructor, Date);
    assert.equal(args.authority.id.constructor, String);
    assert.equal(args.authority.name.constructor, String);
  });

  it('should throw an error if date of birth is invalid', () => {
    assert.throws(() => validate({ dateOfBirth: 'invalid date' }), /invalid date/i);
  });

  it('should throw an error if date of expiry is invalid', () => {
    assert.throws(() => validate({ dateOfExpiry: 'invalid date' }), /invalid date/i);
  });

  it('should throw an error if date of expiry is before date of birth', () => {
    assert.throws(
      () =>
        validate({
          dateOfBirth: '31 Dec 2000',
          dateOfExpiry: '30 Dec 2000'
        }),
      /is before/i
    );
  });

  it('should throw an error if gender is unknown', () => {
    assert.throws(() => validate({ gender: 'invalid date' }), /unknown/i);
  });

  it('should throw an error if authority is invalid', () => {
    assert.throws(() => validate({ authority: 'invalid date' }), /invalid authority/i);
  });

  it('should throw an error if serial references invalid authority', () => {
    assert.throws(() => validate({ serial: 'abcd56789' }), /invalid authority/i);
  });

  it('should throw an error if serial is shorter than required', () => {
    assert.throws(() => validate({ serial: '35335678' }), /invalid length/i);
  });

  it('should throw an error if serial is longer than required', () => {
    assert.throws(() => validate({ serial: '3533567890' }), /invalid length/i);
  });
});

describe('query', () => {
  it('should find authorities via search term', () => {
    const results = query('wien');
    assert.equal(results.constructor, Array);
    assert.equal(results.length, 2);
    assert.equal(results[0].id, '3533');
    assert.equal(results[1].id, 'c4vw');
  });
});

describe('convert', () => {
  const line = ['0302', 'PA', '1997', '18209', 'Stadt', 'Bad Doberan', '', 'DBR'].join('\t');

  it('should convert tab separated authority data', () => {
    const results = convert(line);
    assert.equal(results.length, 1);
    assert.deepEqual(results[0], {
      id: '0302',
      documentType: 'PA',
      year: '1997',
      zip: '18209',
      type: 'Stadt',
      name: 'Bad Doberan',
      url: '',
      licenseTag: 'DBR'
    });
  });

  it('should lowercase the authority ID', () => {
    const results = convert(['C4VW', 'RP', '', '', '', 'Wien', '', ''].join('\t'));
    assert.equal(results[0].id, 'c4vw');
  });

  it('should skip comments and blank lines', () => {
    const results = convert(`#!/usr/bin/env bash\n#Dateiname:\tBKZ.sh\n\n${line}\n\n`);
    assert.equal(results.length, 1);
  });

  it('should skip lines without an ID or a name', () => {
    assert.equal(convert('\t\t\t\t\t\t\t').length, 0);
    assert.equal(convert(['0302', 'PA', '', '', '', '', '', ''].join('\t')).length, 0);
  });
});
