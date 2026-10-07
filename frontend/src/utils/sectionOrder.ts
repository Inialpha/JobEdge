// Section ordering as data, not as a hardcoded layout.
//
// Contact information and the Summary are always rendered first and cannot be moved.
// Everything else is an entry in an ordered list of section ids. The editor changes the list,
// and the preview (which becomes the PDF) and the DOCX generator read the same list.
//
// This file must stay free of imports so it can be unit tested on its own.

export const SECTION_IDS = ['experience', 'education', 'skills', 'projects', 'certifications', 'awards'] as const

export type SectionId = (typeof SECTION_IDS)[number]

export type MoveDirection = 'up' | 'down'

export const SECTION_LABELS: Record<SectionId, string> = {
  experience: 'Professional Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  awards: 'Awards',
}

// The order every template used before sections became movable.
export const DEFAULT_SECTION_ORDER: readonly SectionId[] = SECTION_IDS

// The Modern template always showed Skills before Education in its sidebar. Keeping that as its
// default means resumes that were never reordered look exactly as they did before.
const TEMPLATE_DEFAULT_ORDER: Record<string, readonly SectionId[]> = {
  modern: ['skills', 'education', 'experience', 'projects', 'certifications', 'awards'],
}

// The Modern template has two columns. These sections live in the sidebar; the rest in the main column.
export const MODERN_SIDEBAR_SECTIONS: readonly SectionId[] = ['skills', 'education']

export const isSectionId = (value: unknown): value is SectionId =>
  typeof value === 'string' && (SECTION_IDS as readonly string[]).includes(value)

/**
 * Turns anything (saved data, old data, garbage) into a complete, valid order:
 * unknown ids and duplicates are dropped and missing sections are appended in default order.
 */
export const normalizeSectionOrder = (order: unknown, fallback: readonly SectionId[] = DEFAULT_SECTION_ORDER): SectionId[] => {
  const result: SectionId[] = []
  if (Array.isArray(order)) {
    for (const id of order) {
      if (isSectionId(id) && !result.includes(id)) result.push(id)
    }
  }
  for (const id of fallback) {
    if (!result.includes(id)) result.push(id)
  }
  return result
}

/** True when the user has chosen an order (an empty or missing list means "use the default"). */
export const hasCustomOrder = (order: unknown): boolean => Array.isArray(order) && order.length > 0

/** The order to render for a template: the user's choice, or that template's default. */
export const getSectionOrder = (order: unknown, template: string = 'classic'): SectionId[] => {
  const fallback = TEMPLATE_DEFAULT_ORDER[template] ?? DEFAULT_SECTION_ORDER
  return hasCustomOrder(order) ? normalizeSectionOrder(order, fallback) : [...fallback]
}

/** Moves one section a step up or down. Returns a new list; moving past either end changes nothing. */
export const moveSection = (order: readonly SectionId[], id: SectionId, direction: MoveDirection): SectionId[] => {
  const next = [...order]
  const from = next.indexOf(id)
  if (from === -1) return next
  const to = direction === 'up' ? from - 1 : from + 1
  if (to < 0 || to >= next.length) return next
  ;[next[from], next[to]] = [next[to], next[from]]
  return next
}
