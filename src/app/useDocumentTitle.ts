import { useEffect } from 'react'

const TITLE_SUFFIX = 'PMAP'

/** Sets the document title to "<name> · PMAP" while the calling page is mounted. */
export function useDocumentTitle(name: string) {
  useEffect(() => {
    document.title = `${name} · ${TITLE_SUFFIX}`
  }, [name])
}
