# SCRIPT 2 ADD MISSING INFO TO STUDENT TABLE, LAST_LOGIN, CURRENT_SEASON_ID, IMG_URL
import json
from supabase import create_client, Client
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
import re

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- Helper Function to Map Season Names ---
def map_season_name_to_db(season_name):
    """
    Map scraped season names to database season names
    Now that the database has full names with language variants, we need to map correctly
    """
    if not season_name:
        return season_name
    
    season_name = season_name.strip()
    
    # Handle Season 03 Software Engineer variations with specific language mappings
    if re.match(r'Season 03 Software Engineer', season_name, re.IGNORECASE):
        # Map specific language variants
        if 'Cpp' in season_name:
            return "Season 03 Software Engineer Cpp"
        elif 'Rust' in season_name:
            return "Season 03 Software Engineer Rust"
        elif 'Golang' in season_name or 'Go' in season_name:
            return "Season 03 Software Engineer Go"
        else:
            # If it's just "Season 03 Software Engineer" without specific language,
            # we can't map it properly, so return as-is
            print(f"Warning: Found '{season_name}' but no specific language variant.")
            return season_name
    
    # For other seasons, return as-is since they should match the database exactly
    return season_name

# --- Helper Function to Convert Relative Time to Timestamp ---
def parse_relative_time_to_timestamp(relative_time_str):
    """
    Convert relative time strings like '3 days ago', 'a month ago', '30 days ago' 
    to actual timestamps
    """
    if not relative_time_str:
        return None
    
    # Current timestamp
    now = datetime.now()
    
    # Clean the string and make it lowercase
    time_str = relative_time_str.lower().strip()
    
    # Parse different formats
    if 'day' in time_str:
        # Extract number of days
        numbers = re.findall(r'\d+', time_str)
        if numbers:
            days = int(numbers[0])
        elif 'a day' in time_str:
            days = 1
        else:
            days = 0
        
        timestamp = now - timedelta(days=days)
        
    elif 'month' in time_str:
        # Extract number of months
        numbers = re.findall(r'\d+', time_str)
        if numbers:
            months = int(numbers[0])
        elif 'a month' in time_str:
            months = 1
        else:
            months = 0
        
        # Approximate months as 30 days each
        days = months * 30
        timestamp = now - timedelta(days=days)
        
    elif 'week' in time_str:
        # Extract number of weeks
        numbers = re.findall(r'\d+', time_str)
        if numbers:
            weeks = int(numbers[0])
        elif 'a week' in time_str:
            weeks = 1
        else:
            weeks = 0
        
        timestamp = now - timedelta(weeks=weeks)
        
    elif 'year' in time_str:
        # Extract number of years
        numbers = re.findall(r'\d+', time_str)
        if numbers:
            years = int(numbers[0])
        elif 'a year' in time_str:
            years = 1
        else:
            years = 0
        
        # Approximate years as 365 days each
        days = years * 365
        timestamp = now - timedelta(days=days)
        
    elif 'hour' in time_str:
        # Extract number of hours
        numbers = re.findall(r'\d+', time_str)
        if numbers:
            hours = int(numbers[0])
        elif 'an hour' in time_str:
            hours = 1
        else:
            hours = 0
        
        timestamp = now - timedelta(hours=hours)
        
    else:
        # Default to current time if we can't parse it
        timestamp = now
    
    # Return as ISO format string for Supabase
    return timestamp.isoformat()


# Load scraped data from a JSON file in the 'public' folder
with open('public/student_grades.json', 'r', encoding='utf-8') as f:
    scraped_data_example = json.load(f)

print("Total students found:", len(scraped_data_example))

# Array to store all student information
students_data = []

# Process each student in the list
for student in scraped_data_example:
    # Skip the last_modified entry
    if 'last_modified' in student and len(student) == 1:
        continue
        
    username = student.get("name")
    profile_img_url = student.get("img")
    last_login_str = student.get("last_log_in")
    seasons = student.get("seasons")
    
    # Convert relative time to timestamp
    last_login_timestamp = parse_relative_time_to_timestamp(last_login_str)

    # Determine current season based on the seasons data
    current_season = None
    if seasons:
        current_season = list(seasons.keys())[-1]
        print(f"All seasons completed, using last season: {current_season}")
    
    # Create student data object
    student_data = {
        "username": username,
        "profile_img_url": profile_img_url,
        "last_login": last_login_timestamp,
        "last_login_original": last_login_str,  # Keep original for reference
        "current_season": current_season,
    }
    
    # Add to the array
    students_data.append(student_data)


# First, get all seasons from the database to create a mapping
print("Loading seasons from database...")
try:
    seasons_result = supabase.table('seasons').select('id, name').execute()
    season_mapping = {}
    
    if seasons_result.data:
        for season in seasons_result.data:
            season_mapping[season['name']] = season['id']
        print(f"Found {len(season_mapping)} seasons in database:")
        for name, uuid in season_mapping.items():
            print(f"  - {name}: {uuid}")
    else:
        print("No seasons found in database")
        
except Exception as e:
    print(f"Error loading seasons: {e}")
    season_mapping = {}

updated_count = 0
not_found_count = 0
error_count = 0
not_found_students = []

for student_data in students_data:
    username = student_data['username']
    
    try:
        # First, check if student exists in the database
        existing_student = supabase.table('students').select('*').eq('username', username).execute()
        
        if existing_student.data:
            student_id = existing_student.data[0]['id']
            print(f"\nFound student: {username} (ID: {student_id})")
            
            # Prepare update data (only update fields that are not null/empty)
            update_data = {}
            
            if student_data['profile_img_url']:
                update_data['profile_image_url'] = student_data['profile_img_url']
                
            if student_data['last_login']:
                update_data['last_login'] = student_data['last_login']
                
            # Look up season UUID if current_season exists
            if student_data['current_season']:
                original_season_name = student_data['current_season']
                mapped_season_name = map_season_name_to_db(original_season_name)
                
                # Try mapped name first, then original name
                season_uuid = None
                if mapped_season_name in season_mapping:
                    season_uuid = season_mapping[mapped_season_name]
                    print(f"  - Mapped season '{original_season_name}' -> '{mapped_season_name}' to UUID: {season_uuid}")
                elif original_season_name in season_mapping:
                    season_uuid = season_mapping[original_season_name]
                    print(f"  - Mapped season '{original_season_name}' to UUID: {season_uuid}")
                else:
                    print(f"  - Warning: Season '{original_season_name}' (mapped: '{mapped_season_name}') not found in database")
                
                if season_uuid:
                    update_data['current_season_id'] = season_uuid
            
            # Update the student record
            if update_data:
                result = supabase.table('students').update(update_data).eq('id', student_id).execute()
                
                if result.data:
                    updated_count += 1
                    print(f"  ✓ Updated fields: {list(update_data.keys())}")
                else:
                    error_count += 1
                    print(f"  ✗ Failed to update student")
            else:
                print(f"  - No data to update (all fields empty)")
                
        else:
            not_found_count += 1
            not_found_students.append(username)
            print(f"\n✗ Student not found in database: {username}")
            
    except Exception as e:
        error_count += 1
        print(f"\n✗ Error processing {username}: {str(e)}")

# Summary
print("\n" + "="*50)
print("UPDATE SUMMARY")
print("="*50)
print(f"Successfully updated: {updated_count} students")
print(f"Not found in database: {not_found_count} students")
print(f"Errors encountered: {error_count} students")
print(f"Total processed: {len(students_data)} students")
print(f"Students not found: {not_found_students}")
