import { PlayIcon } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { ErrorState } from '@/components/ErrorState'
import { SearchableSelect } from '@/components/SearchableSelect'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useTerritoryOptions } from '../filters/useTerritoryOptions'
import { useStartRun } from './useStartRun'

interface StartRunProps {
  /** True while a listed run has no finish time: starting is blocked. */
  blocked: boolean
}

/**
 * Starts a sync run for one powiat or all of Poland after a confirmation that names the scope. The
 * start error and Retry stay in the dialog so the choice remains visible.
 */
export function StartRun({ blocked }: StartRunProps) {
  const id = useId()
  const labelId = `${id}-scope`
  const [code, setCode] = useState<string | undefined>()
  const [open, setOpen] = useState(false)
  const { options } = useTerritoryOptions()
  const start = useStartRun()

  const choices = useMemo(
    () => options.allPowiats.map((option) => ({ value: option.code, label: option.label })),
    [options],
  )
  const powiatName =
    code === undefined ? undefined : (options.byCode.powiat.get(code)?.name ?? code)
  const question =
    code === undefined
      ? 'Start a sync for all of Poland?'
      : `Start a sync for ${powiatName} (${code})?`

  const changeOpen = (next: boolean) => {
    setOpen(next)
    start.reset()
  }

  const send = () => start.mutate(code, { onSuccess: () => setOpen(false) })

  return (
    <div className="grid w-full gap-1.5 sm:w-auto">
      <Label id={labelId}>Sync scope</Label>
      <div className="flex flex-wrap items-center gap-2">
        <SearchableSelect
          labelId={labelId}
          options={choices}
          value={code}
          onChange={setCode}
          searchLabel="Search powiats"
          anyLabel="All of Poland"
          className="w-full sm:w-60"
        />
        <Button
          type="button"
          aria-disabled={blocked || undefined}
          className={cn(blocked && 'opacity-50 hover:bg-primary')}
          onClick={(event) => {
            // aria-disabled instead of disabled: the button stays focusable and keeps its text.
            if (blocked) {
              event.preventDefault()
              return
            }
            changeOpen(true)
          }}
        >
          <PlayIcon aria-hidden />
          {blocked ? 'A run is in progress' : 'Start sync'}
        </Button>
      </div>
      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start sync</DialogTitle>
            <DialogDescription>{question}</DialogDescription>
          </DialogHeader>
          {start.isError && (
            <ErrorState
              message={`Could not start the sync: ${start.error.message}`}
              onRetry={send}
            />
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            {!start.isError && (
              <Button type="button" disabled={start.isPending} onClick={send}>
                Start
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
