// User interface: builds the form, reads the values and shows the quote.
import { quote, compareTiers, TIERS } from './pricing.js'
import { TEXT } from './i18n.js'

const $ = (id) => document.getElementById(id)

// Default values for each project type.
const DEFAULTS = {
  kitchen: { length: 4.2, worktop: 'quartz', island: false, appliances: false },
  wardrobe: { width: 2.5, height: 2.4, doors: 'sliding', drawers: 4, lighting: true },
  bedroom: { bedSize: 160, headboard: true, nightstands: 2, dresser: false },
  builtin: { width: 3, height: 2.2, lighting: false },
  terrace: { area: 20, material: 'composite', railing: 0, pergola: false },
}

// Which fields to show for each type: [name, kind, options]
const FIELDS = {
  kitchen: [['length', 'number', { min: 1, max: 15, step: 0.1 }], ['worktop', 'select', 'worktops'], ['island', 'check'], ['appliances', 'check']],
  wardrobe: [['width', 'number', { min: 0.5, max: 8, step: 0.1 }], ['height', 'number', { min: 1, max: 3.2, step: 0.1 }], ['doors', 'select', 'doorTypes'], ['drawers', 'number', { min: 0, max: 20, step: 1 }], ['lighting', 'check']],
  bedroom: [['bedSize', 'select', 'bedSizes'], ['headboard', 'check'], ['nightstands', 'number', { min: 0, max: 4, step: 1 }], ['dresser', 'check']],
  builtin: [['width', 'number', { min: 0.5, max: 10, step: 0.1 }], ['height', 'number', { min: 0.5, max: 3.5, step: 0.1 }], ['lighting', 'check']],
  terrace: [['area', 'number', { min: 2, max: 200, step: 1 }], ['material', 'select', 'materials'], ['railing', 'number', { min: 0, max: 60, step: 1 }], ['pergola', 'check']],
}

const state = {
  lang: pickLang(),
  type: 'kitchen',
  tier: 'comfort',
  values: structuredClone(DEFAULTS),
  installation: true,
  delivery: 'local',
  quoteNo: 'AB-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000)),
}

function pickLang() {
  try {
    const saved = localStorage.getItem('qc-lang')
    if (saved && TEXT[saved]) return saved
  } catch {}
  const nav = (navigator.language || 'fr').slice(0, 2)
  return TEXT[nav] ? nav : 'fr'
}

const t = () => TEXT[state.lang]
const money = (n) => new Intl.NumberFormat(state.lang === 'en' ? 'en-CH' : state.lang === 'sq' ? 'de-CH' : 'fr-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 }).format(n)

function renderStatic() {
  document.documentElement.lang = state.lang
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t()[el.dataset.t] })
  document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.lang === state.lang))

  $('types').innerHTML = Object.keys(DEFAULTS).map((k) =>
    `<button type="button" role="radio" aria-checked="${k === state.type}" data-type="${k}">${t().types[k]}</button>`).join('')

  $('tiers').innerHTML = TIERS.map((k) =>
    `<button type="button" role="radio" aria-checked="${k === state.tier}" data-tier="${k}"><strong>${t().tiers[k]}</strong><small>${t().tierHint[k]}</small></button>`).join('')

  $('delivery').innerHTML = Object.entries(t().deliveries).map(([k, v]) =>
    `<option value="${k}" ${k === state.delivery ? 'selected' : ''}>${v}</option>`).join('')

  renderFields()
}

function renderFields() {
  const v = state.values[state.type]
  $('fields').innerHTML = FIELDS[state.type].map(([name, kind, opt]) => {
    const label = t()[name]
    if (kind === 'check') {
      return `<label class="check"><input type="checkbox" name="${name}" ${v[name] ? 'checked' : ''}> <span>${label}</span></label>`
    }
    if (kind === 'select') {
      const options = opt === 'bedSizes' ? { 140: '140', 160: '160', 180: '180' } : t()[opt]
      return `<label><span>${label}</span><select name="${name}">${Object.entries(options).map(([k, txt]) =>
        `<option value="${k}" ${String(v[name]) === k ? 'selected' : ''}>${txt}</option>`).join('')}</select></label>`
    }
    return `<label><span>${label}</span><input type="number" name="${name}" value="${v[name]}" min="${opt.min}" max="${opt.max}" step="${opt.step}" inputmode="decimal"></label>`
  }).join('')
}

function currentProject() {
  return { type: state.type, tier: state.tier, ...state.values[state.type] }
}

function renderQuote() {
  const opts = { installation: state.installation, delivery: state.delivery }
  const q = quote(currentProject(), opts)
  const L = t()
  $('quoteNo').textContent = state.quoteNo
  $('date').textContent = new Date().toLocaleDateString(state.lang === 'sq' ? 'sq-AL' : state.lang === 'en' ? 'en-GB' : 'fr-CH')
  $('total').textContent = money(q.total)
  $('range').textContent = `${L.between} ${money(q.low)} ${L.and} ${money(q.high)}`

  const rows = q.lines.map((l) =>
    `<tr><td>${L.lines[l.key]}<small>${l.qty} ${L.units[l.unit]}</small></td><td>${money(l.amount)}</td></tr>`)
  if (q.installation) rows.push(`<tr><td>${L.installLine}</td><td>${money(q.installation)}</td></tr>`)
  if (q.delivery) rows.push(`<tr><td>${L.deliveryLine}</td><td>${money(q.delivery)}</td></tr>`)
  rows.push(`<tr class="sub"><td>${L.net}</td><td>${money(q.net)}</td></tr>`)
  rows.push(`<tr><td>${L.vat}</td><td>${money(q.vat)}</td></tr>`)
  rows.push(`<tr class="sum"><td>${L.total}</td><td>${money(q.total)}</td></tr>`)
  $('lines').innerHTML = rows.join('')

  const tiers = compareTiers(currentProject(), opts)
  const max = Math.max(...Object.values(tiers))
  $('compare').innerHTML = TIERS.map((k) => `
    <div class="bar ${k === state.tier ? 'on' : ''}">
      <span>${L.tiers[k]}</span>
      <div class="track"><div class="fill" style="width:${(tiers[k] / max) * 100}%"></div></div>
      <b>${money(tiers[k])}</b>
    </div>`).join('')
  return q
}

function quoteAsText() {
  const q = renderQuote()
  const L = t()
  const out = [`Atelier Boréal · ${L.quoteNo} ${state.quoteNo}`, `${L.types[state.type]} · ${L.tiers[state.tier]}`, '']
  q.lines.forEach((l) => out.push(`${L.lines[l.key]} (${l.qty} ${L.units[l.unit]}): ${money(l.amount)}`))
  if (q.installation) out.push(`${L.installLine}: ${money(q.installation)}`)
  if (q.delivery) out.push(`${L.deliveryLine}: ${money(q.delivery)}`)
  out.push(`${L.net}: ${money(q.net)}`, `${L.vat}: ${money(q.vat)}`, `${L.total}: ${money(q.total)}`, '', L.validity)
  return out.join('\n')
}

// Events
document.addEventListener('click', (e) => {
  const b = e.target.closest('button')
  if (!b) return
  if (b.dataset.lang) {
    state.lang = b.dataset.lang
    try { localStorage.setItem('qc-lang', state.lang) } catch {}
    renderStatic(); renderQuote()
  } else if (b.dataset.type) {
    state.type = b.dataset.type
    renderStatic(); renderQuote()
  } else if (b.dataset.tier) {
    state.tier = b.dataset.tier
    renderStatic(); renderQuote()
  } else if (b.id === 'copy') {
    const text = quoteAsText()
    navigator.clipboard?.writeText(text).then(() => {
      b.textContent = t().copied
      setTimeout(() => { b.textContent = t().copy }, 1500)
    }).catch(() => {})
  } else if (b.id === 'print') {
    window.print()
  }
})

$('form').addEventListener('input', (e) => {
  const el = e.target
  if (el.id === 'installation') state.installation = el.checked
  else if (el.id === 'delivery') state.delivery = el.value
  else if (el.name) {
    const v = state.values[state.type]
    if (el.type === 'checkbox') v[el.name] = el.checked
    else if (el.type === 'number') v[el.name] = Math.max(0, parseFloat(el.value) || 0)
    else v[el.name] = el.name === 'bedSize' ? Number(el.value) : el.value
  }
  renderQuote()
})

renderStatic()
renderQuote()
