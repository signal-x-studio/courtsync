# Volleyball Photography Coverage Optimizer

A web application that helps event photographers optimize their coverage of volleyball matches by filtering and analyzing tournament schedules from Advanced Event Systems API based on their assigned volleyball club.

## Features

- **Match Filtering**: Automatically filters matches for 630 Volleyball teams (hard-coded club)
- **List View**: Detailed match list with conflict detection
- **Timeline View**: Visual timeline showing matches across courts
- **Conflict Detection**: Identifies overlapping matches that create scheduling conflicts
- **Export**: Export filtered schedules as JSON or CSV

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Usage

1. Enter the Event ID (default: `PTAwMDAwNDEzMTQ90`)
2. Select a date (default: `2025-11-01`)
3. Set the time window in minutes (default: `300`)
4. Click "Load Schedule" to fetch and filter matches
5. View matches in List or Timeline view
6. Export data as JSON or CSV

## Club Configuration

The app is currently hard-coded to filter matches for **630 Volleyball**. The filtering logic matches team names containing "630 Volleyball" or "630" in:
- First Team
- Second Team  
- Work Team (refereeing team)

## Technical Stack

- React 19 with TypeScript
- Vite for build tooling
- Tailwind CSS v4 for styling
- date-fns for date formatting
- Advanced Event Systems API for tournament data

## Project Structure

```
src/
├── components/
│   ├── EventInput.tsx      # Event configuration form
│   ├── MatchList.tsx        # List view of matches
│   └── TimelineView.tsx     # Timeline visualization
├── services/
│   └── api.ts              # API client
├── types/
│   └── index.ts            # TypeScript interfaces
├── utils/
│   ├── dateUtils.ts        # Date formatting utilities
│   └── matchFilters.ts     # Match filtering logic
└── App.tsx                 # Main application component
```

## API Endpoint

The app fetches data from:
```
https://results.advancedeventsystems.com/api/event/{eventId}/courts/{date}/{timeWindow}
```

## Notes

- Timestamps are in Unix milliseconds
- Match conflicts are detected when matches overlap in time
- The timeline view groups matches by court
- Division colors are used for visual distinction
