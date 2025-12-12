const fs = require('fs');
const path = require('path');

function validateDocumentationHandover() {
  console.log('📚 Phase 10: Documentation & Handover Validation\n');
  
  let issues = [];
  let fixes = [];
  let score = 0;
  const maxScore = 10;
  
  // 1. Check README documentation
  console.log('📖 README Documentation Analysis:');
  
  let readmeExists = false;
  let readmeSections = 0;
  let readmeInstallation = false;
  let readmeUsage = false;
  let readmeContributing = false;
  let readmeLicense = false;
  
  if (fs.existsSync('README.md')) {
    readmeExists = true;
    const readmeContent = fs.readFileSync('README.md', 'utf8');
    
    readmeSections = (readmeContent.match(/^#+\s/gm) || []).length;
    readmeInstallation = readmeContent.includes('## Installation') || readmeContent.includes('# Installation');
    readmeUsage = readmeContent.includes('## Usage') || readmeContent.includes('# Usage');
    readmeContributing = readmeContent.includes('## Contributing') || readmeContent.includes('# Contributing');
    readmeLicense = readmeContent.includes('## License') || readmeContent.includes('# License');
  }
  
  console.log(`  📄 README exists: ${readmeExists ? 'Yes' : 'No'}`);
  console.log(`  📋 README sections: ${readmeSections}`);
  console.log(`  🔧 Installation guide: ${readmeInstallation ? 'Yes' : 'No'}`);
  console.log(`  💡 Usage guide: ${readmeUsage ? 'Yes' : 'No'}`);
  console.log(`  🤝 Contributing guide: ${readmeContributing ? 'Yes' : 'No'}`);
  console.log(`  📜 License info: ${readmeLicense ? 'Yes' : 'No'}`);
  
  if (readmeExists && readmeSections >= 5 && readmeInstallation && readmeUsage) {
    score++;
    console.log('  ✅ README documentation is well implemented');
  } else {
    console.log('  ❌ README documentation needs improvement');
    issues.push('README documentation not well implemented');
  }
  
  // 2. Check component documentation
  console.log('\n⚛️  Component Documentation Analysis:');
  
  let componentDocs = 0;
  let componentStories = 0;
  let componentTests = 0;
  let componentTypes = 0;
  let componentExamples = 0;
  
  const componentFiles = getComponentFiles('src');
  
  componentFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('@component') || content.includes('Component:')) {
        componentDocs++;
      }
      
      if (file.includes('.stories.') || content.includes('Story')) {
        componentStories++;
      }
      
      if (file.includes('.test.') || file.includes('.spec.')) {
        componentTests++;
      }
      
      if (content.includes('interface') || content.includes('type ')) {
        componentTypes++;
      }
      
      if (content.includes('@example') || content.includes('Example:')) {
        componentExamples++;
      }
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  console.log(`  📄 Component files: ${componentFiles.length}`);
  console.log(`  📚 Component documentation: ${componentDocs}`);
  console.log(`  📖 Component stories: ${componentStories}`);
  console.log(`  🧪 Component tests: ${componentTests}`);
  console.log(`  📝 Component types: ${componentTypes}`);
  console.log(`  💡 Component examples: ${componentExamples}`);
  
  if (componentDocs >= 10 && componentStories >= 5 && componentTests >= 10) {
    score++;
    console.log('  ✅ Component documentation is well implemented');
  } else {
    console.log('  ❌ Component documentation needs improvement');
    issues.push('Component documentation not well implemented');
  }
  
  // 3. Check API documentation
  console.log('\n🌐 API Documentation Analysis:');
  
  let apiDocs = false;
  let apiEndpoints = 0;
  let apiSchemas = 0;
  let apiExamples = 0;
  let apiTesting = 0;
  
  // Check for API documentation files
  const apiDocFiles = [
    'API.md',
    'docs/api.md',
    'docs/endpoints.md',
    'src/api/README.md',
    'POSTMAN.md',
    'INSOMNIA.md'
  ];
  
  apiDocFiles.forEach(file => {
    if (fs.existsSync(file)) {
      apiDocs = true;
      const content = fs.readFileSync(file, 'utf8');
      
      apiEndpoints += (content.match(/###|GET|POST|PUT|DELETE/g) || []).length;
      apiSchemas += (content.match(/schema|type|interface/g) || []).length;
      apiExamples += (content.match(/example|curl|fetch/g) || []).length;
      apiTesting += (content.match(/test|mock|response/g) || []).length;
    }
  });
  
  console.log(`  📄 API docs exist: ${apiDocs ? 'Yes' : 'No'}`);
  console.log(`  🔗 API endpoints documented: ${apiEndpoints}`);
  console.log(`  📋 API schemas: ${apiSchemas}`);
  console.log(`  💡 API examples: ${apiExamples}`);
  console.log(`  🧪 API testing info: ${apiTesting}`);
  
  if (apiDocs && apiEndpoints >= 5 && apiExamples >= 3) {
    score++;
    console.log('  ✅ API documentation is well implemented');
  } else {
    console.log('  ❌ API documentation needs improvement');
    issues.push('API documentation not well implemented');
  }
  
  // 4. Check visual route guide
  console.log('\n🗺️  Visual Route Guide Analysis:');
  
  let routeGuide = false;
  let routeMap = false;
  let routeScreenshots = 0;
  let routeDescriptions = 0;
  let navigationFlow = 0;
  
  // Check for route guide files
  const routeGuideFiles = [
    'ROUTES.md',
    'docs/routes.md',
    'docs/navigation.md',
    'ROUTE_GUIDE.md',
    'NAVIGATION.md'
  ];
  
  routeGuideFiles.forEach(file => {
    if (fs.existsSync(file)) {
      routeGuide = true;
      const content = fs.readFileSync(file, 'utf8');
      
      routeMap = content.includes('map') || content.includes('diagram') || content.includes('flow');
      routeScreenshots += (content.match(/screenshot|image|\.png|\.jpg/g) || []).length;
      routeDescriptions += (content.match(/###|description|purpose/g) || []).length;
      navigationFlow += (content.match(/flow|navigation|user.*journey/g) || []).length;
    }
  });
  
  console.log(`  📄 Route guide exists: ${routeGuide ? 'Yes' : 'No'}`);
  console.log(`  🗺️  Route map/diagram: ${routeMap ? 'Yes' : 'No'}`);
  console.log(`  📸 Route screenshots: ${routeScreenshots}`);
  console.log(`  📝 Route descriptions: ${routeDescriptions}`);
  console.log(`  🔄 Navigation flow: ${navigationFlow}`);
  
  if (routeGuide && routeMap && routeDescriptions >= 5) {
    score++;
    console.log('  ✅ Visual route guide is well implemented');
  } else {
    console.log('  ❌ Visual route guide needs improvement');
    issues.push('Visual route guide not well implemented');
  }
  
  // 5. Check development setup documentation
  console.log('\n⚙️  Development Setup Documentation Analysis:');
  
  let devSetup = false;
  let devRequirements = 0;
  let devCommands = 0;
  let devEnvironment = 0;
  let devTroubleshooting = 0;
  
  // Check for development setup files
  const devSetupFiles = [
    'DEVELOPMENT.md',
    'SETUP.md',
    'CONTRIBUTING.md',
    'docs/development.md',
    'docs/setup.md'
  ];
  
  devSetupFiles.forEach(file => {
    if (fs.existsSync(file)) {
      devSetup = true;
      const content = fs.readFileSync(file, 'utf8');
      
      devRequirements += (content.match(/requirement|prerequisite|node|npm/g) || []).length;
      devCommands += (content.match(/npm|yarn|run|build|test/g) || []).length;
      devEnvironment += (content.match(/env|environment|config|variable/g) || []).length;
      devTroubleshooting += (content.match(/troubleshoot|issue|problem|fix/g) || []).length;
    }
  });
  
  console.log(`  📄 Dev setup docs exist: ${devSetup ? 'Yes' : 'No'}`);
  console.log(`  📋 Dev requirements: ${devRequirements}`);
  console.log(`  💻 Dev commands: ${devCommands}`);
  console.log(`  🌍 Dev environment: ${devEnvironment}`);
  console.log(`  🔧 Dev troubleshooting: ${devTroubleshooting}`);
  
  if (devSetup && devRequirements >= 3 && devCommands >= 5) {
    score++;
    console.log('  ✅ Development setup documentation is well implemented');
  } else {
    console.log('  ❌ Development setup documentation needs improvement');
    issues.push('Development setup documentation not well implemented');
  }
  
  // 6. Check deployment documentation
  console.log('\n🚀 Deployment Documentation Analysis:');
  
  let deployDocs = false;
  let deploySteps = 0;
  let deployEnvironments = 0;
  let deployConfig = 0;
  let deployMonitoring = 0;
  
  // Check for deployment files
  const deployFiles = [
    'DEPLOYMENT.md',
    'DEPLOY.md',
    'docs/deployment.md',
    'docs/production.md',
    'CI.md',
    'CD.md'
  ];
  
  deployFiles.forEach(file => {
    if (fs.existsSync(file)) {
      deployDocs = true;
      const content = fs.readFileSync(file, 'utf8');
      
      deploySteps += (content.match(/step|process|workflow/g) || []).length;
      deployEnvironments += (content.match(/staging|production|dev|test/g) || []).length;
      deployConfig += (content.match(/config|environment|variable|secret/g) || []).length;
      deployMonitoring += (content.match(/monitor|log|health|check/g) || []).length;
    }
  });
  
  console.log(`  📄 Deployment docs exist: ${deployDocs ? 'Yes' : 'No'}`);
  console.log(`  📋 Deployment steps: ${deploySteps}`);
  console.log(`  🌍 Deployment environments: ${deployEnvironments}`);
  console.log(`  ⚙️  Deployment config: ${deployConfig}`);
  console.log(`  📊 Deployment monitoring: ${deployMonitoring}`);
  
  if (deployDocs && deploySteps >= 3 && deployEnvironments >= 2) {
    score++;
    console.log('  ✅ Deployment documentation is well implemented');
  } else {
    console.log('  ❌ Deployment documentation needs improvement');
    issues.push('Deployment documentation not well implemented');
  }
  
  // 7. Check architecture documentation
  console.log('\n🏗️  Architecture Documentation Analysis:');
  
  let archDocs = false;
  let archDiagrams = 0;
  let archComponents = 0;
  let archPatterns = 0;
  let archDecisions = 0;
  
  // Check for architecture files
  const archFiles = [
    'ARCHITECTURE.md',
    'DESIGN.md',
    'docs/architecture.md',
    'docs/design.md',
    'TECH_STACK.md'
  ];
  
  archFiles.forEach(file => {
    if (fs.existsSync(file)) {
      archDocs = true;
      const content = fs.readFileSync(file, 'utf8');
      
      archDiagrams += (content.match(/diagram|chart|flow|structure/g) || []).length;
      archComponents += (content.match(/component|module|service|layer/g) || []).length;
      archPatterns += (content.match(/pattern|architecture|design|structure/g) || []).length;
      archDecisions += (content.match(/decision|choice|why|because/g) || []).length;
    }
  });
  
  console.log(`  📄 Architecture docs exist: ${archDocs ? 'Yes' : 'No'}`);
  console.log(`  📊 Architecture diagrams: ${archDiagrams}`);
  console.log(`  🧩 Architecture components: ${archComponents}`);
  console.log(`  🏗️  Architecture patterns: ${archPatterns}`);
  console.log(`  🧠 Architecture decisions: ${archDecisions}`);
  
  if (archDocs && archComponents >= 5 && archPatterns >= 3) {
    score++;
    console.log('  ✅ Architecture documentation is well implemented');
  } else {
    console.log('  ❌ Architecture documentation needs improvement');
    issues.push('Architecture documentation not well implemented');
  }
  
  // 8. Check security documentation
  console.log('\n🔒 Security Documentation Analysis:');
  
  let securityDocs = false;
  let securityPolicies = 0;
  let securityGuidelines = 0;
  let securityCompliance = 0;
  let securityAudits = 0;
  
  // Check for security files
  const securityFiles = [
    'SECURITY.md',
    'SECURITY_GUIDELINES.md',
    'docs/security.md',
    'PRIVACY_POLICY.md',
    'COMPLIANCE.md'
  ];
  
  securityFiles.forEach(file => {
    if (fs.existsSync(file)) {
      securityDocs = true;
      const content = fs.readFileSync(file, 'utf8');
      
      securityPolicies += (content.match(/policy|rule|guideline/g) || []).length;
      securityGuidelines += (content.match(/guideline|best practice|recommendation/g) || []).length;
      securityCompliance += (content.match(/compliance|GDPR|SOC|PCI/g) || []).length;
      securityAudits += (content.match(/audit|check|scan|review/g) || []).length;
    }
  });
  
  console.log(`  📄 Security docs exist: ${securityDocs ? 'Yes' : 'No'}`);
  console.log(`  📋 Security policies: ${securityPolicies}`);
  console.log(`  📖 Security guidelines: ${securityGuidelines}`);
  console.log(`  ⚖️  Security compliance: ${securityCompliance}`);
  console.log(`  🔍 Security audits: ${securityAudits}`);
  
  if (securityDocs && securityPolicies >= 3 && securityGuidelines >= 3) {
    score++;
    console.log('  ✅ Security documentation is well implemented');
  } else {
    console.log('  ❌ Security documentation needs improvement');
    issues.push('Security documentation not well implemented');
  }
  
  // 9. Check changelog and versioning
  console.log('\n📝 Changelog & Versioning Analysis:');
  
  let changelog = false;
  let versionHistory = 0;
  let releaseNotes = 0;
  let breakingChanges = 0;
  let versionTags = 0;
  
  // Check for changelog files
  const changelogFiles = [
    'CHANGELOG.md',
    'CHANGES.md',
    'HISTORY.md',
    'RELEASES.md',
    'docs/changelog.md'
  ];
  
  changelogFiles.forEach(file => {
    if (fs.existsSync(file)) {
      changelog = true;
      const content = fs.readFileSync(file, 'utf8');
      
      versionHistory += (content.match(/##|version|v\d+\./g) || []).length;
      releaseNotes += (content.match(/added|fixed|changed|deprecated/g) || []).length;
      breakingChanges += (content.match(/breaking|major|important/g) || []).length;
      versionTags += (content.match(/v\d+\.\d+\.\d+/g) || []).length;
    }
  });
  
  console.log(`  📄 Changelog exists: ${changelog ? 'Yes' : 'No'}`);
  console.log(`  📈 Version history: ${versionHistory}`);
  console.log(`  📋 Release notes: ${releaseNotes}`);
  console.log(`  ⚠️  Breaking changes: ${breakingChanges}`);
  console.log(`  🏷️  Version tags: ${versionTags}`);
  
  if (changelog && versionHistory >= 3 && releaseNotes >= 5) {
    score++;
    console.log('  ✅ Changelog and versioning are well implemented');
  } else {
    console.log('  ❌ Changelog and versioning need improvement');
    issues.push('Changelog and versioning not well implemented');
  }
  
  // 10. Check handover documentation
  console.log('\n🤝 Handover Documentation Analysis:');
  
  let handoverDocs = false;
  let contactInfo = 0;
  let teamStructure = 0;
  let responsibilities = 0;
  let onboarding = 0;
  
  // Check for handover files
  const handoverFiles = [
    'HANDOVER.md',
    'ONBOARDING.md',
    'TEAM.md',
    'docs/handover.md',
    'docs/onboarding.md'
  ];
  
  handoverFiles.forEach(file => {
    if (fs.existsSync(file)) {
      handoverDocs = true;
      const content = fs.readFileSync(file, 'utf8');
      
      contactInfo += (content.match(/contact|email|phone|slack/g) || []).length;
      teamStructure += (content.match(/team|role|position|member/g) || []).length;
      responsibilities += (content.match(/responsibility|owner|lead|maintainer/g) || []).length;
      onboarding += (content.match(/onboard|new|join|start/g) || []).length;
    }
  });
  
  console.log(`  📄 Handover docs exist: ${handoverDocs ? 'Yes' : 'No'}`);
  console.log(`  📞 Contact information: ${contactInfo}`);
  console.log(`  👥 Team structure: ${teamStructure}`);
  console.log(`  🎯 Responsibilities: ${responsibilities}`);
  console.log(`  🚀 Onboarding info: ${onboarding}`);
  
  if (handoverDocs && contactInfo >= 2 && teamStructure >= 2) {
    score++;
    console.log('  ✅ Handover documentation is well implemented');
  } else {
    console.log('  ❌ Handover documentation needs improvement');
    issues.push('Handover documentation not well implemented');
  }
  
  // Calculate final score
  const percentage = Math.round((score / maxScore) * 100);
  
  console.log('\n📊 Phase 10 Results:');
  console.log(`  🎯 Documentation & Handover Score: ${score}/${maxScore} (${percentage}%)`);
  console.log(`  🔧 Fixes Available: ${fixes.length}`);
  console.log(`  ⚠️  Issues Found: ${issues.length}`);
  
  if (fixes.length > 0) {
    console.log('\n✅ Automatic Fixes Available:');
    fixes.forEach(fix => console.log(`  - ${fix}`));
  }
  
  if (issues.length > 0) {
    console.log('\n❌ Manual Issues Requiring Attention:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  // Phase completion determination
  const isPhaseComplete = percentage >= 85 && issues.length <= 3;
  
  console.log(`\n🎯 Phase 10 Status: ${isPhaseComplete ? '✅ COMPLETE' : '⚠️  NEEDS ATTENTION'}`);
  
  if (isPhaseComplete) {
    console.log('🚀 Project documentation is ready for handover!');
  } else {
    console.log('📝 Address remaining documentation issues before final handover');
  }
  
  return {
    success: isPhaseComplete,
    score,
    maxScore,
    percentage,
    fixes,
    issues,
    recommendations: issues.length > 0 ? ['Address manual documentation issues'] : []
  };
}

// Helper function to get all component files
function getComponentFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          traverse(fullPath);
        } else if (stat.isFile() && (
          item.endsWith('.tsx') || 
          item.endsWith('.ts') ||
          item.endsWith('.jsx') ||
          item.endsWith('.js')
        )) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  traverse(dir);
  return files;
}

if (require.main === module) {
  validateDocumentationHandover();
}

module.exports = { validateDocumentationHandover };
