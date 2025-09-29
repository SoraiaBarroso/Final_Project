"""
Student Management Utilities
Combines student expected season assignment and status calculations
Run with: python student_management.py [--seasons] [--status] [--all]
"""

import argparse
import asyncio
import sys
from datetime import datetime

# Import our utilities
from utils import get_supabase_client, print_step

class StudentSeasonManager:
    """Handles student season assignment and management"""
    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
    
    def update_expected_seasons(self):
        """Set expected_season_id for students based on their cohort and program"""
        print_step("EXPECTED SEASONS", "Updating expected season assignments for students")
        
        today = datetime.now().date().isoformat()
        
        # Get all students with cohort_id and program_id
        try:
            students_response = self.supabase.from_('students').select('id, cohort_id, program_id').execute()
            students = students_response.data
            print(f"Found {len(students)} students to process")
        except Exception as e:
            print(f"Error fetching students: {e}")
            return False
        
        updated_count = 0
        
        for student in students:
            student_id = student['id']
            cohort_id = student.get('cohort_id')
            program_id = student.get('program_id')
            
            if not cohort_id or not program_id:
                print(f"Skipping student {student_id} (missing cohort_id or program_id)")
                continue
            
            try:
                # Find the matching program_cohort_season
                pcs_response = self.supabase.from_('program_cohort_seasons').select('season_id, start_date, end_date') \
                    .eq('cohort_id', cohort_id).eq('program_id', program_id).execute()
                pcs_data = pcs_response.data
                
                expected_season_id = None
                for row in pcs_data:
                    if row['start_date'] <= today <= row['end_date']:
                        expected_season_id = row['season_id']
                        break
                
                if expected_season_id:
                    # Update the student's expected_season_id
                    update_response = self.supabase.from_('students') \
                        .update({'expected_season_id': expected_season_id}) \
                        .eq('id', student_id).execute()
                    
                    print(f"✓ Updated student {student_id} with expected_season_id {expected_season_id}")
                    updated_count += 1
                else:
                    print(f"No expected season found for student {student_id} (cohort: {cohort_id}, program: {program_id})")
            
            except Exception as e:
                print(f"Error processing student {student_id}: {e}")
                continue
        
        print(f"✓ Updated expected seasons for {updated_count} students")
        return True

class StudentStatusManager:
    """Handles student status calculations and updates"""
    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
    
    async def update_student_status(self):
        """Update student status based on season progress using PostgreSQL function"""
        print_step("STUDENT STATUS", "Updating student status based on progress")
        
        try:
            # Call the PostgreSQL function directly
            print("Calling PostgreSQL function 'update_student_status_based_on_season_progress'...")
            
            response = self.supabase.rpc('update_student_status_based_on_season_progress').execute()
            
            if hasattr(response, 'data') and response.data is not None:
                print("✓ Student statuses updated successfully by PostgreSQL function")
                if response.data:
                    print(f"Response data: {response.data}")
                return True
            else:
                print("Warning: PostgreSQL function call completed but returned no data")
                print(f"Full response: {response}")
                return True  # Assuming success if no error was raised
        
        except Exception as e:
            print(f"Error calling PostgreSQL function: {e}")
            return False
    
    def update_student_status_sync(self):
        """Synchronous wrapper for async status update"""
        return asyncio.run(self.update_student_status())

class StudentManager:
    """Main class that orchestrates all student management operations"""
    
    def __init__(self, service_role=True):
        # Use service role for administrative operations
        self.supabase = get_supabase_client(service_role=service_role)
        self.season_manager = StudentSeasonManager(self.supabase)
        self.status_manager = StudentStatusManager(self.supabase)
    
    def update_expected_seasons(self):
        """Update expected seasons for all students"""
        return self.season_manager.update_expected_seasons()
    
    def update_student_status(self):
        """Update student status based on progress"""
        return self.status_manager.update_student_status_sync()
    
    def run_all_updates(self):
        """Run all student management updates in the correct order"""
        print_step("STUDENT MANAGEMENT", "Running all student management operations")
        
        success_count = 0
        
        # 1. Update expected seasons first
        if self.update_expected_seasons():
            success_count += 1
        
        # 2. Update student status based on progress
        if self.update_student_status():
            success_count += 1
        
        if success_count == 2:
            print_step("COMPLETED", "All student management operations completed successfully")
            return True
        else:
            print_step("PARTIAL SUCCESS", f"Completed {success_count}/2 operations")
            return False

def main():
    """Main function with CLI argument parsing"""
    parser = argparse.ArgumentParser(description='Manage student seasons and status updates')
    parser.add_argument('--seasons', action='store_true', help='Update expected seasons for students')
    parser.add_argument('--status', action='store_true', help='Update student status based on progress')
    parser.add_argument('--all', action='store_true', help='Run all student management operations')
    parser.add_argument('--service-role', action='store_true', default=True, 
                       help='Use service role key (default: True)')
    
    args = parser.parse_args()
    
    # If no specific flags are provided, show help
    if not any([args.seasons, args.status, args.all]):
        parser.print_help()
        return
    
    try:
        # Create student manager
        manager = StudentManager(service_role=args.service_role)
        
        success = True
        
        # Run requested operations
        if args.all:
            success = manager.run_all_updates()
        else:
            if args.seasons:
                if not manager.update_expected_seasons():
                    success = False
            
            if args.status:
                if not manager.update_student_status():
                    success = False
        
        if success:
            print("\n🎉 All operations completed successfully!")
        else:
            print("\n⚠️ Some operations failed. Check the logs above.")
            sys.exit(1)
    
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()