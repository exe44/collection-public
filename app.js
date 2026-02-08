const grid = document.getElementById('grid')
const empty = document.getElementById('empty')
const searchInput = document.getElementById('search')
const tagRow = document.getElementById('tagRow')

let items = []
let tagFilter = 'all'

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
  const query = (searchInput.value || '').toLowerCase().trim()

  const filtered = items.filter((item) => {
    const tags = getItemTags(item)
    if (tagFilter !== 'all' && !tags.includes(tagFilter)) return false
    if (!query) return true
    const haystack = [item.title, item.creator, ...(tags || [])]
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

load()
