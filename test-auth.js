// 测试认证 API 的脚本
const axios = require('axios').default;

const BASE_URL = 'http://localhost:3000';

async function testSignup() {
  try {
    const email = `test-${Date.now()}@test-domain.com`;
    const password = 'Password123!';
    
    console.log('测试注册 API...');
    console.log('发送数据:', { email, password, displayName: 'Test User' });
    
    const response = await axios.post(`${BASE_URL}/api/auth/signup`, {
      email,
      password,
      displayName: 'Test User',
    }, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    console.log('注册成功:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('注册失败:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

async function testSignin(email, password) {
  try {
    console.log('测试登录 API...');
    console.log('发送数据:', { email, password });
    
    const response = await axios.post(`${BASE_URL}/api/auth/signin`, {
      email,
      password,
    }, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    console.log('登录成功:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('登录失败:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

async function runTests() {
  console.log('=== 开始测试认证 API ===\n');
  
  // 测试注册
  const signupResult = await testSignup();
  
  if (signupResult.success) {
    // 如果注册成功，测试登录
    const email = signupResult.data.data.user.email;
    await testSignin(email, 'Password123!');
  }
  
  console.log('\n=== 测试完成 ===');
}

// 确保安装了 axios
async function main() {
  try {
    await runTests();
  } catch (error) {
    console.error('测试脚本出错:', error);
  }
}

main();
