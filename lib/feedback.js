const chalk = require('chalk');

module.exports = {
  success: (...args) => {
    args.unshift('✅');
    console.log.apply(console, args.map(arg => chalk.green.bold(arg)));
  },

  warn: (...args) => {
    args.unshift('⚠️');
    console.warn.apply(console, args.map(arg => chalk.yellow.bold(arg)));
  },

  fail: (...args) => {
    args.unshift('‼️');
    console.error.apply(console, args.map(arg => chalk.red.bold(arg)));
  }
};
