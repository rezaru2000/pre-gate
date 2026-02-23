#!/bin/bash
# Create "pregate" DB for tools that default to db name = username (avoids log spam).
psql -v ON_ERROR_STOP=0 -U pregate -d pregate_dev -c "CREATE DATABASE pregate;" 2>/dev/null || true
