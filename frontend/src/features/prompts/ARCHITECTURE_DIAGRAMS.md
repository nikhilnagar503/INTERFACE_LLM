# Prompt Templates Refactoring - Visual Architecture

## High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        ChatInterface                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Input Toolbar (Input Actions Row)                        │ │
│  │  ┌──────────┬──────────┬──────────┬───────────────────────┤ │
│  │  │ Model ⬇️ │ Browse + │ Attach   │ ... other buttons    │ │
│  │  │ Select   │ Templates│ File     │                       │ │
│  │  │          │ [NEW! 👈]│          │                       │ │
│  │  └──────────┴──────────┴──────────┴───────────────────────┤ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Chat Messages Area                                        │ │
│  │  (Where conversation happens)                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Input Field (Textarea)                                    │ │
│  │  (Template content appears here when selected)             │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ {{template_content_fills_here}}                      │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  PromptMarketplace Modal (When "Browse Templates" clicked)│ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  📚 Prompt Marketplace          ✕ (close)           │ │ │
│  │  ├──────────────────────────────────────────────────────┤ │ │
│  │  │  Search: [Search box]   Filter: [Tag dropdown] 🗙     │ │ │
│  │  ├──────────────────────────────────────────────────────┤ │ │
│  │  │  7 templates found | ✅ 2 selected                  │ │ │
│  │  ├──────────────────────────────────────────────────────┤ │ │
│  │  │                                                       │ │ │
│  │  │  ┌─────────────────┐  ┌─────────────────┐            │ │ │
│  │  │  │ Template Card   │  │ Template Card   │ ...        │ │ │
│  │  │  │ 📝 Title        │  │ 📝 Title        │            │ │ │
│  │  │  │ Short desc...   │  │ Short desc...   │            │ │ │
│  │  │  │ [Tag] [Tag]     │  │ [Tag] [Tag]     │            │ │ │
│  │  │  │           [✓]   │  │           [+]   │            │ │ │
│  │  │  └─────────────────┘  └─────────────────┘            │ │ │
│  │  │                                                       │ │ │
│  │  │  ┌─────────────────┐  ┌─────────────────┐            │ │ │
│  │  │  │ Template Card   │  │ Template Card   │ ...        │ │ │
│  │  │  │ ...             │  │ ...             │            │ │ │
│  │  │  └─────────────────┘  └─────────────────┘            │ │ │
│  │  │                                                       │ │ │
│  │  ├──────────────────────────────────────────────────────┤ │ │
│  │  │  [Done]                                              │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Tree

```
ChatInterface
│
├─ State
│  ├─ showPromptMarketplace: boolean
│  ├─ selectedPrompts: string[]
│  ├─ messages: Message[]
│  ├─ input: string
│  └─ ...other state
│
├─ Children
│  ├─ WelcomePage (when no messages)
│  ├─ Chat messages display
│  ├─ Input toolbar with buttons
│  │  └─ [Browse Templates] ← NEW
│  ├─ Input field & send button
│  │
│  └─ PromptMarketplace [MODAL]
│     │
│     ├─ State (Local)
│     │  ├─ templates: Template[]
│     │  ├─ isLoading: boolean
│     │  ├─ searchTerm: string
│     │  ├─ selectedTag: string
│     │  ├─ error: string | null
│     │  └─ isCached: boolean
│     │
│     ├─ Handlers
│     │  ├─ loadTemplates()
│     │  ├─ handleClearFilters()
│     │  └─ handleSelectTemplate()
│     │
│     └─ Children
│        ├─ Header (Title + Close button)
│        ├─ PromptSearchBar
│        │  ├─ Search input
│        │  ├─ Tag filter dropdown
│        │  └─ Clear filters button
│        ├─ PromptGrid
│        │  ├─ OR PromptCard[] (Normal state)
│        │  ├─ OR Skeleton cards[] (Loading)
│        │  └─ OR Empty state (No results)
│        │     └─ PromptCard
│        │        ├─ Title
│        │        ├─ Description
│        │        ├─ Tags
│        │        └─ Select button [+/✓]
│        └─ Footer (Done button)
│
└─ Effects
   ├─ useEffect(() => { loadTemplates() }, [isOpen])
   └─ useEffect(() => { scrollToBottom() }, [messages])
```

---

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────┐
│ User Action: Click "Browse Templates" Button             │
└──────────────────────────────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────┐
│ Event: onClick → setShowPromptMarketplace(true)          │
└──────────────────────────────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────┐
│ PromptMarketplace Component Mounts                        │
│ Props: { isOpen: true, onClose, onSelectPrompt, ... }   │
└──────────────────────────────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────┐
│ useEffect Trigger                                         │
│ Condition: isOpen && !isCached && !templates.length      │
│ Action: Call loadTemplates()                             │
└──────────────────────────────────────────────────────────┘
                       ↓
          ┌────────────────────────┐
          │   loadTemplates()      │
          └────────────────────────┘
                       ↓
          ┌────────────────────────────────────┐
          │ Check localStorage                 │
          │ key: 'promptTemplates'             │
          └────────────────────────────────────┘
          ↓                                    ↓
    ┌──────────────┐                ┌──────────────────┐
    │ Cache HIT    │                │ Cache MISS       │
    │ (Fast)       │                │ (Slow)           │
    └──────────────┘                └──────────────────┘
         ↓                                   ↓
    Load from    ──────────────────── Fetch from API
    localStorage                    (or built-in data)
         ↓                                   ↓
    Parse JSON                       Await response
         ↓                                   ↓
    setTemplates(data)              setTemplates(data)
    setIsCached(true)               setIsCached(true)
         ↓                                   ↓
         │                          Save to localStorage
         │                                   ↓
         └────────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────┐
│ State Updated: templates loaded                          │
│ UI Re-renders with grid                                 │
└──────────────────────────────────────────────────────────┘
                       ↓
          ┌────────────────────────┐
          │ Display              │
          │ - Modal overlay       │
          │ - Search bar         │
          │ - PromptGrid         │
          │   - Cards or         │
          │   - Skeletons or     │
          │   - Empty state      │
          │ - Done button        │
          └────────────────────────┘
```

---

## Search & Filter Flow

```
User Types Search Term
│
├─ onChange event → setSearchTerm(value)
│
├─ State updates
│
├─ Component re-renders
│
├─ filteredTemplates calculated:
│  │
│  └─ templates.filter(prompt => {
│     matchesSearch = 
│       prompt.title.includes(searchTerm) ||
│       prompt.description.includes(searchTerm)
│     matchesTag = 
│       !selectedTag || prompt.tags.includes(selectedTag)
│     return matchesSearch && matchesTag
│  })
│
├─ PromptGrid receives filtered results
│
└─ UI updates with matching cards
```

---

## Selection & Input Population Flow

```
User Clicks "+" on PromptCard
│
├─ onClick event → onSelect(template) [passed from PromptMarketplace]
│
├─ handleSelectPromptTemplate(template) executes
│  │
│  ├─ setInput(template.content)
│  │  └─ Chat input field NOW contains template content
│  │
│  └─ setSelectedPrompts(prev => [...prev, template.id])
│     └─ Add template ID to selection array
│
├─ UI updates:
│  ├─ PromptCard highlights (blue border + background)
│  ├─ Button changes from [+] to [✓]
│  ├─ Selected count updates in header
│  └─ Card remains interactive (multi-select possible)
│
└─ User can:
   ├─ Continue selecting more templates
   ├─ Close modal by clicking "Done"
   ├─ Edit the template content in input field
   └─ Send message when ready
```

---

## Caching Architecture

```
┌─────────────────────────────────────────────────┐
│ Browser LocalStorage                            │
│                                                 │
│ ┌───────────────────────────────────────────┐  │
│ │ Key: 'promptTemplates'                    │  │
│ │                                           │  │
│ │ Value: JSON Array                         │  │
│ │ ┌─────────────────────────────────────┐   │  │
│ │ │ [                                   │   │  │
│ │ │   {                                 │   │  │
│ │ │     id: "template-1",               │   │  │
│ │ │     title: "Title",                 │   │  │
│ │ │     description: "...",             │   │  │
│ │ │     content: "...",                 │   │  │
│ │ │     tags: [...],                    │   │  │
│ │ │     variables: [...]                │   │  │
│ │ │   },                                │   │  │
│ │ │   { ... },                          │   │  │
│ │ │   ...                               │   │  │
│ │ │ ]                                   │   │  │
│ │ └─────────────────────────────────────┘   │  │
│ │                                           │  │
│ │ Storage size: ~50-100KB (7 templates)    │  │
│ │ Expiry: Never (manual clear needed)      │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
         ↑                                    
         │ Write (on first fetch)
         │ Read (on subsequent opens)
         │
     PromptMarketplace
     loadTemplates()
```

---

## File Import/Export Map

```
ChatInterface.jsx
├─ imports
│  ├─ PromptMarketplace from './features/prompts/PromptMarketplace'
│  └─ ...other imports
│
└─ uses PromptMarketplace component
   └─ passes props: isOpen, onClose, onSelectPrompt, selectedPrompts

PromptMarketplace.jsx
├─ imports
│  ├─ PromptSearchBar from './PromptSearchBar'
│  ├─ PromptGrid from './PromptGrid'
│  ├─ { fetchPromptTemplates, PROMPT_TEMPLATES } from './promptTemplates'
│  └─ './PromptMarketplace.css'
│
└─ children
   ├─ PromptSearchBar (search & filter)
   ├─ PromptGrid (template cards)
   └─ PromptGrid.css

PromptGrid.jsx
├─ imports
│  ├─ PromptCard from './PromptCard'
│
└─ children
   └─ PromptCard[] (maps over prompts)

PromptCard.jsx
├─ no sub-imports (leaf component)
└─ exports card UI

PromptSearchBar.jsx
├─ no sub-imports (leaf component)
└─ exports search & filter UI

promptTemplates.js
├─ exports
│  ├─ PROMPT_TEMPLATES (data array)
│  └─ fetchPromptTemplates() (async function)
│
└─ used by
   └─ PromptMarketplace.jsx
```

---

## CSS Structure

```
PromptMarketplace.css
├─ Modal & Overlay
│  ├─ .prompt-marketplace-overlay
│  ├─ .prompt-marketplace-modal
│  ├─ .marketplace-header
│  ├─ .marketplace-content
│  └─ .marketplace-footer
│
├─ Search & Filter
│  ├─ .prompt-search-bar (3-column grid)
│  ├─ .search-input
│  ├─ .filter-section
│  ├─ .tag-filter
│  └─ .btn-clear-filters
│
├─ Grid & Cards
│  ├─ .prompt-grid (responsive grid)
│  ├─ .prompt-card
│  ├─ .prompt-card.selected (variant)
│  ├─ .card-content
│  ├─ .card-title
│  ├─ .card-description
│  ├─ .card-tags
│  ├─ .tag (badge)
│  ├─ .btn-select
│  └─ .btn-select.selected (variant)
│
├─ Loading States
│  ├─ .prompt-grid.loading (container)
│  ├─ .skeleton-card (placeholder)
│  ├─ @keyframes pulse
│  └─ .skeleton-title/desc/tags
│
├─ Empty States
│  ├─ .prompt-grid.empty
│  └─ .empty-state
│
├─ Animations
│  ├─ @keyframes fadeIn
│  ├─ @keyframes slideUp
│  └─ @keyframes pulse
│
└─ Responsive Breakpoints
   └─ @media (max-width: 768px)
      ├─ Modal width: 95%
      ├─ Search bar: stack
      ├─ Grid: smaller min-width
      └─ Padding adjustments
```

---

## State Transitions

```
Initial State
├─ templates: []
├─ isLoading: false
├─ isCached: false
└─ showPromptMarketplace: false

↓

User clicks "Browse Templates"

↓

State: showPromptMarketplace = true

↓

Modal mounts, useEffect triggers

↓

State: isLoading = true
UI: Skeleton cards visible

↓

API responds (or localStorage hit)

↓

State: templates = [data], isCached = true, isLoading = false
UI: Cards render with real data

↓

User searches / filters

↓

State: searchTerm or selectedTag updates
Derived: filteredTemplates recalculated
UI: Cards updated via PromptGrid

↓

User clicks "+" on card

↓

State: selectedPrompts.push(id), input = template.content
UI: Card highlights, count updates, input field populated

↓

User clicks "Done"

↓

State: showPromptMarketplace = false, selectedPrompts = []
UI: Modal closes, templates cached for next open
```

---

## Performance Optimization Points

```
🚀 First Load (~500ms)
├─ Network request to API
├─ Parse JSON response
├─ Set state (templates, isLoading)
├─ React reconciliation
├─ Render PromptGrid with cards
└─ localStorage.setItem() (async, non-blocking)

⚡ Cached Load (<10ms)
├─ useEffect triggers
├─ localStorage.getItem() (synchronous)
├─ Parse JSON (cached version)
├─ Set state (templates)
├─ React reconciliation (fast, data same)
└─ Render (same as before)

🔍 Search Filter (<50ms)
├─ User types
├─ setSearchTerm() (state update)
├─ Component re-renders
├─ Filter runs: templates.filter(...) O(n)
├─ PromptGrid receives filtered array
└─ Render only matching cards

🎨 UI Animations
├─ Modal fadeIn: 0.2s
├─ Modal slideUp: 0.3s
├─ Card hover: 0.2s
└─ Skeleton pulse: 1.5s (repeating)
```

---

**Visual Architecture Complete** ✅  
All diagrams are ASCII for compatibility and clarity.
