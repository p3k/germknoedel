import assert from 'assert';
import { execFileSync } from 'node:child_process';
import { calculate, validate } from '../index.js';
import { convert, query } from '../lib/authorities.js';

describe('calculate', () => {
  it('should generate a passport code', () => {
    const code = calculate('abcd56789', 'X', new Date('1970-01-01'), new Date('2019-12-31'));
    assert.equal(code, 'ABCD567899D<<7001017X1912319<<<<<<<<<<<<<<<6');
  });

  // A date of birth is a calendar date, not an instant, and must not depend on
  // the host's local timezone. Spawning real processes under different TZ
  // values is what actually proves that – a single process can't easily fake
  // observing itself from two timezones at once.
  it('should not depend on the host timezone', () => {
    const script =
      "import('./lib/calculate.js').then(m => console.log(m.default('abcd56789', 'X', new Date('1970-01-01'), new Date('2019-12-31'))))";

    const run = TZ => execFileSync(process.execPath, ['-e', script], { env: { ...process.env, TZ } })
      .toString()
      .trim();

    const utc = run('UTC');
    assert.equal(utc, 'ABCD567899D<<7001017X1912319<<<<<<<<<<<<<<<6');
    assert.equal(run('America/Los_Angeles'), utc);
    assert.equal(run('Pacific/Kiritimati'), utc);
  });

  it('should generate a passport code from an object', () => {
    const code = calculate({
      serial: 'abcd56789',
      gender: 'X',
      dateOfBirth: new Date('1970-01-01'),
      dateOfExpiry: new Date('2019-12-31')
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
          dateOfBirth: '2000-12-31',
          dateOfExpiry: '2000-12-30'
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

describe('cli', () => {
  // The code and the printed "Date of birth"/"Date of expiry" lines must agree
  // regardless of the host timezone – they used to disagree under a negative
  // UTC offset, because the code was computed in UTC but the display text used
  // Date.prototype.toDateString(), which reads local time.
  it('should print dates that agree with the code, in any timezone', () => {
    const run = TZ =>
      execFileSync(process.execPath, ['bin/germknoedel.js', '1970-01-01', '2019-12-31'], {
        env: { ...process.env, TZ }
      }).toString();

    for (const TZ of ['UTC', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
      const output = run(TZ);
      assert.match(output, /D<<7001017X1912319</, `wrong code under TZ=${TZ}`);
      assert.match(output, /Date of birth: Thu Jan 01 1970/, `wrong date of birth under TZ=${TZ}`);
      assert.match(output, /Date of expiry: Tue Dec 31 2019/, `wrong date of expiry under TZ=${TZ}`);
    }
  });
});
