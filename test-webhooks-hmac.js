#!/usr/bin/env node

/**
 * Test script for verifying HMAC webhook signatures
 * 
 * This script helps you test your webhook HMAC verification locally
 * before deploying to production.
 * 
 * Usage:
 *   node test-webhooks-hmac.js
 */

const crypto = require('crypto');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;

if (!SHOPIFY_API_SECRET) {
  console.error('❌ Error: SHOPIFY_API_SECRET not found in environment variables');
  console.error('Make sure you have a .env.local file with SHOPIFY_API_SECRET set');
  process.exit(1);
}

console.log('🔐 Testing Webhook HMAC Verification\n');
console.log('Using SHOPIFY_API_SECRET:', SHOPIFY_API_SECRET.substring(0, 10) + '...\n');

// Test payloads matching Shopify's format
const testPayloads = [
  {
    name: 'shop/redact',
    payload: {
      shop_id: 954889,
      shop_domain: 'test-shop.myshopify.com'
    }
  },
  {
    name: 'customers/data_request',
    payload: {
      shop_id: 954889,
      shop_domain: 'test-shop.myshopify.com',
      orders_requested: [299938, 280263, 220458],
      customer: {
        id: 191167,
        email: 'john@example.com',
        phone: '555-625-1199'
      },
      data_request: {
        id: 9999
      }
    }
  },
  {
    name: 'customers/redact',
    payload: {
      shop_id: 954889,
      shop_domain: 'test-shop.myshopify.com',
      customer: {
        id: 191167,
        email: 'john@example.com',
        phone: '555-625-1199'
      },
      orders_to_redact: [299938, 280263, 220458]
    }
  }
];

function calculateHMAC(body) {
  return crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(body, 'utf8')
    .digest('base64');
}

function verifyHMAC(body, hmacHeader) {
  const calculatedHmac = calculateHMAC(body);
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(calculatedHmac, 'base64'),
      Buffer.from(hmacHeader, 'base64')
    );
  } catch (error) {
    console.error('Comparison error:', error.message);
    return false;
  }
}

console.log('Running HMAC Verification Tests:\n');
console.log('='.repeat(70));

testPayloads.forEach((test, index) => {
  console.log(`\nTest ${index + 1}: ${test.name}`);
  console.log('-'.repeat(70));
  
  const body = JSON.stringify(test.payload);
  const hmac = calculateHMAC(body);
  
  console.log('Payload:', body.substring(0, 80) + '...');
  console.log('HMAC (base64):', hmac);
  
  // Test with correct HMAC
  const validResult = verifyHMAC(body, hmac);
  console.log('✓ Valid HMAC test:', validResult ? '✅ PASS' : '❌ FAIL');
  
  // Test with incorrect HMAC
  const invalidHmac = 'invalid-hmac-signature-12345==';
  const invalidResult = verifyHMAC(body, invalidHmac);
  console.log('✓ Invalid HMAC test:', !invalidResult ? '✅ PASS' : '❌ FAIL');
  
  // Generate curl command for manual testing
  console.log('\nCurl command to test this webhook:');
  console.log('```bash');
  console.log(`curl -X POST http://localhost:3000/api/webhooks/${test.name.replace('/', '/')} \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -H "x-shopify-hmac-sha256: ${hmac}" \\`);
  console.log(`  -d '${body}'`);
  console.log('```');
});

console.log('\n' + '='.repeat(70));
console.log('\n✅ All HMAC verification tests completed!\n');

console.log('Next Steps:');
console.log('1. Start your dev server: npm run dev');
console.log('2. Use the curl commands above to test your webhooks');
console.log('3. Expected response: HTTP 200 with success message');
console.log('4. Test invalid HMAC by changing the header value');
console.log('5. Expected response: HTTP 401 Unauthorized\n');

console.log('📚 Documentation:');
console.log('   - Shopify HMAC Verification: https://shopify.dev/docs/apps/build/webhooks/subscribe/https');
console.log('   - Testing Guide: See WEBHOOK_TESTING.md\n');

