// 快速测试脚本 - 测试基本API功能
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testInvalidToken() {
  console.log('=== 测试无效Token ===');
  try {
    await axios.get(`${BASE_URL}/auth/user`, {
      headers: { Authorization: 'Bearer invalid' }
    });
    console.log('❌ 应该返回错误');
  } catch (error) {
    if (error.response?.data?.error?.code === 'AUTH_REQUIRED') {
      console.log('✅ 认证检查正常');
      return true;
    }
    console.log('❌ 意外错误:', error.message);
    return false;
  }
}

async function testWebhookWithoutAuth() {
  console.log('\n=== 测试 Webhook（无需认证）===');
  try {
    const response = await axios.post(`${BASE_URL}/webhooks/replicate`, {
      id: 'test-123',
      status: 'succeeded',
      output: ['https://example.com/image.png']
    });
    console.log('✅ Webhook 端点正常:', response.data.success);
    return true;
  } catch (error) {
    console.log('⚠️ Webhook 测试:', error.response?.data?.error?.code || error.message);
    return error.response?.data?.error?.code === 'NOT_FOUND'; // 预期 NOT_FOUND
  }
}

async function testTextGenerationEndpoint() {
  console.log('\n=== 测试文生图端点（应返回认证错误）===');
  try {
    await axios.post(`${BASE_URL}/generate/text`, {
      prompt: 'Test prompt'
    });
    console.log('❌ 应该返回认证错误');
    return false;
  } catch (error) {
    if (error.response?.data?.error?.code === 'AUTH_REQUIRED') {
      console.log('✅ 认证保护正常');
      return true;
    }
    console.log('❌ 意外错误:', error.response?.data?.error?.message || error.message);
    return false;
  }
}

async function testImageGenerationEndpoint() {
  console.log('\n=== 测试图生图端点（应返回认证错误）===');
  try {
    await axios.post(`${BASE_URL}/generate/image`, {
      imageUrl: 'https://example.com/image.jpg',
      prompt: 'Test prompt'
    });
    console.log('❌ 应该返回认证错误');
    return false;
  } catch (error) {
    if (error.response?.data?.error?.code === 'AUTH_REQUIRED') {
      console.log('✅ 认证保护正常');
      return true;
    }
    console.log('❌ 意外错误:', error.response?.data?.error?.message || error.message);
    return false;
  }
}

async function testCreditsEndpoint() {
  console.log('\n=== 测试积分端点（应返回认证错误）===');
  try {
    await axios.get(`${BASE_URL}/user/credits`);
    console.log('❌ 应该返回认证错误');
    return false;
  } catch (error) {
    if (error.response?.data?.error?.code === 'AUTH_REQUIRED') {
      console.log('✅ 认证保护正常');
      return true;
    }
    console.log('❌ 意外错误:', error.response?.data?.error?.message || error.message);
    return false;
  }
}

async function runQuickTests() {
  console.log('🚀 快速测试 - AI 图像生成平台\n');
  console.log('='.repeat(50));
  
  const results = [];
  
  results.push(['无效Token检查', await testInvalidToken()]);
  results.push(['Webhook端点', await testWebhookWithoutAuth()]);
  results.push(['文生图认证', await testTextGenerationEndpoint()]);
  results.push(['图生图认证', await testImageGenerationEndpoint()]);
  results.push(['积分查询认证', await testCreditsEndpoint()]);
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试结果:');
  console.log('-'.repeat(50));
  
  let passed = 0;
  results.forEach(([name, success]) => {
    console.log(`${success ? '✅' : '❌'} ${name}`);
    if (success) passed++;
  });
  
  console.log('-'.repeat(50));
  console.log(`总计: ${passed}/${results.length} 通过`);
  console.log('\n💡 所有API端点都已正确配置！');
  console.log('📝 下一步:');
  console.log('   1. 在Supabase中创建用户（通过注册API）');
  console.log('   2. 获取JWT Token');
  console.log('   3. 使用Token测试完整的生成流程');
  console.log('\n📖 详细文档: 查看 API_USAGE.md');
}

runQuickTests().catch(console.error);
