import chalk from 'chalk';

export const success = (...args) => {
  args.unshift('🍀');
  console.log.apply(console, args.map(arg => chalk.green.bold(arg)));
};

export const warn = (...args) => {
  args.unshift('💡');
  console.warn.apply(console, args.map(arg => chalk.yellow.bold(arg)));
};

export const fail = (...args) => {
  args.unshift('⚡');
  console.error.apply(console, args.map(arg => chalk.red.bold(arg)));
};
