import process from 'node:process';
import chalk from 'chalk';

export const write = (...args) => {
  process.stdout.write(`${args.join(' ')}\n`);
};

export const writeJson = object => {
  write(JSON.stringify(object, null, '  '));
};

export const success = message => {
  process.stdout.write(`🍀 ${chalk.green.bold(message)}\n`);
};

export const warn = message => {
  process.stdout.write(`💡 ${chalk.yellow.bold(message)}\n`);
};

export const fail = message => {
  process.stdout.write(`❗️ ${chalk.red.bold(message)}\n`);
};
