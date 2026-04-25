import { getCountries, getCountryCallingCode } from "libphonenumber-js";

export interface CountryOption {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

const displayNames = new Intl.DisplayNames(["en"], { type: "region" });

const toFlag = (countryCode: string) =>
  countryCode
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");

export const getCountryOptions = (): CountryOption[] => {
  return getCountries()
    .map((code) => ({
      code,
      name: displayNames.of(code) || code,
      dialCode: `+${getCountryCallingCode(code)}`,
      flag: toFlag(code),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

