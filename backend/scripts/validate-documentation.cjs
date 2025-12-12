const fs = require('fs');
const path = require('path');

function validateDocumentation() {
  console.log('📚 Documentation & Handover Validation Report\n');
  
  // Check existing documentation files
  console.log('📄 Documentation Files:');
  
  const docFiles = [
    'README.md',
    'CHANGELOG.md',
    'CONTRIBUTING.md',
    'LICENSE',
    'swagger.yaml',
    'swagger.json',
    'openapi.yaml',
    'AccuBooks.postman_collection.json'
  ];
  
  let existingDocs = 0;
  docFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`  ${exists ? '✅' : '❌'} ${file}`);
    if (exists) existingDocs++;
  });
  
  console.log(`  📊 ${existingDocs}/${docFiles.length} documentation files present\n`);
  
  // Validate README.md content
  console.log('📖 README.md Content Validation:');
  
  if (fs.existsSync('README.md')) {
    const readmeContent = fs.readFileSync('README.md', 'utf8');
    
    const sections = [
      { name: 'Project Description', pattern: /## (Description|Overview|About)/i },
      { name: 'Installation', pattern: /## (Installation|Setup|Getting Started)/i },
      { name: 'Environment Variables', pattern: /## (Environment|Configuration|\.env)/i },
      { name: 'API Documentation', pattern: /## (API|Endpoints|Routes)/i },
      { name: 'Database Setup', pattern: /## (Database|Prisma|Migrations)/i },
      { name: 'Testing', pattern: /## (Testing|Tests|Jest)/i },
      { name: 'Deployment', pattern: /## (Deployment|Deploy|Production)/i },
      { name: 'Scripts', pattern: /## (Scripts|NPM|Commands)/i },
      { name: 'Architecture', pattern: /## (Architecture|Structure|Project)/i }
    ];
    
    let sectionsFound = 0;
    sections.forEach(section => {
      const found = section.pattern.test(readmeContent);
      console.log(`  ${found ? '✅' : '❌'} ${section.name}`);
      if (found) sectionsFound++;
    });
    
    console.log(`  📊 ${sectionsFound}/${sections.length} documentation sections complete`);
  } else {
    console.log('  ❌ README.md not found');
  }
  
  // Check environment variables documentation
  console.log('\n⚙️  Environment Variables Documentation:');
  
  if (fs.existsSync('README.md')) {
    const readmeContent = fs.readFileSync('README.md', 'utf8');
    
    const envVars = [
      'NODE_ENV',
      'DATABASE_URL',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'PORT',
      'REDIS_URL',
      'CORS_ORIGIN',
      'STRIPE_SECRET_KEY',
      'EMAIL_HOST',
      'EMAIL_USER',
      'EMAIL_PASS'
    ];
    
    let documentedVars = 0;
    envVars.forEach(varName => {
      const documented = readmeContent.includes(varName);
      console.log(`  ${documented ? '✅' : '❌'} ${varName}`);
      if (documented) documentedVars++;
    });
    
    console.log(`  📊 ${documentedVars}/${envVars.length} environment variables documented`);
  }
  
  // Check API documentation
  console.log('\n🌐 API Documentation:');
  
  const hasSwagger = fs.existsSync('swagger.yaml') || fs.existsSync('swagger.json');
  const hasPostman = fs.existsSync('AccuBooks.postman_collection.json');
  
  if (hasSwagger) {
    const swaggerFile = fs.existsSync('swagger.yaml') ? 'swagger.yaml' : 'swagger.json';
    const swaggerContent = fs.readFileSync(swaggerFile, 'utf8');
    
    const hasInfo = swaggerContent.includes('info:') || swaggerContent.includes('"info"');
    const hasPaths = swaggerContent.includes('paths:') || swaggerContent.includes('"paths"');
    const hasComponents = swaggerContent.includes('components:') || swaggerContent.includes('"components"');
    const hasSecurity = swaggerContent.includes('security:') || swaggerContent.includes('"security"');
    
    console.log(`  📄 ${swaggerFile}:`);
    console.log(`    ${hasInfo ? '✅' : '❌'} API info section`);
    console.log(`    ${hasPaths ? '✅' : '❌'} API paths defined`);
    console.log(`    ${hasComponents ? '✅' : '❌'} Components/schemas`);
    console.log(`    ${hasSecurity ? '✅' : '❌'} Security schemes`);
  } else {
    console.log('  ❌ Swagger/OpenAPI documentation not found');
  }
  
  console.log(`  ${hasPostman ? '✅' : '❌'} Postman collection available`);
  
  // Check database documentation
  console.log('\n🗄️  Database Documentation:');
  
  if (fs.existsSync('README.md')) {
    const readmeContent = fs.readFileSync('README.md', 'utf8');
    
    const hasPrismaSetup = readmeContent.includes('Prisma') || readmeContent.includes('prisma');
    const hasMigrationSteps = readmeContent.includes('migration') || readmeContent.includes('migrate');
    const hasSeedInfo = readmeContent.includes('seed') || readmeContent.includes('seeding');
    const hasSchemaInfo = readmeContent.includes('schema') || readmeContent.includes('models');
    
    console.log(`  ${hasPrismaSetup ? '✅' : '❌'} Prisma setup instructions`);
    console.log(`  ${hasMigrationSteps ? '✅' : '❌'} Database migration steps`);
    console.log(`  ${hasSeedInfo ? '✅' : '❌'} Database seeding info`);
    console.log(`  ${hasSchemaInfo ? '✅' : '❌'} Database schema documentation`);
  }
  
  // Check monitoring documentation
  console.log('\n📊 Monitoring Documentation:');
  
  if (fs.existsSync('README.md')) {
    const readmeContent = fs.readFileSync('README.md', 'utf8');
    
    const hasLoggingInfo = readmeContent.includes('logging') || readmeContent.includes('Winston');
    const hasMetricsInfo = readmeContent.includes('metrics') || readmeContent.includes('monitoring');
    const hasHealthChecks = readmeContent.includes('health') || readmeContent.includes('/health');
    const hasAlertingInfo = readmeContent.includes('alert') || readmeContent.includes('notification');
    
    console.log(`  ${hasLoggingInfo ? '✅' : '❌'} Logging documentation`);
    console.log(`  ${hasMetricsInfo ? '✅' : '❌'} Metrics documentation`);
    console.log(`  ${hasHealthChecks ? '✅' : '❌'} Health check endpoints`);
    console.log(`  ${hasAlertingInfo ? '✅' : '❌'} Alerting setup`);
  }
  
  // Check deployment documentation
  console.log('\n🚀 Deployment Documentation:');
  
  if (fs.existsSync('README.md')) {
    const readmeContent = fs.readFileSync('README.md', 'utf8');
    
    const hasDockerInfo = readmeContent.includes('Docker') || readmeContent.includes('docker');
    const hasProductionSteps = readmeContent.includes('production') || readmeContent.includes('deploy');
    const hasEnvSetup = readmeContent.includes('environment') || readmeContent.includes('production env');
    const hasBuildSteps = readmeContent.includes('build') || readmeContent.includes('npm run build');
    
    console.log(`  ${hasDockerInfo ? '✅' : '❌'} Docker deployment`);
    console.log(`  ${hasProductionSteps ? '✅' : '❌'} Production deployment steps`);
    console.log(`  ${hasEnvSetup ? '✅' : '❌'} Production environment setup`);
    console.log(`  ${hasBuildSteps ? '✅' : '❌'} Build process documentation`);
  }
  
  // Check development scripts documentation
  console.log('\n🔧 Development Scripts Documentation:');
  
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const scripts = packageJson.scripts || {};
    
    const scriptNames = Object.keys(scripts);
    console.log(`  📊 Found ${scriptNames.length} npm scripts`);
    
    if (fs.existsSync('README.md')) {
      const readmeContent = fs.readFileSync('README.md', 'utf8');
      
      let documentedScripts = 0;
      scriptNames.forEach(scriptName => {
        if (readmeContent.includes(scriptName)) {
          documentedScripts++;
        }
      });
      
      console.log(`  📊 ${documentedScripts}/${scriptNames.length} scripts documented in README`);
    }
  }
  
  // Generate missing documentation recommendations
  console.log('\n🎯 Documentation Recommendations:');
  
  const recommendations = [];
  
  if (!fs.existsSync('README.md')) {
    recommendations.push('Create comprehensive README.md');
  }
  
  if (!fs.existsSync('CHANGELOG.md')) {
    recommendations.push('Add CHANGELOG.md for version history');
  }
  
  if (!fs.existsSync('CONTRIBUTING.md')) {
    recommendations.push('Add CONTRIBUTING.md for development guidelines');
  }
  
  if (!hasSwagger) {
    recommendations.push('Generate Swagger/OpenAPI documentation');
  }
  
  if (!fs.existsSync('DEPLOYMENT.md')) {
    recommendations.push('Create detailed DEPLOYMENT.md guide');
  }
  
  if (!fs.existsSync('TROUBLESHOOTING.md')) {
    recommendations.push('Add TROUBLESHOOTING.md for common issues');
  }
  
  if (recommendations.length === 0) {
    console.log('  ✅ Documentation is comprehensive!');
  } else {
    recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }
  
  // Calculate documentation score
  console.log('\n📊 Documentation Assessment Score:');
  
  const maxScore = 10;
  let docScore = 0;
  
  if (fs.existsSync('README.md')) docScore++;
  if (fs.existsSync('swagger.yaml') || fs.existsSync('swagger.json')) docScore++;
  if (fs.existsSync('AccuBooks.postman_collection.json')) docScore++;
  if (fs.existsSync('CHANGELOG.md')) docScore++;
  if (fs.existsSync('CONTRIBUTING.md')) docScore++;
  if (fs.existsSync('package.json')) docScore++;
  if (fs.existsSync('prisma/schema.prisma')) docScore++;
  if (fs.existsSync('LICENSE')) docScore++;
  if (fs.existsSync('Dockerfile')) docScore++;
  if (fs.existsSync('docker-compose.yml')) docScore++;
  
  const percentage = Math.round((docScore / maxScore) * 100);
  console.log(`  🎯 Overall Documentation Score: ${docScore}/${maxScore} (${percentage}%)`);
  
  return {
    success: true,
    documentationScore: docScore,
    maxScore,
    percentage,
    existingDocs,
    recommendations
  };
}

if (require.main === module) {
  validateDocumentation();
}

module.exports = { validateDocumentation };
