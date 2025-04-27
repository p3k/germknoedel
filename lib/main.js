import fs from 'node:fs';

import chalk from 'chalk';
import commandLineArgs from 'command-line-args';

import calculate from './calculate.js';
import { fail, write, writeJson } from './feedback.js';
import help from './help.js';
import { query, update } from './authorities.js';
import { validate, getGender } from './validate.js';

import { __dirname } from './util.js';

const module = JSON.parse(fs.readFileSync(__dirname + '/../package.json'));

const mainArgs = [
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
  { name: 'serial', alias: 's', type: String, description: 'The full serial number (8 characters)' },
  { name: 'update', alias: 'u', type: Boolean, description: 'Update authority data' },
  { name: 'version', alias: 'v', type: Boolean, description: 'Output the version string' }
];

const args = commandLineArgs(mainArgs, { stopAtFirstUnknown: true });
const argv = args._unknown || [];
delete args._unknown;

args.dateOfBirth = argv[0];
args.dateOfExpiry = argv[1];

const queryAuthorities = args => {
  const authorities = query(args.query);
  if (args.format === 'json') {
    writeJson(authorities);
  } else {
    authorities.forEach(authority => write(chalk.green.bold(authority.id), authority.name));
  }
};

const calculateCode = args => {
  const { serial, gender, dateOfBirth, dateOfExpiry, authority } = validate(args);
  const code = calculate(serial, gender, dateOfBirth, dateOfExpiry);

  const result = {
    authority,
    code,
    dateOfBirth: dateOfBirth.toDateString(),
    dateOfExpiry: dateOfExpiry.toDateString(),
    gender: gender || 'unspecified',
    serial
  };

  if (args.format === 'json') {
    writeJson(result, null, '  ');
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

try {
  if (!args.format) args.format = 'console';

  if (!['console', 'json', 'plain'].includes(args.format)) {
    throw 'Invalid format';
  }

  if (args.help) {
    help(mainArgs);
  } else if (args.version) {
    write(module.version);
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
