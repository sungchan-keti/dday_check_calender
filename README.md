# D-day Calendar Tracker

A static web app for tracking D-day goals with a visual calendar. Set start and target dates, mark each day with an `X`, and monitor your progress at a glance.

## Features

- **Multiple Goals** — Add, switch, and delete goals using a tab-based UI
- Set goal name, start date, and D-day target date
- Per-date `D-N / D+N / D-DAY` countdown display
- Toggle daily `X` marks on the calendar
- Visual indicators for today, D-day, and checked dates
- Summary cards for progress rate, remaining days, and cumulative checks
- Auto-save to `localStorage` (saves on every input change)

## Getting Started

### Option 1: Open directly
Open `index.html` in any modern browser.

### Option 2: Local server

```bash
python -m http.server 4173
```

Then visit:

```text
http://localhost:4173
```

## File Structure

- `index.html` — App layout (goal tabs, settings panel, calendar, summary cards)
- `style.css` — Dark theme UI styles with glassmorphism effects
- `app.js` — Multi-goal management, D-day calculation, calendar rendering, check persistence
