export function resetMatchFormKeepingContext(form: HTMLFormElement) {
  const championship = form.elements.namedItem(
    'championshipId',
  ) as HTMLSelectElement | null
  const stage = form.elements.namedItem('stageId') as HTMLSelectElement | null
  const group = form.elements.namedItem('groupId') as HTMLSelectElement | null
  const championshipId = championship?.value
  const stageId = stage?.value
  const groupId = group?.value

  form.reset()

  if (championship && championshipId !== undefined)
    championship.value = championshipId
  if (stage && stageId !== undefined) stage.value = stageId
  if (group && groupId !== undefined) group.value = groupId
}
