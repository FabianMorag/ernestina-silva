import { useState, type FormEvent } from 'react'
import { ArrowRight, LogOut, Plus, ShieldCheck, Swords, Trophy, Users } from 'lucide-react'
import useSWR, { useSWRConfig } from 'swr'
import { signOut } from './session.ts'
import { PublicPage } from './PublicPage.tsx'
import { pageForPath } from './routes.ts'
import { patchRequest, request, stageLabel, type Item, type Match, type Participant, type Player, type Stage } from './tournament-api.ts'

function AdminPage() {
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
  const [championshipId, setChampionshipId] = useState('')

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

  function createName(event: FormEvent<HTMLFormElement>, path: string, refresh: () => Promise<unknown>) {
    event.preventDefault()
    const form = event.currentTarget
    const name = String(new FormData(form).get('name') ?? '')
    void submit(async () => {
      await request(path, { name })
      await refresh()
    }, form)
  }

  if (checkingUser) return <main className="grid min-h-screen place-items-center text-base-content/60">Cargando administración…</main>

  if (!signedIn) return (
    <main className="grid min-h-screen place-items-center bg-base-200 px-4">
      <form className="card w-full max-w-md border border-base-300 bg-base-100 shadow-xl" onSubmit={(event) => {
        event.preventDefault()
        const form = event.currentTarget
        const data = new FormData(form)
        void submit(async () => {
          await request('/auth/login', { username: data.get('username'), password: data.get('password') })
          await refreshUser()
        })
      }}>
        <div className="card-body gap-5">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-content"><ShieldCheck /></div>
          <div><p className="text-sm font-semibold uppercase tracking-widest text-primary">Ernestina Silva</p><h1 className="mt-2 text-3xl font-bold">Administración del campeonato</h1><p className="mt-2 text-base-content/60">Ingresá para registrar los partidos históricos.</p><a className="link link-primary mt-2 inline-block text-sm" href="/">Volver al campeonato</a></div>
          <label className="form-control"><span className="label-text mb-2">Usuario</span><input className="input input-bordered w-full" name="username" autoComplete="username" required /></label>
          <label className="form-control"><span className="label-text mb-2">Contraseña</span><input className="input input-bordered w-full" name="password" type="password" autoComplete="current-password" required /></label>
          {error && <p className="text-sm text-error" role="alert">{error}</p>}
          <button className="btn btn-primary mt-2" disabled={busy}>Ingresar <ArrowRight className="size-4" /></button>
          {import.meta.env.DEV && <p className="text-xs text-base-content/50">Solo para desarrollo local: admin / admin</p>}
        </div>
      </form>
    </main>
  )

  const selectedStages = stages.filter((stage) => stage.championshipId === championshipId)
  const selectedParticipants = participants.filter((entry) => entry.championshipId === championshipId)
  const canRecord = selectedParticipants.length >= 2

  return (
    <main className="min-h-screen bg-base-200 text-base-content">
      <header className="border-b border-base-300 bg-base-100"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-content"><Trophy className="size-5" /></div><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Ernestina Silva</p><h1 className="text-xl font-bold">Administración del campeonato</h1></div></div><div className="flex items-center gap-2"><a className="btn btn-ghost btn-sm" href="/">Ver campeonato</a><button className="btn btn-ghost btn-sm" onClick={() => void submit(() => signOut(() => request('/auth/logout', {}), () => mutateCache(() => true, undefined, { revalidate: false })))}><LogOut className="size-4" /> Cerrar sesión</button></div></div></header>
      <div className="mx-auto max-w-6xl space-y-7 px-5 py-9">
        <div><p className="text-sm font-medium text-primary">Archivo de partidos</p><h2 className="mt-1 text-3xl font-bold">Cargá los resultados</h2><p className="mt-2 text-base-content/60">Primero agregá jugadores, equipos y campeonatos; después registrá cada resultado.</p></div>
        {error && <div className="alert alert-error" role="alert">{error}<button className="btn btn-ghost btn-sm" onClick={() => setError('')}>Cerrar</button></div>}
        <div className="grid gap-4 md:grid-cols-3">
          {([['Jugadores', '/admin/players', players, refreshPlayers, Users], ['Equipos', '/admin/teams', teams, refreshTeams, Swords], ['Campeonatos', '/admin/championships', championships, refreshChampionships, Trophy]] as const).map(([title, path, items, refresh, Icon]) => <section className="card border border-base-300 bg-base-100" key={path}><div className="card-body"><div className="flex items-center gap-2"><Icon className="size-5 text-primary" /><h3 className="card-title text-lg">{title}</h3><span className="badge badge-ghost ml-auto">{items.length}</span></div><form className="mt-3 flex gap-2" onSubmit={(event) => createName(event, path, refresh)}><input className="input input-bordered min-w-0 flex-1" name="name" placeholder={`Nuevo registro de ${title.toLowerCase()}`} maxLength={100} required /><button className="btn btn-primary btn-square" aria-label={`Agregar a ${title.toLowerCase()}`} disabled={busy}><Plus className="size-4" /></button></form><p className="min-h-6 text-sm text-base-content/60">{items.length ? items.map((item) => item.name).join(' · ') : 'Todavía no hay registros.'}</p></div></section>)}
        </div>
        <section className="card border border-base-300 bg-base-100"><div className="card-body gap-4"><h3 className="card-title text-lg">Editar jugadores</h3><p className="text-sm text-base-content/60">El título es opcional. Los cambios se reflejan también en las vistas públicas.</p><div className="grid gap-3 md:grid-cols-2">{players.map((player) => <form key={player.id} className="grid gap-2 rounded-xl border border-base-300 p-3" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); void submit(async () => { await patchRequest(`/admin/players/${player.id}`, { name: data.get('name'), title: data.get('title') }); await refreshPlayers(); await refreshParticipants() }) }}><label className="form-control"><span className="label-text mb-1">Nombre</span><input className="input input-bordered w-full" name="name" defaultValue={player.name} maxLength={100} required /></label><label className="form-control"><span className="label-text mb-1">Título (opcional)</span><input className="input input-bordered w-full" name="title" defaultValue={player.title ?? ''} maxLength={100} /></label><button className="btn btn-outline btn-sm justify-self-start" disabled={busy}>Guardar cambios</button></form>)}</div></div></section>
        <section className="card border border-base-300 bg-base-100"><div className="card-body gap-4"><h3 className="card-title text-lg">Equipos por campeonato</h3><p className="text-sm text-base-content/60">Cada jugador utiliza un equipo durante todo el campeonato. Podés cambiarlo antes de registrar su primer partido.</p><form className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); void submit(async () => { await request('/admin/participants', { championshipId: data.get('championshipId'), playerId: data.get('playerId'), teamId: data.get('teamId') }); await refreshParticipants() }) }}><select className="select select-bordered w-full" name="championshipId" required defaultValue=""><option value="" disabled>Campeonato</option>{championships.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select className="select select-bordered w-full" name="playerId" required defaultValue=""><option value="" disabled>Jugador</option>{players.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select className="select select-bordered w-full" name="teamId" required defaultValue=""><option value="" disabled>Equipo</option>{teams.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button className="btn btn-outline" disabled={busy || !championships.length || !players.length || !teams.length}>Asignar equipo</button></form>{participants.length > 0 && <ul className="text-sm text-base-content/70">{participants.map((entry) => <li key={entry.id}>{championships.find((item) => item.id === entry.championshipId)?.name}: {entry.player.name} — {entry.team.name}</li>)}</ul>}</div></section>
        <section className="card border border-base-300 bg-base-100"><div className="card-body"><div className="flex items-center gap-2"><Trophy className="size-5 text-primary" /><h3 className="card-title text-lg">Etapas del campeonato</h3></div><p className="text-sm text-base-content/60">Opcional: agregá etapas de grupos, liga o eliminación directa a un campeonato.</p><form className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); void submit(async () => { await request('/admin/stages', { name: data.get('name'), kind: data.get('kind'), championshipId: data.get('championshipId') }); await refreshStages() }, form) }}><input className="input input-bordered w-full" name="name" placeholder="Nombre de la etapa" maxLength={100} required /><select className="select select-bordered w-full" name="kind" required><option value="GROUP">Grupos</option><option value="LEAGUE">Liga</option><option value="KNOCKOUT">Eliminación directa</option></select><select className="select select-bordered w-full" name="championshipId" required defaultValue=""><option value="" disabled>Campeonato</option>{championships.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button className="btn btn-outline" disabled={busy || !championships.length}><Plus className="size-4" /> Agregar etapa</button></form>{stages.length > 0 && <p className="text-sm text-base-content/60">{stages.map((stage) => `${stage.name} (${stageLabel(stage.kind)})`).join(' · ')}</p>}</div></section>
        <section className="card border border-base-300 bg-base-100"><div className="card-body gap-5"><div className="flex items-center gap-2"><Swords className="size-5 text-primary" /><h3 className="card-title text-lg">Registrar un partido</h3></div>{!canRecord && <p className="text-sm text-warning">Asigná un equipo a dos jugadores del campeonato para registrar partidos.</p>}<form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const home = selectedParticipants.find((entry) => entry.playerId === data.get('homePlayerId')); const away = selectedParticipants.find((entry) => entry.playerId === data.get('awayPlayerId')); if (!home || !away) { setError('Seleccioná dos jugadores con equipos asignados.'); return } void submit(async () => { await request('/admin/matches', { championshipId: data.get('championshipId'), stageId: data.get('stageId') || null, homePlayerId: home.playerId, awayPlayerId: away.playerId, homeTeamId: home.teamId, awayTeamId: away.teamId, homeScore: Number(data.get('homeScore')), awayScore: Number(data.get('awayScore')) }); await refreshMatches() }, form) }}>
          <label className="form-control"><span className="label-text mb-2">Campeonato</span><select className="select select-bordered w-full" name="championshipId" required value={championshipId} onChange={(event) => setChampionshipId(event.target.value)}><option value="" disabled>Seleccioná un campeonato</option>{championships.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="form-control"><span className="label-text mb-2">Etapa (opcional)</span><select className="select select-bordered w-full" name="stageId" key={championshipId}><option value="">Sin etapa</option>{selectedStages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name} · {stageLabel(stage.kind)}</option>)}</select></label>
          {[['Local', 'home'], ['Visitante', 'away']].map(([label, prefix]) => <div className="rounded-xl border border-base-300 p-4" key={prefix}><h4 className="mb-3 font-semibold">{label}</h4><label className="form-control"><span className="label-text mb-2">Jugador · equipo asignado</span><select className="select select-bordered w-full" name={`${prefix}PlayerId`} key={`${prefix}-${championshipId}`} required defaultValue=""><option value="" disabled>Seleccioná un jugador</option>{selectedParticipants.map((entry) => <option key={entry.id} value={entry.playerId}>{entry.player.name} · {entry.team.name}</option>)}</select></label><label className="form-control mt-3"><span className="label-text mb-2">Goles</span><input className="input input-bordered w-28" type="number" name={`${prefix}Score`} min="0" step="1" required /></label></div>)}
          <div className="md:col-span-2"><button className="btn btn-primary" disabled={busy || !canRecord}>Guardar partido <ArrowRight className="size-4" /></button></div>
        </form></div></section>
        <section><div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-bold">Partidos registrados</h3><span className="badge badge-outline">{matches.length}</span></div><div className="space-y-3">{matches.length === 0 ? <div className="rounded-xl border border-dashed border-base-300 bg-base-100 p-8 text-center text-base-content/60">Todavía no hay partidos registrados.</div> : matches.map((match) => <article className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-base-300 bg-base-100 p-5" key={match.id}><div><p className="font-semibold">{match.homePlayer.name} <span className="text-base-content/40">contra</span> {match.awayPlayer.name}</p><p className="text-sm text-base-content/60">{match.homeTeam.name} · {match.awayTeam.name}</p><p className="mt-1 text-xs text-base-content/50">{match.championship.name}{match.stage ? ` / ${match.stage.name}` : ''}</p></div><div className="rounded-lg bg-base-200 px-4 py-2 text-xl font-black tabular-nums">{match.homeScore} — {match.awayScore}</div></article>)}</div></section>
      </div>
    </main>
  )
}

function App() {
  const page = pageForPath(window.location.pathname)
  return page === 'admin' ? <AdminPage /> : <PublicPage page={page} />
}

export default App
