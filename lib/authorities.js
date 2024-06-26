import fs from 'node:fs';
import http from 'node:http';
import zlib from 'node:zlib';

import { success, fail, write } from './feedback.js';
import { __dirname } from './util.js';

const url = 'http://www.pruefziffernberechnung.de/Begleitdokumente/BKZ.sh.gz';
const authorities = JSON.parse(fs.readFileSync(__dirname + '/../authorities.json'));

const query = query => {
  if (query === null) throw 'Invalid query';
  if (query === '*') query = '';

  return authorities
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
    });
};

const convert = text => {
  return text
    .split('\n')
    .filter(line => line && line.trim() && !line.startsWith('#'))
    .reduce((list, item) => {
      const parts = item.split('\t');

      const id = parts[0];
      const name = parts[5];

      if (id && name) {
        list.push({
          id: id.toLowerCase(),
          documentType: parts[1],
          year: parts[2],
          zip: parts[3],
          type: parts[4],
          name: name,
          url: parts[6],
          licenseTag: parts[7]
        });
      }

      return list;
    }, []);
};

const update = () => {
  write('Fetching authority data from', url);

  http
    .get(url, response => {
      const buffer = [];
      const gunzip = zlib.createGunzip();

      gunzip
        .on('data', data => {
          buffer.push(data.toString());
        })
        .on('error', error => {
          fail(error);
        })
        .on('end', () => {
          const data = convert(buffer.join(''));
          fs.writeFileSync('authorities.json', JSON.stringify(data));
          success('Done.');
        });

      response.pipe(gunzip);
    })
    .on('error', error => {
      fail(error);
    });
};

export { authorities, query, update };
