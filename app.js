const grid = document.getElementById('grid')
const empty = document.getElementById('empty')
const searchInput = document.getElementById('search')
const typeFilter = document.getElementById('typeFilter')

let items = []

const typeLabel = (type) => {
  switch (type) {
    case 'book':
      return '書籍'
    case 'cd':
      return 'CD'
    case 'vinyl':
      return '黑膠'
    default:
      return '其他'
  }
}

const render = () => {
  const query = (searchInput.value || '').toLowerCase().trim()
  const type = typeFilter.value

  const filtered = items.filter((item) => {
    if (type !== 'all' && item.type !== type) return false
    if (!query) return true
    const haystack = [item.title, item.creator, ...(item.tags || [])]
      .join(' ')
      .toLowerCase()
    return haystack.includes(query)
  })

  grid.innerHTML = ''

  if (!filtered.length) {
    empty.style.display = 'block'
    return
  }

  empty.style.display = 'none'
  filtered.forEach((item) => {
    const card = document.createElement('article')
    card.className = 'card'

    const cover = document.createElement('div')
    cover.className = 'image'
    if (item.images && item.images.length) {
      cover.style.backgroundImage = `url(${item.images[0]})`
    }

    const title = document.createElement('div')
    title.className = 'title'
    title.textContent = item.title || 'Untitled'

    const meta = document.createElement('div')
    meta.className = 'meta'
    meta.textContent = [typeLabel(item.type), item.creator].filter(Boolean).join(' · ')

    card.append(cover, title, meta)

    if (item.note) {
      const note = document.createElement('div')
      note.className = 'note'
      note.textContent = item.note
      card.append(note)
    }

    grid.append(card)
  })
}

const load = async () => {
  try {
    const response = await fetch('./items.json', { cache: 'no-store' })
    if (!response.ok) throw new Error('items.json not found')
    const data = await response.json()
    items = data.items || []
  } catch (error) {
    items = []
  }

  render()
}

searchInput.addEventListener('input', render)
typeFilter.addEventListener('change', render)

load()
