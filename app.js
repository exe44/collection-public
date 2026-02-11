const grid = document.getElementById('grid')
const empty = document.getElementById('empty')
const searchInput = document.getElementById('search')
const tagRow = document.getElementById('tagRow')
const dataMeta = document.querySelector('meta[name="collection-data-url"]')
const mediaBaseMeta = document.querySelector('meta[name="collection-media-base-url"]')

let items = []
let tagFilter = 'all'
const mediaBaseUrl = (mediaBaseMeta?.getAttribute('content') || '').trim()
const dataSources = Array.from(new Set([
  (dataMeta?.getAttribute('content') || '').trim(),
  './items.json',
].filter(Boolean)))

const primaryLabel = (tag) => {
  switch (tag) {
    case 'book':
      return '書籍'
    case 'music':
      return '音樂'
    default:
      return '其他'
  }
}

const getItemTags = (item) => {
  if (Array.isArray(item.tags) && item.tags.length) return item.tags
  if (item.primaryTag) return [item.primaryTag]
  return []
}

const buildTagRow = () => {
  if (!tagRow) return
  tagRow.innerHTML = ''
  const tags = new Set()
  items.forEach((item) => {
    getItemTags(item).forEach((tag) => tags.add(tag))
  })

  const tagsList = Array.from(tags).sort()

  const allBtn = document.createElement('button')
  allBtn.type = 'button'
  allBtn.className = `chip ${tagFilter === 'all' ? 'active' : ''}`
  allBtn.textContent = '全部'
  allBtn.addEventListener('click', () => {
    tagFilter = 'all'
    render()
  })
  tagRow.append(allBtn)

  tagsList.forEach((tag) => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = `chip ${tagFilter === tag ? 'active' : ''}`
    btn.textContent = tag
    btn.addEventListener('click', () => {
      tagFilter = tag
      render()
    })
    tagRow.append(btn)
  })
}

const render = () => {
  const query = (searchInput?.value || '').toLowerCase().trim()

  const filtered = items.filter((item) => {
    const tags = getItemTags(item)
    if (tagFilter !== 'all' && !tags.includes(tagFilter)) return false
    if (!query) return true
    const haystack = [item.title, item.creator, ...(tags || [])]
      .join(' ')
      .toLowerCase()
    return haystack.includes(query)
  })

  if (!grid) return
  grid.innerHTML = ''

  if (!filtered.length) {
    if (empty) empty.style.display = 'block'
    return
  }

  if (empty) empty.style.display = 'none'
  filtered.forEach((item) => {
    const card = document.createElement('article')
    card.className = 'card'

    const cover = document.createElement('div')
    cover.className = 'image'
    const firstImage = getPrimaryImage(item)
    if (firstImage) {
      cover.style.backgroundImage = `url(${firstImage})`
    }

    const title = document.createElement('div')
    title.className = 'title'
    title.textContent = item.title || 'Untitled'

    const meta = document.createElement('div')
    meta.className = 'meta'
    const label = primaryLabel(item.primaryTag || getItemTags(item)[0])
    meta.textContent = [label, item.creator].filter(Boolean).join(' · ')

    card.append(cover, title, meta)

    const tags = getItemTags(item)
    if (tags.length) {
      const chipList = document.createElement('div')
      chipList.className = 'chip-list'
      tags.forEach((tag) => {
        const chip = document.createElement('span')
        chip.className = 'chip small'
        chip.textContent = tag
        chipList.append(chip)
      })
      card.append(chipList)
    }

    if (item.note) {
      const note = document.createElement('div')
      note.className = 'note'
      note.textContent = item.note
      card.append(note)
    }

    grid.append(card)
  })

  buildTagRow()
}

const getPrimaryImage = (item) => {
  if (Array.isArray(item.images) && item.images.length) {
    return resolveImageUrl(item.images[0])
  }
  if (Array.isArray(item.imageRefs) && item.imageRefs.length) {
    const firstRef = item.imageRefs.find((ref) => ref?.url || ref?.key)
    if (firstRef?.url) return resolveImageUrl(firstRef.url)
    if (firstRef?.key) return resolveMediaKey(firstRef.key)
  }
  return ''
}

const resolveImageUrl = (value) => {
  if (typeof value !== 'string' || !value) return ''
  if (value.startsWith('data:image/')) return value
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  if (!mediaBaseUrl) return value
  return joinUrl(mediaBaseUrl, value)
}

const resolveMediaKey = (key) => {
  if (typeof key !== 'string' || !key) return ''
  if (!mediaBaseUrl) return ''
  const normalized = key.replace(/^\/+/, '')
  return joinUrl(mediaBaseUrl, normalized)
}

const joinUrl = (base, path) => `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`

const load = async () => {
  for (const source of dataSources) {
    try {
      const response = await fetch(source, { cache: 'no-store' })
      if (!response.ok) throw new Error(`fetch failed (${response.status})`)
      const data = await response.json()
      items = Array.isArray(data?.items) ? data.items : []
      render()
      return
    } catch (error) {
      // try next source
    }
  }

  items = []
  render()
}

if (searchInput) {
  searchInput.addEventListener('input', render)
}

load()
