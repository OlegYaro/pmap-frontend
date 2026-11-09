import { z } from 'zod'

/** The body of `POST /exports`: the id of the started export. */
export const startExportSchema = z.object({ id: z.string().min(1) })

const fileUrl = z.string().refine((value) => {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}, 'The file link must be an http(s) URL')

/** The body of `GET /exports/{id}`; the OpenAPI document types it only as a string map. */
export const exportStatusSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('pending') }),
  z.object({ status: z.literal('done'), url: fileUrl }),
  z.object({ status: z.literal('failed'), error: z.string().optional() }),
])

export type ExportStatus = z.infer<typeof exportStatusSchema>

/** Id of a started export; throws a readable error when the body has no id. */
export function parseStartExport(body: unknown): string {
  const result = startExportSchema.safeParse(body)
  if (!result.success) throw new Error('Unexpected response from the export service')
  return result.data.id
}

/** The status in `body`; throws a readable error when it is not one of the documented shapes. */
export function parseExportStatus(body: unknown): ExportStatus {
  const result = exportStatusSchema.safeParse(body)
  if (!result.success) throw new Error('Unexpected response from the export service')
  return result.data
}
