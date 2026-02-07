# Scripts

Python scripts that scrape student data from Qwasar, update the database, and generate analytics.

## Files

- **`main.py`** - Runs everything in order
- **`data_processor.py`** - Scrapes Qwasar and updates student/project/season data
- **`student_management.py`** - Assigns expected seasons and updates student status
- **`update_points_assigned.py`** - Calculates attendance points
- **`analytics.py`** - Creates progress snapshots and reports
- **`utils.py`** - Shared helper functions
- **`update_attendance.py`** - Syncs attendance from Google Sheets
- **`update_slack_ids.js`** - Updates Slack IDs from CSV

## Setup

Install dependencies:
```bash
pip install supabase python-dotenv requests beautifulsoup4
```

Create a `.env` file:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_ROLE_KEY=your_supabase_service_role_key
SCRAPER_USERNAME=your_qwasar_username
SCRAPER_PASSWORD=your_qwasar_password
```

## Usage

### Run everything
```bash
python main.py --full                 # Full pipeline (uses existing data)
python main.py --full --scrape        # Full pipeline + scrape new data
python main.py --quick                # Just management + points + analytics
```

### Run individual scripts
```bash
python data_processor.py --all        # Scrape + update all data
python data_processor.py --scrape     # Only scrape
python data_processor.py --students   # Only update student data
python data_processor.py --projects   # Only update project completion
python data_processor.py --progress   # Only update season progress

python student_management.py --all    # Assign seasons + update status
python student_management.py --seasons
python student_management.py --status

python analytics.py --all --service-role
python analytics.py --snapshot
python analytics.py --stats
python analytics.py --report
```

### Update Slack IDs
```bash
node scripts/update_slack_ids.js
```
Reads from `scripts/user_slack_ids.csv` (format: `username,slack_id`).

## Pipeline order

```
1. data_processor.py    -> Scrape + process data
2. student_management.py -> Assign seasons + calculate status
3. update_points_assigned.py -> Calculate attendance points
4. analytics.py          -> Generate snapshots + reports
```

## Troubleshooting

- **Auth errors** - Check `.env` credentials
- **No students found** - Make sure you're using service role key
- **Scraping fails** - Check Qwasar username/password
- **Missing dependencies** - Run `pip install` again
