const fs = require('fs');
const chalk = require('chalk');

const authorities = JSON.parse(fs.readFileSync('authorities.json'));

const query = query => {
  if (query === '*') query = '';

  authorities
    .filter(authority => {
      if (!authority.name || !authority.id) return false;
      return authority.name.toLowerCase().indexOf(query.toLowerCase()) > -1;
    })
    .reduce((list, authority) => {
      if (
        !list.some(availableAuthority => {
          return availableAuthority.id === authority.id && availableAuthority.name === authority.name;
        })
      ) {
        list.push(authority);
      }
      return list;
    }, [])
    .sort((authority1, authority2) => {
      const name1 = authority1.name.toLowerCase();
      const name2 = authority2.name.toLowerCase();

      if (name1 === name2) {
        if (authority1.id > authority2.id) return 1;
        if (authority1.id < authority2.id) return -1;
      }

      if (name1 > name2) return 1;
      if (name1 < name2) return -1;
      return 0;
    })
    .forEach(authority => console.log(chalk.green.bold(authority.id), authority.name));

  return;
};

module.exports = { authorities, query };
