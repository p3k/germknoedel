import chalk from 'chalk';
import commandLineArgs from 'command-line-args';
import fs from 'fs';

import calculate from './calculate.js';
import { fail } from './feedback.js';
import help from './help.js';
import { query, update } from './authorities.js';
import validate from './validate.js';

import { __dirname } from './util.js';

const module = JSON.parse(fs.readFileSync(__dirname + '/../package.json'));

const mainArgs = [
  { name: 'authority', alias: 'a', type: String, description: 'The ID of the issuing authority' },
  { name: 'gender', alias: 'g', type: String, description: 'Either male, female or unspecified (default)' },
  { name: 'help', alias: 'h', type: Boolean, description: 'Print this help message' },
  {
    name: 'query',
    alias: 'q',
    type: String,
    description: 'Search string to query for all known authorities and their corresponding IDs'
  },
  { name: 'serial', alias: 's', type: String, description: 'The full serial number (8 characters)' },
  { name: 'update', alias: 'u', type: Boolean, description: 'Update authority data' },
  { name: 'version', alias: 'v', type: Boolean, description: 'Output the version string'}
];

const args = commandLineArgs(mainArgs, { stopAtFirstUnknown: true });
const argv = args._unknown || [];
delete args._unknown;

args.dateOfBirth = argv[0];
args.dateOfExpiry = argv[1];

if (args.help) {
  help(mainArgs);
} else if (args.version) {
  console.log(module.version);
} else if (args.update) {
  update();
} else if (typeof args.query !== 'undefined') {
  query(args.query).forEach(authority => console.log(chalk.green.bold(authority.id), authority.name));
} else {
  try {
    const { serial, gender, dateOfBirth, dateOfExpiry, authority } = validate(args);
    const result = calculate(serial, gender, dateOfBirth, dateOfExpiry);

    console.log(`${chalk.green.bold(result)}
Authority: ${authority.name}
Date of birth:  ${dateOfBirth.toDateString()}
Date of expiry: ${dateOfExpiry.toDateString()}
Gender: ${args.gender || 'unspecified'}`);
  } catch (error) {
    fail(error);
  }
}
