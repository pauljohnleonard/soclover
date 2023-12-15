#!/bin/bash
nx b soclover --configuration=production

if [ $? -ne 0 ]; then
  # If nx command fails, print an error message and exit the script
  echo "nx command failed, exiting script"
  exit 1
fi

firebase deploy --only hosting
