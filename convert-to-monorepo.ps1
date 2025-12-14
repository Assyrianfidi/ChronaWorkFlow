# Convert AccuBooks to monorepo structure

# Create apps directory
New-Item -ItemType Directory -Path apps

# Move client and backend to apps
Move-Item -Path client -Destination apps
Move-Item -Path backend -Destination apps

# Create packages directory
New-Item -ItemType Directory -Path packages

# Create shared package
New-Item -ItemType Directory -Path packages/shared
Set-Location packages/shared
npm init -y
# ... add shared code ...

# Create root package.json
Set-Location ..\..
npm init -y

# Install Turborepo
npm install turbo --save-dev

# Create turbo.json
@'
{
  "pipeline": {
    "build": {
      "outputs": ["dist/**"],
      "dependsOn": ["^build"]
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "outputs": []
    }
  }
}
'@ | Out-File -FilePath turbo.json

# Update root package.json to set workspaces
$packageJson = Get-Content -Raw -Path package.json | ConvertFrom-Json
$packageJson.workspaces = ["apps/*", "packages/*"]
$packageJson.scripts = @{
  "build" = "turbo run build";
  "lint" = "turbo run lint";
  "test" = "turbo run test";
}
$packageJson | ConvertTo-Json | Set-Content -Path package.json
