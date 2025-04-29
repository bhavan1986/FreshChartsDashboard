from flask import Flask, render_template, jsonify
import pandas as pd

app = Flask(__name__)

def load_excel_data():
    #xl = pd.ExcelFile('Data1.xlsx', engine='openpyxl')  # 📌 Hardcoded local file
    file_path = "Trades_Charts.xlsm"
    
    if not os.path.exists(file_path):
        print("❌ Excel file not found.")
        return {}
        
        

    chart_data = {}

    for sheet_name in xl.sheet_names:
        df = xl.parse(sheet_name)

        if df.shape[1] >= 4:
            x = df.iloc[:, 0].dropna().tolist()
            y1 = df.iloc[:, 1].dropna().tolist()
            y2 = df.iloc[:, 2].dropna().tolist()
            y3 = df.iloc[:, 3].dropna().tolist()

            # Read N1:P3
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
    chart_data = load_excel_data()
    return jsonify(chart_data)

# 🆕 Important for Vercel/Render:
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
