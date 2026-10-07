// Run with: npm run test:unit   (Node 22.6+; uses Node's built-in test runner, no extra packages)
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_SECTION_ORDER,
  SECTION_IDS,
  getSectionOrder,
  hasCustomOrder,
  moveSection,
  normalizeSectionOrder,
} from '../src/utils/sectionOrder.ts'

test('default order matches what every template rendered before', () => {
  assert.deepEqual([...DEFAULT_SECTION_ORDER], ['experience', 'education', 'skills', 'projects', 'certifications', 'awards'])
})

test('contact and summary are not movable sections', () => {
  assert.ok(!SECTION_IDS.includes('summary'))
  assert.ok(!SECTION_IDS.includes('contact'))
  assert.ok(!SECTION_IDS.includes('personalInformation'))
})

test('normalize drops unknown ids and duplicates and appends missing sections', () => {
  assert.deepEqual(normalizeSectionOrder(['awards', 'bogus', 'awards', 'skills', 42, null]), [
    'awards', 'skills', 'experience', 'education', 'projects', 'certifications',
  ])
})

test('normalize copes with non-arrays', () => {
  for (const bad of [undefined, null, 'skills', 7, {}]) {
    assert.deepEqual(normalizeSectionOrder(bad), [...DEFAULT_SECTION_ORDER])
  }
})

test('every normalized order contains each section exactly once', () => {
  const result = normalizeSectionOrder(['projects', 'projects', 'awards'])
  assert.equal(result.length, SECTION_IDS.length)
  assert.equal(new Set(result).size, SECTION_IDS.length)
})

test('an empty or missing saved order means "use the default"', () => {
  assert.equal(hasCustomOrder(undefined), false)
  assert.equal(hasCustomOrder([]), false)
  assert.equal(hasCustomOrder(['skills']), true)
  assert.deepEqual(getSectionOrder([], 'classic'), [...DEFAULT_SECTION_ORDER])
  assert.deepEqual(getSectionOrder(undefined), [...DEFAULT_SECTION_ORDER])
})

test('modern keeps its own default until the user reorders', () => {
  assert.deepEqual(getSectionOrder(undefined, 'modern').slice(0, 2), ['skills', 'education'])
  assert.deepEqual(getSectionOrder([], 'minimal'), [...DEFAULT_SECTION_ORDER])
})

test('a custom order is honoured by every template', () => {
  const custom = ['awards', 'projects']
  for (const template of ['classic', 'modern', 'minimal', 'creative']) {
    const order = getSectionOrder(custom, template)
    assert.deepEqual(order.slice(0, 2), ['awards', 'projects'])
    assert.equal(new Set(order).size, SECTION_IDS.length)
  }
})

test('moveSection moves one step and does not mutate its input', () => {
  const start = [...DEFAULT_SECTION_ORDER]
  const moved = moveSection(start, 'skills', 'up')
  assert.deepEqual(moved, ['experience', 'skills', 'education', 'projects', 'certifications', 'awards'])
  assert.deepEqual(start, [...DEFAULT_SECTION_ORDER])
  assert.deepEqual(moveSection(moved, 'skills', 'down'), start)
})

test('moveSection is a no-op at either end', () => {
  const start = [...DEFAULT_SECTION_ORDER]
  assert.deepEqual(moveSection(start, 'experience', 'up'), start)
  assert.deepEqual(moveSection(start, 'awards', 'down'), start)
})

test('moveSection ignores unknown ids', () => {
  assert.deepEqual(moveSection([...DEFAULT_SECTION_ORDER], 'nope', 'up'), [...DEFAULT_SECTION_ORDER])
})

test('moving every section to the top one by one never loses or duplicates a section', () => {
  let order = [...DEFAULT_SECTION_ORDER]
  for (const id of [...SECTION_IDS].reverse()) {
    while (order.indexOf(id) > 0) order = moveSection(order, id, 'up')
    assert.equal(new Set(order).size, SECTION_IDS.length)
  }
  assert.deepEqual(order, [...SECTION_IDS])
})
