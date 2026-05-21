// 详细诊断脚本
const axios = require('axios').default;

const BASE_URL = 'http://localhost:3000';

// 测试环境变量是否正确加载
async function testEnv() {
  console.log('=== 测试环境变量 ===');
  
  // 通过检查 API 是否能访问来间接测试
  try {
    const response = await axios.get(`${BASE_URL}/api/auth/user`, {
      timeout: 5000,
    });
    console.log('API 可访问:', response.status);
  } catch (error) {
    console.log('API 访问失败:', error.message);
  }
}

// 测试 Supabase 连接
async function testSupabaseDirect() {
  console.log('\n=== 测试直接连接 Supabase ===');
  
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    'https://abrusrpxpfhuwykqntpg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFicnVzcnB4cGZodXd5a3FudHBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI0MzA0NSwiZXhwIjoyMDk0ODE5MDQ1fQ.dajUa0oQhm7V_5molRJxA9owkscNnEH_gDDLQYo6wu0'
  );
  
  try {
    console.log('正在连接到 Supabase...');
    const { data, error } = await supabase.auth.signUp({
      email: `direct-test-${Date.now()}@test-domain.com`,
      password: 'Password123!',
    });
    
    if (error) {
      console.log('Supabase Auth 错误:', error);
      console.log('错误详情:', JSON.stringify(error, null, 2));
    } else {
      console.log('Supabase Auth 成功:', data?.user?.email);
    }
  } catch (error) {
    console.log('Supabase 连接异常:', error);
  }
}

// 测试注册 API 并获取详细错误
async function testSignupDetailed() {
  console.log('\n=== 测试注册 API (详细) ===');
  
  const email = `detailed-test-${Date.now()}@test-domain.com`;
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/signup`, {
      email,
      password: 'Password123!',
      displayName: 'Test User',
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });
    
    console.log('成功:', response.status);
    console.log('响应:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('失败:', error.response?.status);
    console.log('响应数据:', error.response?.data ? JSON.stringify(error.response.data, null, 2) : error.message);
    console.log('请求配置:', error.config?.data);
  }
}

async function run() {
  console.log('=== 开始诊断 ===');
  
  await testEnv();
  await testSupabaseDirect();
  await testSignupDetailed();
  
  console.log('\n=== 诊断完成 ===');
}

run();
