# Convert CSV Test Suite to Excel Workbook
# IGNITE-APEX Test Suite Converter
# Run: .\convert-to-excel.ps1

Write-Host "Converting IGNITE-APEX Test Suite to Excel..." -ForegroundColor Cyan

# Check if ImportExcel module is installed
if (-not (Get-Module -ListAvailable -Name ImportExcel)) {
    Write-Host "ImportExcel module not found. Installing..." -ForegroundColor Yellow
    try {
        Install-Module -Name ImportExcel -Force -Scope CurrentUser
        Write-Host "[OK] ImportExcel module installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Failed to install ImportExcel module" -ForegroundColor Red
        Write-Host "Please install manually: Install-Module -Name ImportExcel" -ForegroundColor Yellow
        exit 1
    }
}

# Import module
Import-Module ImportExcel

# Set paths
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$csvFolder = $scriptPath
$outputFile = Join-Path (Split-Path -Parent $scriptPath) "IGNITE_APEX_TEST_SUITE.xlsx"

Write-Host "CSV Folder: $csvFolder" -ForegroundColor Gray
Write-Host "Output File: $outputFile" -ForegroundColor Gray

# Remove old file if exists
if (Test-Path $outputFile) {
    Write-Host "Removing existing workbook..." -ForegroundColor Yellow
    Remove-Item $outputFile -Force
}

# Get all CSV files and sort
$csvFiles = Get-ChildItem -Path $csvFolder -Filter "*.csv" | Sort-Object Name

if ($csvFiles.Count -eq 0) {
    Write-Host "[ERROR] No CSV files found in $csvFolder" -ForegroundColor Red
    exit 1
}

Write-Host "Found $($csvFiles.Count) CSV files" -ForegroundColor Cyan
Write-Host ""

# Counter
$sheetCount = 0

# Import each CSV as a sheet
foreach ($file in $csvFiles) {
    $sheetCount++
    $sheetName = $file.BaseName

    # Shorten name if too long (Excel limit: 31 characters)
    if ($sheetName.Length -gt 31) {
        $sheetName = $sheetName.Substring(0, 31)
    }

    Write-Host "[$sheetCount/$($csvFiles.Count)] Processing: $($file.Name) -> Sheet: $sheetName" -ForegroundColor White

    try {
        # Import CSV
        $data = Import-Csv $file.FullName

        if ($data.Count -eq 0) {
            Write-Host "   [WARNING] $($file.Name) is empty" -ForegroundColor Yellow
            continue
        }

        # Export to Excel with formatting
        $data | Export-Excel -Path $outputFile `
            -WorksheetName $sheetName `
            -AutoSize `
            -FreezeTopRow `
            -BoldTopRow `
            -TableStyle Medium6 `
            -TableName "Table_$sheetCount"

        Write-Host "   [OK] Exported $($data.Count) rows" -ForegroundColor Green

    } catch {
        Write-Host "   [ERROR] Error processing $($file.Name): $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CONVERSION COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Excel Workbook Created:" -ForegroundColor White
Write-Host "   $outputFile" -ForegroundColor Yellow
Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host "   Sheets: $sheetCount" -ForegroundColor Gray
Write-Host "   File Size: $([math]::Round((Get-Item $outputFile).Length / 1KB, 2)) KB" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Open the Excel file" -ForegroundColor White
Write-Host "   2. Review test cases" -ForegroundColor White
Write-Host "   3. Execute tests" -ForegroundColor White
Write-Host "   4. Fill 'Actual Result' and 'Status' columns" -ForegroundColor White
Write-Host ""
Write-Host "Documentation: test-suite/README.md" -ForegroundColor Gray
Write-Host ""

# Try to open the file
$openFile = Read-Host "Would you like to open the Excel file now? (Y/N)"
if ($openFile -eq "Y" -or $openFile -eq "y") {
    Write-Host "Opening Excel..." -ForegroundColor Cyan
    Start-Process $outputFile
}

Write-Host "Done!" -ForegroundColor Green
