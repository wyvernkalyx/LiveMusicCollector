# Live Music Collector - UI/UX Design Document

## 1. Design Principles

- **Information Density**: Show lots of data without overwhelming
- **Chronological Focus**: Optimize for browsing by date
- **Quick Actions**: Common tasks accessible in 1-2 clicks
- **Keyboard Navigation**: Power users can navigate without mouse
- **Visual Hierarchy**: Important information stands out

## 2. Application Layout

### 2.1 Main Window Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ File  Edit  View  Library  Playback  Tools  Help                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ [♫▶] [⏸] [⏹] [⏮] [⏭]  ━━━━━━━━━━━━━━━━━━━━━  3:42 / 21:18  [🔊━━━] [⚙] │
├─────────────────────────────────────────────────────────────────────────────┤
│         │                                                          │         │
│         │  [Search Box........................] [🔍] [Filters ▼] │ Details │
│ Library │──────────────────────────────────────────────────────│  Panel  │
│  Tree   │                                                        │         │
│         │            Main Content Area                           │ (Hidden │
│  250px  │              (Show List)                              │   by    │
│         │                                                        │ default)│
│         │                                                        │         │
│         │                                                        │  350px  │
├─────────┴────────────────────────────────────────────────────┴───────────┤
│ 2,847 shows | 31,293 tracks | 2.1 TB | Currently playing: China Cat...   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Library Tree (Left Sidebar)

```
📚 Library
├── 🎵 All Shows (2,847)
├── 📅 By Year
│   ├── 1965 (2)
│   ├── 1966 (13)
│   ├── 1967 (52)
│   └── ...
├── 📍 By Venue
│   ├── Madison Square Garden (21)
│   ├── Fillmore West (43)
│   └── ...
├── 💿 Official Releases (47)
├── 🎙️ Soundboards (892)
├── 🎤 Audience (1,743)
├── ⭐ Favorites
└── 🔄 Recently Added
```

## 3. Main Content Views

### 3.1 Chronological View (Default)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Showing: All Shows                                          View: ⚏ ▦ ▤  │
├─────────────────────────────────────────────────────────────────────────┤
│ ▼ 1977 (152 shows)                                                      │
├─────────────────────────────────────────────────────────────────────────┤
│ Date       Venue                    City, State    Source    Quality    │
├─────────────────────────────────────────────────────────────────────────┤
│ 1977-02-26 Swing Auditorium        San Bernardino  SBD       ★★★★☆     │
│ 1977-02-27 Robertson Gym           Santa Barbara   AUD       ★★★☆☆     │
│ 1977-03-18 Winterland Arena        San Francisco   SBD       ★★★★★     │
│ ▶ 1977-05-08 Cornell University    Ithaca, NY      SBD       ★★★★★    │
│ 1977-05-09 War Memorial           Buffalo, NY      AUD       ★★★★☆     │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Expanded Show View

```
│ ▼ 1977-05-08 Cornell University    Ithaca, NY      SBD       ★★★★★    │
│   └─ Barton Hall - Betty Board                              2:32:17    │
│      Set 1:                                                            │
│      01. New Minglewood Blues                                 4:48     │
│      02. Loser                                                7:31     │
│      03. El Paso                                              4:23     │
│      04. They Love Each Other                                 6:58     │
│      05. Jack Straw                                           5:42     │
│      Set 2:                                                            │
│      06. Scarlet Begonias >                                   9:12     │
│      07. Fire on the Mountain                                13:42     │
│      08. Estimated Prophet                                    8:31     │
│      09. St. Stephen >                                        4:23     │
│      10. Not Fade Away >                                     17:48     │
│      11. St. Stephen >                                        1:54     │
│      12. Morning Dew                                         14:17     │
│      Encore:                                                           │
│      13. One More Saturday Night                              4:58     │
```

### 3.3 Search Results View

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Search: "Fire on the Mountain"                        423 performances  │
├─────────────────────────────────────────────────────────────────────────┤
│ Date       Venue                    Song Context                        │
├─────────────────────────────────────────────────────────────────────────┤
│ 1977-05-08 Cornell University      Scarlet Begonias > Fire on the...  │
│ 1978-04-16 Huntington Civic Center  Fire on the Mountain > Drums      │
│ 1979-11-02 Nassau Coliseum         Fire on the Mountain (standalone)  │
└─────────────────────────────────────────────────────────────────────────┘
```

## 4. Import Workflow

### 4.1 Import Dialog

```
┌─ Import Music ──────────────────────────────────────────────────────────┐
│                                                                         │
│  Drag & drop files here or click to browse                            │
│                                                                         │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐             │
│  │                                                       │             │
│  │         🎵  Drop music files or folders              │             │
│  │                                                       │             │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘             │
│                                                                         │
│  ☑ Copy files to library (recommended)                                 │
│  ☑ Auto-match to known shows                                          │
│  ☑ Normalize names and metadata                                       │
│                                                                         │
│                                          [Cancel] [Import]              │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Import Progress

```
┌─ Importing... ──────────────────────────────────────────────────────────┐
│                                                                         │
│  Processing: 1978-07-08 Red Rocks                                      │
│                                                                         │
│  ████████████████████░░░░░░░░░░░░░░░░░░  45%                          │
│                                                                         │
│  ✓ 14 shows matched automatically                                      │
│  ⚠ 3 shows need manual matching                                        │
│  ⏳ 23 shows remaining                                                  │
│                                                                         │
│  Current: Extracting metadata from Dark Star...                        │
│                                                                         │
│                                   [Run in Background] [Cancel]          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 5. Metadata Editor

### 5.1 Show Metadata Panel

```
┌─ Edit Show Information ─────────────────────────────────────────────────┐
│                                                                         │
│  Date:     [1977-05-08]              Source:    [▼ Soundboard    ]    │
│  Venue:    [Cornell University]       Taper:     [Betty Cantor   ]    │
│  City:     [Ithaca         ]         Quality:   [★★★★★          ]    │
│  State:    [NY]                      Lineage:   [Master Reel >    ]   │
│                                                  [DAT > FLAC      ]   │
│  Notes:    [Often considered one of the best Grateful Dead shows  ]   │
│            [ever performed. Features exceptional Scarlet > Fire   ]   │
│                                                                         │
│  Matched to: ✓ Archive.org: gd1977-05-08.sbd.cantor.sbeok         │
│              ✓ Setlist.fm: Grateful Dead 5/8/1977                    │
│                                                                         │
│                                          [Cancel] [Save Changes]        │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Track Editor (Batch Edit)

```
┌─ Edit Tracks ───────────────────────────────────────────────────────────┐
│                                                                         │
│  Editing 3 tracks:                                                      │
│                                                                         │
│  ☑ Track  Original Title            → Normalized Title                 │
│  ─────────────────────────────────────────────────────────────────────│
│  ☑ 06     Scarlet                  → Scarlet Begonias               ☑│
│  ☑ 07     Fire                     → Fire on the Mountain           ☑│
│  ☑ 10     NFA                      → Not Fade Away                  ☑│
│                                                                         │
│  Segues:  06 ━━━━ > ━━━━ 07        10 ━━━━ jam ━━━━ 11             │
│                                                                         │
│  [Apply to all "NFA" in library]              [Cancel] [Save]          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 6. Search & Filter Interface

### 6.1 Advanced Search Dialog

```
┌─ Advanced Search ───────────────────────────────────────────────────────┐
│                                                                         │
│  Song/Show: [                                               ]          │
│                                                                         │
│  Date Range: [1965-01-01] to [1995-12-31]   [Last 30 days ▼]        │
│                                                                         │
│  Venue:      [                                               ]          │
│  City/State: [                        ] [  ]                           │
│                                                                         │
│  Source Type:  ☑ All  ☐ SBD  ☐ AUD  ☐ Matrix  ☐ Official            │
│                                                                         │
│  Quality:    ★☆☆☆☆ ────────●──── ★★★★★                              │
│                                                                         │
│  ─── Set Position ──────────────────────────────────────────────────   │
│  Show opener:    [Feels Like a Stranger    ] [▼]                      │
│  Show closer:    [                          ] [▼]                      │
│  Encore:         [                          ] [▼]                      │
│  Set 2 opener:   [                          ] [▼]                      │
│                                                                         │
│  ─── Song Order ────────────────────────────────────────────────────   │
│  [Cumberland Blues         ] appears before [Franklin's Tower    ]     │
│  ☐ Must be consecutive  ☑ Include segues (>)                          │
│  [+ Add another song order rule]                                       │
│                                                                         │
│  Contains songs:  [China Cat Sunflower     ] [+]                      │
│                   [Rider                    ] [x]                      │
│                                                                         │
│                                    [Clear] [Search]                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Quick Filter Bar (Collapsed)

```
[Filters ▼]  3 active: Year: 1977 | Source: SBD | Quality: 4+ stars
```

### 6.2 Quick Filter Bar (Expanded)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Quick Filters:                                                          │
│                                                                         │
│ Year:  [All ▼]  Source: [All ▼]  Quality: [All ▼]  Venue: [All ▼]   │
│                                                                         │
│ ☑ Hide incomplete shows  ☑ Official releases only                      │
└─────────────────────────────────────────────────────────────────────────┘
```

## 7. Player Interface

### 7.1 Minimal Player (Top Bar)

```
[♫▶] [⏸] [⏹] [⏮] [⏭]  Scarlet Begonias > Fire on the Mountain  3:42 / 21:18  [🔊━━━]
```

### 7.2 Expanded Player (Bottom Panel - Optional)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ♫ Now Playing: Fire on the Mountain - 1977-05-08                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ██████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  3:42 / 13:42       │
│                                                                         │
│  [⏮⏮] [▶] [⏭⏭]     [🔀] [🔁] [🔊 ████████░░]                       │
│                                                                         │
│  Next: Estimated Prophet                                               │
│  Queue: 7 tracks remaining                                             │
└─────────────────────────────────────────────────────────────────────────┘
```

## 8. Context Menus

### 8.1 Show Context Menu (Right-click)

```
┌─────────────────────────┐
│ Play Show               │
│ Add to Queue           │
│ ─────────────────────── │
│ Edit Show Info         │
│ Update Metadata        │
│ Find Duplicates        │
│ ─────────────────────── │
│ Show in Explorer       │
│ Export...              │
│ ─────────────────────── │
│ Delete from Library    │
└─────────────────────────┘
```

### 8.2 Track Context Menu

```
┌─────────────────────────┐
│ Play                    │
│ Play Next              │
│ Add to Queue           │
│ ─────────────────────── │
│ Find Other Versions    │
│ Show Song History      │
│ ─────────────────────── │
│ Edit Track Info        │
│ Rename File            │
└─────────────────────────┘
```

## 9. Statistics Dashboard (View Menu Option)

```
┌─ Library Statistics ────────────────────────────────────────────────────┐
│                                                                         │
│  Total Shows: 2,847      Total Size: 2.1 TB      Avg Quality: ★★★★☆   │
│                                                                         │
│  Shows by Decade:                    Most Played Songs:                │
│  ┌────────────────────┐             1. Truckin' (423)                 │
│  │▓▓▓ 60s (112)       │             2. Sugar Magnolia (394)           │
│  │▓▓▓▓▓▓▓ 70s (891)   │             3. Me and My Uncle (389)          │
│  │▓▓▓▓▓▓▓▓▓ 80s (982)│             4. China Cat Sunflower (374)      │
│  │▓▓▓▓▓▓ 90s (862)    │             5. Playing in the Band (357)      │
│  └────────────────────┘                                                │
│                                      Top Venues:                        │
│  Source Distribution:                1. Madison Square Garden (52)      │
│  🎙️ SBD: 31%  🎤 AUD: 61%          2. Winterland (48)                 │
│  💿 Official: 2%  🔀 Matrix: 6%     3. Greek Theatre Berkeley (41)     │
└─────────────────────────────────────────────────────────────────────────┘
```

## 10. Keyboard Shortcuts

```
Navigation:
↑/↓         Navigate shows
←/→         Expand/collapse
Enter       Play show/track
Space       Play/pause
Ctrl+F      Search
Ctrl+I      Import

Playback:
Ctrl+→      Next track
Ctrl+←      Previous track
Ctrl+↑      Volume up
Ctrl+↓      Volume down

Library:
Ctrl+E      Edit metadata
Ctrl+D      Show duplicates
Delete      Remove from library
F2          Rename
```

## 11. Color Scheme & Visual Design (Dark Mode Default)

### Primary Colors (Dark Mode):
- Background: #121212 (main) / #1e1e1e (elevated)
- Surface: #2a2a2a (cards/panels)
- Accent: #4a90e2 (blue) / #bb86fc (purple alt)
- Success: #27ae60 (green)
- Warning: #f39c12 (orange)
- Error: #cf6679 (red)
- Text Primary: #ffffff (87% opacity)
- Text Secondary: #ffffff (60% opacity)
- Text Disabled: #ffffff (38% opacity)

### Light Mode Colors (Optional):
- Background: #ffffff (main) / #f5f5f5 (elevated)
- Surface: #ffffff (cards)
- Accent: #1976d2 (blue)
- Text Primary: #000000 (87% opacity)

### Typography:
- Headers: -apple-system, BlinkMacSystemFont, Segoe UI Semibold 14px
- Body: -apple-system, BlinkMacSystemFont, Segoe UI Regular 12px
- Monospace: Consolas, Monaco, 'Courier New' 11px (for dates, times)

### Elevation (Dark Mode):
- Level 0: #121212 (background)
- Level 1: #1e1e1e (sidebar, player)
- Level 2: #232323 (cards)
- Level 3: #252525 (popups)
- Level 4: #272727 (modals)

### Icons:
- Use Lucide React icons (consistent with modern design)
- 16x16 for toolbar
- 12x12 for inline icons
- White with 87% opacity in dark mode

## 12. Responsive Behavior

### Minimum Window Size: 1024x768

### Breakpoints:
- < 1280px: Hide details panel by default
- < 1024px: Collapse library tree to icons
- Full player always visible

### Resizable Panels:
- Library tree: 200-400px
- Details panel: 300-500px
- Draggable splitters between sections

## 13. Loading States

### Initial Load:
```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                         🎵 Live Music Collector                         │
│                                                                         │
│                    Loading library database...                          │
│                    ████████████░░░░░░░░░░░░                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Lazy Loading Indicators:
- Spinner for expanding shows
- Skeleton rows while loading
- "Load more" for infinite scroll

## 14. Empty States

### No Shows:
```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                      🎵 Welcome to Live Music Collector!                │
│                                                                         │
│                    Your library is empty. Let's fix that!              │
│                                                                         │
│                         [Import Music] [Browse Help]                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### No Search Results:
```
No shows found matching "Darkstar 1969"

Did you mean: "Dark Star 1969"? [Search instead]
```

## 15. Settings/Preferences Window

```
┌─ Preferences ───────────────────────────────────────────────────────────┐
│                                                                         │
│ General │ Library │ Import │ Playback │ Advanced                       │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                                         │
│ Library Location:                                                       │
│ [D:\MusicLibrary                                    ] [Browse...]       │
│                                                                         │
│ Naming Convention:                                                      │
│ Date Format:    [yyyy-mm-dd ▼]                                        │
│ Venue Format:   [{venue}, {city}, {state} ▼]                         │
│ ☑ Include source type in folder names                                  │
│ ☑ Normalize song titles automatically                                  │
│                                                                         │
│ File Handling:                                                          │
│ ☐ Move files instead of copying                                        │
│ ☑ Preserve original file names                                         │
│ ☑ Create backup before editing metadata                                │
│                                                                         │
│                                    [Cancel] [Apply] [OK]                │
└─────────────────────────────────────────────────────────────────────────┘
```

## 16. Comparison Mode (MVP Feature)

### 16.1 Comparison View Activation

Right-click on a show → "Compare with other sources" or use Ctrl+Shift+C

### 16.2 Source Comparison Interface

```
┌─ Comparing: 1977-05-08 Cornell University ─────────────────────────────┐
│                                                                         │
│ Source 1: Betty Board SBD          Source 2: Audience Recording       │
│ ★★★★★ Quality                      ★★★★☆ Quality                     │
│ ─────────────────────────────────────────────────────────────────────│
│                                                                         │
│ Scarlet Begonias    9:12      │    Scarlet Begonias    9:14          │
│ Fire on the Mountain 13:42    │    Fire on the Mountain 13:45        │
│                                │                                       │
│ [▶ Play]  Lineage: MSR>DAT    │    [▶ Play]  Taper: Jim Smith       │
│ Size: 543 MB                   │    Size: 498 MB                      │
│ ─────────────────────────────────────────────────────────────────────│
│                                                                         │
│ Differences:                                                           │
│ • Track splits: Source 2 has Drums as separate track                  │
│ • Missing in Source 2: Soundcheck recordings                          │
│ • Audio quality: Source 1 has clearer high frequencies               │
│                                                                         │
│ [Sync Playback] [Add Source 3] [Export Comparison]                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 16.3 Synchronized Playback Mode

When enabled, both sources play simultaneously with:
- Independent volume controls
- A/B switching with crossfade
- Waveform visualization showing differences

## 17. Future UI Enhancements (Post-MVP)

1. **Waveform Display**: Visual representation during playback
2. **Album Art**: Show posters/ticket stubs for shows
3. **Timeline View**: Visual timeline of all shows
4. **Comparison Mode**: Side-by-side different sources
5. **Social Features**: Share setlists, rate shows
6. **Visualization**: Song frequency heat maps
7. **Mobile Companion**: Simplified browse/play interface
8. **Theme Editor**: Custom color schemes
