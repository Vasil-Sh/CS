import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = 'AIzaSyCPk71oK80DipfjyPy8F1rXfTFShwaHIBk';

async function testGemini() {
  console.log('🔑 Testing Gemini API Key...');
  console.log('🔑 API Key:', apiKey.substring(0, 10) + '...');
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    
    console.log('✅ API initialized successfully');
    console.log('📡 Sending test request...');
    
    const prompt = 'Привіт! Скажи "Gemini працює!" українською мовою.';
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Response received:');
    console.log(text);
    console.log('\n🎉 Gemini API працює коректно!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('❌ Full error:', JSON.stringify(error, null, 2));
  }
}

testGemini();
