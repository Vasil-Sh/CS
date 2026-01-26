import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = 'AIzaSyCPk71oK80DipfjyPy8F1rXfTFShwaHIBk';

async function listModels() {
  console.log('🔑 Testing Gemini API Key...');
  console.log('🔑 API Key:', apiKey.substring(0, 10) + '...');
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    console.log('📋 Listing available models...');
    
    // Try different model names that are commonly available
    const modelsToTry = [
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.0-pro'
    ];
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`\n🧪 Testing model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say "OK" in one word');
        const response = await result.response;
        const text = response.text();
        console.log(`✅ ${modelName} works! Response: ${text}`);
        break;
      } catch (error) {
        console.log(`❌ ${modelName} failed: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listModels();
