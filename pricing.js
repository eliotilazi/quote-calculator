// Pricing engine: pure functions, no HTML.
// All prices are in CHF and are example figures for a fictional workshop.

export const TIERS = ['essential', 'comfort', 'premium']
export const VAT_RATE = 0.081 // Swiss VAT, standard rate
export const INSTALL_RATE = 0.12 // installation = 12 % of the furniture
export const DELIVERY = { local: 150, switzerland: 290, pickup: 0 }
export const RANGE = 0.1 // the estimate is shown as +/- 10 %

// Price tables per product type and quality tier.
export const RATES = {
  kitchen: {
    perMetre: { essential: 450, comfort: 750, premium: 1200 }, // base and wall units, per linear metre
    worktop: { laminate: 120, wood: 280, quartz: 450, granite: 600 }, // per linear metre
    island: { essential: 1800, comfort: 2500, premium: 4000 },
    appliances: { essential: 2500, comfort: 4500, premium: 8000 },
  },
  wardrobe: {
    perMetre: { essential: 350, comfort: 600, premium: 950 }, // for a 2.4 m high wardrobe
    doors: { hinged: 1, sliding: 1.15, open: 0.8 },
    drawer: 90,
    lighting: 250,
  },
  bedroom: {
    bed: { 140: { essential: 650, comfort: 1100, premium: 1900 }, 160: { essential: 750, comfort: 1250, premium: 2150 }, 180: { essential: 850, comfort: 1400, premium: 2400 } },
    nightstand: { essential: 120, comfort: 220, premium: 380 },
    dresser: { essential: 450, comfort: 800, premium: 1300 },
    headboard: { essential: 200, comfort: 350, premium: 600 },
  },
  builtin: {
    perM2: { essential: 300, comfort: 500, premium: 800 }, // front surface
    lighting: 250,
  },
  terrace: {
    perM2: { pine: 90, composite: 160, hardwood: 230 },
    pergola: { essential: 2500, comfort: 4200, premium: 6500 },
    railingPerMetre: 180,
  },
}

const round5 = (n) => Math.round(n / 5) * 5

function line(key, qty, unit, amount) {
  return { key, qty, unit, amount: round5(amount) }
}

// Returns the list of priced lines for one product.
export function productLines(p) {
  const t = p.tier
  const r = RATES[p.type]
  const lines = []
  switch (p.type) {
    case 'kitchen': {
      const m = Math.max(0, p.length || 0)
      lines.push(line('kitchenUnits', m, 'm', m * r.perMetre[t]))
      lines.push(line('worktop_' + p.worktop, m, 'm', m * r.worktop[p.worktop]))
      if (p.island) lines.push(line('island', 1, 'pc', r.island[t]))
      if (p.appliances) lines.push(line('appliances', 1, 'set', r.appliances[t]))
      break
    }
    case 'wardrobe': {
      const w = Math.max(0, p.width || 0)
      const hFactor = Math.max(0.5, (p.height || 2.4) / 2.4)
      lines.push(line('wardrobe_' + p.doors, w, 'm', w * r.perMetre[t] * hFactor * r.doors[p.doors]))
      if (p.drawers > 0) lines.push(line('drawers', p.drawers, 'pc', p.drawers * r.drawer))
      if (p.lighting) lines.push(line('lighting', 1, 'set', r.lighting))
      break
    }
    case 'bedroom': {
      lines.push(line('bed_' + p.bedSize, 1, 'pc', r.bed[p.bedSize][t]))
      if (p.headboard) lines.push(line('headboard', 1, 'pc', r.headboard[t]))
      if (p.nightstands > 0) lines.push(line('nightstands', p.nightstands, 'pc', p.nightstands * r.nightstand[t]))
      if (p.dresser) lines.push(line('dresser', 1, 'pc', r.dresser[t]))
      break
    }
    case 'builtin': {
      const area = Math.max(0, (p.width || 0) * (p.height || 0))
      lines.push(line('builtinFront', +area.toFixed(2), 'm2', area * r.perM2[t]))
      if (p.lighting) lines.push(line('lighting', 1, 'set', r.lighting))
      break
    }
    case 'terrace': {
      const area = Math.max(0, p.area || 0)
      lines.push(line('deck_' + p.material, area, 'm2', area * r.perM2[p.material]))
      if (p.railing > 0) lines.push(line('railing', p.railing, 'm', p.railing * r.railingPerMetre))
      if (p.pergola) lines.push(line('pergola', 1, 'pc', r.pergola[t]))
      break
    }
    default:
      throw new Error('Unknown product type: ' + p.type)
  }
  return lines.filter((l) => l.amount > 0)
}

// Full quote: product lines + installation + delivery + VAT, and a +/- range.
export function quote(p, opts = {}) {
  const lines = productLines(p)
  const furniture = lines.reduce((s, l) => s + l.amount, 0)
  const installation = opts.installation === false ? 0 : round5(furniture * INSTALL_RATE)
  const delivery = DELIVERY[opts.delivery || 'local']
  const net = furniture + installation + delivery
  const vat = Math.round(net * VAT_RATE * 100) / 100
  const total = Math.round((net + vat) * 100) / 100
  return {
    lines,
    furniture,
    installation,
    delivery,
    net,
    vat,
    total,
    low: round5(total * (1 - RANGE)),
    high: round5(total * (1 + RANGE)),
  }
}

// Same project priced in the three tiers, to compare at a glance.
export function compareTiers(p, opts) {
  return Object.fromEntries(TIERS.map((tier) => [tier, quote({ ...p, tier }, opts).total]))
}
