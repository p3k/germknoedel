import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import zlib from 'node:zlib';
import type { IncomingMessage } from 'node:http';

import authoritiesData from '../authorities.json' with { type: 'json' };
import { success, fail, write } from './feedback.ts';
import { __dirname } from './util.ts';

export interface Authority {
  id: string;
  documentType: string;
  year: string;
  zip: string;
  type: string;
  name: string;
  url: string;
  licenseTag: string;
}

const authorities = authoritiesData as Authority[];

// This source is currently dead – the path returns 404 and the domain redirects
// to an unrelated site – and no replacement publishes the data in this layout.
// The URL stays hardcoded on purpose: `convert` below understands exactly this
// tab separated file, so a new source means new parsing code anyway. See #107.
const url = 'http://www.pruefziffernberechnung.de/Begleitdokumente/BKZ.sh.gz';

// Only used to write an update back to disk, which only ever happens from the
// locally installed CLI – __dirname/fileURLToPath requires a file: URL, which
// breaks for anyone loading this module remotely (e.g. `jsr:@p3k/germknoedel`),
// so it must not be used for the read path above.
const file = __dirname + '/../authorities.json';

const query = (query: string | null): Authority[] => {
  if (query === null) throw 'Invalid query';
  if (query === '*') query = '';

  return authorities
    .filter(authority => {
      if (!authority.name || !authority.id) return false;
      return authority.name.toLowerCase().indexOf(query.toLowerCase()) > -1;
    })
    .reduce<Authority[]>((list, authority) => {
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

const convert = (text: string): Authority[] => {
  return text
    .split('\n')
    .filter(line => line && line.trim() && !line.startsWith('#'))
    .reduce<Authority[]>((list, item) => {
      const parts = item.split('\t');

      const id = parts[0];
      const name = parts[5];

      if (id && name) {
        list.push({
          id: id.toLowerCase(),
          documentType: parts[1] ?? '',
          year: parts[2] ?? '',
          zip: parts[3] ?? '',
          type: parts[4] ?? '',
          name: name,
          url: parts[6] ?? '',
          licenseTag: parts[7] ?? ''
        });
      }

      return list;
    }, []);
};

const download = (url: string, redirectsLeft = 5): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const client = new URL(url).protocol === 'http:' ? http : https;

    client
      .get(url, (response: IncomingMessage) => {
        const { statusCode, headers } = response;

        if (statusCode !== undefined && [301, 302, 303, 307, 308].includes(statusCode) && headers.location) {
          response.resume();
          if (redirectsLeft === 0) {
            reject(`Too many redirects fetching ${url}`);
            return;
          }
          resolve(download(new URL(headers.location, url).toString(), redirectsLeft - 1));
          return;
        }

        // Without this the body of an error page was piped straight into gunzip,
        // which reported “incorrect header check” instead of naming the status.
        if (statusCode !== 200) {
          response.resume();
          reject(`Fetching ${url} failed with status ${statusCode}`);
          return;
        }

        const chunks: Buffer[] = [];

        response
          .on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          })
          .on('error', reject)
          .on('end', () => {
            resolve(Buffer.concat(chunks));
          });
      })
      .on('error', reject);
  });
};

const update = async (): Promise<void> => {
  write('Fetching authority data from', url);

  try {
    const data = convert(zlib.gunzipSync(await download(url)).toString());

    // The previous implementation wrote to the working directory, while the data
    // is read from the package directory, so a successful update wrote a file
    // that was never read.
    fs.writeFileSync(file, JSON.stringify(data));
    success(`Done, ${data.length} authorities.`);
  } catch (error) {
    fail(error instanceof Error ? error.message : error);
  }
};

export { authorities, convert, query, update };
