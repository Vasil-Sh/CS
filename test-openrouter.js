const apiKey = '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';

async function testOpenRouter() {
  console.log('🔑 Testing OpenRouter API...');
  console.log('🔑 API Key:', apiKey.substring(0, 15) + '...');
  
  try {
    console.log('\n📡 Sending test request to OpenRouter...');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5174',
        'X-Title': 'CS2 Betting App Test'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: 'Привіт! Скажи "OpenRouter працює!" українською мовою.'
          }
        ],
        temperature: 0.7,
        max_tokens: 100
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Request failed:', response.status, response.statusText);
      console.error('Error details:', errorText);
      return;
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    
    console.log('✅ Response received:');
    console.log(text);
    console.log('\n🎉 OpenRouter API працює коректно!');
    console.log('💡 Model used:', data.model);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

testOpenRouter();
