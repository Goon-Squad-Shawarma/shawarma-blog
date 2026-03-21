#!/bin/bash

# Make sure this file has executable permissions, run `chmod +x railway/run-worker.sh`

# Run the queue worker
php artisan queue:work --sleep=3 --tries=3 --max-time=3600
