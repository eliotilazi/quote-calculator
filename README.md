# Quote Calculator for Custom Furniture (FR · SQ · EN)

A live quote calculator for a fictional furniture workshop, **Atelier Boréal**. The customer picks a project (kitchen, wardrobe, bedroom, built-in unit or terrace), enters the dimensions and the finish level, and gets an itemised estimate with installation, delivery and Swiss VAT.

**Live demo:** https://eliotilazi.github.io/quote-calculator/

## Features

- 5 project types, each with its own dimensions and options
- 3 finish levels (Essential, Comfort, Premium) and a side-by-side comparison
- Itemised quote: furniture lines, installation (12 %), delivery, VAT 8.1 %, total and a +/- 10 % range
- Interface in French, Albanian and English (language remembered in the browser)
- Copy the quote as text, or print it / save it as PDF
- Light and dark mode, works on mobile
- Automatic tests for the pricing engine (`node test.mjs`)

## How it is organised

| File | Role |
| --- | --- |
| `pricing.js` | The pricing engine: price tables and pure functions that compute the quote |
| `i18n.js` | All interface texts in 3 languages |
| `app.js` | The form, the live quote and the buttons |
| `style.css` | The design |
| `test.mjs` | 20 tests: prices, VAT, options, tiers and translations |

The prices live in one table at the top of `pricing.js`, so a real workshop can plug in its own rates without touching the rest of the code.

## Run it locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
node test.mjs                 # run the tests
```

## Next steps

- Send the quote by email with a contact form
- Add photos of each finish level
- Save quotes so the customer can come back to them

Atelier Boréal is a fictional workshop and all prices are examples. Built by [Eliot Ilazi](https://eliotilazi.github.io).
