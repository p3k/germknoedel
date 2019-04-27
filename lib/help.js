const chalk = require('chalk');
const commandLineUsage = require('command-line-usage');

module.exports = args => {
  const usage = commandLineUsage([
    {
      header: 'Name'.toUpperCase(),
      content: 'germknödel – generate passport codes.'
    },
    {
      header: 'Synopsis'.toUpperCase(),
      content: `germknödel <date-of-birth> <date-of-expiry>
        germknoedel (alternative spelling for international keyboards.)`
    },
    {
      header: 'Examples'.toUpperCase(),
      content: `germknödel
        ${chalk.gray(
          'Generate a code issued by a random authority, with random serial number, date of birth and date of expiry, as well as unspecified gender.'
        )}

        germknödel 1970-01-01 2019-12-31
        ${chalk.gray('Generate a code with the desired date of birth and date of expiry.')}

        germknödel --authority 3533 1970-01-01 2019-12-31
        ${chalk.gray('Generate a code issued by the German ambassador in Vienna.')}

        germknödel --serial 3533IIY6Z 1970-01-01 2019-12-31
        ${chalk.gray('Generate a code with the desired serial number.')}

        germknödel --gender female 1970-01-01 2019-12-31
        ${chalk.gray('Generate a code with the desired gender.')}

        germknödel --query wien
        ${chalk.gray(
          'List all known authorities containing the term “wien” – i.e. most likely located in Vienna, Austria.'
        )}

        germknödel --update
        ${chalk.gray('Update the known list of authorities.')}`
    },
    { header: 'Options'.toUpperCase(), optionList: args }
  ]);

  console.log(usage);
};
