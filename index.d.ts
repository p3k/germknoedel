/** A passport/ID-issuing authority record, as found in authorities.json. */
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

/** The options-object form accepted by calculate(), as an alternative to positional arguments. */
export interface PassportCodeOptions {
  serial?: string;
  gender?: string;
  dateOfBirth?: Date;
  dateOfExpiry?: Date;
}

/** Generates a passport code. Accepts either positional arguments or a single options object. */
export function calculate(serial?: string, gender?: string, dateOfBirth?: Date, dateOfExpiry?: Date): string;
/** Equivalent to the positional form above, as a single options object. */
export function calculate(options?: PassportCodeOptions): string;

/** The arguments accepted by validate(); any field left unset is filled in with a random default. */
export interface ValidateInput {
  serial?: string;
  gender?: string;
  dateOfBirth?: Date | string;
  dateOfExpiry?: Date | string;
  authority?: string;
}

/** The normalized result returned by validate(), with every field resolved to its final value. */
export interface ValidatedArgs {
  serial: string;
  gender: string;
  dateOfBirth: Date;
  dateOfExpiry: Date;
  authority: Authority;
}

/** Validates and normalizes the arguments used to generate a passport code, filling in random defaults for anything missing. */
export function validate(args?: ValidateInput): ValidatedArgs;
