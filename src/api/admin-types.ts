import { z } from 'zod'

/**
 * Response shapes of the admin endpoints. The OpenAPI document types their bodies only as string
 * maps, so these follow the extraction service's response models and are checked at runtime. Only
 * the fields the UI reads are listed; extra fields are ignored.
 */

/** Stages a task goes through, in order, and its final states. */
export const RUN_STAGES = [
  'queued',
  'downloading',
  'cleaning',
  'assigning',
  'staged',
  'done',
  'not_published',
  'failed',
] as const

export const RUN_TRIGGERS = ['manual', 'schedule'] as const

/** A known value, or any other string so a value added by the service does not break the page. */
const stage = z.enum(RUN_STAGES).or(z.string())
const trigger = z.enum(RUN_TRIGGERS).or(z.string())
const count = z.number().int()
const timestamp = z.string()

/** One row of `GET /admin/runs`, newest first. `finished_at` is null while the run goes on. */
export const runListItemSchema = z.object({
  run_id: z.string().min(1),
  trigger,
  started_at: timestamp,
  finished_at: timestamp.nullable(),
  total: count,
  done: count,
  not_published: count,
  failed: count,
})

/** A failed task of a run, with its error trace. */
export const failedTaskSchema = z.object({
  id: z.number().int(),
  territory_code: z.string().nullable(),
  status: stage,
  updated_at: timestamp,
  failed_stage: z.string().nullable(),
  error_trace: z.string().nullable(),
})

/** The body of `GET /admin/runs/{run_id}`; `excluded` counts the excluded rows by reason. */
export const runStatusSchema = z.object({
  run_id: z.string().min(1),
  started_at: timestamp.nullable(),
  total: count,
  downloaded: count,
  assigned: count,
  cleaned: count,
  loaded: count,
  not_published: count,
  failed: count,
  in_progress: count,
  current_stage: stage.nullable(),
  failed_tasks: z.array(failedTaskSchema),
  inserted: count,
  updated: count,
  excluded: z.record(z.string(), count),
})

/** The body of a 202 from `POST /admin/runs`. */
export const runStartedSchema = z.object({ run_id: z.string().min(1) })

export type RunListItem = z.infer<typeof runListItemSchema>
export type FailedTask = z.infer<typeof failedTaskSchema>
export type RunStatus = z.infer<typeof runStatusSchema>
export type RunStarted = z.infer<typeof runStartedSchema>

export const UNEXPECTED_RESPONSE = 'Unexpected response from the server'

/** `body` checked against `schema`; throws a readable error when it does not match. */
function parseWith<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body)
  if (!result.success) throw new Error(UNEXPECTED_RESPONSE)
  return result.data
}

const runListSchema = z.array(runListItemSchema)

export const parseRunList = (body: unknown): RunListItem[] => parseWith(runListSchema, body)
export const parseRunStatus = (body: unknown): RunStatus => parseWith(runStatusSchema, body)
export const parseRunStarted = (body: unknown): RunStarted => parseWith(runStartedSchema, body)

/** Readable names of the stages and task states. */
export const STAGE_LABELS: Readonly<Record<string, string>> = {
  queued: 'Queued',
  downloading: 'Downloading',
  cleaning: 'Cleaning',
  assigning: 'Assigning',
  staged: 'Staged',
  done: 'Done',
  not_published: 'Not published',
  failed: 'Failed',
}

/** Readable names of the run triggers. */
export const TRIGGER_LABELS: Readonly<Record<string, string>> = {
  manual: 'Manual',
  schedule: 'Scheduled',
}
