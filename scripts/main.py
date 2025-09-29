"""
Main Orchestrator Script
Coordinates all student data processing operations
Run with: python main.py [options]
"""

import argparse
import sys
import subprocess
import os
from datetime import datetime

# Import our utilities
from utils import print_step

class DataPipelineOrchestrator:
    """Orchestrates the complete data processing pipeline"""
    
    def __init__(self):
        self.scripts_dir = os.path.dirname(os.path.abspath(__file__))
        self.success_count = 0
        self.total_operations = 0
    
    def run_script(self, script_name, args=[]):
        """Run a script with specified arguments"""
        script_path = os.path.join(self.scripts_dir, script_name)
        
        if not os.path.exists(script_path):
            print(f"❌ Script not found: {script_name}")
            return False
        
        try:
            cmd = [sys.executable, script_path] + args
            print(f"Running: {' '.join(cmd)}")
            
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            
            if result.stdout:
                print(result.stdout)
            if result.stderr:
                print(f"Warnings: {result.stderr}")
            
            return True
            
        except subprocess.CalledProcessError as e:
            print(f"❌ Script failed with exit code {e.returncode}")
            if e.stdout:
                print(f"Output: {e.stdout}")
            if e.stderr:
                print(f"Error: {e.stderr}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return False
    
    def run_full_pipeline(self, scrape_new_data=False):
        """Run the complete data processing pipeline"""
        print_step("FULL PIPELINE", "Starting complete data processing pipeline")
        
        operations = []
        
        # 1. Data Collection and Processing
        if scrape_new_data:
            operations.append(("Data Scraping & Processing", "data_processor.py", ["--all"]))
        else:
            operations.append(("Data Processing (existing data)", "data_processor.py", ["--students", "--projects", "--progress"]))
        
        # 2. Student Management
        operations.append(("Student Management", "student_management.py", ["--all"]))
        
        # 3. Analytics
        operations.append(("Analytics Generation", "analytics.py", ["--all"]))
        
        self.total_operations = len(operations)
        
        for operation_name, script, args in operations:
            print_step(operation_name.upper(), f"Running {script}")
            
            if self.run_script(script, args):
                print(f"✅ {operation_name} completed successfully")
                self.success_count += 1
            else:
                print(f"❌ {operation_name} failed")
        
        # Summary
        if self.success_count == self.total_operations:
            print_step("PIPELINE SUCCESS", f"All {self.total_operations} operations completed successfully! 🎉")
            return True
        else:
            print_step("PIPELINE PARTIAL", f"Completed {self.success_count}/{self.total_operations} operations")
            return False
    
    def run_data_only(self, scrape=False):
        """Run only data collection and processing"""
        print_step("DATA PIPELINE", "Running data collection and processing only")
        
        args = ["--all"] if scrape else ["--students", "--projects", "--progress"]
        
        if self.run_script("data_processor.py", args):
            print("✅ Data processing completed successfully")
            return True
        else:
            print("❌ Data processing failed")
            return False
    
    def run_management_only(self):
        """Run only student management operations"""
        print_step("MANAGEMENT PIPELINE", "Running student management operations only")
        
        if self.run_script("student_management.py", ["--all"]):
            print("✅ Student management completed successfully")
            return True
        else:
            print("❌ Student management failed")
            return False
    
    def run_analytics_only(self):
        """Run only analytics generation"""
        print_step("ANALYTICS PIPELINE", "Running analytics generation only")
        
        if self.run_script("analytics.py", ["--all"]):
            print("✅ Analytics generation completed successfully")
            return True
        else:
            print("❌ Analytics generation failed")
            return False

def main():
    """Main function with comprehensive CLI options"""
    parser = argparse.ArgumentParser(
        description='Main orchestrator for student data processing pipeline',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py --full                 # Run complete pipeline with existing data
  python main.py --full --scrape        # Run complete pipeline with new scraping
  python main.py --data                 # Process data only
  python main.py --data --scrape        # Scrape and process data
  python main.py --management           # Run student management only
  python main.py --analytics            # Run analytics only
  python main.py --quick                # Quick update (management + analytics)
        """
    )
    
    # Pipeline options
    parser.add_argument('--full', action='store_true', 
                       help='Run the complete pipeline (data + management + analytics)')
    parser.add_argument('--data', action='store_true', 
                       help='Run data processing only')
    parser.add_argument('--management', action='store_true', 
                       help='Run student management only')
    parser.add_argument('--analytics', action='store_true', 
                       help='Run analytics generation only')
    parser.add_argument('--quick', action='store_true', 
                       help='Quick update: management + analytics (no data processing)')
    
    # Options
    parser.add_argument('--scrape', action='store_true', 
                       help='Include web scraping (only with --full or --data)')
    parser.add_argument('--verbose', '-v', action='store_true', 
                       help='Verbose output')
    
    args = parser.parse_args()
    
    # Validate arguments
    if not any([args.full, args.data, args.management, args.analytics, args.quick]):
        parser.print_help()
        return
    
    if args.scrape and not (args.full or args.data):
        print("❌ --scrape can only be used with --full or --data")
        sys.exit(1)
    
    # Initialize orchestrator
    orchestrator = DataPipelineOrchestrator()
    
    try:
        success = False
        
        if args.full:
            success = orchestrator.run_full_pipeline(scrape_new_data=args.scrape)
        
        elif args.data:
            success = orchestrator.run_data_only(scrape=args.scrape)
        
        elif args.management:
            success = orchestrator.run_management_only()
        
        elif args.analytics:
            success = orchestrator.run_analytics_only()
        
        elif args.quick:
            print_step("QUICK UPDATE", "Running management and analytics")
            mgmt_success = orchestrator.run_management_only()
            analytics_success = orchestrator.run_analytics_only()
            success = mgmt_success and analytics_success
        
        # Exit with appropriate code
        if success:
            print(f"\n🎉 All operations completed successfully at {datetime.now().strftime('%H:%M:%S')}")
            sys.exit(0)
        else:
            print(f"\n⚠️ Some operations failed. Check logs above.")
            sys.exit(1)
    
    except KeyboardInterrupt:
        print("\n🛑 Pipeline interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n❌ Pipeline error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()