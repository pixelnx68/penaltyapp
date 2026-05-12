# Delete Penalty Feature

## Overview
Add the ability to delete a penalty entry from the Log page, with an undo button and confirmation dialog matching the existing Admin delete pattern.

## Backend

### New Server Action: `deletePenalty(id: string)`
- File: `src/lib/actions/penalties.ts`
- Accepts a penalty `_id` (string)
- Calls `deleteOne({ _id: new ObjectId(id) })` on the `penalties` collection
- Revalidates paths: `/`, `/log`, `/ledger`, `/payments`
- Error handling: logs and returns error on failure

## Frontend

### Log Page Changes (`src/app/log/page.tsx`)
- Replace the disabled green "Done" button with a red "Undo" button when a penalty exists for that player+date
- State: `confirmDelete: string | null` — holds the penalty `_id` to confirm
- On "Undo" tap: set `confirmDelete` to the penalty's `_id`
- Confirmation dialog: fixed overlay with `bg-black/40`, centered white card, "Delete this penalty?" message, Cancel + Delete buttons (matching Admin pattern)
- On confirm: call `deletePenalty(confirmDelete)`, clear state, re-fetch daily penalties, show success toast
- On cancel: clear `confirmDelete`, no action
- Row reverts to "Late" state after successful deletion

## UX Patterns Followed
- Confirmation dialog with cancel/delete buttons (matches Admin page at `src/app/admin/page.tsx`)
- Toast notification on success
- Same styling conventions (rounded-lg, border, spacing)
- Double-tap prevention via pending state on undo button
