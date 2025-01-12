#!/usr/bin/env pwsh

# Get all migration files
$migrations = Get-ChildItem -Path "supabase/migrations" -Filter "*.sql"

# Create a hashtable to store unique migrations by their base name (without timestamp)
$uniqueMigrations = @{}

foreach ($migration in $migrations) {
    # Extract the base name (everything after the timestamp)
    $baseName = $migration.Name -replace '^\d+_', ''
    
    if ($uniqueMigrations.ContainsKey($baseName)) {
        # If we already have this migration, keep the one with the higher timestamp
        $existingTimestamp = [int]($uniqueMigrations[$baseName].Name -replace '_.*$')
        $currentTimestamp = [int]($migration.Name -replace '_.*$')
        
        if ($currentTimestamp > $existingTimestamp) {
            Write-Host "Removing older version of $baseName"
            Remove-Item $uniqueMigrations[$baseName].FullName
            $uniqueMigrations[$baseName] = $migration
        } else {
            Write-Host "Removing newer version of $baseName"
            Remove-Item $migration.FullName
        }
    } else {
        $uniqueMigrations[$baseName] = $migration
    }
}

Write-Host "Migration cleanup complete" 