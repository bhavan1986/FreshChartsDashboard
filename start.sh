#!/bin/bash

# Run background fetcher (every 5 mins using while loop)
python fetch_excel.py &

# Run Flask app
gunicorn index:app --bind 0.0.0.0:10000
