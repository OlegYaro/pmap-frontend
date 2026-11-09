import type { ReactNode } from 'react'
import { EMPTY, formatArea, formatIsoDate, formatNumber, formatPln, orEmpty } from '@/lib/format'
import { FUNCTION_LABELS, MARKET_TYPE_LABELS, labelFor } from '../filters/labels'
import type { NameOf } from '../filters/useTerritoryOptions'
import { pricePerM2 } from './cells'
import type { TransactionRow } from './listQuery'

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="min-w-0 rounded-lg border p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      <dl className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-3 gap-y-2 text-sm">
        {children}
      </dl>
    </section>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{value}</dd>
    </>
  )
}

const text = (value: string) => value
const dateTime = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

/** A territory as "name (code)", or just the code while the name is unknown. */
function withName(name: string, code: string): string {
  return name === code ? code : `${name} (${code})`
}

interface TransactionFieldsProps {
  transaction: TransactionRow
  nameOf: NameOf
}

/** Every field of a transaction in four cards: prices, premises, location and source. */
export function TransactionFields({ transaction: t, nameOf }: TransactionFieldsProps) {
  const perM2 = pricePerM2(t)
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card title="Prices">
        <Field label="Premises price" value={orEmpty(t.price_premises, formatPln)} />
        <Field label="Property price" value={orEmpty(t.price_property, formatPln)} />
        <Field label="Transaction price" value={orEmpty(t.price_transaction, formatPln)} />
        <Field label="Premises price per m²" value={orEmpty(perM2, formatPln)} />
      </Card>
      <Card title="Premises">
        <Field label="Usable area" value={orEmpty(t.area_usable, formatArea)} />
        <Field label="Rooms" value={orEmpty(t.rooms, formatNumber)} />
        <Field label="Floor" value={orEmpty(t.floor, formatNumber)} />
        <Field label="Function" value={orEmpty(t.function, (v) => labelFor(FUNCTION_LABELS, v))} />
        <Field
          label="Market type"
          value={orEmpty(t.market_type, (v) => labelFor(MARKET_TYPE_LABELS, v))}
        />
        <Field label="Transaction date" value={orEmpty(t.transaction_date, formatIsoDate)} />
      </Card>
      <Card title="Location">
        <Field label="Address" value={orEmpty(t.address, text)} />
        <Field label="City" value={orEmpty(t.city_name, text)} />
        <Field label="District" value={orEmpty(t.district_name, text)} />
        <Field label="Powiat" value={withName(nameOf('powiat', t.powiat_code), t.powiat_code)} />
        <Field
          label="Gmina"
          value={orEmpty(t.gmina_code, (code) => withName(nameOf('gmina', code), code))}
        />
      </Card>
      <Card title="Source">
        <Field label="External transaction id" value={t.external_transaction_identifier} />
        <Field label="External building id" value={orEmpty(t.external_building_id, text)} />
        <Field label="Source version" value={orEmpty(t.date_source_version, text)} />
        <Field label="Run id" value={orEmpty(t.run_id, text)} />
        <Field label="Last update" value={orEmpty(t.updated_at, dateTime)} />
      </Card>
    </div>
  )
}

function stringify(value: unknown): string {
  if (value === null || value === undefined) return EMPTY
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** The raw source attributes as a collapsed list of keys and values. */
export function SourceAttributes({ attributes }: { attributes: Record<string, unknown> }) {
  const entries = Object.entries(attributes).sort(([a], [b]) => a.localeCompare(b))
  return (
    <details className="rounded-lg border p-4">
      <summary className="cursor-pointer text-sm font-semibold">Source attributes</summary>
      {entries.length === 0 ? (
        <p className="text-muted-foreground mt-3 text-sm">No attributes</p>
      ) : (
        <dl className="mt-3 grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-3 gap-y-2 text-sm">
          {entries.map(([key, value]) => (
            <Field key={key} label={key} value={stringify(value)} />
          ))}
        </dl>
      )}
    </details>
  )
}
