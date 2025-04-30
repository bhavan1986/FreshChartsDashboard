import requests
import time
import os

# Environment variables (ensure these are set in your environment)
TENANT_ID = os.environ["TENANT_ID"]
CLIENT_ID = os.environ["CLIENT_ID"]
CLIENT_SECRET = os.environ["CLIENT_SECRET"]

# Your Microsoft Graph User ID
USER_ID = "542ea7de-925a-40e9-ba86-07c7e82b8336"
EXCEL_FILE_PATH = "/Trades_Charts.xlsm"
file_path = '/data/Trades_Charts.xlsm'  # Shared disk location
LOCAL_SAVE_PATH = "/data/Trades_Charts.xlsm"  # Shared disk location


# Function to get access token from Microsoft Graph API
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

# Function to download the Excel file
def download_excel(token):
    url = f"https://graph.microsoft.com/v1.0/users/{USER_ID}/drive/root:{EXCEL_FILE_PATH}:/content"
    headers = {'Authorization': f'Bearer {token}'}
    print(f"🔵 Downloading: {EXCEL_FILE_PATH}")
    response = requests.get(url, headers=headers)
    print(f"🔵 File download status: {response.status_code}")
    response.raise_for_status()
    with open(LOCAL_SAVE_PATH, 'wb') as f:
        f.write(response.content)
    print(f"✅ File saved as '{LOCAL_SAVE_PATH}' at {time.strftime('%Y-%m-%d %H:%M:%S')}")

# Main loop to fetch file every 5 minutes
if __name__ == "__main__":
    while True:
        try:
            print("⏳ Starting fetch...")
            token = get_access_token()  # Get access token
            download_excel(token)  # Download the Excel file
        except Exception as e:
            print(f"❌ Error: {e}")
        
        print("⏳ Waiting for the next fetch in 5 minutes...")
        time.sleep(60)  # Wait for 5 minutes (300 seconds) before running again
