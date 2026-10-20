import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  ArrowRight,
  LogOut,
  Pencil,
  Plus,
  ShieldCheck,
  Swords,
  Trophy,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import useSWR, { useSWRConfig } from 'swr'
import {
  rosterForChampionship,
  unassignedPlayers,
  type AdminPage as AdminSection,
} from './admin-navigation.ts'
import { signOut } from './session.ts'
import { resetMatchFormKeepingContext } from './match-form.ts'
import { withChampionshipParam } from './routes.ts'
import {
  deleteRequest,
  patchRequest,
  request,
  stageLabel,
  type Item,
  type Match,
  type Participant,
  type Player,
  type Stage,
} from './tournament-api.ts'

const adminLinks = [
  {
    page: 'players',
    href: '/admin/jugadores',
    label: 'Jugadores',
    Icon: Users,
  },
  { page: 'teams', href: '/admin/equipos', label: 'Equipos', Icon: Swords },
  {
    page: 'championships',
    href: '/admin/campeonatos',
    label: 'Campeonatos',
    Icon: Trophy,
  },
  { page: 'matches', href: '/admin/partidos', label: 'Partidos', Icon: Swords },
] as const

const pageIntro = {
  players: {
    title: 'Jugadores',
    description: 'Registra jugadores y edita sus nombres y títulos.',
  },
  teams: {
    title: 'Equipos',
    description:
      'Crea el catálogo de equipos disponibles para los campeonatos.',
  },
  championships: {
    title: 'Campeonatos',
    description:
      'Crea un campeonato y elige qué jugadores participan y con qué equipo.',
  },
  matches: {
    title: 'Partidos',
    description:
      'Carga resultados solo entre jugadores inscritos en el campeonato.',
  },
  'not-found': {
    title: 'Página no encontrada',
    description: 'Esta sección de administración no existe.',
  },
} as const

function TeamAssignmentSelect({
  entry,
  teams,
  onSaved,
}: {
  entry: Participant
  teams: Item[]
  onSaved: () => Promise<unknown>
}) {
  const savedTeamId = useRef(entry.teamId)
  const selectRef = useRef<HTMLSelectElement>(null)
  const [status, setStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error' | 'refresh-error'
  >('idle')

  useEffect(() => {
    savedTeamId.current = entry.teamId
  }, [entry.teamId])

  useEffect(() => {
    if (status !== 'saved') return
    const timer = window.setTimeout(() => setStatus('idle'), 2500)
    return () => window.clearTimeout(timer)
  }, [status])

  async function changeTeam(nextTeamId: string) {
    setStatus('saving')
    try {
      await request('/admin/participants', {
        championshipId: entry.championshipId,
        playerId: entry.playerId,
        teamId: nextTeamId,
      })
      savedTeamId.current = nextTeamId
    } catch {
      if (selectRef.current) selectRef.current.value = savedTeamId.current
      setStatus('error')
      return
    }
    try {
      await onSaved()
      setStatus('saved')
    } catch {
      setStatus('refresh-error')
    }
  }

  return (
    <div className="min-w-0 flex-1">
      <select
        ref={selectRef}
        key={`${entry.id}-${entry.teamId}`}
        className="select-bordered select w-full"
        defaultValue={entry.teamId}
        aria-label={`Equipo de ${entry.player.name}`}
        disabled={status === 'saving'}
        onChange={(event) => void changeTeam(event.target.value)}
      >
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
      {status !== 'idle' && (
        <p
          className={`mt-1 text-xs ${status === 'error' ? 'text-error' : 'text-base-content/60'}`}
          role={status === 'error' ? 'alert' : 'status'}
        >
          {status === 'saving' && 'Guardando…'}
          {status === 'saved' && 'Guardado'}
          {status === 'error' &&
            'No se pudo guardar. Se restauró el equipo anterior.'}
          {status === 'refresh-error' &&
            'Equipo guardado, pero no se pudo actualizar la lista.'}
        </p>
      )}
    </div>
  )
}

export function AdminPage({ page }: { page: AdminSection }) {
  const { mutate: mutateCache } = useSWRConfig()
  const {
    data: user,
    mutate: refreshUser,
    isLoading: checkingUser,
  } = useSWR<{ username: string }>('/auth/me', request, {
    shouldRetryOnError: false,
  })
  const signedIn = Boolean(user)
  const { data: players = [], mutate: refreshPlayers } = useSWR<Player[]>(
    signedIn ? '/admin/players' : null,
    request,
  )
  const { data: teams = [], mutate: refreshTeams } = useSWR<Item[]>(
    signedIn ? '/admin/teams' : null,
    request,
  )
  const { data: championships = [], mutate: refreshChampionships } = useSWR<
    Item[]
  >(signedIn ? '/admin/championships' : null, request)
  const { data: stages = [], mutate: refreshStages } = useSWR<Stage[]>(
    signedIn ? '/admin/stages' : null,
    request,
  )
  const { data: matches = [], mutate: refreshMatches } = useSWR<Match[]>(
    signedIn ? '/admin/matches' : null,
    request,
  )
  const { data: participants = [], mutate: refreshParticipants } = useSWR<
    Participant[]
  >(signedIn ? '/admin/participants' : null, request)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const championshipId = searchParams.get('campeonato') ?? ''
  const [playerDialog, setPlayerDialog] = useState<{ player?: Player } | null>(
    null,
  )
  const playerDialogRef = useRef<HTMLDialogElement>(null)
  const playerDialogTrigger = useRef<HTMLElement | null>(null)
  const [teamDialog, setTeamDialog] = useState<Item | null>(null)
  const teamDialogRef = useRef<HTMLDialogElement>(null)
  const teamDialogTrigger = useRef<HTMLElement | null>(null)
  const [matchToEdit, setMatchToEdit] = useState<Match | null>(null)
  const editMatchDialogRef = useRef<HTMLDialogElement>(null)
  const editMatchDialogTrigger = useRef<HTMLElement | null>(null)
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null)
  const matchDialogRef = useRef<HTMLDialogElement>(null)
  const matchDialogTrigger = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const dialog = playerDialogRef.current
    if (!dialog) return
    if (playerDialog) {
      if (!dialog.open) dialog.showModal()
      return
    }
    if (dialog.open) dialog.close()
    playerDialogTrigger.current?.focus()
  }, [playerDialog])

  function changePlayerDialog(next: { player?: Player } | null) {
    if (next)
      playerDialogTrigger.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
    setError('')
    setPlayerDialog(next)
  }

  useEffect(() => {
    const dialog = teamDialogRef.current
    if (!dialog) return
    if (teamDialog) {
      if (!dialog.open) dialog.showModal()
      return
    }
    if (dialog.open) dialog.close()
    teamDialogTrigger.current?.focus()
  }, [teamDialog])

  function changeTeamDialog(next: Item | null) {
    if (next)
      teamDialogTrigger.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
    setError('')
    setTeamDialog(next)
  }

  useEffect(() => {
    const dialog = editMatchDialogRef.current
    if (!dialog) return
    if (matchToEdit) {
      if (!dialog.open) dialog.showModal()
      return
    }
    if (dialog.open) dialog.close()
    editMatchDialogTrigger.current?.focus()
  }, [matchToEdit])

  function changeEditMatchDialog(next: Match | null) {
    if (next)
      editMatchDialogTrigger.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
    setError('')
    setMatchToEdit(next)
  }

  useEffect(() => {
    const dialog = matchDialogRef.current
    if (!dialog) return
    if (matchToDelete) {
      if (!dialog.open) dialog.showModal()
      return
    }
    if (dialog.open) dialog.close()
    matchDialogTrigger.current?.focus()
  }, [matchToDelete])

  function changeMatchDialog(next: Match | null) {
    if (next)
      matchDialogTrigger.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
    setError('')
    setMatchToDelete(next)
  }

  async function submit(
    action: () => Promise<unknown>,
    form?: HTMLFormElement,
  ) {
    setError('')
    setBusy(true)
    try {
      await action()
      form?.reset()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Ocurrió un error. Intenta nuevamente.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (checkingUser)
    return (
      <main className="text-base-content/60 grid min-h-screen place-items-center">
        Cargando administración…
      </main>
    )

  if (!signedIn)
    return (
      <main className="bg-base-200 grid min-h-screen place-items-center px-4">
        <form
          className="bg-base-100 border-base-300 card w-full max-w-md border shadow-xl"
          onSubmit={(event) => {
            event.preventDefault()
            const data = new FormData(event.currentTarget)
            void submit(async () => {
              await request('/auth/login', {
                username: data.get('username'),
                password: data.get('password'),
              })
              await refreshUser()
            })
          }}
        >
          <div className="card-body gap-5">
            <div className="bg-primary text-primary-content flex size-12 items-center justify-center rounded-2xl">
              <ShieldCheck />
            </div>
            <div>
              <p className="text-primary text-sm font-semibold tracking-widest uppercase">
                Ernestina Silva
              </p>
              <h1 className="mt-2 text-3xl font-bold">
                Administración del campeonato
              </h1>
              <p className="text-base-content/60 mt-2">
                Ingresa para administrar jugadores, equipos, campeonatos y
                partidos.
              </p>
              <Link
                className="link link-primary mt-2 inline-block text-sm"
                to="/"
              >
                Volver al campeonato
              </Link>
            </div>
            <label className="form-control">
              <span className="label-text mb-2">Usuario</span>
              <input
                className="input input-bordered w-full"
                name="username"
                autoComplete="username"
                required
              />
            </label>
            <label className="form-control">
              <span className="label-text mb-2">Contraseña</span>
              <input
                className="input input-bordered w-full"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            {error && (
              <p className="text-error text-sm" role="alert">
                {error}
              </p>
            )}
            <button className="btn btn-primary mt-2" disabled={busy}>
              Ingresar <ArrowRight className="size-4" />
            </button>
            {import.meta.env.DEV && (
              <p className="text-base-content/50 text-xs">
                Solo para desarrollo local: admin / admin
              </p>
            )}
          </div>
        </form>
      </main>
    )

  const selectedChampionship = championships.find(
    (item) => item.id === championshipId,
  )
  const selectedRoster = rosterForChampionship(participants, championshipId)
  const selectedTeamCount = new Set(selectedRoster.map((entry) => entry.teamId))
    .size
  const availablePlayers = unassignedPlayers(
    players,
    participants,
    championshipId,
  )
  const selectedStages = stages.filter(
    (stage) => stage.championshipId === championshipId,
  )
  const availableStageKinds = (['GROUP', 'LEAGUE', 'KNOCKOUT'] as const).filter(
    (kind) => !selectedStages.some((stage) => stage.kind === kind),
  )
  const visibleMatches = championshipId
    ? matches.filter((match) => match.championship.id === championshipId)
    : matches
  const canRecord = selectedRoster.length >= 2

  function createName(
    event: FormEvent<HTMLFormElement>,
    path: string,
    refresh: () => Promise<unknown>,
  ) {
    event.preventDefault()
    const form = event.currentTarget
    const name = new FormData(form).get('name')
    void submit(async () => {
      await request(path, { name })
      await refresh()
    }, form)
  }

  return (
    <main className="bg-base-200 text-base-content min-h-screen">
      <header className="bg-base-100 border-base-300 border-b">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-content grid size-10 place-items-center rounded-xl">
              <Trophy className="size-5" />
            </div>
            <div>
              <p className="text-primary text-xs font-bold tracking-widest uppercase">
                Ernestina Silva
              </p>
              <h1 className="text-xl font-bold">Administración</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link className="btn btn-ghost btn-sm" to="/">
              Ver campeonato
            </Link>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() =>
                void submit(() =>
                  signOut(
                    () => request('/auth/logout', {}),
                    () =>
                      mutateCache(() => true, undefined, { revalidate: false }),
                  ),
                )
              }
            >
              <LogOut className="size-4" /> Cerrar sesión
            </button>
          </div>
        </div>
        <nav
          aria-label="Secciones de administración"
          className="mx-auto flex max-w-6xl flex-wrap gap-2 px-5 pb-4"
        >
          {adminLinks.map(({ page: section, href, label, Icon }) => (
            <Link
              key={section}
              to={href}
              aria-current={page === section ? 'page' : undefined}
              className={`btn btn-sm ${page === section ? 'btn-primary' : 'btn-ghost'}`}
            >
              <Icon className="size-4" /> {label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="mx-auto max-w-6xl space-y-7 px-5 py-9">
        <div>
          <h2 className="text-3xl font-bold">{pageIntro[page].title}</h2>
          <p className="text-base-content/60 mt-2">
            {pageIntro[page].description}
          </p>
        </div>
        {error &&
          !playerDialog &&
          !teamDialog &&
          !matchToEdit &&
          !matchToDelete && (
            <div className="alert alert-error" role="alert">
              {error}
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setError('')}
              >
                Cerrar
              </button>
            </div>
          )}

        {page === 'players' && (
          <section className="space-y-2">
            <div className="flex flex-wrap items-center justify-end gap-3 px-4">
              <button
                className="btn-outline btn btn-sm"
                onClick={() => changePlayerDialog({})}
              >
                Agregar jugador <Plus className="size-4" />
              </button>
            </div>
            {players.length > 0 ? (
              <ul className="list" aria-label="Lista de jugadores">
                {players.map((player) => (
                  <li key={player.id} className="list-row items-center">
                    <div className="list-col-grow min-w-0">
                      <p className="truncate text-lg font-bold">
                        {player.name}
                      </p>
                      {player.title && (
                        <p className="text-base-content/60 truncate text-sm">
                          {player.title}
                        </p>
                      )}
                    </div>
                    <button
                      className="btn btn-ghost btn-sm btn-square"
                      aria-label={`Editar ${player.name}`}
                      onClick={() => changePlayerDialog({ player })}
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
              ref={playerDialogRef}
              className="modal"
              aria-labelledby="player-dialog-title"
              onClose={() => changePlayerDialog(null)}
              onClick={(event) => {
                if (event.target === event.currentTarget)
                  changePlayerDialog(null)
              }}
            >
              {playerDialog && (
                <div className="modal-box">
                  <div className="flex items-center justify-between gap-3">
                    <h3 id="player-dialog-title" className="text-lg font-bold">
                      {playerDialog.player
                        ? `Editar a ${playerDialog.player.name}`
                        : 'Agregar jugador'}
                    </h3>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-square"
                      aria-label="Cerrar"
                      onClick={() => changePlayerDialog(null)}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <form
                    key={playerDialog.player?.id ?? 'new'}
                    className="mt-4 grid gap-3"
                    onSubmit={(event) => {
                      event.preventDefault()
                      const form = event.currentTarget
                      const data = new FormData(form)
                      const payload = {
                        name: data.get('name'),
                        title: data.get('title'),
                      }
                      const player = playerDialog.player
                      void submit(async () => {
                        if (player)
                          await patchRequest(
                            `/admin/players/${player.id}`,
                            payload,
                          )
                        else await request('/admin/players', payload)
                        await refreshPlayers()
                        setPlayerDialog(null)
                      }, form)
                    }}
                  >
                    <label className="form-control">
                      <span className="label-text mb-1">Nombre</span>
                      <input
                        className="input input-bordered w-full"
                        name="name"
                        defaultValue={playerDialog.player?.name ?? ''}
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
                        defaultValue={playerDialog.player?.title ?? ''}
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
                        onClick={() => changePlayerDialog(null)}
                      >
                        Cancelar
                      </button>
                      <button className="btn btn-primary" disabled={busy}>
                        {playerDialog.player
                          ? 'Guardar cambios'
                          : 'Agregar jugador'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </dialog>
          </section>
        )}

        {page === 'teams' && (
          <section className="space-y-2">
            <form
              className="flex flex-wrap gap-2 px-4"
              onSubmit={(event) =>
                createName(event, '/admin/teams', refreshTeams)
              }
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
                {teams.map((team) => (
                  <li key={team.id} className="list-row items-center">
                    <p className="list-col-grow min-w-0 truncate text-lg font-bold">
                      {team.name}
                    </p>
                    <button
                      className="btn btn-ghost btn-sm btn-square"
                      aria-label={`Editar ${team.name}`}
                      onClick={() => changeTeamDialog(team)}
                    >
                      <Pencil className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-base-content/60 px-4 py-6 text-sm">
                Todavía no hay equipos. Después podrás asignarlos a cada
                campeonato.
              </p>
            )}
            <dialog
              ref={teamDialogRef}
              className="modal"
              aria-labelledby="team-dialog-title"
              onClose={() => changeTeamDialog(null)}
              onClick={(event) => {
                if (event.target === event.currentTarget) changeTeamDialog(null)
              }}
            >
              {teamDialog && (
                <div className="modal-box">
                  <div className="flex items-center justify-between gap-3">
                    <h3 id="team-dialog-title" className="text-lg font-bold">
                      Editar a {teamDialog.name}
                    </h3>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-square"
                      aria-label="Cerrar"
                      onClick={() => changeTeamDialog(null)}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <form
                    key={teamDialog.id}
                    className="mt-4 grid gap-3"
                    onSubmit={(event) => {
                      event.preventDefault()
                      const form = event.currentTarget
                      const data = new FormData(form)
                      void submit(async () => {
                        await patchRequest(`/admin/teams/${teamDialog.id}`, {
                          name: data.get('name'),
                        })
                        await Promise.all([
                          refreshTeams(),
                          refreshParticipants(),
                          refreshMatches(),
                        ])
                        setTeamDialog(null)
                      }, form)
                    }}
                  >
                    <label className="form-control">
                      <span className="label-text mb-1">Nombre</span>
                      <input
                        className="input input-bordered w-full"
                        name="name"
                        defaultValue={teamDialog.name}
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
                        onClick={() => changeTeamDialog(null)}
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
        )}

        {page === 'championships' && (
          <>
            <section>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 px-4">
                  <h3 className="text-xl font-bold">Crear campeonato</h3>
                  <span className="text-base-content/60 text-sm">
                    {championships.length}{' '}
                    {championships.length === 1 ? 'campeonato' : 'campeonatos'}
                  </span>
                </div>
                <form
                  className="space-y-4 px-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    const form = event.currentTarget
                    const data = new FormData(form)
                    const stageKinds = data.getAll('stageKinds')
                    if (stageKinds.length === 0) {
                      form
                        .querySelector<HTMLInputElement>('[name="stageKinds"]')
                        ?.setCustomValidity('Selecciona al menos una etapa')
                      form.reportValidity()
                      return
                    }
                    void submit(async () => {
                      await request('/admin/championships', {
                        name: data.get('name'),
                        stageKinds,
                      })
                      await Promise.all([
                        refreshChampionships(),
                        refreshStages(),
                      ])
                    }, form)
                  }}
                >
                  <input
                    className="input input-bordered w-full"
                    name="name"
                    placeholder="Nombre del campeonato"
                    maxLength={100}
                    required
                  />
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">
                      Etapas (elige al menos una)
                    </legend>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      {(['GROUP', 'LEAGUE', 'KNOCKOUT'] as const).map(
                        (kind) => (
                          <label
                            className="flex cursor-pointer items-center gap-2"
                            key={kind}
                          >
                            <input
                              className="checkbox checkbox-sm"
                              type="checkbox"
                              name="stageKinds"
                              value={kind}
                              onChange={(event) => {
                                event.currentTarget.form
                                  ?.querySelector<HTMLInputElement>(
                                    '[name="stageKinds"]',
                                  )
                                  ?.setCustomValidity('')
                              }}
                            />
                            {stageLabel(kind)}
                          </label>
                        ),
                      )}
                    </div>
                  </fieldset>
                  <button className="btn-outline btn" disabled={busy}>
                    Crear campeonato <Plus className="size-4" />
                  </button>
                </form>
              </div>
            </section>
            <section className="border-base-300 border-t pt-7">
              <div className="space-y-4">
                <h3 className="px-4 text-xl font-bold">Gestionar campeonato</h3>
                <div className="px-4">
                  <label className="flex max-w-lg flex-col gap-2">
                    <span className="text-sm font-medium">Campeonato</span>
                    <select
                      className="select-bordered select w-full"
                      value={championshipId}
                      onChange={(event) =>
                        setSearchParams(
                          withChampionshipParam(
                            searchParams,
                            event.target.value,
                          ),
                        )
                      }
                    >
                      <option value="">Selecciona un campeonato</option>
                      {championships.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {selectedChampionship && (
                  <>
                    <div className="space-y-2 px-4 pt-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h4 className="text-lg font-bold">
                          Jugadores y equipos
                        </h4>
                        <Link
                          className="link link-primary"
                          to={`/admin/partidos?campeonato=${encodeURIComponent(championshipId)}`}
                        >
                          Cargar partidos{' '}
                          <ArrowRight className="inline size-4" />
                        </Link>
                      </div>
                      <p className="text-base-content/60 text-sm">
                        Solo los jugadores inscritos, con su equipo asignado,
                        pueden disputar partidos.
                      </p>
                      <p className="text-base-content/70 text-sm">
                        {selectedRoster.length}{' '}
                        {selectedRoster.length === 1
                          ? 'jugador inscrito'
                          : 'jugadores inscritos'}{' '}
                        · {selectedTeamCount}{' '}
                        {selectedTeamCount === 1
                          ? 'equipo utilizado'
                          : 'equipos utilizados'}
                      </p>
                    </div>
                    <form
                      className="grid gap-3 px-4 md:grid-cols-[1fr_1fr_auto]"
                      onSubmit={(event) => {
                        event.preventDefault()
                        const form = event.currentTarget
                        const data = new FormData(form)
                        void submit(async () => {
                          await request('/admin/participants', {
                            championshipId,
                            playerId: data.get('playerId'),
                            teamId: data.get('teamId'),
                          })
                          await refreshParticipants()
                        }, form)
                      }}
                    >
                      <select
                        className="select-bordered select w-full"
                        name="playerId"
                        key={`player-${championshipId}-${selectedRoster.length}`}
                        required
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Jugador sin inscribir
                        </option>
                        {availablePlayers.map((player) => (
                          <option key={player.id} value={player.id}>
                            {player.name}
                          </option>
                        ))}
                      </select>
                      <select
                        className="select-bordered select w-full"
                        name="teamId"
                        key={`team-${championshipId}-${selectedRoster.length}`}
                        required
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Equipo para este campeonato
                        </option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                      <button
                        className="btn-outline btn"
                        disabled={
                          busy || !availablePlayers.length || !teams.length
                        }
                      >
                        Inscribir <Plus className="size-4" />
                      </button>
                    </form>
                    {(!players.length || !teams.length) && (
                      <p className="text-warning px-4 text-sm">
                        Primero agrega jugadores y equipos en sus respectivas
                        secciones.
                      </p>
                    )}
                    {selectedRoster.length > 0 ? (
                      <ul className="list" aria-label="Plantel del campeonato">
                        {selectedRoster.map((entry) => (
                          <li className="list-row items-center" key={entry.id}>
                            <span className="min-w-32 font-bold">
                              {entry.player.name}
                            </span>
                            <TeamAssignmentSelect
                              entry={entry}
                              teams={teams}
                              onSaved={refreshParticipants}
                            />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-base-content/60 px-4 py-6 text-sm">
                        Este campeonato todavía no tiene jugadores ni equipos
                        asignados.
                      </p>
                    )}
                  </>
                )}
              </div>
            </section>
            {selectedChampionship && (
              <section className="border-base-300 border-t pt-7">
                <div className="space-y-4">
                  <h3 className="px-4 text-xl font-bold">
                    Etapas de {selectedChampionship.name}
                  </h3>
                  <form
                    className="flex flex-wrap gap-3 px-4"
                    onSubmit={(event) => {
                      event.preventDefault()
                      const form = event.currentTarget
                      const data = new FormData(form)
                      void submit(async () => {
                        await request('/admin/stages', {
                          kind: data.get('kind'),
                          championshipId,
                        })
                        await refreshStages()
                      })
                    }}
                  >
                    <select
                      className="select-bordered select min-w-48 flex-1"
                      name="kind"
                      required
                      disabled={availableStageKinds.length === 0}
                    >
                      {availableStageKinds.map((kind) => (
                        <option key={kind} value={kind}>
                          {stageLabel(kind)}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn-outline btn"
                      disabled={busy || availableStageKinds.length === 0}
                    >
                      Agregar etapa <Plus className="size-4" />
                    </button>
                  </form>
                  {selectedStages.length > 0 && (
                    <ul className="list" aria-label="Etapas del campeonato">
                      {selectedStages.map((stage) => (
                        <li className="list-row items-center" key={stage.id}>
                          <span className="font-bold">
                            {stageLabel(stage.kind)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            )}
          </>
        )}

        {page === 'matches' && (
          <>
            <section>
              <div className="space-y-5">
                <h3 className="px-4 text-xl font-bold">Registrar un partido</h3>
                {!canRecord && (
                  <p className="text-warning px-4 text-sm">
                    Selecciona un campeonato con al menos dos jugadores
                    inscritos y sus equipos asignados.
                  </p>
                )}
                <form
                  className="grid gap-x-5 gap-y-6 px-4 md:grid-cols-2"
                  onSubmit={(event) => {
                    event.preventDefault()
                    const form = event.currentTarget
                    const data = new FormData(form)
                    const home = selectedRoster.find(
                      (entry) => entry.playerId === data.get('homePlayerId'),
                    )
                    const away = selectedRoster.find(
                      (entry) => entry.playerId === data.get('awayPlayerId'),
                    )
                    if (!home || !away) {
                      setError(
                        'Selecciona dos jugadores inscritos en el campeonato.',
                      )
                      return
                    }
                    void submit(async () => {
                      await request('/admin/matches', {
                        championshipId,
                        stageId: data.get('stageId') || null,
                        homePlayerId: home.playerId,
                        awayPlayerId: away.playerId,
                        homeTeamId: home.teamId,
                        awayTeamId: away.teamId,
                        homeScore: Number(data.get('homeScore')),
                        awayScore: Number(data.get('awayScore')),
                      })
                      await refreshMatches()
                      resetMatchFormKeepingContext(form)
                    })
                  }}
                >
                  <label className="flex min-w-0 flex-col gap-2">
                    <span className="text-sm font-medium">Campeonato</span>
                    <select
                      className="select-bordered select w-full"
                      name="championshipId"
                      required
                      value={championshipId}
                      onChange={(event) =>
                        setSearchParams(
                          withChampionshipParam(
                            searchParams,
                            event.target.value,
                          ),
                        )
                      }
                    >
                      <option value="" disabled>
                        Selecciona un campeonato
                      </option>
                      {championships.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex min-w-0 flex-col gap-2">
                    <span className="text-sm font-medium">
                      Etapa (opcional)
                    </span>
                    <select
                      className="select-bordered select w-full"
                      name="stageId"
                      key={championshipId}
                    >
                      <option value="">Sin etapa</option>
                      {selectedStages.map((stage) => (
                        <option key={stage.id} value={stage.id}>
                          {stageLabel(stage.kind)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {(
                    [
                      ['Local', 'home'],
                      ['Visitante', 'away'],
                    ] as const
                  ).map(([label, prefix]) => (
                    <div
                      className="border-base-300 space-y-4 border-t pt-5"
                      key={prefix}
                    >
                      <h4 className="font-semibold">{label}</h4>
                      <label className="flex min-w-0 flex-col gap-2">
                        <span className="text-sm font-medium">
                          Jugador · equipo asignado
                        </span>
                        <select
                          className="select-bordered select w-full"
                          name={`${prefix}PlayerId`}
                          key={`${prefix}-${championshipId}`}
                          required
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Selecciona un jugador
                          </option>
                          {selectedRoster.map((entry) => (
                            <option key={entry.id} value={entry.playerId}>
                              {entry.player.name} · {entry.team.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-sm font-medium">Goles</span>
                        <input
                          className="input input-bordered w-28"
                          type="number"
                          name={`${prefix}Score`}
                          min="0"
                          step="1"
                          required
                        />
                      </label>
                    </div>
                  ))}
                  <div className="pt-1 md:col-span-2">
                    <button
                      className="btn btn-primary"
                      disabled={busy || !canRecord}
                    >
                      Guardar partido <ArrowRight className="size-4" />
                    </button>
                  </div>
                </form>
              </div>
            </section>
            <section className="border-base-300 space-y-4 border-t pt-7">
              <div className="flex items-center justify-between gap-3 px-4">
                <h3 className="text-xl font-bold">Partidos registrados</h3>
                <span className="text-base-content/60 text-sm">
                  {visibleMatches.length}{' '}
                  {visibleMatches.length === 1 ? 'partido' : 'partidos'}
                </span>
              </div>
              {visibleMatches.length === 0 ? (
                <p className="text-base-content/60 px-4 py-6 text-sm">
                  Todavía no hay partidos registrados.
                </p>
              ) : (
                <ul className="list" aria-label="Partidos registrados">
                  {visibleMatches.map((match) => (
                    <li className="list-row items-center" key={match.id}>
                      <div className="list-col-grow min-w-0">
                        <p className="font-semibold">
                          {match.homePlayer.name}{' '}
                          <span className="text-base-content/40">contra</span>{' '}
                          {match.awayPlayer.name}
                        </p>
                        <p className="text-base-content/60 text-sm">
                          {match.homeTeam.name} · {match.awayTeam.name}
                        </p>
                        <p className="text-base-content/50 mt-1 text-xs">
                          {match.championship.name}
                          {match.stage
                            ? ` / ${stageLabel(match.stage.kind)}`
                            : ''}
                        </p>
                      </div>
                      <span className="text-xl font-black tabular-nums">
                        {match.homeScore} — {match.awayScore}
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-square btn-sm"
                        aria-label={`Editar partido de ${match.homePlayer.name} contra ${match.awayPlayer.name}`}
                        disabled={busy}
                        onClick={() => changeEditMatchDialog(match)}
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-square btn-sm text-error"
                        aria-label={`Eliminar partido de ${match.homePlayer.name} contra ${match.awayPlayer.name}`}
                        disabled={busy}
                        onClick={() => changeMatchDialog(match)}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <dialog
                ref={editMatchDialogRef}
                className="modal"
                aria-labelledby="edit-match-title"
                onCancel={(event) => {
                  if (busy) event.preventDefault()
                  else changeEditMatchDialog(null)
                }}
                onClose={() => changeEditMatchDialog(null)}
                onClick={(event) => {
                  if (event.target === event.currentTarget && !busy)
                    changeEditMatchDialog(null)
                }}
              >
                {matchToEdit && (
                  <div className="modal-box">
                    <h3 id="edit-match-title" className="text-lg font-bold">
                      Editar partido
                    </h3>
                    <p className="text-base-content/60 mt-1 text-sm">
                      {matchToEdit.homePlayer.name} contra{' '}
                      {matchToEdit.awayPlayer.name} ·{' '}
                      {matchToEdit.championship.name}
                    </p>
                    <form
                      key={matchToEdit.id}
                      className="mt-5 space-y-4"
                      onSubmit={(event) => {
                        event.preventDefault()
                        const data = new FormData(event.currentTarget)
                        const matchId = matchToEdit.id
                        void submit(async () => {
                          await patchRequest(`/admin/matches/${matchId}`, {
                            stageId: data.get('stageId') || null,
                            homeScore: Number(data.get('homeScore')),
                            awayScore: Number(data.get('awayScore')),
                          })
                          await refreshMatches()
                          changeEditMatchDialog(null)
                        })
                      }}
                    >
                      <label className="flex flex-col gap-2">
                        <span className="text-sm font-medium">Etapa</span>
                        <select
                          className="select select-bordered w-full"
                          name="stageId"
                          defaultValue={matchToEdit.stage?.id ?? ''}
                        >
                          <option value="">Sin etapa</option>
                          {stages
                            .filter(
                              (stage) =>
                                stage.championshipId ===
                                matchToEdit.championship.id,
                            )
                            .map((stage) => (
                              <option key={stage.id} value={stage.id}>
                                {stageLabel(stage.kind)}
                              </option>
                            ))}
                        </select>
                      </label>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="flex flex-col gap-2">
                          <span className="text-sm font-medium">
                            Goles de {matchToEdit.homePlayer.name}
                          </span>
                          <input
                            className="input input-bordered w-full"
                            type="number"
                            name="homeScore"
                            min={0}
                            step={1}
                            defaultValue={matchToEdit.homeScore}
                            required
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-sm font-medium">
                            Goles de {matchToEdit.awayPlayer.name}
                          </span>
                          <input
                            className="input input-bordered w-full"
                            type="number"
                            name="awayScore"
                            min={0}
                            step={1}
                            defaultValue={matchToEdit.awayScore}
                            required
                          />
                        </label>
                      </div>
                      {error && (
                        <p className="text-error text-sm" role="alert">
                          {error}
                        </p>
                      )}
                      <div className="modal-action">
                        <button
                          type="button"
                          className="btn btn-ghost"
                          disabled={busy}
                          onClick={() => changeEditMatchDialog(null)}
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
              <dialog
                ref={matchDialogRef}
                className="modal"
                role="alertdialog"
                aria-labelledby="delete-match-title"
                aria-describedby="delete-match-description"
                onCancel={(event) => {
                  if (busy) event.preventDefault()
                  else changeMatchDialog(null)
                }}
                onClose={() => changeMatchDialog(null)}
                onClick={(event) => {
                  if (event.target === event.currentTarget && !busy)
                    changeMatchDialog(null)
                }}
              >
                {matchToDelete && (
                  <div className="modal-box">
                    <h3 id="delete-match-title" className="text-lg font-bold">
                      Eliminar partido
                    </h3>
                    <p
                      id="delete-match-description"
                      className="text-base-content/70 mt-3"
                    >
                      ¿Eliminar el partido de {matchToDelete.homePlayer.name}{' '}
                      contra {matchToDelete.awayPlayer.name} (
                      {matchToDelete.homeScore} — {matchToDelete.awayScore})?
                      Esta acción no se puede deshacer.
                    </p>
                    {error && (
                      <p className="text-error mt-3 text-sm" role="alert">
                        {error}
                      </p>
                    )}
                    <div className="modal-action">
                      <button
                        type="button"
                        className="btn btn-ghost"
                        disabled={busy}
                        autoFocus
                        onClick={() => changeMatchDialog(null)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="btn btn-error"
                        disabled={busy}
                        onClick={() => {
                          const matchId = matchToDelete.id
                          void submit(async () => {
                            await deleteRequest(`/admin/matches/${matchId}`)
                            await refreshMatches()
                            changeMatchDialog(null)
                          })
                        }}
                      >
                        Eliminar partido
                      </button>
                    </div>
                  </div>
                )}
              </dialog>
            </section>
          </>
        )}

        {page === 'not-found' && (
          <Link className="btn btn-primary" to="/admin/campeonatos">
            Ir a campeonatos
          </Link>
        )}
      </div>
    </main>
  )
}
