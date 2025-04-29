import requests
import os

print("✅ Python script started...")

# 🔥 Read from environment variables
TENANT_ID = os.environ.get("TENANT_ID")
CLIENT_ID = os.environ.get("CLIENT_ID")
CLIENT_SECRET = os.environ.get("CLIENT_SECRET")

print(f"✅ TENANT_ID: {TENANT_ID}")
print(f"✅ CLIENT_ID: {CLIENT_ID}")
print(f"✅ CLIENT_SECRET: {'SET' if CLIENT_SECRET else 'NOT SET'}")

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
    print(f"🛠 POST DATA: {data}")
    response = requests.post(url, headers=headers, data=data, timeout=10)
    print(f"🔵 Token Response Status: {response.status_code}")
    print(f"🛠 RAW RESPONSE TEXT: {response.text}")
    response.raise_for_status()
    token = response.json()['access_token']
    print("✅ Access Token Received")
    return token


def download_excel(access_token):
    print(f"🔵 Downloading Excel file from: {EXCEL_FILE_PATH}")
    url = f"https://graph.microsoft.com/v1.0/drive/root:{EXCEL_FILE_PATH}:/content"
    headers = {'Authorization': f'Bearer {access_token}'}
    response = requests.get(url, headers=headers, timeout=10)
    print(f"🔵 File Download Response Status: {response.status_code}")
    response.raise_for_status()
    with open(LOCAL_SAVE_PATH, 'wb') as f:
        f.write(response.content)
    print(f"✅ File downloaded successfully!")

# 🆕 NEW MAIN FUNCTION (runs once and exits)
def main():
    try:
        token = get_access_token()
        download_excel(token)
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
