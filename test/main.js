import assert from 'assert';
import fs from 'node:fs';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { calculate, validate } from '../index.js';
import { convert, query } from '../lib/authorities.js';
import help from '../lib/help.js';
import { run } from '../lib/main.js';
import { write, writeJson, success, warn, fail } from '../lib/feedback.js';

const execFileAsync = promisify(execFile);

// lib/main.js parses process.argv and acts on it as soon as it is imported,
// so it cannot be imported directly in a test – it has to be run as the
// actual CLI binary, in a child process, just like a real user would.
const runCli = (args, env = {}) =>
  execFileSync(process.execPath, ['bin/germknoedel.js', ...args], {
    env: { ...process.env, ...env }
  }).toString();

// Spawning a real Node process is the dominant cost in this file by far – a
// single CLI invocation already costs more than the rest of the suite
// combined. Running independent spawns concurrently, rather than one `it()`
// awaiting them in sequence, is what actually matters for keeping that cost
// from multiplying; the irreducible single-spawn floor elsewhere is just the
// price of testing a real binary instead of an in-process function.
const runCliConcurrently = (args, envs) =>
  Promise.all(
    envs.map(env =>
      execFileAsync(process.execPath, ['bin/germknoedel.js', ...args], {
        env: { ...process.env, ...env }
      }).then(({ stdout }) => stdout)
    )
  );

// feedback.js and help.js write straight to process.stdout.write; capture it
// rather than importing them into a child process too, since neither has any
// top-level side effect that makes that unsafe.
const captureStdout = fn => {
  const original = process.stdout.write;
  let output = '';
  process.stdout.write = chunk => {
    output += chunk;
    return true;
  };
  try {
    fn();
  } finally {
    process.stdout.write = original;
  }
  return output;
};

describe('calculate', () => {
  it('should generate a passport code', () => {
    const code = calculate('abcd56789', 'X', new Date('1970-01-01'), new Date('2019-12-31'));
    assert.equal(code, 'ABCD567899D<<7001017X1912319<<<<<<<<<<<<<<<6');
  });

  // A date of birth is a calendar date, not an instant, and must not depend on
  // the host's local timezone. Spawning real processes under different TZ
  // values is what actually proves that – a single process can't easily fake
  // observing itself from two timezones at once.
  it('should not depend on the host timezone', async () => {
    const script =
      "import('./lib/calculate.js').then(m => console.log(m.default('abcd56789', 'X', new Date('1970-01-01'), new Date('2019-12-31'))))";

    const runScript = TZ =>
      execFileAsync(process.execPath, ['-e', script], { env: { ...process.env, TZ } }).then(({ stdout }) =>
        stdout.trim()
      );

    const [utc, la, kiritimati] = await Promise.all([
      runScript('UTC'),
      runScript('America/Los_Angeles'),
      runScript('Pacific/Kiritimati')
    ]);
    assert.equal(utc, 'ABCD567899D<<7001017X1912319<<<<<<<<<<<<<<<6');
    assert.equal(la, utc);
    assert.equal(kiritimati, utc);
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

  // GENDERS is a plain object, so `gender in GENDERS` used to match any
  // inherited Object.prototype member name too.
  it('should throw an error if gender is an inherited object member name', () => {
    assert.throws(() => validate({ gender: 'toString' }), /unknown/i);
    assert.throws(() => validate({ gender: 'hasOwnProperty' }), /unknown/i);
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
  // Date.prototype.toDateString(), which reads local time. TZ is read from the
  // real process environment, so this is the one test here that genuinely
  // needs separate spawned processes rather than an in-process run() call.
  it('should print dates that agree with the code, in any timezone', async () => {
    const TZs = ['UTC', 'America/Los_Angeles', 'Pacific/Kiritimati'];
    const outputs = await runCliConcurrently(['1970-01-01', '2019-12-31'], TZs.map(TZ => ({ TZ })));

    TZs.forEach((TZ, i) => {
      const output = outputs[i];
      assert.match(output, /D<<7001017X1912319</, `wrong code under TZ=${TZ}`);
      assert.match(output, /Date of birth: Thu Jan 01 1970/, `wrong date of birth under TZ=${TZ}`);
      assert.match(output, /Date of expiry: Tue Dec 31 2019/, `wrong date of expiry under TZ=${TZ}`);
    });
  });

  // The one true end-to-end check: that bin/germknoedel.js, shebang and all,
  // actually wires up to run(). Everything below exercises run() directly and
  // in-process – argv parsing and dispatch have no reason to need a real
  // process once they aren't also tangled up with module-load side effects.
  it('should generate a code when run as the installed binary', () => {
    const output = runCli(['1970-01-01', '2019-12-31']);
    assert.match(output, /D<<7001017X1912319</);
  });

  it('should print the version from package.json', () => {
    const { version } = JSON.parse(fs.readFileSync('./package.json'));
    assert.equal(captureStdout(() => run(['--version'])).trim(), version);
  });

  it('should list matching authorities', () => {
    const output = captureStdout(() => run(['--query', 'wien']));
    assert.match(output, /3533/);
    assert.match(output, /Wien/);
  });

  it('should list matching authorities as JSON', () => {
    const results = JSON.parse(captureStdout(() => run(['--query', 'wien', '--format', 'json'])));
    assert.equal(results.length, 2);
    assert.equal(results[0].id, '3533');
  });

  it('should output plain format as just the code', () => {
    const output = captureStdout(() => run(['--format', 'plain', '1970-01-01', '2019-12-31'])).trim();
    assert.match(output, /^\w{9}\dD<<7001017X1912319<{15}\d$/);
  });

  it('should output json format with the code and display dates', () => {
    const result = JSON.parse(captureStdout(() => run(['--format', 'json', '1970-01-01', '2019-12-31'])));
    assert.match(result.code, /D<<7001017X1912319</);
    assert.equal(result.dateOfBirth, 'Thu Jan 01 1970');
    assert.equal(result.dateOfExpiry, 'Tue Dec 31 2019');
  });

  it('should accept short option aliases', () => {
    const output = captureStdout(() =>
      run(['-a', '3533', '-g', 'female', '-f', 'plain', '1970-01-01', '2019-12-31'])
    ).trim();
    assert.match(output, /^3533/);
    assert.match(output, /F1912319/);
  });

  // main.js itself decides to print help after reporting an error – that
  // combination is main.js's own behaviour, not validate()'s, which only
  // throws.
  it('should report an invalid format and still print help', () => {
    const output = captureStdout(() => run(['--format', 'bogus']));
    assert.match(output, /Invalid format/i);
    assert.match(output, /SYNOPSIS/);
  });
});

// Covers --help's actual output; cheaper than a CLI-level spawn, and main.js's
// own side of that flag is just `if (args.help) help(mainArgs)`.
describe('help', () => {
  it('should print usage with the given option descriptions', () => {
    const output = captureStdout(() =>
      help([{ name: 'foo', alias: 'f', type: String, description: 'A foo option' }])
    );
    assert.match(output, /NAME/);
    assert.match(output, /SYNOPSIS/);
    assert.match(output, /EXAMPLES/);
    assert.match(output, /OPTIONS/);
    assert.match(output, /--foo/);
    assert.match(output, /A foo option/);
  });
});

describe('feedback', () => {
  it('should write arguments space-joined with a trailing newline', () => {
    assert.equal(captureStdout(() => write('a', 'b', 'c')), 'a b c\n');
  });

  it('should write JSON with two-space indentation', () => {
    assert.equal(captureStdout(() => writeJson({ a: 1 })), '{\n  "a": 1\n}\n');
  });

  it('should prefix success messages', () => {
    const output = captureStdout(() => success('done'));
    assert.match(output, /🍀/);
    assert.match(output, /done/);
  });

  it('should prefix warnings', () => {
    const output = captureStdout(() => warn('careful'));
    assert.match(output, /💡/);
    assert.match(output, /careful/);
  });

  it('should prefix failures', () => {
    const output = captureStdout(() => fail('broken'));
    assert.match(output, /❗/);
    assert.match(output, /broken/);
  });
});
