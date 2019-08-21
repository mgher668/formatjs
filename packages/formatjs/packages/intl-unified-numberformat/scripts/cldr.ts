import {extractAllUnits, getAllLanguages} from 'formatjs-extract-cldr-data';
import {resolve, join} from 'path';
import {outputFileSync, outputJSONSync} from 'fs-extra';

const {locales, units: unitData} = extractAllUnits();

// https://tc39.es/proposal-unified-intl-numberformat/section6/locales-currencies-tz_diff_out.html#sec-issanctionedsimpleunitidentifier
const SANCTIONED_UNITS = [
  'acre',
  'bit',
  'byte',
  'celsius',
  'centimeter',
  'day',
  'degree',
  'fahrenheit',
  'fluid-ounce',
  'foot',
  'gallon',
  'gigabit',
  'gigabyte',
  'gram',
  'hectare',
  'hour',
  'inch',
  'kilobit',
  'kilobyte',
  'kilogram',
  'kilometer',
  'liter',
  'megabit',
  'megabyte',
  'meter',
  'mile',
  'mile-scandinavian',
  'millimeter',
  'milliliter',
  'millisecond',
  'minute',
  'month',
  'ounce',
  'percent',
  'petabyte',
  'pound',
  'second',
  'stone',
  'terabit',
  'terabyte',
  'week',
  'yard',
  'year',
];

const languages = getAllLanguages();

const allUnits = Object.keys(unitData);

function shortenUnit(unit: string) {
  return unit.replace(/^(.*?)-/, '');
}

const allLocaleDistDir = resolve(__dirname, '../dist/locale-data');

const sanctionedUnitData: Record<string, any> = languages.reduce(
  (all: Record<string, any>, lang) => {
    all[lang] = {};
    return all;
  },
  {}
);
allUnits.forEach(unit => {
  const shortenedUnit = shortenUnit(unit);
  if (!SANCTIONED_UNITS.includes(shortenedUnit)) {
    return;
  }

  // Dist all locale files to dist/locale-data
  const allLocaleFiles = unitData[unit];

  Object.keys(allLocaleFiles).map(locale => {
    const lang = locale.split('-')[0];

    if (!sanctionedUnitData[lang][locale]) {
      sanctionedUnitData[lang][locale] = {
        ...(locales[locale] || {}),
        units: {},
      };
    }
    sanctionedUnitData[lang][locale].units[shortenedUnit] =
      allLocaleFiles[locale];
  });
});

Object.keys(sanctionedUnitData).forEach(lang => {
  outputJSONSync(
    join(allLocaleDistDir, lang + '.json'),
    sanctionedUnitData[lang]
  );
});

outputFileSync(
  resolve(__dirname, '../src/units-constants.ts'),
  `/* @generated */
// prettier-ignore
export type Unit = 
  ${SANCTIONED_UNITS.map(unit => `'${unit}'`).join(' | ')}
`
);

//  // Aggregate all into src/locales.ts
// outputFileSync(
//   resolve(__dirname, '../src/locales.ts'),
//   `/* @generated */
// // prettier-ignore
// import IntlRelativeTimeFormat from "./core";\n
// IntlRelativeTimeFormat.__addLocaleData(${Object.keys(allLocaleFiles)
//   .map(lang => allLocaleFiles[lang])
//   .join(',\n')});
// export default IntlRelativeTimeFormat;
//   `
// );

// Extract src/en.ts
outputFileSync(
  resolve(__dirname, '../src/en.ts'),
  `/* @generated */
// prettier-ignore
export default ${JSON.stringify(sanctionedUnitData.en)};
`
);