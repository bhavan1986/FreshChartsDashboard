# Project: Live Excel Chart Dashboard (Dynamic Version)

## How to Run Locally

1. Unzip the folder `Project_FreshCharts/`

2. Open a Terminal (Command Prompt, PowerShell, or Mac Terminal).

3. Navigate into the project folder:

   cd Project_FreshCharts

4. Install required Python libraries:

   pip install -r requirements.txt

5. Start the Flask server:

   python app.py

6. Open your browser and go to:

   http://127.0.0.1:5000

---

## Notes:
- Pulls your Excel file directly from public OneDrive link.
- Updates data silently every 5 minutes.
- Zooms charts automatically to last 200 data points.
- Retains your zoom/pan position after refresh.
- You can Reset Zoom individually per chart with the button below each chart.
