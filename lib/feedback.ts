import process from 'node:process';
import chalk from 'chalk';

export const write = (...args: unknown[]): void => {
  process.stdout.write(`${args.join(' ')}\n`);
};

export const writeJson = (object: unknown): void => {
  write(JSON.stringify(object, null, '  '));
};

export const success = (message: string): void => {
  process.stdout.write(`🍀 ${chalk.green.bold(message)}\n`);
};

export const warn = (message: string): void => {
  process.stdout.write(`💡 ${chalk.yellow.bold(message)}\n`);
};

export const fail = (message: unknown): void => {
  process.stdout.write(`❗️ ${chalk.red.bold(String(message))}\n`);
};
