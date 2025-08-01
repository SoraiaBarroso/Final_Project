# populate the project completion table for every students
import json
from supabase import create_client, Client
from datetime import datetime
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Supabase Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in the .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Load scraped data from a JSON file in the 'public' folder
try:
    with open('public/student_grades.json', 'r', encoding='utf-8') as f:
        scraped_data_list = json.load(f)
except FileNotFoundError:
    print("Error: 'public/student_grades.json' not found. Please ensure the file exists.")
    exit()
except json.JSONDecodeError:
    print("Error: Could not decode 'public/student_grades.json'. Check for valid JSON format.")
    exit()

def populate_student_project_completion(scraped_data):
    print("Starting population of student_project_completion table...")

    # 1. Fetch all student IDs and their usernames for lookup
    try:
        response = supabase.from_('students').select('id, username').execute()
        student_id_map = {row['username']: row['id'] for row in response.data}
        print(f"Fetched {len(student_id_map)} students for lookup.")
    except Exception as e:
        print(f"Error fetching students: {e}")
        return

    # 2. Fetch all project IDs and their names for lookup
    try:
        response = supabase.from_('projects').select('id, name').execute()
        project_id_map = {row['name']: row['id'] for row in response.data}
        print(f"Fetched {len(project_id_map)} projects for lookup.")
    except Exception as e:
        print(f"Error fetching projects: {e}")
        return

    # Dictionary to store unique records (key: (student_id, project_id), value: record)
    # This will automatically handle duplicates and prioritize completed projects
    records_dict = {}

    for student_data in scraped_data:
        student_username = student_data.get("name")
        if not student_username:
            print(f"Skipping record due to missing 'name': {student_data}")
            continue

        student_id = student_id_map.get(student_username)

        if not student_id:
            print(f"Warning: Student '{student_username}' not found in the database. Skipping project completion for this student.")
            continue

        # Process completed projects first (these will take priority)
        for project_name in student_data.get("completed_projects", []):
            project_id = project_id_map.get(project_name)
            if project_id:
                key = (student_id, project_id)
                records_dict[key] = {
                    "student_id": student_id,
                    "project_id": project_id,
                    "is_completed": True,
                    "completion_date": datetime.now().date().isoformat() # Using current date for simplicity
                }
            else:
                print(f"Warning: Project '{project_name}' not found in 'projects' table for student '{student_username}'.")

        # Process ongoing projects (only add if not already marked as completed)
        for project_name in student_data.get("ongoing_projects", []):
            project_id = project_id_map.get(project_name)
            if project_id:
                key = (student_id, project_id)
                # Only add if this project is not already marked as completed
                if key not in records_dict:
                    records_dict[key] = {
                        "student_id": student_id,
                        "project_id": project_id,
                        "is_completed": False,
                        "completion_date": None # No completion date for ongoing projects
                    }
                else:
                    print(f"Info: Project '{project_name}' for student '{student_username}' is in both completed and ongoing lists. Keeping as completed.")
            else:
                print(f"Warning: Project '{project_name}' not found in 'projects' table for student '{student_username}'.")

    # Convert dictionary values to list for upsert
    records_to_upsert = list(records_dict.values())

    # Perform bulk upsert for student_project_completion
    if records_to_upsert:
        print(f"Attempting to upsert {len(records_to_upsert)} student project completion records...")
        try:
            response = supabase.from_('student_project_completion').upsert(
                records_to_upsert,
                on_conflict="student_id, project_id"
            ).execute()
            print("Student project completion data upserted successfully.")
        except Exception as e:
            print(f"Error upserting student project completion data: {e}")
    else:
        print("No student project completion records to upsert.")

if __name__ == "__main__":
    populate_student_project_completion(scraped_data_list)
    print("\nScript finished. Only student project completion data was processed.")