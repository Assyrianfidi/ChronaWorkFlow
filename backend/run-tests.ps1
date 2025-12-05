# Run a single test with detailed output
$testName = "should return all reports for admin"
$testFile = "src/__tests__/integration/report-api.test.js"

Write-Host "Running test: $testName" -ForegroundColor Cyan

# Run the test with detailed output
npx jest $testFile -t "$testName" --config=jest.config.cjs --verbose --no-cache
