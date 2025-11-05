#!/bin/bash

# Specify the target directory for cleanup
TARGET_DIR="/root/chatgptorgru/client/public/images"  # Replace with the desired path

# Check if the target directory exists
if [ ! -d "$TARGET_DIR" ]; then
    echo "Error: directory $TARGET_DIR does not exist."
    exit 1
fi

echo "Deleting files older than 30 days from current date in directory: $TARGET_DIR"

# Traverse all subdirectories recursively
for dir in $(find "$TARGET_DIR" -mindepth 1 -type d); do
    echo "Processing directory: $dir"

    # Delete files older than 30 days
    find "$dir" -type f -mtime +30 -delete

    # Check if the directory is empty (including hidden files), and remove if empty
    if [ -z "$(ls -A "$dir" 2>/dev/null)" ]; then
        echo "Directory $dir is empty. Removing..."
        rmdir "$dir" 2>/dev/null
    fi
done

echo "Cleanup completed."
