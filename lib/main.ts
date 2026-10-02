import fs from 'node:fs';

import chalk from 'chalk';
import commandLineArgs, { type OptionDefinition } from 'command-line-args';

import calculate from './calculate.ts';
import { toDisplayDate } from './date.ts';
import { fail, write, writeJson } from './feedback.ts';
import help from './help.ts';
import { query, update } from './authorities.ts';
import { validate, getGender } from './validate.ts';

import { __dirname } from './util.ts';

const pkg = JSON.parse(fs.readFileSync(__dirname + '/../package.json', 'utf8'));

interface Args {
  authority?: string;
  gender?: string;
  format?: string;
  help?: boolean;
  query?: string;
  serial?: string;
  update?: boolean;
  version?: boolean;
  dateOfBirth?: string;
  dateOfExpiry?: string;
  _unknown?: string[];
}

const mainArgs: (OptionDefinition & { description: string })[] = [
  { name: 'authority', alias: 'a', type: String, description: 'The ID of the issuing authority' },
  { name: 'gender', alias: 'g', type: String, description: 'Either male, female or unspecified (default)' },
  {
    name: 'format',
    alias: 'f',
    type: String,
    description: 'Specify the output format: console (default), plain, or json'
  },
  { name: 'help', alias: 'h', type: Boolean, description: 'Print this help message' },
  {
    name: 'query',
    alias: 'q',
    type: String,
    description: 'Search string to query for all known authorities and their corresponding IDs'
  },
  { name: 'serial', alias: 's', type: String, description: 'The full serial number (9 characters)' },
  { name: 'update', alias: 'u', type: Boolean, description: 'Update authority data' },
  { name: 'version', alias: 'v', type: Boolean, description: 'Output the version string' }
];

const queryAuthorities = (args: Args): void => {
  const authorities = query(args.query ?? null);
  if (args.format === 'json') {
    writeJson(authorities);
  } else {
    authorities.forEach(authority => write(chalk.green.bold(authority.id), authority.name));
  }
};

const calculateCode = (args: Args): void => {
  const { serial, gender, dateOfBirth, dateOfExpiry, authority } = validate(args);
  const code = calculate(serial, gender, dateOfBirth, dateOfExpiry);

  const result = {
    authority,
    code,
    dateOfBirth: toDisplayDate(dateOfBirth),
    dateOfExpiry: toDisplayDate(dateOfExpiry),
    gender: gender || 'unspecified',
    serial
  };

  if (args.format === 'json') {
    writeJson(result);
  } else if (args.format === 'plain') {
    write(code);
  } else {
    write(
      chalk.green.bold(code),
      '\nAuthority:',
      authority.name,
      '\nDate of birth:',
      result.dateOfBirth,
      '\nDate of expiry:',
      result.dateOfExpiry,
      '\nGender:',
      getGender(result.gender)
    );
  }
};

// Parsing argv and dispatching on it are both side effects, so they live in
// here rather than at module scope – importing this file must be safe to do
// without acting on the real process.argv, which is what let the rest of it
// (queryAuthorities, calculateCode) be tested directly, in-process, instead
// of only through a spawned process.
export const run = (argv: string[] = process.argv.slice(2)): void => {
  const args = commandLineArgs(mainArgs, { argv, stopAtFirstUnknown: true }) as Args;
  const unknown = args._unknown || [];
  delete args._unknown;

  args.dateOfBirth = unknown[0];
  args.dateOfExpiry = unknown[1];

  try {
    if (!args.format) args.format = 'console';

    if (!['console', 'json', 'plain'].includes(args.format)) {
      throw 'Invalid format';
    }

    if (args.help) {
      help(mainArgs);
    } else if (args.version) {
      write(pkg.version);
    } else if (args.update) {
      update();
    } else if (typeof args.query !== 'undefined') {
      queryAuthorities(args);
    } else {
      calculateCode(args);
    }
  } catch (message) {
    fail(message);
    help(mainArgs);
  }
};
