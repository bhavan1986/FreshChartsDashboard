import requests
import time
import os

TENANT_ID = os.environ.get("TENANT_ID")
CLIENT_ID = os.environ.get("CLIENT_ID")
CLIENT_SECRET = os.environ.get("CLIENT_SECRET")

# ✔️ Use your new business OneDrive driveId and correct file path
DRIVE_ID = "b!agwTnnmZNUme_FrWOjFLrEWG6AQXTXdHp4nc4_bSwXfT-sLOaMJvS66sikSquz-D"
EXCEL_FILE_PATH = "/Trades_Charts.xlsm"
LOCAL_SAVE_PATH = "Trades_Charts.xlsm"

def get_access_token():
    print("🔵 Requesting access token...")
    url = f"https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token"
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    data = {
        'grant_type': 'client_credentials',
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'scope': 'https://graph.microsoft.com/.default'
    }
    response = requests.post(url, headers=headers, data=data)
    response.raise_for_status()
    token = response.json()['access_token']
    print("✅ Access token received.")
    return token

def download_excel(token):
    url = f"https://graph.microsoft.com/v1.0/drives/{DRIVE_ID}/root:{EXCEL_FILE_PATH}:/content"
    headers = {'Authorization': f'Bearer {token}'}
    print(f"🔵 Downloading: {EXCEL_FILE_PATH}")
    response = requests.get(url, headers=headers)
    print(f"🔵 File download status: {response.status_code}")
    response.raise_for_status()
    with open(LOCAL_SAVE_PATH, 'wb') as f:
        f.write(response.content)
    print(f"✅ File saved as '{LOCAL_SAVE_PATH}' at {time.strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    try:
        print("⏳ Starting fetch...")
        token = get_access_token()
        download_excel(token)
    except Exception as e:
        print(f"❌ Error: {e}")
