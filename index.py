from flask import Flask, render_template, jsonify
import pandas as pd
import os
import io

app = Flask(__name__)

def load_excel_data():
    #BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    #file_path = os.path.join(BASE_DIR, "Trades_Charts.xlsm")
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
        df = xl.parse(sheet_name)

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

# Important for Render hosting
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
