from flask import Flask, render_template, jsonify
import pandas as pd
import requests
from io import BytesIO

app = Flask(__name__)

# Public Excel file URL
#EXCEL_URL = "https://onedrive.live.com/download.aspx?resid=042D9F69E78D8378!s1f2420cd030d4164a6c063f5f39a0bb4"


def load_excel_data():
    #response = requests.get(EXCEL_URL)
    
     # Add these lines for debug:
    #print("Response Status Code:", response.status_code)
    #print("Response Headers:", response.headers)
    #print("Response Content Sample:", response.content[:200])  # Print first 200 bytes
    
    
    #excel_file = BytesIO(response.content)
    #xl = pd.ExcelFile(excel_file, engine='openpyxl')
    xl = pd.ExcelFile('Data1.xlsx', engine='openpyxl')

    chart_data = {}

    for sheet_name in xl.sheet_names:
        df = xl.parse(sheet_name)
        
        if df.shape[1] >= 4:
            x = df.iloc[:, 0].dropna().tolist()
            y1 = df.iloc[:, 1].dropna().tolist()
            y2 = df.iloc[:, 2].dropna().tolist()
            y3 = df.iloc[:, 3].dropna().tolist()
            
            # Read N1:P3 range
            n1p3 = df.iloc[0:3, 13:16].fillna("").values.tolist()

            chart_data[sheet_name] = {
                'x': x,
                'y1': y1,
                'y2': y2,
                'y3': y3,
                'n1p3': n1p3
            }
    
    return chart_data

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/data')
def data():
    return jsonify(load_excel_data())

if __name__ == '__main__':
    app.run(debug=True)
