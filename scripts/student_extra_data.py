# SCRIPT 2 ADD MISSING INFO TO STUDENT TABLE, LAST_LOGIN, CURRENT_SEASON_ID, IMG_URL
import json
from supabase import create_client, Client
from datetime import datetime, timedelta
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

# --- Helper Function to Normalize Season Names ---
def normalize_season_name(season_name):
    """
    Normalize season names by removing language-specific suffixes
    Examples:
    - "Season 03 Software Engineer Cpp" -> "Season 03 Software Engineering"
    - "Season 02 Data Science" -> "Season 02 Data Science"
    - "Season 01 Arc 01" -> "Season 01 Arc 01"
    """
    if not season_name:
        return season_name
    
    # Common language suffixes to remove
    language_suffixes = [
        ' Cpp', ' C++', ' Python', ' JavaScript', ' Java', ' Go', ' Rust',
        ' TypeScript', ' PHP', ' Ruby', ' Swift', ' Golang'
    ]
    
    normalized = season_name
    
    # Remove language suffixes
    for suffix in language_suffixes:
        if normalized.endswith(suffix):
            normalized = normalized[:-len(suffix)]
            break
    
    # Don't change "Software Engineer" since that's what's in the database
    # normalized = normalized.replace("Software Engineer", "Software Engineering")
    
    return normalized

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


# --- Your Scraped Data Example (REPLACE THIS WITH YOUR ACTUAL SCRAPED DATA) ---
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

# # Print all students data
# print(f"\nProcessed {len(students_data)} students:")
# for i, student in enumerate(students_data, 1):
#     print(f"\n--- Student {i} ---")
#     print(f"Username: {student['username']}")
#     print(f"Profile Image URL: {student['profile_img_url']}")
#     print(f"Last Login (original): {student['last_login_original']}")
#     print(f"Last Login (timestamp): {student['last_login']}")
#     print(f"Current Season: {student['current_season']}")

# print(f"\nStudents data array contains {len(students_data)} students ready for database insertion.")

# --- Update Student Records in Database ---
print("\n" + "="*50)
print("UPDATING STUDENT RECORDS IN DATABASE")
print("="*50)

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
                normalized_season_name = normalize_season_name(original_season_name)
                
                # Try normalized name first, then original name
                season_uuid = None
                if normalized_season_name in season_mapping:
                    season_uuid = season_mapping[normalized_season_name]
                    print(f"  - Mapped season '{original_season_name}' -> '{normalized_season_name}' to UUID: {season_uuid}")
                elif original_season_name in season_mapping:
                    season_uuid = season_mapping[original_season_name]
                    print(f"  - Mapped season '{original_season_name}' to UUID: {season_uuid}")
                else:
                    print(f"  - Warning: Season '{original_season_name}' (normalized: '{normalized_season_name}') not found in database")
                
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

# This script:
# 1. Loads student data from the JSON file
# 2. Processes and structures the data
# 3. Finds existing students in the database by username
# 4. Updates the missing fields in the student table:
#    - current_season_id (derived from 'seasons' field)
#    - profile_image_url (from 'img' field)  
#    - last_login (from 'last_log_in' field)
#
# The students_data array contains all student information ready for database operations
# Each element in the array has the structure:
# {
#   "username": string,
#   "profile_img_url": string,
#   "last_login": string,
#   "current_season": string
# }