const { OpenAI } = require('openai');

exports.handler = async (event) => {
  // 1. Check for the correct HTTP method
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // 2. Safely retrieve the OpenAI API key from Netlify environment variables
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // 3. Parse the incoming data from the frontend
  const { images, inputs } = JSON.parse(event.body);

  // 4. Basic validation
  if (!images || images.length === 0) {
    return { statusCode: 400, body: 'Bad Request: No images provided.' };
  }

  try {
    // 5. Construct the prompt for the AI
    const prompt = `
      You are a professional trading analyst. A user has provided screenshots of their trading charts and some basic trade information. 
      Your task is to provide a comprehensive analysis based on the provided images.

      User's Trade Info:
      - Entry Price: ${inputs.entry}
      - Position Size: ${inputs.size}
      - Average Price: ${inputs.avgPrice}

      Based on the chart images provided, please analyze the following:
      1.  **Overall Conclusion:** Briefly summarize the user's trade. Was it a good entry? What were the key factors?
      2.  **Timeframe Stack Analysis:** For each timeframe (e.g., Daily, 1H, 3min), provide a one-sentence summary and a sentiment (Bullish, Bearish, or Neutral).
      3.  **Chart Specific Analysis:** For each individual chart image, provide a 2-3 sentence analysis explaining the key patterns, indicators, or signals you see.

      Please format your response as a JSON object with the following structure:
      {
        "overall_conclusion": "<Your summary here>",
        "timeframe_analysis": [
          { "timeframe": "Daily Chart", "sentiment": "Bullish/Bearish/Neutral", "summary": "<Your one-sentence summary>" },
          { "timeframe": "1H Chart", "sentiment": "Bullish/Bearish/Neutral", "summary": "<Your one-sentence summary>" }
        ],
        "chart_specific_analysis": [
          { "timeframe": "Daily Chart", "analysis": "<Your 2-3 sentence analysis for this specific chart>" },
          { "timeframe": "1H Chart", "analysis": "<Your 2-3 sentence analysis for this specific chart>" }
        ]
      }
    `;

    // 6. Prepare the messages array for the OpenAI API call, including the images
    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          // Map over the images array to include them in the request
          ...images.map(image => ({
            type: 'image_url',
            image_url: {
              url: image.src, // The base64 data URL
            },
          })),
        ],
      },
    ];

    // 7. Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: messages,
      max_tokens: 1000, // Adjust as needed
    });

    // 8. Extract the response and send it back to the frontend
    const analysisResult = response.choices[0].message.content;

    return {
      statusCode: 200,
      body: analysisResult, // The response is already a JSON string
    };

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to analyze charts.' }) };
  }
};
