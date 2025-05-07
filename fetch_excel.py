import requests
import time
import os
import datetime
import pytz
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Environment variables (ensure these are set in your environment)
TENANT_ID = os.environ["TENANT_ID"]
CLIENT_ID = os.environ["CLIENT_ID"]
CLIENT_SECRET = os.environ["CLIENT_SECRET"]

# Your Microsoft Graph User ID
USER_ID = "542ea7de-925a-40e9-ba86-07c7e82b8336"
EXCEL_FILE_PATH = "/Trades_Charts.xlsm"
LOCAL_SAVE_PATH = "/data/Trades_Charts.xlsm"  # Shared disk location

# Function to get access token from Microsoft Graph API
def get_access_token():
    logger.info("🔵 Requesting access token...")
    try:
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
        logger.info("✅ Access token received.")
        return token
    except Exception as e:
        logger.error(f"Failed to get access token: {e}")
        raise

# Function to download the Excel file
def download_excel(token):
    try:
        url = f"https://graph.microsoft.com/v1.0/users/{USER_ID}/drive/root:{EXCEL_FILE_PATH}:/content"
        headers = {'Authorization': f'Bearer {token}'}
        logger.info(f"🔵 Downloading: {EXCEL_FILE_PATH}")
        response = requests.get(url, headers=headers)
        logger.info(f"🔵 File download status: {response.status_code}")
        response.raise_for_status()
        with open(LOCAL_SAVE_PATH, 'wb') as f:
            f.write(response.content)
        logger.info(f"✅ File saved as '{LOCAL_SAVE_PATH}' at {time.strftime('%Y-%m-%d %H:%M:%S')}")
    except Exception as e:
        logger.error(f"Failed to download Excel file: {e}")
        raise

# Function to check if current time is within market hours (Monday-Friday, 9:30 AM to 4:00 PM EST)
def is_market_hours():
    try:
        # Get current time in EST timezone
        est = pytz.timezone('US/Eastern')
        now = datetime.datetime.now(est)
        
        # Check if it's a weekday (Monday = 0, Sunday = 6)
        if now.weekday() >= 5:  # Saturday or Sunday
            return False
        
        # Check if within market hours (9:30 AM to 4:00 PM)
        market_open = now.replace(hour=9, minute=30, second=0, microsecond=0)
        market_close = now.replace(hour=23, minute=5, second=0, microsecond=0)
        
        return market_open <= now <= market_close
    except Exception as e:
        logger.error(f"Error checking market hours: {e}")
        # Default to True in case of error to ensure we don't miss market data
        return True

# Main loop to fetch file during market hours
if __name__ == "__main__":
    logger.info("🚀 Starting the Excel fetch script")
    
    # Log timezone information to debug timezone issues
    est = pytz.timezone('US/Eastern')
    now = datetime.datetime.now(est)
    logger.info(f"Current time in EST: {now.strftime('%Y-%m-%d %H:%M:%S %Z')}")
    
    while True:
        try:
            if is_market_hours():
                logger.info("⏳ Starting fetch during market hours...")
                token = get_access_token()  # Get access token
                download_excel(token)  # Download the Excel file
                logger.info("⏳ Waiting for the next fetch in 30 seconds...")
            else:
                current_time = datetime.datetime.now(pytz.timezone('US/Eastern'))
                logger.info(f"💤 Outside market hours ({current_time.strftime('%Y-%m-%d %H:%M:%S %Z')}). Checking again in 30 seconds...")
                # Also print to stdout with flush to ensure visibility
                print(f"💤 Outside market hours ({current_time.strftime('%Y-%m-%d %H:%M:%S %Z')}). Checking again in 30 seconds...", flush=True)
        except Exception as e:
            logger.error(f"❌ Error in main loop: {e}")
            # Also print to stdout with flush to ensure visibility
            print(f"❌ Error in main loop: {e}", flush=True)
        
        # Sleep for 30 seconds before checking again
        time.sleep(30)