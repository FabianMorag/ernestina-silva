export function resetMatchFormKeepingContext(form: HTMLFormElement) {
  const championship = form.elements.namedItem(
    'championshipId',
  ) as HTMLSelectElement | null
  const stage = form.elements.namedItem('stageId') as HTMLSelectElement | null
  const group = form.elements.namedItem('groupId') as HTMLSelectElement | null
  const knockoutRound = form.elements.namedItem(
    'knockoutRound',
  ) as HTMLSelectElement | null
  const knockoutSlot = form.elements.namedItem(
    'knockoutSlot',
  ) as HTMLSelectElement | null
  const championshipId = championship?.value
  const stageId = stage?.value
  const groupId = group?.value
  const round = knockoutRound?.value
  const slot = knockoutSlot?.value

  form.reset()

  if (championship && championshipId !== undefined)
    championship.value = championshipId
  if (stage && stageId !== undefined) stage.value = stageId
  if (group && groupId !== undefined) group.value = groupId
  if (knockoutRound && round !== undefined) knockoutRound.value = round
  if (knockoutSlot && slot !== undefined) knockoutSlot.value = slot
}
