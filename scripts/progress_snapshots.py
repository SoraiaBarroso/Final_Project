import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ROLE_KEY')  # Use service role key

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def main():
    # Query student table and count statuses
    students = supabase.table('students').select('status').execute().data
    total_students = len(students)
    on_track = sum(1 for s in students if s['status'] == 'On Track')
    behind = sum(1 for s in students if s['status'] == 'Behind')
    ahead = sum(1 for s in students if s['status'] == 'Ahead')

    # Insert snapshot
    snapshot = {
        "total_students": total_students,
        "on_track": on_track,
        "behind": behind,
        "ahead": ahead
    }
    result = supabase.table('progress_snapshots').insert(snapshot).execute()
    print("Inserted snapshot:", result.data)

if __name__ == "__main__":
    main()