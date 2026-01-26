const apiKey = 'AIzaSyCPk71oK80DipfjyPy8F1rXfTFShwaHIBk';

async function testDirectAPI() {
  console.log('🔑 Testing Gemini API directly with fetch...');
  
  try {
    // Test 1: List available models
    console.log('\n📋 Step 1: Listing available models...');
    const listResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    
    if (!listResponse.ok) {
      console.error('❌ List models failed:', listResponse.status, listResponse.statusText);
      const errorText = await listResponse.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const listData = await listResponse.json();
    console.log('✅ Available models:');
    
    if (listData.models && listData.models.length > 0) {
      listData.models.forEach(model => {
        console.log(`  - ${model.name}`);
        console.log(`    Supported methods: ${model.supportedGenerationMethods?.join(', ')}`);
      });
      
      // Find a model that supports generateContent
      const workingModel = listData.models.find(m => 
        m.supportedGenerationMethods?.includes('generateContent')
      );
      
      if (workingModel) {
        console.log(`\n✅ Found working model: ${workingModel.name}`);
        
        // Test 2: Try generating content with the working model
        console.log('\n📡 Step 2: Testing content generation...');
        const modelName = workingModel.name.split('/').pop();
        
        const generateResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: 'Привіт! Скажи "Gemini працює!" українською мовою.'
                }]
              }]
            })
          }
        );
        
        if (!generateResponse.ok) {
          console.error('❌ Generate failed:', generateResponse.status, generateResponse.statusText);
          const errorText = await generateResponse.text();
          console.error('Error details:', errorText);
          return;
        }
        
        const generateData = await generateResponse.json();
        const text = generateData.candidates?.[0]?.content?.parts?.[0]?.text;
        
        console.log('✅ Response received:');
        console.log(text);
        console.log('\n🎉 Gemini API працює коректно!');
        console.log(`\n💡 Use model name: ${modelName}`);
      } else {
        console.error('❌ No model found that supports generateContent');
      }
    } else {
      console.error('❌ No models available for this API key');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

testDirectAPI();
