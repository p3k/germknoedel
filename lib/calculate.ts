import { toCodeDate } from './date.ts';

export interface PassportCodeOptions {
  serial?: string;
  gender?: string;
  dateOfBirth?: Date;
  dateOfExpiry?: Date;
}

const number = (char: string): number => {
  return isNaN(Number(char)) ? char.toUpperCase().charCodeAt(0) - 55 : parseInt(char, 10);
};

const checksum = (series: string): number => {
  const weights = [7, 3, 1] as const;

  return (
    Array.from(series).reduce((checksum, char, index) => {
      // index % 3 is always 0, 1, or 2 – always in range for this fixed 3-tuple.
      const weight = weights[index % 3 as 0 | 1 | 2];
      return (checksum += weight * number(char));
    }, 0) % 10
  );
};

function calculate(serial?: string, gender?: string, dateOfBirth?: Date, dateOfExpiry?: Date): string;
function calculate(options?: PassportCodeOptions): string;
function calculate(
  serialOrOptions: string | PassportCodeOptions = '0'.repeat(9),
  gender = 'x',
  dateOfBirth: Date = new Date(0),
  dateOfExpiry: Date = new Date()
): string {
  let serial: string;

  if (typeof serialOrOptions === 'object') {
    const params = serialOrOptions;
    ({ serial = '0'.repeat(9), gender = 'x', dateOfBirth = new Date(0), dateOfExpiry = new Date() } = params);
  } else {
    serial = serialOrOptions;
  }

  serial = serial.toUpperCase();
  gender = gender.toUpperCase();
  const codeDateOfBirth = toCodeDate(dateOfBirth);
  const codeDateOfExpiry = toCodeDate(dateOfExpiry);

  const nationality = 'd'.toUpperCase();
  const serialChecksum = checksum(serial);
  const dateOfBirthChecksum = checksum(codeDateOfBirth);
  const dateOfExpiryChecksum = checksum(codeDateOfExpiry);

  const totalChecksum = checksum(
    [serial, serialChecksum, codeDateOfBirth, dateOfBirthChecksum, codeDateOfExpiry, dateOfExpiryChecksum].join('')
  );

  return [
    serial,
    serialChecksum,
    nationality,
    '<<',
    codeDateOfBirth,
    dateOfBirthChecksum,
    gender,
    codeDateOfExpiry,
    dateOfExpiryChecksum,
    '<'.repeat(15),
    totalChecksum
  ].join('');
}

export default calculate;
