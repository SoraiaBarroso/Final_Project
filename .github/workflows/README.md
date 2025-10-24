# GitHub Actions Workflows

This directory contains automated workflows for the Final Project application.

## Daily Data Scraper Workflow

**File:** `daily-data-scraper.yml`

Automates the daily execution of data scraping and processing scripts to keep student data fresh and up-to-date.

### Features

- **Scheduled Execution**: Runs automatically every day at 6 AM UTC
- **Manual Trigger**: Can be triggered manually with customizable options
- **Multiple Modes**: Supports full pipeline, quick updates, or data-only processing
- **Optional Web Scraping**: Choose whether to scrape fresh data from Qwasar or use existing data
- **Error Handling**: Uploads logs on failure for debugging
- **Security**: Cleans up sensitive files after execution

### Schedule

```yaml
schedule:
  - cron: '0 6 * * *'  # Runs daily at 6 AM UTC
```

To adjust the schedule, modify the cron expression:
- `0 6 * * *` = 6 AM UTC daily
- `0 */6 * * *` = Every 6 hours
- `0 0 * * 0` = Weekly on Sunday at midnight
- `0 0 1 * *` = Monthly on the 1st at midnight

### Manual Execution Options

You can manually trigger the workflow from the GitHub Actions tab with these options:

1. **Scrape Mode**:
   - `full`: Complete pipeline (data + management + analytics)
   - `quick`: Fast update (management + analytics only)
   - `data-only`: Data processing only

2. **Enable Scraping**:
   - `true`: Scrape fresh data from Qwasar (slower, ~5-10 minutes)
   - `false`: Use existing data (faster, ~1-2 minutes)

### Required GitHub Secrets

Before the workflow can run, you must configure the following secrets in your GitHub repository:

#### How to Add Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add each of the following secrets:

#### Secret Configuration

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_KEY` | Supabase anonymous/public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_ROLE_KEY` | Supabase service role key (admin access) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SCRAPER_USERNAME` | Qwasar platform username for scraping | `your.email@example.com` |
| `SCRAPER_PASSWORD` | Qwasar platform password for scraping | `YourSecurePassword123` |

#### Finding Your Supabase Keys

1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **API**
3. Copy the following values:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public** key → `SUPABASE_KEY`
   - **service_role** key → `SUPABASE_ROLE_KEY`

**⚠️ Important**: Never commit these values directly to your code. Always use GitHub Secrets.

### Workflow Steps

The workflow performs the following steps:

1. **Checkout Repository**: Gets the latest code
2. **Setup Python**: Installs Python 3.11 with dependency caching
3. **Install Dependencies**: Installs required Python packages
4. **Create .env File**: Generates environment file from secrets
5. **Run Scraper**: Executes the appropriate scraping mode
6. **Clean Up**: Removes sensitive files
7. **Upload Logs**: (On failure) Saves logs for debugging
8. **Notify**: (On failure) Creates error notification

### Script Execution Modes

#### Scheduled Run (Daily at 6 AM UTC)
```bash
python main.py --full --scrape
```
Runs the complete pipeline with fresh web scraping.

#### Manual Run - Full Pipeline
```bash
# With scraping
python main.py --full --scrape

# Without scraping
python main.py --full
```

#### Manual Run - Quick Update
```bash
python main.py --quick
```
Updates student management and analytics without data processing.

#### Manual Run - Data Only
```bash
# With scraping
python main.py --data --scrape

# Without scraping
python main.py --data
```

### Monitoring

#### View Workflow Runs

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. Select **Daily Data Scraper** workflow
4. View run history and logs

#### Check for Failures

- Failed runs will have a ❌ red indicator
- Click on the failed run to view detailed logs
- Download artifacts for additional debugging information

#### Success Indicators

- Successful runs will have a ✅ green indicator
- Check the logs to verify data was processed correctly
- Verify data updates in your Supabase dashboard

### Troubleshooting

#### Common Issues

1. **Authentication Errors**
   - Verify all GitHub Secrets are correctly configured
   - Check that Supabase keys haven't expired
   - Ensure Qwasar credentials are valid

2. **Import Errors**
   - Dependencies might be missing from requirements
   - Check Python version compatibility (3.11)

3. **Database Connection Errors**
   - Verify Supabase URL is correct
   - Check network connectivity from GitHub Actions
   - Ensure Supabase project is active

4. **Scraping Failures**
   - Qwasar platform might have changed structure
   - Check if Qwasar credentials are still valid
   - Review scraping script for compatibility

#### Debugging Failed Runs

1. Click on the failed workflow run
2. Expand each step to view detailed logs
3. Download artifacts (if available) for additional context
4. Check the specific error messages in the logs
5. Verify GitHub Secrets are properly set

### Local Testing

Before pushing changes, test the workflow locally:

```bash
# Navigate to scripts directory
cd scripts

# Create .env file with your credentials
cat << EOF > .env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_ROLE_KEY=your_supabase_service_role_key
SCRAPER_USERNAME=your_qwasar_username
SCRAPER_PASSWORD=your_qwasar_password
EOF

# Install dependencies
pip install supabase python-dotenv requests beautifulsoup4

# Test the pipeline
python main.py --full --scrape

# Clean up
rm .env
```

### Security Best Practices

1. **Never commit credentials**: Always use GitHub Secrets
2. **Use service role carefully**: Only for administrative operations
3. **Rotate credentials regularly**: Update secrets periodically
4. **Review logs**: Check for exposed sensitive information
5. **Limit access**: Control who can trigger manual workflows

### Performance Optimization

#### Reduce Execution Time

1. **Use quick mode** for frequent updates:
   ```yaml
   - cron: '0 */3 * * *'  # Every 3 hours
   python main.py --quick
   ```

2. **Skip scraping** during off-peak hours:
   ```bash
   python main.py --full  # Without --scrape flag
   ```

3. **Split operations**:
   - Data processing during night (with scraping)
   - Quick updates during day (without scraping)

#### Recommended Schedule

```yaml
# Full scraping once daily
- cron: '0 6 * * *'
  python main.py --full --scrape

# Quick updates every 3 hours
- cron: '0 */3 * * *'
  python main.py --quick
```

### Cost Considerations

GitHub Actions provides:
- **2,000 minutes/month** for free on public repositories
- **Additional minutes** for private repositories (varies by plan)

Estimated usage:
- Full pipeline with scraping: ~5-10 minutes
- Full pipeline without scraping: ~2-3 minutes
- Quick update: ~1 minute

Monthly estimate (daily full scraping):
- 30 days × 10 minutes = **300 minutes/month**

### Advanced Configuration

#### Add Slack/Email Notifications

Add a notification step at the end of the workflow:

```yaml
- name: Notify on completion
  if: always()
  run: |
    # Add your notification logic here
    # Example: Send to Slack webhook, email service, etc.
```

#### Add Data Validation

Add a validation step after scraping:

```yaml
- name: Validate data
  working-directory: ./scripts
  run: |
    python -c "from analytics import Analytics; a = Analytics(); a.show_stats()"
```

#### Conditional Execution

Run different modes based on day of week:

```yaml
- name: Weekend full scrape
  if: github.event.schedule == '0 6 * * 0'
  run: python main.py --full --scrape

- name: Weekday quick update
  if: github.event.schedule == '0 6 * * 1-5'
  run: python main.py --quick
```

### Support

For issues with:
- **Workflow configuration**: Check this documentation
- **Python scripts**: See `scripts/README.md`
- **GitHub Actions**: Visit [GitHub Actions documentation](https://docs.github.com/en/actions)
- **Supabase**: Visit [Supabase documentation](https://supabase.com/docs)

### Changelog

#### v1.0.0 (Initial Release)
- Daily scheduled execution at 6 AM UTC
- Manual trigger with multiple modes
- Comprehensive error handling and logging
- Secure credential management with GitHub Secrets
