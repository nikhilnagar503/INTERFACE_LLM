# Prompt Templates Refactoring Guide

## Overview

The Prompt Templates system has been refactored to implement **lazy-loading, caching, and a marketplace-style UI**. Templates are now only fetched when the user clicks "Browse Templates" and are cached in localStorage for subsequent loads.

## Architecture

### Component Structure

```
ChatInterface
├── PromptMarketplace (Modal)
│   ├── PromptSearchBar (Search & Filter)
│   ├── PromptGrid (Card Container)
│   │   └── PromptCard[] (Individual Cards)
│   └── PromptMarketplace.css
└── promptTemplates.js (Data & API)
```

### Component Responsibilities

| Component | Purpose |
|-----------|---------|
| **PromptMarketplace** | Main modal container; handles state, caching, and orchestration |
| **PromptSearchBar** | Search input + tag filter dropdown |
| **PromptGrid** | Grid layout with loading skeletons and empty state |
| **PromptCard** | Individual template card with title, description, tags, and select button |
| **promptTemplates.js** | Centralized data, export functions, API simulation |

## State Management

### ChatInterface State

```jsx
const [showPromptMarketplace, setShowPromptMarketplace] = useState(false);
const [selectedPrompts, setSelectedPrompts] = useState([]);
```

- `showPromptMarketplace`: Controls modal visibility
- `selectedPrompts`: Tracks selected template IDs (enables multi-select)

### PromptMarketplace State

```jsx
const [templates, setTemplates] = useState([]);          // Fetched templates
const [isLoading, setIsLoading] = useState(false);       // Loading indicator
const [searchTerm, setSearchTerm] = useState('');        // Search query
const [selectedTag, setSelectedTag] = useState('');      // Active tag filter
const [error, setError] = useState(null);                // Error messages
const [isCached, setIsCached] = useState(false);         // Cache flag
```

## Data Flow

### 1. Browse Templates Button Click

```
User clicks "+" button
  ↓
setShowPromptMarketplace(true)
  ↓
PromptMarketplace mounts
  ↓
useEffect checks: isOpen && !isCached && templates.empty
  ↓
loadTemplates() executes
```

### 2. Template Loading (Lazy + Cache)

```
loadTemplates()
  ↓
Check localStorage for 'promptTemplates'
  ├─ Found: Load from cache, set isCached=true
  └─ Not Found: 
       ├─ Call fetchPromptTemplates()
       ├─ Store result in localStorage
       └─ set isCached=true
  ↓
setTemplates(data)
```

### 3. Search & Filter

```
User types or filters
  ↓
filteredTemplates = templates.filter(prompt => {
  matchesSearch = prompt.title/description includes term
  matchesTag = !selectedTag OR prompt.tags includes selectedTag
  return matchesSearch && matchesTag
})
  ↓
PromptGrid re-renders with filtered results
```

### 4. Template Selection

```
User clicks "+" on a card
  ↓
handleSelectPromptTemplate(template)
  ↓
setInput(template.content)  // Prepopulate chat input
setSelectedPrompts([...])   // Track selection
  ↓
Marketplace stays open (allow multi-select)
  ↓
User clicks "Done" → handleCloseMarketplace()
  ↓
Clear selectedPrompts, close modal
```

## API Integration Points

### promptTemplates.js

```javascript
// Replace with actual API call:
export const fetchPromptTemplates = async () => {
  const response = await fetch(`${API_URL}/api/prompts/templates`);
  return response.json();
};
```

### Backend Endpoint (Example)

```
GET /api/prompts/templates
├─ Query Params:
│  ├─ skip: number (pagination)
│  ├─ limit: number (pagination)
│  └─ tags: string (comma-separated filter)
├─ Response: 200
│  └─ {
│      "templates": [Template],
│      "total": number,
│      "cached": boolean
│    }
└─ Response: 500
   └─ { "detail": "Error message" }
```

## Caching Strategy

### LocalStorage Schema

```javascript
localStorage.setItem('promptTemplates', JSON.stringify([
  {
    id: 'template-id',
    title: 'Template Title',
    description: 'Short description',
    content: 'Prompt content',
    tags: ['Category1', 'Category2'],
    variables: ['{{var1}}', '{{var2}}']
  }
  // ... more templates
]));
```

### Cache Invalidation

Currently: **No automatic invalidation** (evergreen cache)

Options to add:
```javascript
// Option 1: Timestamp-based
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
if (Date.now() - cachedAt > CACHE_DURATION) {
  // Refetch
}

// Option 2: Manual refresh button
<button onClick={() => {
  localStorage.removeItem('promptTemplates');
  loadTemplates();
}}>
  Refresh Templates
</button>
```

## UI/UX Features

### Loading State
- Skeleton cards with pulsing animation
- 6 placeholder cards while fetching

### Empty States
- No templates found message
- Suggests adjusting search/filters

### Search & Filter
- Real-time search across title + description
- Dropdown tag filter
- "Clear Filters" button

### Selection Feedback
- Card highlights with blue border + background
- Button changes to filled "✓"
- Selected count badge in header

### Responsive Design
- Desktop: Multi-column grid (280px min-width)
- Tablet: Adjusted grid
- Mobile: Stack with full-width search

## Usage Examples

### Adding a New Template

```javascript
// In promptTemplates.js, add to PROMPT_TEMPLATES array:
{
  id: 'unique-id',
  title: 'Template Title',
  description: 'One-liner description (max 1-2 lines)',
  content: 'Full prompt template content',
  tags: ['Category1', 'Category2'],
  variables: ['{{var1}}', '{{var2}}']
}
```

### Selecting a Template in Chat

1. User clicks "+" button (Browse Templates)
2. Marketplace opens, templates lazy-load
3. User searches or filters by tag
4. Clicks "+" on desired template(s)
5. Template content populates input field
6. User clicks "Done"
7. Template appears in chat input, ready to send

### Adding Templates to a Conversation

```jsx
// Once selected, the template content is in the input:
setInput(template.content);

// User can:
// - Edit the template
// - Fill in {{variables}}
// - Add context before sending
// - Click Send to submit
```

## File Structure

```
frontend/src/features/prompts/
├── PromptMarketplace.jsx          # Main modal component
├── PromptMarketplace.css          # Marketplace styles
├── PromptCard.jsx                 # Individual card
├── PromptGrid.jsx                 # Card grid container
├── PromptSearchBar.jsx            # Search & filter controls
├── promptTemplates.js             # Data + API
├── PromptLibrary.jsx              # [DEPRECATED] Old full-page component
└── PromptLibrary.css              # [DEPRECATED]
```

## Migration from Old System

### Old Behavior (PromptLibrary.jsx)
- Loaded on dedicated "Prompts" page tab
- All templates visible on load
- Click "Use in Chat" → localStorage + redirect

### New Behavior (PromptMarketplace.jsx)
- Integrated into chat interface
- Lazy-load on "Browse Templates" click
- Select multiple templates
- Templates populate input field
- Multi-select before closing modal

### To Keep Old System Running

Option 1: Keep both
```jsx
// App.jsx
case 'prompts':
  return <PromptLibrary />;  // Old full-page view
```

Option 2: Replace completely
- Remove PromptLibrary tab
- Only use PromptMarketplace in ChatInterface

## Error Handling

### Scenarios

| Scenario | Handling |
|----------|----------|
| API fetch fails | Show error banner, fallback to `PROMPT_TEMPLATES` constant |
| LocalStorage full | Gracefully degrade, fetch fresh each time |
| Network timeout | Retry with exponential backoff (future enhancement) |
| Corrupted cache | Try parse, fallback to API |

### Error Banner

```jsx
{error && (
  <div className="error-banner">{error}</div>
)}
```

## Performance Considerations

- **First Load**: ~500ms (simulated delay) + ~50KB data
- **Cached Load**: <10ms (localStorage read)
- **Grid Render**: Virtualization ready (can add windowing for 1000+ templates)
- **Search**: Real-time, no debounce needed for small datasets

## Future Enhancements

1. **Server-side Pagination**
   ```javascript
   fetchPromptTemplates(page = 1, limit = 20)
   ```

2. **Advanced Filtering**
   - Multiple tag selection
   - Difficulty level
   - Last used
   - Custom categories

3. **User Templates**
   - Save custom prompts
   - Share with team
   - Rate/favorite

4. **Analytics**
   - Track which templates are used most
   - A/B test new templates

5. **Marketplace Features**
   - Template previews
   - Example outputs
   - Author info
   - Community ratings

## Troubleshooting

### Templates Not Loading
- Check browser console for errors
- Verify localStorage not full: `localStorage.clear()`
- Ensure API endpoint is correct

### Cached Templates Out of Date
```javascript
// Manually clear:
localStorage.removeItem('promptTemplates');
```

### Selection Not Working
- Check if `selectedPrompts` state updates
- Verify `handleSelectPromptTemplate` is called
- Inspect Redux DevTools or React Dev Tools

## Testing

### Unit Tests

```javascript
// PromptCard.test.jsx
test('renders title, description, tags', () => {});
test('calls onSelect when clicked', () => {});

// PromptMarketplace.test.jsx
test('lazy-loads templates on open', () => {});
test('caches templates in localStorage', () => {});
test('filters by search term', () => {});
test('filters by tag', () => {});
```

### E2E Tests

```
1. Click Browse Templates
2. Verify modal opens
3. Verify templates load
4. Search for a term
5. Verify results filter
6. Select a template
7. Verify input populates
8. Click Done
9. Verify modal closes
```

---

**Last Updated**: January 20, 2026
**Status**: Production Ready
**Maintainer**: LLM Interface Team
