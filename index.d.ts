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

export interface PassportCodeOptions {
  serial?: string;
  gender?: string;
  dateOfBirth?: Date;
  dateOfExpiry?: Date;
}

/** Generates a passport code. Accepts either positional arguments or a single options object. */
export function calculate(serial?: string, gender?: string, dateOfBirth?: Date, dateOfExpiry?: Date): string;
export function calculate(options?: PassportCodeOptions): string;

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

/** Validates and normalizes the arguments used to generate a passport code, filling in random defaults for anything missing. */
export function validate(args?: ValidateInput): ValidatedArgs;
