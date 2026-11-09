import { CheckIcon, ChevronRightIcon, CopyIcon } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { EMPTY, formatDateTime } from '@/lib/format'
import { STAGE_LABELS, type FailedTask } from '../../api/admin-types'
import { labelFor } from '../filters/labels'

/** How long "Copied" or "Copy failed" is shown. */
export const COPY_FEEDBACK_MS = 2_000

/** The failed tasks of a run, each with its error trace behind a disclosure button. */
export function FailedTasks({ tasks }: { tasks: readonly FailedTask[] }) {
  if (tasks.length === 0) return <p className="text-muted-foreground text-sm">No failed tasks</p>
  return (
    <ul className="divide-y rounded-lg border">
      {tasks.map((task) => (
        <FailedTaskItem key={task.id} task={task} />
      ))}
    </ul>
  )
}

function FailedTaskItem({ task }: { task: FailedTask }) {
  const traceId = useId()
  const [expanded, setExpanded] = useState(false)
  const territory = task.territory_code ?? EMPTY
  const stage = task.failed_stage === null ? EMPTY : labelFor(STAGE_LABELS, task.failed_stage)

  return (
    <li className="grid grid-cols-1 gap-2 p-3">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
        <TaskField label="Territory" value={territory} mono />
        <TaskField label="Failed stage" value={stage} />
        <TaskField label="Status" value={labelFor(STAGE_LABELS, task.status)} />
        <TaskField label="Updated" value={formatDateTime(task.updated_at)} />
      </dl>
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={expanded}
          aria-controls={traceId}
          aria-label={`Error trace of task ${territory}`}
          className="-ml-2"
          onClick={() => setExpanded((value) => !value)}
        >
          <ChevronRightIcon
            aria-hidden
            className={expanded ? 'rotate-90 transition-transform' : 'transition-transform'}
          />
          Error trace
        </Button>
      </div>
      <div id={traceId} hidden={!expanded} className="grid grid-cols-1 gap-2">
        {expanded &&
          (task.error_trace === null || task.error_trace === '' ? (
            <p className="text-muted-foreground text-sm">No trace recorded</p>
          ) : (
            <>
              <pre className="bg-muted max-h-80 overflow-auto rounded-md p-3 font-mono text-xs whitespace-pre">
                {task.error_trace}
              </pre>
              <div>
                <CopyButton text={task.error_trace} />
              </div>
            </>
          ))}
      </div>
    </li>
  )
}

function TaskField({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className={mono ? 'truncate font-mono' : 'truncate'}>{value}</dd>
    </div>
  )
}

type CopyState = 'idle' | 'copied' | 'failed'

const COPY_TEXT: Record<CopyState, string> = {
  idle: 'Copy',
  copied: 'Copied',
  failed: 'Copy failed',
}

/** Copies `text` to the clipboard; shows "Copied" or "Copy failed" for 2 s. */
function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<CopyState>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current)
    },
    [],
  )

  const show = (next: CopyState) => {
    setState(next)
    if (timer.current !== null) clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), COPY_FEEDBACK_MS)
  }

  const copy = async () => {
    try {
      // The Clipboard API is missing on plain HTTP pages.
      if (!('clipboard' in navigator)) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(text)
      show('copied')
    } catch {
      show('failed')
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={() => void copy()}>
      {state === 'copied' ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />}
      <span aria-live="polite">{COPY_TEXT[state]}</span>
    </Button>
  )
}
