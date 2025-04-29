import os
import requests
import msal

# --------------- CONFIGURATION ---------------
CLIENT_ID = "f953174d-549f-43db-bbdc-65dc76d8c17d"  # 🔥 Replace with your Application (client) ID
AUTHORITY = "https://login.microsoftonline.com/consumers"  # 🔥 For personal Microsoft accounts
SCOPES = ["Files.Read"]  # We only need to read files

# OneDrive file information
ONEDRIVE_FILE_PATH = "/Documents/Trades_Charts.xlsm"  # 🔥 Path inside OneDrive (adjust if needed)
LOCAL_SAVE_PATH = "Trades_Charts.xlsm"  # Save as local file

# Microsoft Graph endpoint for user drive
GRAPH_ENDPOINT = "https://graph.microsoft.com/v1.0/me/drive/root:{}:/content".format(ONEDRIVE_FILE_PATH)

# --------------- MSAL AUTH ---------------
app = msal.PublicClientApplication(
    CLIENT_ID,
    authority=AUTHORITY
)

# Try to acquire token silently first
accounts = app.get_accounts()
if accounts:
    result = app.acquire_token_silent(SCOPES, account=accounts[0])
else:
    flow = app.initiate_device_flow(scopes=SCOPES)
    if "user_code" not in flow:
        raise Exception("Failed to create device flow. Err: %s" % flow)
    print("🔵 Go to {} and enter code: {}".format(flow["verification_uri"], flow["user_code"]))
    result = app.acquire_token_by_device_flow(flow)

if "access_token" in result:
    print("✅ Successfully authenticated!")

    # --------------- DOWNLOAD THE FILE ---------------
    response = requests.get(
        GRAPH_ENDPOINT,
        headers={"Authorization": "Bearer " + result["access_token"]},
    )

    if response.status_code == 200:
        with open(LOCAL_SAVE_PATH, "wb") as f:
            f.write(response.content)
        print(f"✅ File downloaded successfully and saved as '{LOCAL_SAVE_PATH}'")
    else:
        print(f"❌ Failed to download file. Status Code: {response.status_code}")
        print(response.text)

else:
    print("❌ Authentication failed.")
    print(result.get("error"))
    print(result.get("error_description"))
    print(result.get("correlation_id"))

import time

while True:
    # Your fetch_excel code here
    # Wrap everything inside a function (I'll show)
    time.sleep(300)  # 300 seconds = 5 minutes
