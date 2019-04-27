#!/usr/bin/env node

const fs = require('fs');
const http = require('http');
const zlib = require('zlib');

const { success, fail } = require('./feedback');

const url = 'http://www.pruefziffernberechnung.de/Begleitdokumente/BKZ.sh.gz';

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

module.exports = () => {
  console.log('Fetching authority data from %s', url);

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
