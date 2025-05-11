from flask import Flask, render_template, jsonify, request
import pandas as pd
import os
import io
import openpyxl
import datetime

app = Flask(__name__)

def load_excel_data():
    file_path = "/data/Trades_Charts.xlsm"
    
    print("Looking for file at:", file_path)
    print("Directory listing:", os.listdir("/data"))

    # ✅ Check if file exists before trying to load
    if not os.path.exists(file_path):
        print("❌ Excel file not found during /data request.")
        return {}

    xl = pd.ExcelFile(file_path, engine='openpyxl')

    chart_data = {}

    for sheet_name in xl.sheet_names:
        df = xl.parse(sheet_name, header=None)

        if df.shape[1] >= 5:
            x = df.iloc[:, 0].tolist()
            y1 = df.iloc[:, 1].tolist()
            y2 = df.iloc[:, 2].tolist()
            y3 = df.iloc[:, 3].tolist()
            y4 = df.iloc[:, 4].tolist()

            # ✅ Keep rows aligned, skip if x is NaN
            clean_x, clean_y1, clean_y2, clean_y3, clean_y4 = [], [], [], [], []
            for xi, yi1, yi2, yi3, yi4 in zip(x, y1, y2, y3, y4):
                if pd.notnull(xi):
                    clean_x.append(xi)
                    clean_y1.append(yi1 if pd.notnull(yi1) else None)
                    clean_y2.append(yi2 if pd.notnull(yi2) else None)
                    clean_y3.append(yi3 if pd.notnull(yi3) else None)
                    clean_y4.append(yi4 if pd.notnull(yi4) else None)

            # 📚 Read N1:P3 info safely
            n1p3 = df.iloc[0:3, 13:16].fillna("").values.tolist()

            chart_data[sheet_name] = {
                'x': clean_x,
                'y1': clean_y1,
                'y2': clean_y2,
                'y3': clean_y3,
                'y4' : clean_y4,
                'n1p3': n1p3
            }

    return chart_data

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/data')
def data():
    try:
        chart_data = load_excel_data()
    except FileNotFoundError:
        print("❌ Excel file not found during /data request.")
        return jsonify({})
    return jsonify(chart_data)

@app.route('/get-runlog-timestamp')
def get_runlog_timestamp():
    try:
        file_path = "/data/Trades_Charts.xlsm"
        
        if not os.path.exists(file_path):
            print(f"❌ Excel file not found at {file_path}")
            return jsonify({'error': 'Excel file not found'}), 404
        
        try:
            # Use openpyxl to directly access cell J2
            workbook = openpyxl.load_workbook(file_path, data_only=True)
            
            if 'RunLog' not in workbook.sheetnames:
                print("❌ RunLog sheet not found in workbook")
                return jsonify({'error': 'RunLog sheet not found'}), 404
                
            worksheet = workbook['RunLog']
            
            # Get the value from cell J2
            j2_cell = worksheet['J2']
            
            if j2_cell is None:
                print("❌ Cell J2 not found")
                return jsonify({'error': 'Cell J2 not found'}), 404
                
            timestamp_value = j2_cell.value
            
            # Format timestamp if needed
            if isinstance(timestamp_value, datetime.datetime):
                timestamp_value = timestamp_value.strftime('%Y-%m-%d %H:%M:%S')
            
            if timestamp_value is None:
                print("❌ Cell J2 is empty")
                # Use current time as fallback
                timestamp_value = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                
            print(f"Retrieved timestamp from J2: {timestamp_value}")
            return jsonify({'value': str(timestamp_value)})
                
        except Exception as e:
            print(f"❌ Error reading cell J2: {str(e)}")
            return jsonify({'error': f'Error reading cell J2: {str(e)}'}), 500
            
    except Exception as e:
        print(f"❌ Error getting RunLog timestamp: {str(e)}")
        return jsonify({'error': 'Failed to get RunLog timestamp'}), 500

# Important for Render hosting
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)