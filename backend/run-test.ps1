# Run a specific test with proper argument escaping
$testName = $args[0]
npx jest src/__tests__/integration/report-api.test.js -t "$testName" --verbose
