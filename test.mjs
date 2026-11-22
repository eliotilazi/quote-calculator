// Automatic tests for the pricing engine. Run with: node test.mjs
import { quote, productLines, compareTiers, VAT_RATE } from './pricing.js'
import { TEXT } from './i18n.js'

let failed = 0
function check(name, cond) {
  if (!cond) failed++
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`)
}

// 1. Kitchen 4 m, comfort, laminate: 4 x 750 + 4 x 120 = 3480
let q = quote({ type: 'kitchen', tier: 'comfort', length: 4, worktop: 'laminate', island: false, appliances: false }, { installation: false, delivery: 'pickup' })
check('kitchen furniture = 3480', q.furniture === 3480)
check('kitchen VAT 8.1 %', q.vat === Math.round(3480 * VAT_RATE * 100) / 100)
check('kitchen total = net + VAT', Math.abs(q.total - (q.net + q.vat)) < 0.01)

// 2. Options add lines
q = quote({ type: 'kitchen', tier: 'premium', length: 3, worktop: 'granite', island: true, appliances: true })
check('kitchen premium has 4 lines', q.lines.length === 4)
check('installation is 12 % rounded to 5', q.installation === Math.round(q.furniture * 0.12 / 5) * 5)
check('local delivery = 150', q.delivery === 150)

// 3. Wardrobe: sliding doors cost 15 % more, height scales the price
const base = { type: 'wardrobe', tier: 'comfort', width: 2, height: 2.4, drawers: 0, lighting: false }
const hinged = productLines({ ...base, doors: 'hinged' })[0].amount
const sliding = productLines({ ...base, doors: 'sliding' })[0].amount
check('wardrobe hinged 2 m = 1200', hinged === 1200)
check('wardrobe sliding = hinged x 1.15', sliding === 1380)
check('taller wardrobe costs more', productLines({ ...base, doors: 'hinged', height: 3 })[0].amount > hinged)

// 4. Bedroom
q = quote({ type: 'bedroom', tier: 'essential', bedSize: 160, headboard: true, nightstands: 2, dresser: true }, { installation: false, delivery: 'pickup' })
check('bedroom essential = 750 + 200 + 240 + 450', q.furniture === 1640)

// 5. Built-in: price per m² of front
check('built-in 3 x 2 m comfort = 3000', productLines({ type: 'builtin', tier: 'comfort', width: 3, height: 2, lighting: false })[0].amount === 3000)

// 6. Terrace
q = quote({ type: 'terrace', tier: 'comfort', area: 20, material: 'composite', railing: 5, pergola: true }, { installation: false, delivery: 'pickup' })
check('terrace = 20 x 160 + 5 x 180 + 4200', q.furniture === 3200 + 900 + 4200)

// 7. Tiers are in increasing order
const tiers = compareTiers({ type: 'wardrobe', width: 2.5, height: 2.4, doors: 'sliding', drawers: 4, lighting: true })
check('essential < comfort < premium', tiers.essential < tiers.comfort && tiers.comfort < tiers.premium)

// 8. Range is +/- 10 %
q = quote({ type: 'builtin', tier: 'premium', width: 2, height: 2, lighting: true })
check('range low < total < high', q.low < q.total && q.total < q.high)

// 9. Zero or negative sizes never give negative prices
q = quote({ type: 'kitchen', tier: 'comfort', length: -3, worktop: 'quartz' }, { installation: false, delivery: 'pickup' })
check('negative length gives 0 furniture', q.furniture === 0)

// 10. Every line key has a label in the 3 languages
const keys = new Set()
for (const p of [
  { type: 'kitchen', tier: 'comfort', length: 1, worktop: 'laminate', island: true, appliances: true },
  { type: 'kitchen', tier: 'comfort', length: 1, worktop: 'wood' }, { type: 'kitchen', tier: 'comfort', length: 1, worktop: 'quartz' }, { type: 'kitchen', tier: 'comfort', length: 1, worktop: 'granite' },
  ...['hinged', 'sliding', 'open'].map((doors) => ({ type: 'wardrobe', tier: 'comfort', width: 1, height: 2.4, doors, drawers: 1, lighting: true })),
  ...[140, 160, 180].map((bedSize) => ({ type: 'bedroom', tier: 'comfort', bedSize, headboard: true, nightstands: 1, dresser: true })),
  { type: 'builtin', tier: 'comfort', width: 1, height: 1, lighting: true },
  ...['pine', 'composite', 'hardwood'].map((material) => ({ type: 'terrace', tier: 'comfort', area: 1, material, railing: 1, pergola: true })),
]) productLines(p).forEach((l) => keys.add(l.key))
for (const lang of ['fr', 'sq', 'en']) {
  const missing = [...keys].filter((k) => !TEXT[lang].lines[k])
  check(`all line labels exist in ${lang}`, missing.length === 0)
}
// 11. Same interface keys in every language
const frKeys = Object.keys(TEXT.fr).sort().join()
check('sq has the same keys as fr', Object.keys(TEXT.sq).sort().join() === frKeys)
check('en has the same keys as fr', Object.keys(TEXT.en).sort().join() === frKeys)

console.log(failed ? `\n${failed} test(s) failed` : '\nAll tests passed')
process.exit(failed ? 1 : 0)
