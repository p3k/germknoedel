import { authorities } from './authorities.js';
import { warn } from './feedback.js';

const CHARACTERS = '0123456789abcdefghijklmnpqrstuvwxyz';
const GENDERS = { female: 'f', male: 'm', unspecified: 'x' };

const random = list => list[randomInt(list.length) - 1];
const randomInt = max => parseInt(Math.random() * max, 10) + 1;

const randomString = length => {
  return Array.from({ length }, () => random(CHARACTERS)).join('');
};

// Built and later read (in calculate.js's `format`) as a calendar date in UTC,
// so the result is the same regardless of the host's local timezone.
const randomDate = () => {
  return new Date(Date.UTC(randomInt(new Date().getUTCFullYear()), randomInt(12) - 1, randomInt(31)));
};

export const validate = args => {
  const validated = Object.assign({}, args);

  if (validated.dateOfBirth) {
    validated.dateOfBirth = new Date(validated.dateOfBirth);
    if (isNaN(validated.dateOfBirth.getTime())) throw 'Invalid date of birth';
  } else {
    validated.dateOfBirth = randomDate();
    validated.dateOfBirth.setUTCFullYear(new Date().getUTCFullYear() + randomInt(100) - 100);
  }

  if (validated.dateOfExpiry) {
    validated.dateOfExpiry = new Date(validated.dateOfExpiry);
    if (isNaN(validated.dateOfExpiry.getTime())) throw 'Invalid date of expiry';
    if (validated.dateOfExpiry < validated.dateOfBirth) throw 'Date of expiry is before date of birth';
  } else {
    validated.dateOfExpiry = randomDate();
    validated.dateOfExpiry.setUTCFullYear(new Date().getUTCFullYear() + randomInt(10));
  }

  // `in` walks the prototype chain, so a plain object matches names like
  // "toString" too; Object.hasOwn checks only GENDERS' own keys.
  if (!validated.gender) {
    validated.gender = GENDERS.unspecified;
  } else if (Object.hasOwn(GENDERS, validated.gender)) {
    validated.gender = GENDERS[validated.gender];
  } else throw 'Unknown gender';

  if (!validated.serial) {
    if (!validated.authority) validated.authority = random(authorities).id;
    validated.serial = validated.authority + randomString(5);
  } else {
    if (validated.authority) {
      warn('Serial and authority are mutually exclusive; ignoring authority value');
    }
    validated.authority = validated.serial.substring(0, 4).toLowerCase();
  }

  // Some IDs are shared by two different authorities (reused across document
  // types or eras in the source data) – `find` returns whichever comes first.
  validated.authority = authorities.find(a => a.id === validated.authority);

  if (!validated.authority) throw 'Invalid authority';

  if (validated.serial.length !== 9) throw 'Invalid length of serial number';

  return validated;
};

export default validate;

export const getGender = genderCode => Object
  .keys(GENDERS)
  .find(key => GENDERS[key] === genderCode);