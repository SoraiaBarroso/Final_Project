import os
import asyncio
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- Supabase Configuration ---
# Ensure these are set in your .env file
# It's recommended to use the SERVICE_ROLE_KEY for server-side operations
# as it bypasses Row Level Security (RLS) and has full access.
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ROLE_KEY') # Use SERVICE_ROLE_KEY here

async def main():
    print("--- Script started: Connecting to Supabase ---")
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in environment variables.")
        print("Please create a .env file with these variables.")
        return

    try:
        # Explicitly create an async client
        # In modern supabase-py, create_client is usually async-aware if used in async context.
        # This line is typically sufficient.
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Supabase client created successfully.")
    except Exception as e:
        print(f"ERROR: Failed to create Supabase client: {e}")
        return # Exit if connection fails

    # --- Call the PostgreSQL function directly ---
    print("Calling PostgreSQL function 'update_student_status_based_on_season_progress'...")
    try:
        # The .execute() method on the RPC call should be awaited.
        # The error suggests the object returned by .execute() is not awaitable.
        # This is often resolved by upgrading the supabase-py library.
        response = supabase.rpc('update_student_status_based_on_season_progress').execute()

        if hasattr(response, 'data') and response.data is not None:
            print("SUCCESS: Student statuses updated by PostgreSQL function.")
            print("Response data:", response.data)
        else:
            print("ERROR: PostgreSQL function call may have failed. Response:", response)

    except Exception as e:
        print(f"ERROR: An unexpected error occurred during RPC call: {e}")

    print("--- Script finished ---")

if __name__ == "__main__":
    print("Attempting to run main function...")
    asyncio.run(main())
    print("Main function execution command completed.")