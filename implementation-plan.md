# Implementation Plan: Architecture Decomposition for 000-dashboard

## 1. Objectives
- Decompose monolithic `src/App.tsx` (1397 lines) into modular domain context providers, custom hooks, and isolated widget components.
- Ensure strict TypeScript typing and zero regressions in feature parity.
- Initialize local git repository and push to GitHub under repo name `000`.

## 2. Target Architecture Structure

```
src/
├── context/
│   ├── DashboardContext.tsx
│   ├── VaultContext.tsx
│   └── ToolsContext.tsx
├── hooks/
│   ├── useKeyboardShortcuts.ts
│   └── useSystemClock.ts
├── modules/
│   ├── registry.tsx
│   ├── groupA/ (A1-A7)
│   ├── groupB/ (B1-B8)
│   ├── groupC/ (C1-C7)
│   ├── groupD/ (D1-D8)
│   ├── groupE/ (E1-E8)
│   ├── groupF/ (F1-F7)
│   ├── groupG/ (G1-G6)
│   ├── groupH/ (H1-H10)
│   └── groupI/ (I1-I5)
├── components/
│   ├── layout/
│   │   ├── ModuleGrid.tsx
│   │   └── FloatingTools.tsx
│   └── modals/
│       ├── ModulePickerModal.tsx
│       ├── LayoutProfilesModal.tsx
│       ├── SpotlightModal.tsx
│       └── MasterPasswordModal.tsx
└── App.tsx
```

## 3. Verification Strategy
- TypeScript compilation: `tsc --noEmit`
- Vite build verification: `npm run build`
- Git verification & push: `gh repo create 000 --public --source=. --push`
