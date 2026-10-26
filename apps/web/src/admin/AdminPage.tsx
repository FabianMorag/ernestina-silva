import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
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
} from 'lucide-react'
import useSWR, { useSWRConfig } from 'swr'
import {
  rosterForChampionship,
  unassignedPlayers,
  type AdminPage as AdminSection,
} from './navigation.ts'
import { PlayersPanel } from './players/PlayersPanel.tsx'
import { TeamsPanel } from './teams/TeamsPanel.tsx'
import { signOut } from './session.ts'
import { resetMatchFormKeepingContext } from './matches/form.ts'
import { groupMatchesByStage } from './matches/sections.ts'
import {
  deleteRequest,
  patchRequest,
  request,
  groupsForStage,
  KNOCKOUT_ROUNDS,
  knockoutRoundLabel,
  knockoutSlots,
  stageLabel,
  championshipTypeLabel,
  type Championship,
  type Item,
  type Match,
  type Participant,
  type Player,
  type Stage,
  type StageGroup,
} from '../shared/tournament-api.ts'

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
      'Consulta tus campeonatos y entra a uno para gestionar sus participantes y etapas.',
  },
  matches: {
    title: 'Partidos',
    description:
      'Elige un campeonato para ver sus partidos y cargar resultados entre jugadores inscritos.',
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

export function AdminPage({
  page,
  championshipView = 'list',
}: {
  page: AdminSection
  championshipView?: 'list' | 'create' | 'detail'
}) {
  const navigate = useNavigate()
  const { championshipId: routeChampionshipId } = useParams()
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
  const {
    data: championships = [],
    mutate: refreshChampionships,
    isLoading: loadingChampionships,
  } = useSWR<Championship[]>(signedIn ? '/admin/championships' : null, request)
  const {
    data: stages = [],
    mutate: refreshStages,
    isLoading: loadingStages,
  } = useSWR<Stage[]>(signedIn ? '/admin/stages' : null, request)
  const { data: groups = [], mutate: refreshGroups } = useSWR<StageGroup[]>(
    signedIn ? '/admin/groups' : null,
    request,
  )
  const { data: matches = [], mutate: refreshMatches } = useSWR<Match[]>(
    signedIn ? '/admin/matches' : null,
    request,
  )
  const {
    data: participants = [],
    mutate: refreshParticipants,
    isLoading: loadingParticipants,
  } = useSWR<Participant[]>(signedIn ? '/admin/participants' : null, request)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [searchParams] = useSearchParams()
  const championshipId =
    page === 'championships' && championshipView === 'detail'
      ? (routeChampionshipId ?? '')
      : (searchParams.get('campeonato') ?? '')
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false)
  const [teamDialogOpen, setTeamDialogOpen] = useState(false)
  const [matchToEdit, setMatchToEdit] = useState<Match | null>(null)
  const [matchStageId, setMatchStageId] = useState('')
  const [matchRound, setMatchRound] = useState('')
  const [editStageId, setEditStageId] = useState('')
  const [editMatchRound, setEditMatchRound] = useState('')
  const registerMatchDialogRef = useRef<HTMLDialogElement>(null)
  const registerMatchDialogTrigger = useRef<HTMLButtonElement>(null)
  const editMatchDialogRef = useRef<HTMLDialogElement>(null)
  const editMatchDialogTrigger = useRef<HTMLElement | null>(null)
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null)
  const matchDialogRef = useRef<HTMLDialogElement>(null)
  const matchDialogTrigger = useRef<HTMLElement | null>(null)

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
    setEditStageId(next?.stage?.id ?? '')
    setEditMatchRound(next?.knockoutRound?.toString() ?? '')
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
  const groupStage = selectedStages.find((stage) => stage.kind === 'GROUP')
  const effectiveMatchStageId = selectedStages.some(
    (stage) => stage.id === matchStageId,
  )
    ? matchStageId
    : ''
  const matchStage = selectedStages.find(
    (stage) => stage.id === effectiveMatchStageId,
  )
  const editStage = stages.find((stage) => stage.id === editStageId)
  const availableStageKinds = (['GROUP', 'LEAGUE', 'KNOCKOUT'] as const).filter(
    (kind) => !selectedStages.some((stage) => stage.kind === kind),
  )
  const visibleMatches = championshipId
    ? matches.filter((match) => match.championship.id === championshipId)
    : matches
  const matchSections = groupMatchesByStage(visibleMatches)
  const canRecord = selectedRoster.length >= 2

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
              Ver sitio público
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
          <h2 className="text-3xl font-bold">
            {page === 'championships' && championshipView === 'create'
              ? 'Nuevo campeonato'
              : page === 'championships' && championshipView === 'detail'
                ? (selectedChampionship?.name ?? 'Campeonato')
                : pageIntro[page].title}
          </h2>
          <p className="text-base-content/60 mt-2">
            {page === 'championships' && championshipView === 'create'
              ? 'Define el nombre y las etapas para comenzar.'
              : page === 'championships' && championshipView === 'detail'
                ? 'Gestiona sus participantes, equipos y etapas.'
                : pageIntro[page].description}
          </p>
        </div>
        {error &&
          !playerDialogOpen &&
          !teamDialogOpen &&
          !matchToEdit &&
          !matchToDelete &&
          !(page === 'matches' && selectedChampionship) && (
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
          <PlayersPanel
            players={players}
            busy={busy}
            error={error}
            onClearError={() => setError('')}
            onDialogChange={setPlayerDialogOpen}
            onSave={(player, payload, form, onSaved) =>
              void submit(async () => {
                if (player)
                  await patchRequest(`/admin/players/${player.id}`, payload)
                else await request('/admin/players', payload)
                await refreshPlayers()
                onSaved()
              }, form)
            }
          />
        )}

        {page === 'teams' && (
          <TeamsPanel
            teams={teams}
            busy={busy}
            error={error}
            onClearError={() => setError('')}
            onDialogChange={setTeamDialogOpen}
            onCreate={(form) => {
              const name = new FormData(form).get('name')
              void submit(async () => {
                await request('/admin/teams', { name })
                await refreshTeams()
              }, form)
            }}
            onSave={(team, name, form, onSaved) =>
              void submit(async () => {
                await patchRequest(`/admin/teams/${team.id}`, { name })
                await Promise.all([
                  refreshTeams(),
                  refreshParticipants(),
                  refreshMatches(),
                ])
                onSaved()
              }, form)
            }
          />
        )}

        {page === 'championships' && (
          <>
            {championshipView === 'list' && (
              <section className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-base-content/60 text-sm">
                    {championships.length}{' '}
                    {championships.length === 1 ? 'campeonato' : 'campeonatos'}
                  </p>
                  <Link
                    className="btn btn-primary"
                    to="/admin/campeonatos/nuevo"
                  >
                    <Plus className="size-4" /> Nuevo campeonato
                  </Link>
                </div>
                {loadingChampionships ||
                loadingStages ||
                loadingParticipants ? (
                  <p className="text-base-content/60 py-8 text-sm">
                    Cargando campeonatos…
                  </p>
                ) : championships.length === 0 ? (
                  <div className="border-base-300 bg-base-100 rounded-xl border px-5 py-9">
                    <Trophy
                      className="text-primary mb-3 size-8"
                      aria-hidden="true"
                    />
                    <p className="font-semibold">Todavía no hay campeonatos.</p>
                    <p className="text-base-content/60 mt-1 text-sm">
                      Crea uno para inscribir jugadores y organizar sus etapas.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3" aria-label="Campeonatos">
                    {championships.map((item) => {
                      const participantCount = participants.filter(
                        (entry) => entry.championshipId === item.id,
                      ).length
                      const championshipStages = stages.filter(
                        (stage) => stage.championshipId === item.id,
                      )
                      return (
                        <li
                          key={item.id}
                          className="border-base-300 bg-base-100 flex flex-col gap-4 rounded-xl border px-5 py-4 sm:flex-row sm:items-center"
                        >
                          <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center">
                            <div className="bg-base-200 text-primary grid size-12 shrink-0 place-items-center rounded-lg">
                              <Trophy className="size-7" aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="truncate font-bold">
                                {item.name}
                              </h4>
                              <p className="text-base-content/60 text-xs">
                                {championshipTypeLabel(item.type)}
                              </p>
                              <p className="text-primary mt-0.5 text-sm">
                                {championshipStages.length
                                  ? championshipStages
                                      .map((stage) => stageLabel(stage.kind))
                                      .join(' · ')
                                  : 'Sin etapas'}
                              </p>
                              <p className="text-base-content/60 mt-1 flex items-center gap-1.5 text-xs">
                                <Users
                                  className="size-3.5"
                                  aria-hidden="true"
                                />
                                {participantCount}{' '}
                                {participantCount === 1
                                  ? 'participante'
                                  : 'participantes'}
                              </p>
                            </div>
                          </div>
                          <Link
                            className="btn btn-primary w-full sm:w-auto sm:min-w-36"
                            to={`/admin/campeonatos/${encodeURIComponent(item.id)}`}
                            aria-label={`Gestionar ${item.name}`}
                          >
                            Gestionar
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            )}
            {championshipView === 'create' && (
              <section className="max-w-4xl">
                <div className="space-y-5">
                  <Link
                    className="link link-primary inline-flex min-h-11 items-center text-sm"
                    to="/admin/campeonatos"
                  >
                    ← Volver a campeonatos
                  </Link>
                  <form
                    className="border-base-300 bg-base-100 space-y-8 rounded-2xl border p-5 sm:p-8"
                    onSubmit={(event) => {
                      event.preventDefault()
                      const form = event.currentTarget
                      const data = new FormData(form)
                      const stageKinds = data.getAll('stageKinds')
                      if (stageKinds.length === 0) {
                        form
                          .querySelector<HTMLInputElement>(
                            '[name="stageKinds"]',
                          )
                          ?.setCustomValidity('Selecciona al menos una etapa')
                        form.reportValidity()
                        return
                      }
                      void submit(async () => {
                        const created = await request<Championship>(
                          '/admin/championships',
                          {
                            name: data.get('name'),
                            type: data.get('type'),
                            stageKinds,
                          },
                        )
                        await Promise.all([
                          refreshChampionships(),
                          refreshStages(),
                        ])
                        navigate(
                          `/admin/campeonatos/${encodeURIComponent(created.id)}`,
                        )
                      }, form)
                    }}
                  >
                    <label className="flex flex-col gap-3 text-sm font-medium">
                      Nombre del campeonato
                      <input
                        className="input input-bordered h-12 w-full text-base"
                        name="name"
                        placeholder="Ej. Copa de primavera"
                        maxLength={100}
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-3 text-sm font-medium">
                      Tipo de campeonato
                      <select
                        className="select select-bordered h-12 w-full text-base"
                        name="type"
                        defaultValue=""
                        required
                      >
                        <option value="" disabled>
                          Selecciona un tipo
                        </option>
                        <option value="COPA_AMERICA">Copa América</option>
                        <option value="WORLD_CUP">Mundial</option>
                      </select>
                    </label>
                    <fieldset className="space-y-4">
                      <legend className="text-sm font-medium">
                        Etapas (elige al menos una)
                      </legend>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {(['GROUP', 'LEAGUE', 'KNOCKOUT'] as const).map(
                          (kind) => (
                            <label
                              className="border-base-300 hover:border-primary/60 has-checked:border-primary has-checked:bg-primary/10 focus-within:outline-primary flex min-h-20 cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors focus-within:outline-2 focus-within:outline-offset-2"
                              key={kind}
                            >
                              <input
                                className="checkbox checkbox-primary shrink-0"
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
                              <span className="font-medium">
                                {stageLabel(kind)}
                              </span>
                            </label>
                          ),
                        )}
                      </div>
                    </fieldset>
                    <button
                      className="btn btn-primary w-full sm:ml-auto sm:w-auto sm:min-w-52"
                      disabled={busy}
                    >
                      Crear campeonato <Plus className="size-4" />
                    </button>
                  </form>
                </div>
              </section>
            )}
            {championshipView === 'detail' && selectedChampionship && (
              <section className="border-base-300 bg-base-100 space-y-5 rounded-xl border p-5 sm:p-7">
                <div className="space-y-5">
                  <Link
                    className="link link-primary text-sm"
                    to="/admin/campeonatos"
                  >
                    ← Volver a campeonatos
                  </Link>
                  {selectedChampionship && (
                    <>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h4 className="text-lg font-bold">
                            Jugadores y equipos
                          </h4>
                          <Link
                            className="btn btn-primary btn-sm"
                            to={`/admin/partidos?campeonato=${encodeURIComponent(championshipId)}`}
                          >
                            Cargar partidos <ArrowRight className="size-4" />
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
                        className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
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
                        <label className="flex min-w-0 flex-col gap-2">
                          <span className="text-sm font-medium">Jugador</span>
                          <select
                            className="select-bordered select w-full"
                            name="playerId"
                            key={`player-${championshipId}-${selectedRoster.length}`}
                            required
                            defaultValue=""
                          >
                            <option value="" disabled>
                              Selecciona un jugador
                            </option>
                            {availablePlayers.map((player) => (
                              <option key={player.id} value={player.id}>
                                {player.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex min-w-0 flex-col gap-2">
                          <span className="text-sm font-medium">
                            Equipo asignado en este campeonato
                          </span>
                          <select
                            className="select-bordered select w-full"
                            name="teamId"
                            key={`team-${championshipId}-${selectedRoster.length}`}
                            required
                            defaultValue=""
                          >
                            <option value="" disabled>
                              Selecciona un equipo
                            </option>
                            {teams.map((team) => (
                              <option key={team.id} value={team.id}>
                                {team.name}
                              </option>
                            ))}
                          </select>
                        </label>
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
                        <p className="text-warning text-sm">
                          Primero agrega jugadores y equipos en sus respectivas
                          secciones.
                        </p>
                      )}
                      {selectedRoster.length > 0 ? (
                        <ul
                          className="list"
                          aria-label="Plantel del campeonato"
                        >
                          {selectedRoster.map((entry) => (
                            <li
                              className="list-row items-center"
                              key={entry.id}
                            >
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
            )}
            {championshipView === 'detail' && selectedChampionship && (
              <section className="border-base-300 bg-base-100 space-y-5 rounded-xl border p-5 sm:p-7">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">Etapas</h3>
                  <form
                    className="flex flex-wrap gap-3"
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
                          <span className="list-col-grow font-bold">
                            {stageLabel(stage.kind)}
                          </span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-square btn-sm text-error"
                            aria-label={`Eliminar etapa ${stageLabel(stage.kind)}`}
                            disabled={busy}
                            onClick={() => {
                              const warning =
                                stage.kind === 'GROUP'
                                  ? ' Sus grupos también se eliminarán.'
                                  : ''
                              if (
                                !window.confirm(
                                  `¿Eliminar la etapa ${stageLabel(stage.kind)}?${warning} Los partidos conservarán sus resultados, pero quedarán sin etapa ni grupo.`,
                                )
                              )
                                return
                              void submit(async () => {
                                await deleteRequest(`/admin/stages/${stage.id}`)
                                await Promise.all([
                                  refreshStages(),
                                  refreshGroups(),
                                  refreshMatches(),
                                ])
                              })
                            }}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {groupStage && (
                    <div className="border-base-300 bg-base-200/40 space-y-3 rounded-lg border p-4">
                      <h4 className="font-semibold">
                        Grupos de la fase de grupos
                      </h4>
                      <form
                        className="flex flex-wrap gap-3"
                        onSubmit={(event) => {
                          event.preventDefault()
                          const form = event.currentTarget
                          const name = new FormData(form).get('name')
                          void submit(async () => {
                            await request('/admin/groups', {
                              stageId: groupStage.id,
                              name,
                            })
                            await refreshGroups()
                          }, form)
                        }}
                      >
                        <input
                          className="input input-bordered w-36"
                          name="name"
                          maxLength={30}
                          placeholder="A, B, C…"
                          aria-label="Nombre del grupo"
                          required
                        />
                        <button className="btn btn-outline" disabled={busy}>
                          Agregar grupo <Plus className="size-4" />
                        </button>
                      </form>
                      <p className="text-base-content/60 text-sm">
                        {groupsForStage(groups, groupStage.id)
                          .map((group) => `Grupo ${group.name}`)
                          .join(' · ') || 'Todavía no hay grupos.'}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}
            {championshipView === 'detail' &&
              !selectedChampionship &&
              !loadingChampionships && (
                <section className="border-base-300 bg-base-100 rounded-xl border p-6">
                  <p className="font-semibold">
                    No encontramos este campeonato.
                  </p>
                  <Link
                    className="link link-primary mt-3 inline-block"
                    to="/admin/campeonatos"
                  >
                    Ver campeonatos
                  </Link>
                </section>
              )}
          </>
        )}

        {page === 'matches' && !championshipId && (
          <section className="space-y-5">
            <p className="text-base-content/60 text-sm">
              {championships.length}{' '}
              {championships.length === 1 ? 'campeonato' : 'campeonatos'}
            </p>
            {loadingChampionships || loadingStages ? (
              <p className="text-base-content/60 py-8 text-sm">
                Cargando campeonatos…
              </p>
            ) : championships.length === 0 ? (
              <div className="border-base-300 bg-base-100 rounded-xl border px-5 py-9">
                <Trophy
                  className="text-primary mb-3 size-8"
                  aria-hidden="true"
                />
                <p className="font-semibold">Todavía no hay campeonatos.</p>
                <Link
                  className="link link-primary mt-3 inline-block"
                  to="/admin/campeonatos/nuevo"
                >
                  Crear un campeonato
                </Link>
              </div>
            ) : (
              <ul className="space-y-3" aria-label="Campeonatos con partidos">
                {championships.map((item) => {
                  const matchCount = matches.filter(
                    (match) => match.championship.id === item.id,
                  ).length
                  const championshipStages = stages.filter(
                    (stage) => stage.championshipId === item.id,
                  )
                  return (
                    <li
                      key={item.id}
                      className="border-base-300 bg-base-100 flex flex-col gap-4 rounded-xl border px-5 py-4 sm:flex-row sm:items-center"
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center">
                        <div className="bg-base-200 text-primary grid size-12 shrink-0 place-items-center rounded-lg">
                          <Trophy className="size-7" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="truncate font-bold">{item.name}</h4>
                          <p className="text-primary mt-0.5 text-sm">
                            {championshipStages.length
                              ? championshipStages
                                  .map((stage) => stageLabel(stage.kind))
                                  .join(' · ')
                              : 'Sin etapas'}
                          </p>
                          <p className="text-base-content/60 mt-1 flex items-center gap-1.5 text-xs">
                            <Swords className="size-3.5" aria-hidden="true" />
                            {matchCount}{' '}
                            {matchCount === 1 ? 'partido' : 'partidos'}
                          </p>
                        </div>
                      </div>
                      <Link
                        className="btn btn-primary w-full sm:w-auto sm:min-w-36"
                        to={`/admin/partidos?campeonato=${encodeURIComponent(item.id)}`}
                        aria-label={`Ver partidos de ${item.name}`}
                      >
                        Ver partidos
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )}

        {page === 'matches' &&
          championshipId &&
          !selectedChampionship &&
          !loadingChampionships && (
            <section className="border-base-300 bg-base-100 rounded-xl border p-6">
              <p className="font-semibold">No encontramos este campeonato.</p>
              <Link
                className="link link-primary mt-3 inline-block"
                to="/admin/partidos"
              >
                Ver campeonatos
              </Link>
            </section>
          )}

        {page === 'matches' && selectedChampionship && (
          <>
            <Link className="link link-primary text-sm" to="/admin/partidos">
              ← Volver a campeonatos
            </Link>
            <dialog
              ref={registerMatchDialogRef}
              className="modal"
              aria-labelledby="register-match-title"
              onCancel={(event) => {
                if (busy) event.preventDefault()
              }}
              onClose={() => setError('')}
              onClick={(event) => {
                if (event.target === event.currentTarget && !busy)
                  registerMatchDialogRef.current?.close()
              }}
            >
              <div className="modal-box max-w-4xl">
                <div className="flex items-center justify-between gap-4">
                  <h3 id="register-match-title" className="text-xl font-bold">
                    Registrar un partido
                  </h3>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={busy}
                    autoFocus
                    onClick={() => registerMatchDialogRef.current?.close()}
                  >
                    Cerrar
                  </button>
                </div>
                {!canRecord && (
                  <p className="text-warning mt-3 text-sm">
                    Este campeonato necesita al menos dos jugadores inscritos y
                    sus equipos asignados.
                  </p>
                )}
                {error && (
                  <p className="text-error mt-3 text-sm" role="alert">
                    {error}
                  </p>
                )}
                <form
                  className="space-y-6 px-4"
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
                        groupId: data.get('groupId') || null,
                        knockoutRound: data.get('knockoutRound')
                          ? Number(data.get('knockoutRound'))
                          : null,
                        knockoutSlot: data.get('knockoutSlot')
                          ? Number(data.get('knockoutSlot'))
                          : null,
                        homePlayerId: home.playerId,
                        awayPlayerId: away.playerId,
                        homeTeamId: home.teamId,
                        awayTeamId: away.teamId,
                        homeScore: Number(data.get('homeScore')),
                        awayScore: Number(data.get('awayScore')),
                      })
                      await refreshMatches()
                      resetMatchFormKeepingContext(form)
                      registerMatchDialogRef.current?.close()
                    })
                  }}
                >
                  <div
                    className={`grid gap-4 md:grid-cols-2 ${matchStage?.kind === 'GROUP' ? 'lg:grid-cols-3' : ''}`}
                  >
                    <label className="flex min-w-0 flex-col gap-2">
                      <span className="text-sm font-medium">
                        Etapa (opcional)
                      </span>
                      <select
                        className="select-bordered select w-full"
                        name="stageId"
                        key={championshipId}
                        value={effectiveMatchStageId}
                        onChange={(event) => {
                          setMatchStageId(event.target.value)
                          setMatchRound('')
                        }}
                      >
                        <option value="">Sin etapa</option>
                        {selectedStages.map((stage) => (
                          <option key={stage.id} value={stage.id}>
                            {stageLabel(stage.kind)}
                          </option>
                        ))}
                      </select>
                    </label>
                    {matchStage?.kind === 'GROUP' && (
                      <label className="flex min-w-0 flex-col gap-2">
                        <span className="text-sm font-medium">Grupo</span>
                        <select
                          className="select select-bordered w-full"
                          name="groupId"
                          key={effectiveMatchStageId}
                          required
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Selecciona un grupo
                          </option>
                          {groupsForStage(groups, effectiveMatchStageId).map(
                            (group) => (
                              <option key={group.id} value={group.id}>
                                Grupo {group.name}
                              </option>
                            ),
                          )}
                        </select>
                      </label>
                    )}
                    {matchStage?.kind === 'KNOCKOUT' && (
                      <>
                        <label className="flex min-w-0 flex-col gap-2">
                          <span className="text-sm font-medium">Ronda</span>
                          <select
                            className="select select-bordered w-full"
                            name="knockoutRound"
                            value={matchRound}
                            onChange={(event) =>
                              setMatchRound(event.target.value)
                            }
                            required
                          >
                            <option value="" disabled>
                              Selecciona una ronda
                            </option>
                            {KNOCKOUT_ROUNDS.map((round) => (
                              <option key={round} value={round}>
                                {knockoutRoundLabel(round)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex min-w-0 flex-col gap-2">
                          <span className="text-sm font-medium">Cruce</span>
                          <select
                            className="select select-bordered w-full"
                            name="knockoutSlot"
                            key={`${effectiveMatchStageId}-${matchRound}`}
                            defaultValue=""
                            required
                            disabled={!matchRound}
                          >
                            <option value="" disabled>
                              Selecciona un cruce
                            </option>
                            {knockoutSlots(Number(matchRound)).map((slot) => {
                              const occupied = matches.some(
                                (entry) =>
                                  entry.stage?.id === effectiveMatchStageId &&
                                  entry.knockoutRound === Number(matchRound) &&
                                  entry.knockoutSlot === slot,
                              )
                              return (
                                <option
                                  key={slot}
                                  value={slot}
                                  disabled={occupied}
                                >
                                  Cruce {slot}
                                  {occupied ? ' · ocupado' : ''}
                                </option>
                              )
                            })}
                          </select>
                        </label>
                      </>
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {(
                      [
                        ['Local', 'home'],
                        ['Visitante', 'away'],
                      ] as const
                    ).map(([label, prefix]) => (
                      <div
                        className="border-base-300 bg-base-100 space-y-4 rounded-xl border p-5"
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
                  </div>
                  <div className="flex justify-end">
                    <button
                      className="btn btn-primary w-full sm:w-auto"
                      disabled={busy || !canRecord}
                    >
                      Guardar partido <ArrowRight className="size-4" />
                    </button>
                  </div>
                </form>
              </div>
            </dialog>
            <section className="border-base-300 space-y-4 border-t pt-7">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4">
                <h3 className="text-xl font-bold">Partidos registrados</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-base-content/60 text-sm">
                    {visibleMatches.length}{' '}
                    {visibleMatches.length === 1 ? 'partido' : 'partidos'}
                  </span>
                  <button
                    ref={registerMatchDialogTrigger}
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => registerMatchDialogRef.current?.showModal()}
                  >
                    <Plus className="size-4" /> Registrar partido
                  </button>
                </div>
              </div>
              {visibleMatches.length === 0 ? (
                <p className="text-base-content/60 px-4 py-6 text-sm">
                  Todavía no hay partidos registrados.
                </p>
              ) : (
                <div className="space-y-6">
                  {matchSections.map((section, index) => (
                    <section
                      key={section.key}
                      aria-labelledby={`match-section-title-${index}`}
                    >
                      <h4
                        id={`match-section-title-${index}`}
                        className="text-base-content/70 mb-3 text-sm font-semibold"
                      >
                        {section.title}
                      </h4>
                      <ul
                        className="space-y-3"
                        aria-label={`Partidos: ${section.title}`}
                      >
                        {section.matches.map((match) => (
                          <li
                            key={match.id}
                            className="border-base-300 bg-base-100 flex flex-col gap-4 rounded-xl border px-5 py-4 sm:flex-row sm:items-center"
                          >
                            <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center">
                              <div className="bg-base-200 text-primary grid size-12 shrink-0 place-items-center rounded-lg">
                                <Swords className="size-7" aria-hidden="true" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="truncate font-bold">
                                  {match.homePlayer.name}{' '}
                                  <span className="text-base-content/40 font-normal">
                                    contra
                                  </span>{' '}
                                  {match.awayPlayer.name}
                                </h4>
                                {match.knockoutSlot && (
                                  <p className="text-base-content/50 mt-0.5 text-xs">
                                    Cruce {match.knockoutSlot}
                                  </p>
                                )}
                                <p className="text-base-content/60 mt-1 text-xs">
                                  {match.homeTeam.name} · {match.awayTeam.name}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-3 sm:justify-end">
                              <span className="text-xl font-black tabular-nums">
                                {match.homeScore} — {match.awayScore}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-square btn-sm"
                                  aria-label={`Editar partido de ${match.homePlayer.name} contra ${match.awayPlayer.name}`}
                                  disabled={busy}
                                  onClick={() => changeEditMatchDialog(match)}
                                >
                                  <Pencil className="size-4" />
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
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
                            groupId: data.get('groupId') || null,
                            knockoutRound: data.get('knockoutRound')
                              ? Number(data.get('knockoutRound'))
                              : null,
                            knockoutSlot: data.get('knockoutSlot')
                              ? Number(data.get('knockoutSlot'))
                              : null,
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
                          value={editStageId}
                          onChange={(event) => {
                            setEditStageId(event.target.value)
                            setEditMatchRound('')
                          }}
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
                      {editStage?.kind === 'GROUP' && (
                        <label className="flex flex-col gap-2">
                          <span className="text-sm font-medium">Grupo</span>
                          <select
                            className="select select-bordered w-full"
                            name="groupId"
                            key={`${matchToEdit.id}-${editStageId}`}
                            defaultValue={
                              matchToEdit.stage?.id === editStageId
                                ? (matchToEdit.group?.id ?? '')
                                : ''
                            }
                            required
                          >
                            <option value="" disabled>
                              Selecciona un grupo
                            </option>
                            {groupsForStage(groups, editStageId).map(
                              (group) => (
                                <option key={group.id} value={group.id}>
                                  Grupo {group.name}
                                </option>
                              ),
                            )}
                          </select>
                        </label>
                      )}
                      {editStage?.kind === 'KNOCKOUT' && (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="flex flex-col gap-2">
                            <span className="text-sm font-medium">Ronda</span>
                            <select
                              className="select select-bordered w-full"
                              name="knockoutRound"
                              value={editMatchRound}
                              onChange={(event) =>
                                setEditMatchRound(event.target.value)
                              }
                            >
                              <option value="">Sin asignar</option>
                              {KNOCKOUT_ROUNDS.map((round) => (
                                <option key={round} value={round}>
                                  {knockoutRoundLabel(round)}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="flex flex-col gap-2">
                            <span className="text-sm font-medium">Cruce</span>
                            <select
                              className="select select-bordered w-full"
                              name="knockoutSlot"
                              key={`${matchToEdit.id}-${editMatchRound}`}
                              defaultValue={
                                matchToEdit.knockoutRound ===
                                Number(editMatchRound)
                                  ? (matchToEdit.knockoutSlot ?? '')
                                  : ''
                              }
                              required={Boolean(editMatchRound)}
                              disabled={!editMatchRound}
                            >
                              <option
                                value=""
                                disabled={Boolean(editMatchRound)}
                              >
                                {editMatchRound
                                  ? 'Selecciona un cruce'
                                  : 'Sin asignar'}
                              </option>
                              {knockoutSlots(Number(editMatchRound)).map(
                                (slot) => {
                                  const occupied = matches.some(
                                    (entry) =>
                                      entry.id !== matchToEdit.id &&
                                      entry.stage?.id === editStageId &&
                                      entry.knockoutRound ===
                                        Number(editMatchRound) &&
                                      entry.knockoutSlot === slot,
                                  )
                                  return (
                                    <option
                                      key={slot}
                                      value={slot}
                                      disabled={occupied}
                                    >
                                      Cruce {slot}
                                      {occupied ? ' · ocupado' : ''}
                                    </option>
                                  )
                                },
                              )}
                            </select>
                          </label>
                        </div>
                      )}
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
                      <div className="modal-action flex-wrap justify-between gap-3">
                        <button
                          type="button"
                          className="btn btn-error btn-outline"
                          aria-label={`Eliminar partido de ${matchToEdit.homePlayer.name} contra ${matchToEdit.awayPlayer.name}`}
                          disabled={busy}
                          onClick={() => changeMatchDialog(matchToEdit)}
                        >
                          <Trash2 className="size-4" /> Eliminar partido
                        </button>
                        <div className="flex justify-end gap-2">
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
                            matchDialogTrigger.current =
                              registerMatchDialogTrigger.current
                            changeMatchDialog(null)
                            changeEditMatchDialog(null)
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
