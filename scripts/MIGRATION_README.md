# Student Status System Migration - Complete Guide

## 📋 Overview

This migration updates the student status system from a season-comparison approach to an engagement-percentage based approach.

### What's Changing?

**Old System:**
- Status determined by comparing current_season vs expected_season
- Values: `On Track`, `Behind`, `Ahead`, `Unknown`

**New System:**
- Status determined by engagement percentage in expected season
- Values: `On Track` (≥70%), `Monitor` (50-69%), `At Risk` (<50%), `Unknown`
- Special rule: Students who completed seasons ahead are automatically `On Track`

---

## 📁 Files Created

This migration includes 5 new files:

1. **`complete_migration.sql`** - All database changes in one script
2. **`update_student_status_function.sql`** - New PostgreSQL function (standalone)
3. **`migration_new_status_values.sql`** - Data migration only (standalone)
4. **`FRONTEND_UPDATES_GUIDE.md`** - Detailed frontend code changes
5. **`STATUS_UPDATE_MIGRATION_GUIDE.md`** - Comprehensive migration documentation

---

## 🚀 Quick Start - Complete Migration

Follow these steps in order:

### Step 1: Backup Your Data (5 minutes)

```bash
# Export current database state (optional but recommended)
# Use Supabase Dashboard → Database → Backups
```

### Step 2: Run Database Migration (10 minutes)

1. Open **Supabase Dashboard → SQL Editor**
2. Copy and paste contents of `scripts/complete_migration.sql`
3. Click "Run"
4. Review the output messages and verification queries

**What this does:**
- Renames `progress_snapshots` columns: `behind` → `at_risk`, `ahead` → `monitor`
- Migrates existing student status values
- Adds CHECK constraint for valid status values
- Replaces the PostgreSQL function with new logic
- Runs verification queries

### Step 3: Update Frontend Code (30 minutes)

Update the following files using instructions from `FRONTEND_UPDATES_GUIDE.md`:

**Required changes:**
1. ✅ `components/StudentsTable.vue` - Status colors and filters
2. ✅ `pages/admin/dashboard.vue` - Stat cards
3. ✅ `scripts/analytics.py` - Column names
4. ✅ `server/api/snapshot.js` - API field names

**Quick Reference:**
```bash
# Status value mappings
"Behind" → "At Risk"
"Ahead" → "Monitor"

# Database column mappings
behind → at_risk
ahead → monitor
```

### Step 4: Update Python Scripts (5 minutes)

The `student_management.py` script requires **no changes** - it already calls the updated function!

Just update `analytics.py` as described in the frontend guide.

### Step 5: Run Scripts to Update Data (5 minutes)

```bash
# Update all student statuses using new logic
python scripts/student_management.py --all

# Create a fresh progress snapshot
python scripts/analytics.py --snapshot
```

### Step 6: Test Everything (15 minutes)

```bash
# Start dev server
npm run dev

# Test checklist:
# ✅ Admin dashboard shows correct status counts
# ✅ Status filter dropdown has new values
# ✅ Status badges show correct colors (green/yellow/red)
# ✅ Student detail pages display correctly
# ✅ Trend charts show data
```

---

## 📊 Expected Results

After migration, you should see:

### Database Changes
- Student status values updated from `Behind`/`Ahead` to `At Risk`/`Monitor`
- Students with ≥70% engagement → `On Track`
- Students with 50-69% engagement → `Monitor`
- Students with <50% engagement → `At Risk`
- Students who completed ahead → `On Track`

### Frontend Changes
- Dashboard cards: "BEHIND" → "AT RISK", "AHEAD" → "MONITOR"
- New badge colors: Warning (yellow) for Monitor, Error (red) for At Risk
- Updated filter dropdowns with new status values

### API Changes
- Snapshot endpoint returns `at_risk_change` and `monitor_change` fields
- Old field names (`behind_change`, `ahead_change`) removed

---

## 🔍 Verification

### Check Student Status Distribution

```sql
SELECT
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
FROM students
GROUP BY status
ORDER BY status;
```

### Check Students Who Completed Ahead

```sql
SELECT
    s.username,
    s.status,
    expected_s.name as expected_season,
    COUNT(DISTINCT completed_s.id) as seasons_ahead
FROM students s
JOIN seasons expected_s ON s.expected_season_id = expected_s.id
JOIN student_season_progress ssp ON s.id = ssp.student_id
JOIN seasons completed_s ON ssp.season_id = completed_s.id
WHERE ssp.is_completed = true
  AND completed_s.order_in_program > expected_s.order_in_program
GROUP BY s.username, s.status, expected_s.name
ORDER BY seasons_ahead DESC;
```

### Check Engagement Distribution

```sql
SELECT
    s.status,
    ROUND(AVG(ssp.progress_percentage), 1) as avg_engagement,
    MIN(ssp.progress_percentage) as min_engagement,
    MAX(ssp.progress_percentage) as max_engagement
FROM students s
JOIN student_season_progress ssp
    ON s.id = ssp.student_id AND s.expected_season_id = ssp.season_id
GROUP BY s.status
ORDER BY s.status;
```

---

## ❗ Troubleshooting

### Issue: "Column 'behind' does not exist"
**Solution:** The `progress_snapshots` table columns were renamed. Make sure you ran `complete_migration.sql` first.

### Issue: Status shows "Unknown" for all students
**Possible causes:**
1. No `expected_season_id` set → Run `python scripts/student_management.py --seasons`
2. No progress data → Run the data scraping script (`scripts/data_processor.py`)
3. Function not updated → Re-run `complete_migration.sql`

### Issue: Frontend shows old status values
**Solution:**
1. Clear browser cache
2. Restart dev server (`npm run dev`)
3. Verify you updated all frontend files per the guide

### Issue: Snapshot API returns null values
**Solution:**
1. Create a new snapshot: `python scripts/analytics.py --snapshot`
2. Verify database columns were renamed correctly
3. Check API code matches the frontend guide

---

## 🔄 Rollback Plan

If you need to rollback (within backup retention period):

```sql
-- 1. Restore student statuses
UPDATE students s
SET status = backup.status
FROM students_status_migration_backup backup
WHERE s.id = backup.id;

-- 2. Restore progress_snapshots columns
ALTER TABLE progress_snapshots RENAME COLUMN at_risk TO behind;
ALTER TABLE progress_snapshots RENAME COLUMN monitor TO ahead;

-- 3. Restore old function (you'll need the old SQL)
```

**Note:** Save the old function SQL before running the migration!

---

## 📈 Monitoring After Migration

### Week 1: Close Monitoring
- Check status distribution daily
- Monitor "At Risk" students for intervention
- Verify automated scripts run successfully

### Week 2-4: Regular Monitoring
- Review "Monitor" status students weekly
- Validate engagement percentage accuracy
- Collect feedback from staff

### After 1 Month:
- Clean up backup table: `DROP TABLE students_status_migration_backup;`
- Document any edge cases discovered
- Update training materials

---

## 📚 Additional Resources

### Understanding New Status Levels

**🟢 On Track (≥70%)**
- Student meets or exceeds required engagement
- Actively participating in sessions
- No intervention needed

**🟡 Monitor (50-69%)**
- Below expectations but not critical
- Requires follow-up from mentors
- Watch for declining trends

**🔴 At Risk (<50%)**
- Significantly behind
- Immediate intervention required
- Schedule one-to-one meeting

**⚪ Unknown**
- Missing progress data
- No expected season assigned
- Needs data update

### Key Database Tables

- **`students`** - Main student record with status field
- **`student_season_progress`** - Progress percentage per season
- **`seasons`** - Season definitions with order_in_program
- **`progress_snapshots`** - Historical status trends

### Related Scripts

- **`student_management.py`** - Updates expected seasons and status
- **`analytics.py`** - Creates progress snapshots
- **`data_processor.py`** - Scrapes progress data from Qwasar

---

## ✅ Pre-Deployment Checklist

Before deploying to production:

- [ ] Database migration tested on staging
- [ ] All verification queries return expected results
- [ ] Frontend updated and tested locally
- [ ] Python scripts updated
- [ ] Backup created and verified
- [ ] Rollback plan documented and tested
- [ ] Team trained on new status definitions
- [ ] Documentation updated
- [ ] Stakeholders notified

---

## 🆘 Support

If you encounter issues during migration:

1. Check the troubleshooting section above
2. Review verification query results
3. Check application logs for errors
4. Refer to `STATUS_UPDATE_MIGRATION_GUIDE.md` for detailed explanations
5. Refer to `FRONTEND_UPDATES_GUIDE.md` for code examples

---

## 📝 Post-Migration Tasks

After successful migration:

1. **Update Documentation**
   - Admin training materials
   - Student handbook
   - API documentation

2. **Configure Alerts**
   - Set up notifications for "At Risk" students
   - Create weekly "Monitor" status reports

3. **Review Process**
   - Schedule weekly status review meetings
   - Define intervention procedures
   - Create follow-up workflows

4. **Data Quality**
   - Ensure progress data updates regularly
   - Verify season assignments are accurate
   - Monitor for edge cases

---

## 🎯 Success Metrics

Track these metrics post-migration:

- Student status distribution trends
- Intervention response time for "At Risk" students
- "Monitor" → "On Track" recovery rate
- Data quality (% of students with Unknown status)
- System performance (query execution time)

---

## 📞 Migration Summary

**Total Time Required:** ~1-2 hours
**Downtime Required:** None (can be done without interruption)
**Risk Level:** Low (all changes are reversible)
**Team Members Needed:** 1-2 (developer + QA)

**Files to Modify:**
- 1 database migration script
- 4 frontend files
- 2 Python scripts

**Testing Required:**
- Database integrity
- Frontend functionality
- API endpoints
- Python scripts

Good luck with your migration! 🚀
