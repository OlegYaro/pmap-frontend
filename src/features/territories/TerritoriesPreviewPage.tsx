import { useTerritories } from './useTerritories'

const PREVIEW_ROWS = 10

/** Temporary home page that proves the app reaches the backend. Replaced by the analytics screen. */
export function TerritoriesPreviewPage() {
  const { data, error, isPending, refetch, isFetching } = useTerritories()

  return (
    <>
      <h1>Territories</h1>
      {isPending && !error && <p>Loading territories…</p>}
      {error && (
        <div role="alert">
          <p>Could not load territories: {error.message}</p>
          <button type="button" onClick={() => void refetch()} disabled={isFetching}>
            Retry
          </button>
        </div>
      )}
      {data && data.length === 0 && <p>No territories.</p>}
      {data && data.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Voivodeship</th>
              <th>Powiat</th>
              <th>Gmina</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, PREVIEW_ROWS).map((t) => (
              <tr key={`${t.voivodeship_teryt}-${t.powiat_teryt}-${t.gmina_teryt}`}>
                <td>{t.voivodeship_name}</td>
                <td>{t.powiat_name ?? '—'}</td>
                <td>{t.gmina_name ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
