# Frontend Updates for New Status System

This guide provides all the code changes needed to update the frontend to work with the new student status system.

## Summary of Changes

**Old Status Values:** On Track, Behind, Ahead, Unknown
**New Status Values:** On Track, Monitor, At Risk, Unknown

**Database Column Changes:**
- `progress_snapshots.behind` → `progress_snapshots.at_risk`
- `progress_snapshots.ahead` → `progress_snapshots.monitor`

---

## 1. Update StudentsTable.vue

**File:** `components/StudentsTable.vue`

### Change 1: Update Status Badge Colors (Lines 118-123)

**OLD:**
```javascript
const color =
  {
    "On Track": "success",
    Behind: "error",
    Ahead: "info",
  }[row.getValue("status")] || "neutral";
```

**NEW:**
```javascript
const color =
  {
    "On Track": "success",
    "At Risk": "error",
    Monitor: "warning",
  }[row.getValue("status")] || "neutral";
```

### Change 2: Update Status Filter Dropdown (Lines 226-240)

**OLD:**
```javascript
<USelect
  size="md"
  v-model="statusFilter"
  :items="[
    { label: 'All', value: 'all' },
    { label: 'On Track', value: 'on track' },
    { label: 'Behind', value: 'behind' },
    { label: 'Ahead', value: 'ahead' },
  ]"
  :ui="{
    trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
  }"
  placeholder="Filter status"
  class="min-w-52"
/>
```

**NEW:**
```javascript
<USelect
  size="md"
  v-model="statusFilter"
  :items="[
    { label: 'All', value: 'all' },
    { label: 'On Track', value: 'on track' },
    { label: 'Monitor', value: 'monitor' },
    { label: 'At Risk', value: 'at risk' },
  ]"
  :ui="{
    trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
  }"
  placeholder="Filter status"
  class="min-w-52"
/>
```

---

## 2. Update Admin Dashboard

**File:** `pages/admin/dashboard.vue`

### Change 1: Update Mock Data (Lines 28-29)

**OLD:**
```javascript
{
  id: 2,
  status: "Behind",
  username: "janesmith",
  ...
}
```

**NEW:**
```javascript
{
  id: 2,
  status: "At Risk",
  username: "janesmith",
  ...
}
```

### Change 2: Update Status Cards (Lines 152-171)

**Replace "BEHIND" card with "AT RISK" card:**

**OLD:**
```vue
<StudentStatCard
  title="BEHIND"
  :count="data.filter((item) => item.status === 'Behind').length"
  icon="i-pajamas:status-alert"
  icon-color="error"
  :change="snapshotChange?.behind_change"
  :percent-change="snapshotChange?.behind_pct_change"
  :invert-colors="true"
  rounded-class="rounded-lg xl:rounded-none lg:rounded-none"
/>
```

**NEW:**
```vue
<StudentStatCard
  title="AT RISK"
  :count="data.filter((item) => item.status === 'At Risk').length"
  icon="i-pajamas:status-alert"
  icon-color="error"
  :change="snapshotChange?.at_risk_change"
  :percent-change="snapshotChange?.at_risk_pct_change"
  :invert-colors="true"
  rounded-class="rounded-lg xl:rounded-none lg:rounded-none"
/>
```

**Replace "AHEAD" card with "MONITOR" card:**

**OLD:**
```vue
<StudentStatCard
  title="AHEAD"
  :count="data.filter((item) => item.status === 'Ahead').length"
  icon="i-pajamas:rocket-launch"
  icon-color="info"
  :change="snapshotChange?.ahead_change"
  :percent-change="snapshotChange?.ahead_pct_change"
  rounded-class="rounded-lg xl:rounded-none xl:rounded-r-lg lg:rounded-l-none"
/>
```

**NEW:**
```vue
<StudentStatCard
  title="MONITOR"
  :count="data.filter((item) => item.status === 'Monitor').length"
  icon="i-pajamas:eye"
  icon-color="warning"
  :change="snapshotChange?.monitor_change"
  :percent-change="snapshotChange?.monitor_pct_change"
  rounded-class="rounded-lg xl:rounded-none xl:rounded-r-lg lg:rounded-l-none"
/>
```

**Note:** You may need to choose a different icon for "Monitor". Suggested alternatives:
- `i-pajamas:eye` - Eye icon (monitoring)
- `i-pajamas:warning` - Warning icon
- `i-pajamas:issues` - Issues icon
- `i-lucide-eye` - Lucide eye icon
- `i-lucide-bell` - Bell/notification icon

---

## 3. Update Analytics Script

**File:** `scripts/analytics.py`

### Change: Update Status Counting (Lines 36-37, 46-47)

**OLD:**
```python
on_track = sum(1 for s in students if s.get('status') == 'On Track')
behind = sum(1 for s in students if s.get('status') == 'Behind')
ahead = sum(1 for s in students if s.get('status') == 'Ahead')

# ...

snapshot = {
    "total_students": total_students,
    "on_track": on_track,
    "behind": behind,
    "ahead": ahead
}
```

**NEW:**
```python
on_track = sum(1 for s in students if s.get('status') == 'On Track')
at_risk = sum(1 for s in students if s.get('status') == 'At Risk')
monitor = sum(1 for s in students if s.get('status') == 'Monitor')

# Handle students with no status or other statuses
untracked = total_students - (on_track + at_risk + monitor)

# Create snapshot record
snapshot = {
    "total_students": total_students,
    "on_track": on_track,
    "at_risk": at_risk,
    "monitor": monitor
}
```

### Change: Update Print Statements (Lines 56-57)

**OLD:**
```python
print(f"  Behind: {behind} ({(behind/total_students*100):.1f}%)")
print(f"  Ahead: {ahead} ({(ahead/total_students*100):.1f}%)")
```

**NEW:**
```python
print(f"  At Risk: {at_risk} ({(at_risk/total_students*100):.1f}%)")
print(f"  Monitor: {monitor} ({(monitor/total_students*100):.1f}%)")
```

---

## 4. Update Snapshot API Endpoint

**File:** `server/api/snapshot.js`

### Change: Update Column References (Lines 29-30, 49-52)

**OLD:**
```javascript
behind_pct_change: null,
ahead_pct_change: null,

// ...

behind_change: latest.behind - previous.behind,
behind_pct_change: pctChange(latest.behind, previous.behind),
ahead_change: latest.ahead - previous.ahead,
ahead_pct_change: pctChange(latest.ahead, previous.ahead),
```

**NEW:**
```javascript
at_risk_pct_change: null,
monitor_pct_change: null,

// ...

at_risk_change: latest.at_risk - previous.at_risk,
at_risk_pct_change: pctChange(latest.at_risk, previous.at_risk),
monitor_change: latest.monitor - previous.monitor,
monitor_pct_change: pctChange(latest.monitor, previous.monitor),
```

---

## 5. Update Database Schema for progress_snapshots

**Run in Supabase SQL Editor:**

```sql
-- Rename columns in progress_snapshots table
ALTER TABLE progress_snapshots
  RENAME COLUMN behind TO at_risk;

ALTER TABLE progress_snapshots
  RENAME COLUMN ahead TO monitor;

-- Verify the change
SELECT * FROM progress_snapshots ORDER BY snapshot_date DESC LIMIT 5;
```

---

## 6. Other Files to Check

Search for any other references to old status values:

```bash
# Search for hard-coded status references
grep -r "Behind\|Ahead" --include="*.vue" --include="*.js" --include="*.ts" pages/ components/ server/

# Search for status enum definitions
grep -r "status.*enum\|status.*type" --include="*.vue" --include="*.js" --include="*.ts" .
```

Files that may need attention:
- Any status badge/chip components
- Student detail pages
- Reports or analytics dashboards
- Email templates or notifications
- API validation schemas
- TypeScript type definitions

---

## Testing Checklist

After making these changes:

1. ✅ Run the new PostgreSQL function to update student statuses
2. ✅ Run analytics script to create a new snapshot
3. ✅ Verify admin dashboard displays correct counts
4. ✅ Test status filter dropdown in students table
5. ✅ Check status badge colors (should show warning color for Monitor, error for At Risk)
6. ✅ Verify snapshot API returns correct field names
7. ✅ Check student detail pages display correct status
8. ✅ Test that status cards show trend data correctly

---

## Quick Command Reference

```bash
# 1. Update PostgreSQL function (in Supabase SQL Editor)
# Paste contents of: scripts/update_student_status_function.sql

# 2. Migrate existing student status values (in Supabase SQL Editor)
# Paste contents of: scripts/migration_new_status_values.sql

# 3. Update progress_snapshots table schema (in Supabase SQL Editor)
ALTER TABLE progress_snapshots RENAME COLUMN behind TO at_risk;
ALTER TABLE progress_snapshots RENAME COLUMN ahead TO monitor;

# 4. Run student management script to update statuses
python scripts/student_management.py --all

# 5. Run analytics to create new snapshot
python scripts/analytics.py --snapshot

# 6. Restart your dev server
npm run dev
```

---

## Color Scheme Reference

For consistent UI styling:

- **🟢 On Track** (≥70%): `color="success"` - Green
- **🟡 Monitor** (50-69%): `color="warning"` - Yellow/Orange
- **🔴 At Risk** (<50%): `color="error"` - Red
- **⚪ Unknown**: `color="neutral"` - Gray

Icon colors in StudentStatCard component automatically map:
- `success` → green
- `warning` → yellow
- `error` → red
- `info` → blue
- `neutral` → gray
