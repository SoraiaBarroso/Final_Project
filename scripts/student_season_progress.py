import json
from supabase import create_client, Client
from datetime import datetime
from dotenv import load_dotenv
import os
import re

# Load environment variables from .env file
load_dotenv()

# --- Supabase Configuration ---
# Replace with your actual Supabase URL and Key
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://example.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'YOUR_SUPABASE_KEY')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- Your Scraped Data Example (REPLACE THIS WITH YOUR ACTUAL SCRAPED DATA) ---
# Load scraped data from a JSON file in the 'public' folder
with open('public/student_grades.json', 'r', encoding='utf-8') as f:
    scraped_data_example = json.load(f)

def map_season_name_to_db(season_name):
    """Map scraped season names to database season names"""
    season_name = season_name.strip()
    
    # Handle Season 03 Software Engineer variations (cpp, rust, golang, etc.)
    if re.match(r'Season 03 Software Engineer', season_name, re.IGNORECASE):
        return "Season 03 Software Engineer"
    
    # Handle other specific mappings based on what exists in the database
    mappings = {
        'Preseason Data': 'Preseason Data',  # Keep as-is, exists in DB
        'Preseason Web': 'Preseason Web',   # Keep as-is, exists in DB
        'Season 02 Data Science': 'Season 02 Data Science',
        'Season 02 Software Engineer': 'Season 02 Software Engineer',
        'Season 03 Data Science': 'Season 03 Data Science',
        'Season 03 Machine Learning': 'Season 03 Machine Learning'
    }
    
    # Check for exact matches first
    if season_name in mappings:
        return mappings[season_name]
    
    # For Onboarding, we'll skip it since it doesn't exist in the database
    if season_name == 'Onboarding':
        return None  # Signal to skip this season
    
    # Return as-is for other seasons (like Season 01 Arc 01, etc.)
    return season_name

def populate_student_season_progress(scraped_data):
    print(f"Processing {len(scraped_data)} students...")
    
    for student_data in scraped_data:
        username = student_data.get('name')
        if not username:
            print(f"Skipping entry due to missing username: {student_data}")
            continue

        # 1. Find Student ID and Program ID
        # We need program_id to correctly look up season_id, as season names can be duplicated across programs
        try:
            student_info_response = supabase.from_('students').select('id, program_id').eq('username', username).single().execute()
            student_info = student_info_response.data
            if not student_info:
                print(f"Student with username '{username}' not found in 'students' table. Skipping season progress for this student.")
                continue
            student_id = student_info['id']
            program_id = student_info['program_id']

        except Exception as e:
            print(f"Error fetching student info for '{username}': {e}")
            continue

        # 2. Process Seasons Progress
        seasons_progress = student_data.get('seasons', {})
        for season_name_raw, progress_str in seasons_progress.items():
            original_season_name = season_name_raw.strip()
            season_name = map_season_name_to_db(original_season_name) # Map to database season name
            
            # Skip if season should be ignored (like Onboarding)
            if season_name is None:
                print(f"Skipping season '{original_season_name}' for student '{username}' (not in database)")
                continue
                
            print(f"Mapping '{original_season_name}' -> '{season_name}' for student '{username}'")
            
            try:
                progress_percentage = float(progress_str.strip('%'))
            except ValueError:
                print(f"Warning: Invalid progress percentage '{progress_str}' for student '{username}', season '{season_name}'. Skipping.")
                continue

            # Find the season_id for the specific program
            try:
                season_response = supabase.from_('seasons').select('id').eq('name', season_name).eq('program_id', program_id).single().execute()
                season_info = season_response.data
                if not season_info:
                    print(f"Season '{season_name}' not found for program ID '{program_id}'. Skipping progress for student '{username}'. Ensure seasons are pre-populated correctly.")
                    continue
                season_id = season_info['id']

            except Exception as e:
                print(f"Error fetching season info for '{season_name}' (Program ID: {program_id}): {e}. Skipping progress for student '{username}'.")
                continue

            # Prepare data for UPSERT
            is_completed = (progress_percentage == 100.0)
            upsert_data = {
                'student_id': student_id,
                'season_id': season_id,
                'progress_percentage': progress_percentage,
                'is_completed': is_completed,
                'updated_at': datetime.now().isoformat()
            }

            # If it's completed and wasn't before, set completion_date
            # This requires fetching the old record first, or handling in a DB trigger/function
            # For simplicity here, we'll set completion_date if it's completed.
            if is_completed:
                upsert_data['completion_date'] = datetime.now().strftime('%Y-%m-%d')

            try:
                # Perform UPSERT (insert or update)
                response = supabase.from_('student_season_progress').upsert(
                    upsert_data,
                    on_conflict='student_id,season_id'
                ).execute()
                print(f"Upserted progress for student '{username}' in season '{season_name}'.")

            except Exception as e:
                print(f"Error upserting student season progress for '{username}' in season '{season_name}': {e}")

# To run this script:
# 1. Replace YOUR_SUPABASE_URL and YOUR_SUPABASE_KEY.
# 2. Replace scraped_data_example with your actual data.
# 3. Ensure you have the 'supabase-py' library installed (`pip install supabase`).
# 4. Run it using `python your_script_name.py` (or `python -m asyncio your_script_name.py` if not in an async context).
#    If running directly, you'd typically wrap the async call:
#    import asyncio
#    asyncio.run(populate_student_season_progress(scraped_data_example))

if __name__ == "__main__":
    # Run the function
    populate_student_season_progress(scraped_data_example)
