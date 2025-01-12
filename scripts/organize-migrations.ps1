#!/usr/bin/env pwsh

# Get all migration files
$migrations = Get-ChildItem -Path "supabase/migrations" -Filter "*.sql" | Where-Object { $_.Name -match '^\d+' }

# Create a hashtable to store unique migrations by their purpose
$uniqueMigrations = @{}
$timestamp = 20240325000000

foreach ($migration in $migrations) {
    # Extract the purpose from the filename (everything after timestamp)
    $purpose = $migration.Name -replace '^\d+_', ''
    
    if (-not $uniqueMigrations.ContainsKey($purpose)) {
        $uniqueMigrations[$purpose] = @{
            OldPath = $migration.FullName
            NewName = "{0:d20}_{1}" -f $timestamp, $purpose
        }
        $timestamp++
    } else {
        Write-Host "Removing duplicate migration: $($migration.Name)"
        Remove-Item $migration.FullName
    }
}

# Rename the remaining migrations
foreach ($migration in $uniqueMigrations.Values) {
    $newPath = Join-Path (Split-Path $migration.OldPath) $migration.NewName
    if ($migration.OldPath -ne $newPath) {
        Write-Host "Renaming $($migration.OldPath) to $($migration.NewName)"
        Move-Item -Path $migration.OldPath -Destination $newPath -Force
    }
}

Write-Host "Migration organization complete" 