#!/usr/bin/env node
/**
 * Environment Variable Verification Script
 * Verifies all environment variables are properly loaded and configured
 */

import 'dotenv/config';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\n🔍 GAF WiFi Management - Environment Verification\n');
console.log('═'.repeat(60));

// Check .env file exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

console.log(`\n📄 Environment File:`);
console.log(`   .env exists: ${envExists ? '✅' : '❌'}`);

if (!envExists) {
  console.log('\n⚠️  .env file not found!');
  console.log('   Run: cp .env.example .env');
  process.exit(1);
}

// Verify environment variables
console.log(`\n🔧 Environment Variables:\n`);

const vars = {
  'PORT': {
    value: process.env.PORT || '3000',
    required: false,
    description: 'Server port',
    default: '3000'
  },
  'BASE_URL': {
    value: process.env.BASE_URL || 'http://192.168.11.10',
    required: false,
    description: 'Base URL for CORS',
    default: 'http://192.168.11.10'
  },
  'JWT_SECRET': {
    value: process.env.JWT_SECRET || '(auto-generated)',
    required: false,
    description: 'JWT signing secret',
    default: 'auto-generated on first run'
  },
  'JWT_EXPIRY': {
    value: process.env.JWT_EXPIRY || '8h',
    required: false,
    description: 'JWT token expiration',
    default: '8h'
  },
  'NODE_ENV': {
    value: process.env.NODE_ENV || 'development',
    required: false,
    description: 'Environment mode',
    default: 'development'
  },
  'GEMINI_API_KEY': {
    value: process.env.GEMINI_API_KEY ? '(set)' : '(not set)',
    required: false,
    description: 'Optional AI features',
    default: 'optional'
  }
};

let allGood = true;

for (const [key, config] of Object.entries(vars)) {
  const status = config.required && !process.env[key] ? '❌' : '✅';
  const value = config.value === '' ? `(empty - using default: ${config.default})` : config.value;
  
  console.log(`   ${status} ${key.padEnd(20)} = ${value}`);
  console.log(`      ${config.description}`);
  
  if (config.required && !process.env[key]) {
    allGood = false;
  }
}

// Check database directory
console.log(`\n📁 File System:\n`);

const isProd = process.env.NODE_ENV === 'production';
const dbDir = isProd ? path.join(__dirname, 'data') : __dirname;
const dbPath = path.join(dbDir, 'database.db');
const secretPath = isProd 
  ? path.join(__dirname, 'data', '.secret')
  : path.join(__dirname, '.secret');

console.log(`   Database directory: ${dbDir}`);
console.log(`   Database exists: ${fs.existsSync(dbPath) ? '✅' : '⚠️  (will be created on first run)'}`);
console.log(`   JWT secret file: ${fs.existsSync(secretPath) ? '✅' : '⚠️  (will be created on first run)'}`);

// Check dist folder for production
if (isProd) {
  const distPath = path.join(__dirname, 'dist');
  const distExists = fs.existsSync(distPath);
  console.log(`   Frontend build (dist/): ${distExists ? '✅' : '❌ Run: npm run build'}`);
  
  if (!distExists) {
    allGood = false;
  }
}

// Summary
console.log('\n' + '═'.repeat(60));

if (allGood) {
  console.log('\n✅ All checks passed! Application is ready to run.\n');
  console.log('Start the application:');
  console.log('  Development: npm run dev');
  console.log('  Production:  npm start\n');
  process.exit(0);
} else {
  console.log('\n❌ Some checks failed. Please fix the issues above.\n');
  process.exit(1);
}
