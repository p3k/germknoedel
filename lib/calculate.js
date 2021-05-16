const number = char => {
  return isNaN(char) ? char.toUpperCase().charCodeAt(0) - 55 : parseInt(char, 10);
};

const checksum = series => {
  const weights = [7, 3, 1];

  return (
    Array.prototype.reduce.call(
      series,
      (checksum, char, index) => {
        const weight = weights[index % 3];
        return (checksum += weight * number(char));
      },
      0
    ) % 10
  );
};

const format = date => {
  date = new Date(date);

  return [
    String(date.getFullYear()).substr(2),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('');
};

module.exports = (serial = '0'.repeat(9), gender = 'x', dateOfBirth = new Date(0), dateOfExpiry = new Date()) => {
  if (typeof serial === 'object') {
    const params = serial;
    var { serial = '0'.repeat(9), gender = 'x', dateOfBirth = new Date(0), dateOfExpiry = new Date() } = params;
  }

  serial = serial.toUpperCase();
  gender = gender.toUpperCase();
  dateOfBirth = format(dateOfBirth);
  dateOfExpiry = format(dateOfExpiry);

  const nationality = 'd'.toUpperCase();
  const serialChecksum = checksum(serial);
  const dateOfBirthChecksum = checksum(dateOfBirth);
  const dateOfExpiryChecksum = checksum(dateOfExpiry);

  const totalChecksum = checksum(
    [serial, serialChecksum, dateOfBirth, dateOfBirthChecksum, dateOfExpiry, dateOfExpiryChecksum].join('')
  );

  return [
    serial,
    serialChecksum,
    nationality,
    '<<',
    dateOfBirth,
    dateOfBirthChecksum,
    gender,
    dateOfExpiry,
    dateOfExpiryChecksum,
    '<'.repeat(15),
    totalChecksum
  ].join('');
};
