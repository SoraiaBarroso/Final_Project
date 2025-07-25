# Sets up the expected_season_id for students based on their cohort and program
import os
import json
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def update_expected_season_for_students():
    today = datetime.now().date().isoformat()
    # Get all students with cohort_id and program_id
    students = supabase.table('students').select('id, cohort_id, program_id').execute().data
    print(f"Found {len(students)} students.")

    for student in students:
        student_id = student['id']
        cohort_id = student.get('cohort_id')
        program_id = student.get('program_id')
        if not cohort_id or not program_id:
            print(f"Skipping student {student_id} (missing cohort_id or program_id)")
            continue

        # Find the matching program_cohort_season
        pcs = supabase.table('program_cohort_seasons').select('season_id, start_date, end_date') \
            .eq('cohort_id', cohort_id).eq('program_id', program_id).execute().data

        expected_season_id = None
        for row in pcs:
            if row['start_date'] <= today <= row['end_date']:
                expected_season_id = row['season_id']
                break

        if expected_season_id:
            # Update the student's expected_season_id
            result = supabase.table('students').update({'expected_season_id': expected_season_id}).eq('id', student_id).execute()
            print(f"Updated student {student_id} with expected_season_id {expected_season_id}")
        else:
            print(f"No expected season found for student {student_id} (cohort: {cohort_id}, program: {program_id})")

if __name__ == "__main__":
    update_expected_season_for_students()