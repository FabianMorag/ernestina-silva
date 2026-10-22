import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Pencil, Plus, X } from 'lucide-react'
import type { Player } from '../../tournament-api.ts'
import {
  playerDialogState,
  type PlayerDialogAction,
} from './player-dialog-state.ts'

type PlayerDraft = {
  name: FormDataEntryValue | null
  title: FormDataEntryValue | null
}

export function PlayersPanel({
  players,
  busy,
  error,
  onClearError,
  onDialogChange,
  onSave,
}: {
  players: Player[]
  busy: boolean
  error: string
  onClearError: () => void
  onDialogChange: (open: boolean) => void
  onSave: (
    player: Player | undefined,
    draft: PlayerDraft,
    form: HTMLFormElement,
    onSaved: () => void,
  ) => void
}) {
  const [player, setPlayer] = useState<Player | undefined>()
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open) {
      if (!dialog.open) dialog.showModal()
      return
    }
    if (dialog.open) dialog.close()
    triggerRef.current?.focus()
  }, [open])

  function changeDialog(action: PlayerDialogAction) {
    if (action.type !== 'close' || !open)
      triggerRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
    const next = playerDialogState(action)
    onClearError()
    setPlayer(next.player)
    setOpen(next.open)
    onDialogChange(next.open)
  }

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-end gap-3 px-4">
        <button
          className="btn-outline btn btn-sm"
          onClick={() => changeDialog({ type: 'create' })}
        >
          Agregar jugador <Plus className="size-4" />
        </button>
      </div>
      {players.length > 0 ? (
        <ul className="list" aria-label="Lista de jugadores">
          {players.map((item) => (
            <li key={item.id} className="list-row items-center">
              <div className="list-col-grow min-w-0">
                <p className="truncate text-lg font-bold">{item.name}</p>
                {item.title && (
                  <p className="text-base-content/60 truncate text-sm">
                    {item.title}
                  </p>
                )}
              </div>
              <button
                className="btn btn-ghost btn-sm btn-square"
                aria-label={`Editar ${item.name}`}
                onClick={() => changeDialog({ type: 'edit', player: item })}
              >
                <Pencil className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-base-content/60 px-4 py-6 text-sm">
          Todavía no hay jugadores.
        </p>
      )}
      <dialog
        ref={dialogRef}
        className="modal"
        aria-labelledby="player-dialog-title"
        onClose={() => changeDialog({ type: 'close' })}
        onClick={(event) => {
          if (event.target === event.currentTarget)
            changeDialog({ type: 'close' })
        }}
      >
        {open && (
          <div className="modal-box">
            <div className="flex items-center justify-between gap-3">
              <h3 id="player-dialog-title" className="text-lg font-bold">
                {player ? `Editar a ${player.name}` : 'Agregar jugador'}
              </h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-square"
                aria-label="Cerrar"
                onClick={() => changeDialog({ type: 'close' })}
              >
                <X className="size-4" />
              </button>
            </div>
            <form
              key={player?.id ?? 'new'}
              className="mt-4 grid gap-3"
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault()
                const form = event.currentTarget
                const data = new FormData(form)
                onSave(
                  player,
                  { name: data.get('name'), title: data.get('title') },
                  form,
                  () => changeDialog({ type: 'close' }),
                )
              }}
            >
              <label className="form-control">
                <span className="label-text mb-1">Nombre</span>
                <input
                  className="input input-bordered w-full"
                  name="name"
                  defaultValue={player?.name ?? ''}
                  maxLength={100}
                  required
                  autoFocus
                />
              </label>
              <label className="form-control">
                <span className="label-text mb-1">Título (opcional)</span>
                <input
                  className="input input-bordered w-full"
                  name="title"
                  defaultValue={player?.title ?? ''}
                  maxLength={100}
                />
              </label>
              {error && (
                <p className="text-error text-sm" role="alert">
                  {error}
                </p>
              )}
              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => changeDialog({ type: 'close' })}
                >
                  Cancelar
                </button>
                <button className="btn btn-primary" disabled={busy}>
                  {player ? 'Guardar cambios' : 'Agregar jugador'}
                </button>
              </div>
            </form>
          </div>
        )}
      </dialog>
    </section>
  )
}
