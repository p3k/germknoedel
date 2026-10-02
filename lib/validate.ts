import { authorities, type Authority } from './authorities.ts';
import { warn } from './feedback.ts';

const CHARACTERS = '0123456789abcdefghijklmnpqrstuvwxyz';
const GENDERS = { female: 'f', male: 'm', unspecified: 'x' } as const;
const isGenderKey = (key: string): key is keyof typeof GENDERS => Object.hasOwn(GENDERS, key);

export interface ValidateInput {
  serial?: string;
  gender?: string;
  dateOfBirth?: Date | string;
  dateOfExpiry?: Date | string;
  authority?: string;
}

export interface ValidatedArgs {
  serial: string;
  gender: string;
  dateOfBirth: Date;
  dateOfExpiry: Date;
  authority: Authority;
}

// randomInt(list.length) always returns a value in [1, list.length], so the
// index below is always in range for a non-empty list – every call site
// passes one.
const random = <T>(list: T[]): T => list[randomInt(list.length) - 1]!;
const randomInt = (max: number): number => parseInt(String(Math.random() * max), 10) + 1;

const randomString = (length: number): string => {
  return Array.from({ length }, () => random(CHARACTERS.split(''))).join('');
};

// Built and later read (in calculate.js's `format`) as a calendar date in UTC,
// so the result is the same regardless of the host's local timezone.
const randomDate = (): Date => {
  return new Date(Date.UTC(randomInt(new Date().getUTCFullYear()), randomInt(12) - 1, randomInt(31)));
};

export const validate = (args: ValidateInput = {}): ValidatedArgs => {
  const validated: ValidateInput = Object.assign({}, args);

  let dateOfBirth: Date;
  if (validated.dateOfBirth) {
    dateOfBirth = new Date(validated.dateOfBirth);
    if (isNaN(dateOfBirth.getTime())) throw new Error('Invalid date of birth');
  } else {
    dateOfBirth = randomDate();
    dateOfBirth.setUTCFullYear(new Date().getUTCFullYear() + randomInt(100) - 100);
  }

  let dateOfExpiry: Date;
  if (validated.dateOfExpiry) {
    dateOfExpiry = new Date(validated.dateOfExpiry);
    if (isNaN(dateOfExpiry.getTime())) throw new Error('Invalid date of expiry');
    if (dateOfExpiry < dateOfBirth) throw new Error('Date of expiry is before date of birth');
  } else {
    dateOfExpiry = randomDate();
    dateOfExpiry.setUTCFullYear(new Date().getUTCFullYear() + randomInt(10));
  }

  // `in` walks the prototype chain, so a plain object matches names like
  // "toString" too; isGenderKey checks only GENDERS' own keys.
  let gender: string;
  if (!validated.gender) {
    gender = GENDERS.unspecified;
  } else if (isGenderKey(validated.gender)) {
    gender = GENDERS[validated.gender];
  } else throw new Error('Unknown gender');

  let serial: string;
  let authorityId: string;
  if (!validated.serial) {
    authorityId = typeof validated.authority === 'string' ? validated.authority : random(authorities).id;
    serial = authorityId + randomString(5);
  } else {
    if (validated.authority) {
      warn('Serial and authority are mutually exclusive; ignoring authority value');
    }
    serial = validated.serial;
    authorityId = serial.substring(0, 4).toLowerCase();
  }

  // Some IDs are shared by two different authorities (reused across document
  // types or eras in the source data) – `find` returns whichever comes first.
  const authority = authorities.find(a => a.id === authorityId);

  if (!authority) throw new Error('Invalid authority');

  if (serial.length !== 9) throw new Error('Invalid length of serial number');

  return { serial, gender, dateOfBirth, dateOfExpiry, authority };
};

export default validate;

export const getGender = (genderCode: string): string | undefined =>
  (Object.keys(GENDERS) as (keyof typeof GENDERS)[]).find(key => GENDERS[key] === genderCode);
