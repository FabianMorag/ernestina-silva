import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Pencil, Plus, X } from 'lucide-react'
import type { Item } from '../../tournament-api.ts'

export function TeamsPanel({
  teams,
  busy,
  error,
  onClearError,
  onDialogChange,
  onCreate,
  onSave,
}: {
  teams: Item[]
  busy: boolean
  error: string
  onClearError: () => void
  onDialogChange: (open: boolean) => void
  onCreate: (form: HTMLFormElement) => void
  onSave: (
    team: Item,
    name: FormDataEntryValue | null,
    form: HTMLFormElement,
    onSaved: () => void,
  ) => void
}) {
  const [team, setTeam] = useState<Item | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (team) {
      if (!dialog.open) dialog.showModal()
      return
    }
    if (dialog.open) dialog.close()
    triggerRef.current?.focus()
  }, [team])

  function changeDialog(next: Item | null) {
    if (next)
      triggerRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
    onClearError()
    setTeam(next)
    onDialogChange(next !== null)
  }

  return (
    <section className="space-y-2">
      <form
        className="flex flex-wrap gap-2 px-4"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault()
          onCreate(event.currentTarget)
        }}
      >
        <input
          className="input input-bordered input-sm min-w-0 flex-1"
          name="name"
          placeholder="Nombre del equipo"
          aria-label="Nombre del equipo"
          maxLength={100}
          required
        />
        <button className="btn-outline btn btn-sm" disabled={busy}>
          Agregar equipo <Plus className="size-4" />
        </button>
      </form>
      {teams.length > 0 ? (
        <ul className="list" aria-label="Lista de equipos">
          {teams.map((item) => (
            <li key={item.id} className="list-row items-center">
              <p className="list-col-grow min-w-0 truncate text-lg font-bold">
                {item.name}
              </p>
              <button
                className="btn btn-ghost btn-sm btn-square"
                aria-label={`Editar ${item.name}`}
                onClick={() => changeDialog(item)}
              >
                <Pencil className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-base-content/60 px-4 py-6 text-sm">
          Todavía no hay equipos. Después podrás asignarlos a cada campeonato.
        </p>
      )}
      <dialog
        ref={dialogRef}
        className="modal"
        aria-labelledby="team-dialog-title"
        onClose={() => changeDialog(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) changeDialog(null)
        }}
      >
        {team && (
          <div className="modal-box">
            <div className="flex items-center justify-between gap-3">
              <h3 id="team-dialog-title" className="text-lg font-bold">
                Editar a {team.name}
              </h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-square"
                aria-label="Cerrar"
                onClick={() => changeDialog(null)}
              >
                <X className="size-4" />
              </button>
            </div>
            <form
              key={team.id}
              className="mt-4 grid gap-3"
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault()
                const form = event.currentTarget
                onSave(team, new FormData(form).get('name'), form, () =>
                  changeDialog(null),
                )
              }}
            >
              <label className="form-control">
                <span className="label-text mb-1">Nombre</span>
                <input
                  className="input input-bordered w-full"
                  name="name"
                  defaultValue={team.name}
                  maxLength={100}
                  required
                  autoFocus
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
                  onClick={() => changeDialog(null)}
                >
                  Cancelar
                </button>
                <button className="btn btn-primary" disabled={busy}>
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        )}
      </dialog>
    </section>
  )
}
