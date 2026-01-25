import pandas as pd
import json
import os

def convert_excel_to_json_csv(file_path):
    print(f"Converting {file_path}...")
    try:
        df = pd.read_excel(file_path)
        base_name = os.path.splitext(file_path)[0]
        
        # Save to CSV
        csv_path = f"{base_name}.csv"
        df.to_csv(csv_path, index=False)
        print(f"Saved to {csv_path}")
        
        # Save to JSON
        json_path = f"{base_name}.json"
        df.to_json(json_path, orient='records', indent=4)
        print(f"Saved to {json_path}")
    except Exception as e:
        print(f"Error converting {file_path}: {e}")

if __name__ == "__main__":
    files_to_convert = [
        "data/demo_lite.xlsx",
        "data/demo_pro.xlsx"
    ]
    
    for file in files_to_convert:
        if os.path.exists(file):
            convert_excel_to_json_csv(file)
        else:
            print(f"File {file} not found.")

    # Also search for any other .xlsx files in the current directory just in case
    for root, dirs, files in os.walk("."):
        if "api_venv" in root or "node_modules" in root:
            continue
        for file in files:
            if file.endswith(".xlsx") and file not in ["demo_lite.xlsx", "demo_pro.xlsx"]:
                full_path = os.path.join(root, file)
                if full_path not in ["data/demo_lite.xlsx", "data/demo_pro.xlsx"]:
                    convert_excel_to_json_csv(full_path)
