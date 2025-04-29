import requests
import time
import os

# 🔥 Read from environment variables
TENANT_ID = os.environ.get("TENANT_ID")
CLIENT_ID = os.environ.get("CLIENT_ID")
CLIENT_SECRET = os.environ.get("CLIENT_SECRET")

# 📄 Excel File Path in OneDrive
EXCEL_FILE_PATH = "/Documents/Trades_Charts.xlsm"
LOCAL_SAVE_PATH = "Trades_Charts.xlsm"

def get_access_token():
    print("🔵 Requesting Access Token...")
    url = f"https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token"
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    data = {
        'grant_type': 'client_credentials',
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'scope': 'https://graph.microsoft.com/.default'
    }
    try:
        response = requests.post(url, headers=headers, data=data, timeout=10)
        print(f"🔵 Token Response Status: {response.status_code}")
        response.raise_for_status()
        token = response.json()['access_token']
        print("✅ Access Token Received")
        return token
    except requests.exceptions.Timeout:
        print("❌ Timeout trying to get Access Token!")
        raise
    except requests.exceptions.RequestException as e:
        print(f"❌ Other error: {e}")
        raise


def download_excel(access_token):
    print(f"🔵 Downloading Excel file from: {EXCEL_FILE_PATH}")
    url = f"https://graph.microsoft.com/v1.0/me/drive/root:{EXCEL_FILE_PATH}:/content"
    headers = {'Authorization': f'Bearer {access_token}'}
    try:
        response = requests.get(url, headers=headers, timeout=10)
        print(f"🔵 File Download Response Status: {response.status_code}")
        response.raise_for_status()
        with open(LOCAL_SAVE_PATH, 'wb') as f:
            f.write(response.content)
        print(f"✅ File downloaded successfully at {time.strftime('%Y-%m-%d %H:%M:%S')}")
    except requests.exceptions.Timeout:
        print("❌ Timeout trying to download Excel file!")
        raise
    except requests.exceptions.RequestException as e:
        print(f"❌ Other error: {e}")
        raise


while True:
    try:
        print("⏳ Starting new fetch cycle...")
        print(f"TENANT_ID: {TENANT_ID}")
        print(f"CLIENT_ID: {CLIENT_ID}")
        if not CLIENT_SECRET:
            print("❌ CLIENT_SECRET is empty!")
        
        token = get_access_token()
        download_excel(token)
    except Exception as e:
        print(f"❌ Error: {e}")
    print("🟰 Sleeping 300 seconds...\n")
    time.sleep(300)
