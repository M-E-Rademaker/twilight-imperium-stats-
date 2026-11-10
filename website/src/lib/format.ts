const pct1 = new Intl.NumberFormat('de-DE', { style: 'percent', maximumFractionDigits: 1, minimumFractionDigits: 1 })
const pct0 = new Intl.NumberFormat('de-DE', { style: 'percent', maximumFractionDigits: 0 })
const num1 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1, minimumFractionDigits: 1 })
const signed1 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1, minimumFractionDigits: 1, signDisplay: 'exceptZero' })
const dateLong = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
const dateMonth = new Intl.DateTimeFormat('de-DE', { month: 'short', year: '2-digit', timeZone: 'UTC' })

/** 0.364 -> "36,4 %" */
export const fmtPct = (ratio: number) => pct1.format(ratio)
/** 0.364 -> "36 %" */
export const fmtPct0 = (ratio: number) => pct0.format(ratio)
export const fmtNum = (n: number) => num1.format(n)
/** +3,3 / −1,1 / 0,0 */
export const fmtSigned = (n: number) => signed1.format(Math.abs(n) < 0.05 ? 0 : n).replace('-', '−')

const toDate = (iso: string | number) => (typeof iso === 'number' ? new Date(iso) : new Date(`${iso}T00:00:00Z`))
export const fmtDate = (iso: string | number) => dateLong.format(toDate(iso))
export const fmtMonth = (iso: string | number) => dateMonth.format(toDate(iso))
export const dateValue = (iso: string) => Date.parse(`${iso}T00:00:00Z`)

export const plural = (n: number, one: string, many: string) => `${n.toLocaleString('de-DE')} ${n === 1 ? one : many}`
