import { useState, type FormEvent } from 'react'
import { ArrowRight, LogOut, Plus, ShieldCheck, Swords, Trophy, Users } from 'lucide-react'
import useSWR, { useSWRConfig } from 'swr'
import { adminPageForPath, rosterForChampionship, unassignedPlayers, type AdminPage as AdminSection } from './admin-navigation.ts'
import { PublicPage } from './PublicPage.tsx'
import { pageForPath } from './routes.ts'
import { signOut } from './session.ts'
import { patchRequest, request, stageLabel, type Item, type Match, type Participant, type Player, type Stage } from './tournament-api.ts'

const adminLinks = [
  { page: 'players', href: '/admin/jugadores', label: 'Jugadores', Icon: Users },
  { page: 'teams', href: '/admin/equipos', label: 'Equipos', Icon: Swords },
  { page: 'championships', href: '/admin/campeonatos', label: 'Campeonatos', Icon: Trophy },
  { page: 'matches', href: '/admin/partidos', label: 'Partidos', Icon: Swords },
] as const

const pageIntro = {
  players: { title: 'Jugadores', description: 'Registrá jugadores y editá sus nombres y títulos.' },
  teams: { title: 'Equipos', description: 'Creá el catálogo de equipos disponibles para los campeonatos.' },
  championships: { title: 'Campeonatos', description: 'Creá un campeonato y elegí qué jugadores participan y con qué equipo.' },
  matches: { title: 'Partidos', description: 'Cargá resultados solo entre jugadores inscritos en el campeonato.' },
  'not-found': { title: 'Página no encontrada', description: 'Esta sección de administración no existe.' },
} as const

function AdminPage({ page }: { page: AdminSection }) {
  const { mutate: mutateCache } = useSWRConfig()
  const { data: user, mutate: refreshUser, isLoading: checkingUser } = useSWR<{ username: string }>('/auth/me', request, { shouldRetryOnError: false })
  const signedIn = Boolean(user)
  const { data: players = [], mutate: refreshPlayers } = useSWR<Player[]>(signedIn ? '/admin/players' : null, request)
  const { data: teams = [], mutate: refreshTeams } = useSWR<Item[]>(signedIn ? '/admin/teams' : null, request)
  const { data: championships = [], mutate: refreshChampionships } = useSWR<Item[]>(signedIn ? '/admin/championships' : null, request)
  const { data: stages = [], mutate: refreshStages } = useSWR<Stage[]>(signedIn ? '/admin/stages' : null, request)
  const { data: matches = [], mutate: refreshMatches } = useSWR<Match[]>(signedIn ? '/admin/matches' : null, request)
  const { data: participants = [], mutate: refreshParticipants } = useSWR<Participant[]>(signedIn ? '/admin/participants' : null, request)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [championshipId, setChampionshipId] = useState(() => new URLSearchParams(window.location.search).get('campeonato') ?? '')

  async function submit(action: () => Promise<unknown>, form?: HTMLFormElement) {
    setError('')
    setBusy(true)
    try {
      await action()
      form?.reset()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Ocurrió un error. Intentá nuevamente.')
    } finally {
      setBusy(false)
    }
  }

  if (checkingUser) return <main className="grid min-h-screen place-items-center text-base-content/60">Cargando administración…</main>

  if (!signedIn) return (
    <main className="grid min-h-screen place-items-center bg-base-200 px-4">
      <form className="card w-full max-w-md border border-base-300 bg-base-100 shadow-xl" onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        void submit(async () => {
          await request('/auth/login', { username: data.get('username'), password: data.get('password') })
          await refreshUser()
        })
      }}>
        <div className="card-body gap-5">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-content"><ShieldCheck /></div>
          <div><p className="text-sm font-semibold uppercase tracking-widest text-primary">Ernestina Silva</p><h1 className="mt-2 text-3xl font-bold">Administración del campeonato</h1><p className="mt-2 text-base-content/60">Ingresá para administrar jugadores, equipos, campeonatos y partidos.</p><a className="link link-primary mt-2 inline-block text-sm" href="/">Volver al campeonato</a></div>
          <label className="form-control"><span className="label-text mb-2">Usuario</span><input className="input input-bordered w-full" name="username" autoComplete="username" required /></label>
          <label className="form-control"><span className="label-text mb-2">Contraseña</span><input className="input input-bordered w-full" name="password" type="password" autoComplete="current-password" required /></label>
          {error && <p className="text-sm text-error" role="alert">{error}</p>}
          <button className="btn btn-primary mt-2" disabled={busy}>Ingresar <ArrowRight className="size-4" /></button>
          {import.meta.env.DEV && <p className="text-xs text-base-content/50">Solo para desarrollo local: admin / admin</p>}
        </div>
      </form>
    </main>
  )

  const selectedChampionship = championships.find((item) => item.id === championshipId)
  const selectedRoster = rosterForChampionship(participants, championshipId)
  const availablePlayers = unassignedPlayers(players, participants, championshipId)
  const selectedStages = stages.filter((stage) => stage.championshipId === championshipId)
  const visibleMatches = championshipId ? matches.filter((match) => match.championship.id === championshipId) : matches
  const canRecord = selectedRoster.length >= 2

  function createName(event: FormEvent<HTMLFormElement>, path: string, refresh: () => Promise<unknown>) {
    event.preventDefault()
    const form = event.currentTarget
    const name = new FormData(form).get('name')
    void submit(async () => { await request(path, { name }); await refresh() }, form)
  }

  return (
    <main className="min-h-screen bg-base-200 text-base-content">
      <header className="border-b border-base-300 bg-base-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-content"><Trophy className="size-5" /></div><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Ernestina Silva</p><h1 className="text-xl font-bold">Administración</h1></div></div>
          <div className="flex items-center gap-2"><a className="btn btn-ghost btn-sm" href="/">Ver campeonato</a><button className="btn btn-ghost btn-sm" onClick={() => void submit(() => signOut(() => request('/auth/logout', {}), () => mutateCache(() => true, undefined, { revalidate: false })))}><LogOut className="size-4" /> Cerrar sesión</button></div>
        </div>
        <nav aria-label="Secciones de administración" className="mx-auto flex max-w-6xl flex-wrap gap-2 px-5 pb-4">
          {adminLinks.map(({ page: section, href, label, Icon }) => <a key={section} href={href} aria-current={page === section ? 'page' : undefined} className={`btn btn-sm ${page === section ? 'btn-primary' : 'btn-ghost'}`}><Icon className="size-4" /> {label}</a>)}
        </nav>
      </header>
      <div className="mx-auto max-w-6xl space-y-7 px-5 py-9">
        <div><p className="text-sm font-medium text-primary">Archivo de partidos</p><h2 className="mt-1 text-3xl font-bold">{pageIntro[page].title}</h2><p className="mt-2 text-base-content/60">{pageIntro[page].description}</p></div>
        {error && <div className="alert alert-error" role="alert">{error}<button className="btn btn-ghost btn-sm" onClick={() => setError('')}>Cerrar</button></div>}

        {page === 'players' && <>
          <section className="card border border-base-300 bg-base-100"><div className="card-body"><div className="flex items-center gap-2"><Users className="size-5 text-primary" /><h3 className="card-title text-lg">Nuevo jugador</h3><span className="badge badge-ghost ml-auto">{players.length}</span></div><form className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); void submit(async () => { await request('/admin/players', { name: data.get('name'), title: data.get('title') }); await refreshPlayers() }, form) }}><input className="input input-bordered w-full" name="name" placeholder="Nombre" maxLength={100} required /><input className="input input-bordered w-full" name="title" placeholder="Título (opcional)" maxLength={100} /><button className="btn btn-primary" disabled={busy}><Plus className="size-4" /> Agregar</button></form></div></section>
          <section className="card border border-base-300 bg-base-100"><div className="card-body gap-4"><h3 className="card-title text-lg">Jugadores registrados</h3><p className="text-sm text-base-content/60">Podés cambiar sus nombres y títulos sin alterar sus partidos.</p><div className="grid gap-3 md:grid-cols-2">{players.map((player) => <form key={player.id} className="grid gap-2 rounded-xl border border-base-300 p-3" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); void submit(async () => { await patchRequest(`/admin/players/${player.id}`, { name: data.get('name'), title: data.get('title') }); await refreshPlayers() }) }}><label className="form-control"><span className="label-text mb-1">Nombre</span><input className="input input-bordered w-full" name="name" defaultValue={player.name} maxLength={100} required /></label><label className="form-control"><span className="label-text mb-1">Título (opcional)</span><input className="input input-bordered w-full" name="title" defaultValue={player.title ?? ''} maxLength={100} /></label><button className="btn btn-outline btn-sm justify-self-start" disabled={busy}>Guardar cambios</button></form>)}</div>{players.length === 0 && <p className="text-sm text-base-content/60">Todavía no hay jugadores.</p>}</div></section>
        </>}

        {page === 'teams' && <section className="card border border-base-300 bg-base-100"><div className="card-body gap-4"><div className="flex items-center gap-2"><Swords className="size-5 text-primary" /><h3 className="card-title text-lg">Catálogo de equipos</h3><span className="badge badge-ghost ml-auto">{teams.length}</span></div><form className="flex flex-wrap gap-2" onSubmit={(event) => createName(event, '/admin/teams', refreshTeams)}><input className="input input-bordered min-w-0 flex-1" name="name" placeholder="Nombre del equipo" maxLength={100} required /><button className="btn btn-primary" disabled={busy}><Plus className="size-4" /> Agregar equipo</button></form><div className="flex flex-wrap gap-2">{teams.map((team) => <span className="badge badge-outline badge-lg" key={team.id}>{team.name}</span>)}</div>{teams.length === 0 && <p className="text-sm text-base-content/60">Todavía no hay equipos. Después podrás asignarlos a cada campeonato.</p>}</div></section>}

        {page === 'championships' && <>
          <section className="card border border-base-300 bg-base-100"><div className="card-body gap-4"><div className="flex items-center gap-2"><Trophy className="size-5 text-primary" /><h3 className="card-title text-lg">Crear campeonato</h3><span className="badge badge-ghost ml-auto">{championships.length}</span></div><form className="flex flex-wrap gap-2" onSubmit={(event) => createName(event, '/admin/championships', refreshChampionships)}><input className="input input-bordered min-w-0 flex-1" name="name" placeholder="Nombre del campeonato" maxLength={100} required /><button className="btn btn-primary" disabled={busy}><Plus className="size-4" /> Crear</button></form></div></section>
          <section className="card border border-base-300 bg-base-100"><div className="card-body gap-4"><h3 className="card-title text-lg">Plantel del campeonato</h3><p className="text-sm text-base-content/60">Solo los jugadores que agregues acá, con su equipo asignado, podrán disputar sus partidos.</p><label className="form-control max-w-lg"><span className="label-text mb-2">Campeonato</span><select className="select select-bordered w-full" value={championshipId} onChange={(event) => setChampionshipId(event.target.value)}><option value="">Seleccioná un campeonato</option>{championships.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            {selectedChampionship && <><div className="flex flex-wrap items-center gap-3 text-sm text-base-content/70"><span>{selectedRoster.length} {selectedRoster.length === 1 ? 'jugador inscrito' : 'jugadores inscritos'}</span><span>·</span><span>{new Set(selectedRoster.map((entry) => entry.teamId)).size} equipos utilizados</span><a className="link link-primary ml-auto" href={`/admin/partidos?campeonato=${encodeURIComponent(championshipId)}`}>Cargar partidos <ArrowRight className="inline size-4" /></a></div>
              <form className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); void submit(async () => { await request('/admin/participants', { championshipId, playerId: data.get('playerId'), teamId: data.get('teamId') }); await refreshParticipants() }, form) }}><select className="select select-bordered w-full" name="playerId" key={`player-${championshipId}-${selectedRoster.length}`} required defaultValue=""><option value="" disabled>Jugador sin inscribir</option>{availablePlayers.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select><select className="select select-bordered w-full" name="teamId" key={`team-${championshipId}-${selectedRoster.length}`} required defaultValue=""><option value="" disabled>Equipo para este campeonato</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select><button className="btn btn-primary" disabled={busy || !availablePlayers.length || !teams.length}><Plus className="size-4" /> Inscribir</button></form>
              {(!players.length || !teams.length) && <p className="text-sm text-warning">Primero agregá jugadores y equipos en sus respectivas secciones.</p>}
              <div className="space-y-2">{selectedRoster.map((entry) => <div className="flex flex-wrap items-center gap-3 rounded-xl border border-base-300 p-3" key={entry.id}><span className="min-w-32 font-semibold">{entry.player.name}</span><form className="flex flex-1 flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); void submit(async () => { await request('/admin/participants', { championshipId, playerId: entry.playerId, teamId: data.get('teamId') }); await refreshParticipants() }) }}><select className="select select-bordered min-w-40 flex-1" name="teamId" key={`${entry.id}-${entry.teamId}`} defaultValue={entry.teamId} aria-label={`Equipo de ${entry.player.name}`}>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select><button className="btn btn-outline btn-sm" disabled={busy}>Cambiar equipo</button></form></div>)}{selectedRoster.length === 0 && <p className="rounded-xl border border-dashed border-base-300 p-5 text-sm text-base-content/60">Este campeonato todavía no tiene jugadores ni equipos asignados.</p>}</div>
            </>}
          </div></section>
          {selectedChampionship && <section className="card border border-base-300 bg-base-100"><div className="card-body gap-4"><h3 className="card-title text-lg">Etapas de {selectedChampionship.name}</h3><p className="text-sm text-base-content/60">Opcional: agregá fases de grupos, liga o eliminación directa.</p><form className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); void submit(async () => { await request('/admin/stages', { name: data.get('name'), kind: data.get('kind'), championshipId }); await refreshStages() }, form) }}><input className="input input-bordered w-full" name="name" placeholder="Nombre de la etapa" maxLength={100} required /><select className="select select-bordered w-full" name="kind" required><option value="GROUP">Grupos</option><option value="LEAGUE">Liga</option><option value="KNOCKOUT">Eliminación directa</option></select><button className="btn btn-outline" disabled={busy}><Plus className="size-4" /> Agregar etapa</button></form><div className="flex flex-wrap gap-2">{selectedStages.map((stage) => <span className="badge badge-outline" key={stage.id}>{stage.name} · {stageLabel(stage.kind)}</span>)}</div></div></section>}
        </>}

        {page === 'matches' && <>
          <section className="card border border-base-300 bg-base-100"><div className="card-body gap-5"><div className="flex items-center gap-2"><Swords className="size-5 text-primary" /><h3 className="card-title text-lg">Registrar un partido</h3></div>{!canRecord && <p className="text-sm text-warning">Seleccioná un campeonato con al menos dos jugadores inscritos y sus equipos asignados.</p>}<form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const home = selectedRoster.find((entry) => entry.playerId === data.get('homePlayerId')); const away = selectedRoster.find((entry) => entry.playerId === data.get('awayPlayerId')); if (!home || !away) { setError('Seleccioná dos jugadores inscritos en el campeonato.'); return } void submit(async () => { await request('/admin/matches', { championshipId, stageId: data.get('stageId') || null, homePlayerId: home.playerId, awayPlayerId: away.playerId, homeTeamId: home.teamId, awayTeamId: away.teamId, homeScore: Number(data.get('homeScore')), awayScore: Number(data.get('awayScore')) }); await refreshMatches() }, form) }}>
            <label className="form-control"><span className="label-text mb-2">Campeonato</span><select className="select select-bordered w-full" name="championshipId" required value={championshipId} onChange={(event) => setChampionshipId(event.target.value)}><option value="" disabled>Seleccioná un campeonato</option>{championships.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="form-control"><span className="label-text mb-2">Etapa (opcional)</span><select className="select select-bordered w-full" name="stageId" key={championshipId}><option value="">Sin etapa</option>{selectedStages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name} · {stageLabel(stage.kind)}</option>)}</select></label>
            {([['Local', 'home'], ['Visitante', 'away']] as const).map(([label, prefix]) => <div className="rounded-xl border border-base-300 p-4" key={prefix}><h4 className="mb-3 font-semibold">{label}</h4><label className="form-control"><span className="label-text mb-2">Jugador · equipo asignado</span><select className="select select-bordered w-full" name={`${prefix}PlayerId`} key={`${prefix}-${championshipId}`} required defaultValue=""><option value="" disabled>Seleccioná un jugador</option>{selectedRoster.map((entry) => <option key={entry.id} value={entry.playerId}>{entry.player.name} · {entry.team.name}</option>)}</select></label><label className="form-control mt-3"><span className="label-text mb-2">Goles</span><input className="input input-bordered w-28" type="number" name={`${prefix}Score`} min="0" step="1" required /></label></div>)}
            <div className="md:col-span-2"><button className="btn btn-primary" disabled={busy || !canRecord}>Guardar partido <ArrowRight className="size-4" /></button></div>
          </form></div></section>
          <section><div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-bold">Partidos registrados</h3><span className="badge badge-outline">{visibleMatches.length}</span></div><div className="space-y-3">{visibleMatches.length === 0 ? <div className="rounded-xl border border-dashed border-base-300 bg-base-100 p-8 text-center text-base-content/60">Todavía no hay partidos registrados.</div> : visibleMatches.map((match) => <article className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-base-300 bg-base-100 p-5" key={match.id}><div><p className="font-semibold">{match.homePlayer.name} <span className="text-base-content/40">contra</span> {match.awayPlayer.name}</p><p className="text-sm text-base-content/60">{match.homeTeam.name} · {match.awayTeam.name}</p><p className="mt-1 text-xs text-base-content/50">{match.championship.name}{match.stage ? ` / ${match.stage.name}` : ''}</p></div><div className="rounded-lg bg-base-200 px-4 py-2 text-xl font-black tabular-nums">{match.homeScore} — {match.awayScore}</div></article>)}</div></section>
        </>}

        {page === 'not-found' && <a className="btn btn-primary" href="/admin/campeonatos">Ir a campeonatos</a>}
      </div>
    </main>
  )
}

function App() {
  const adminPage = adminPageForPath(window.location.pathname)
  const publicPage = pageForPath(window.location.pathname)
  return adminPage ? <AdminPage page={adminPage} /> : <PublicPage page={publicPage === 'admin' ? 'not-found' : publicPage} />
}

export default App
