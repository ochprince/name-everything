/** Shared stage door / list-row materials (A×B system). Rose is status accent only. */

export type StageMaterial = 'day' | 'cobalt' | 'outline' | 'progress'

export const stageDoorShell =
  'flex min-h-[7.5rem] w-full items-center gap-4 rounded-2xl px-5 py-4 text-left transition-[filter,border-color] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

export const stageListShell =
  'flex w-full min-h-[8.75rem] items-center gap-3 rounded-2xl px-4 py-4 text-left transition-[filter,border-color] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

const materialClass: Record<StageMaterial, string> = {
  day: 'bg-day text-cyc hover:brightness-105 active:brightness-95 focus-visible:outline-cyc',
  cobalt:
    'bg-cobalt text-day shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:brightness-110 active:brightness-95 focus-visible:outline-day',
  outline:
    'bg-gradient-to-r from-[#f3eee3] via-[#e5d9b5] to-[#cbb87a] p-px text-day focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e5d9b5]',
  progress:
    'bg-day text-cyc hover:brightness-105 active:brightness-95 focus-visible:outline-cyc',
}

export function stageMaterialClass(material: StageMaterial): string {
  return materialClass[material]
}

/** Champagne gradient frame for home practice doors. */
export const framedDoorOuter =
  'block w-full min-h-[7.5rem] rounded-2xl bg-gradient-to-r from-[#f3eee3] via-[#e5d9b5] to-[#cbb87a] p-px text-left text-day transition-[filter] duration-200 ease-out hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e5d9b5]'

/** Inner fill for day doors inside the champagne frame. */
export const dayDoorInner =
  'flex h-full w-full items-center gap-4 rounded-[0.9rem] bg-day px-5 py-4 text-cyc ring-1 ring-[#e5d9b5]'

/** Inner fill for outline (champagne frame) doors — apply on child or use with outlineFrame. */
export const outlineDoorInner =
  'flex h-full w-full items-center gap-4 rounded-[0.9rem] bg-cyc px-5 py-4'

/** Inner fill for cobalt doors inside the champagne frame. */
export const cobaltDoorInner =
  'flex h-full w-full items-center gap-4 rounded-[0.9rem] bg-cobalt px-5 py-4 text-day shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'

/** Chapter index 0 → day, 1 → cobalt, 2 → day… (by display order). */
export function chapterListMaterial(chapterIndex: number): 'day' | 'cobalt' {
  return chapterIndex % 2 === 0 ? 'day' : 'cobalt'
}

export function secondaryOnMaterial(material: StageMaterial): string {
  if (material === 'day' || material === 'progress') return 'text-cyc/60'
  if (material === 'cobalt') return 'text-day/75'
  return 'text-day/55'
}
