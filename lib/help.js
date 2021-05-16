const chalk = require('chalk');
const commandLineUsage = require('command-line-usage');

module.exports = args => {
  const usage = commandLineUsage([
    {
      header: 'Name'.toUpperCase(),
      content: 'germknoedel – generate passport codes.'
    },
    {
      header: 'Synopsis'.toUpperCase(),
      content: `germknoedel <date-of-birth> <date-of-expiry>
        germknodel (alternative spelling)`
    },
    {
      header: 'Examples'.toUpperCase(),
      content: `germknoedel
        ${chalk.gray(
          'Generate a code issued by a random authority, with random serial number, date of birth and date of expiry, as well as unspecified gender.'
        )}

        germknoedel 1970-01-01 2019-12-31
        ${chalk.gray('Generate a code with the desired date of birth and date of expiry.')}

        germknoedel --authority 3533 1970-01-01 2019-12-31
        ${chalk.gray('Generate a code issued by the German ambassador in Vienna.')}

        germknoedel --serial 3533IIY6Z 1970-01-01 2019-12-31
        ${chalk.gray('Generate a code with the desired serial number.')}

        germknoedel --gender female 1970-01-01 2019-12-31
        ${chalk.gray('Generate a code with the desired gender.')}

        germknoedel --query wien
        ${chalk.gray(
          'List all known authorities containing the term “wien” – i.e. most likely located in Vienna, Austria.'
        )}

        germknoedel --update
        ${chalk.gray('Update the known list of authorities.')}`
    },
    { header: 'Options'.toUpperCase(), optionList: args }
  ]);

  console.log(usage);
};
