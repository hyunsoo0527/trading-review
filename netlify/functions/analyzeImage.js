const { OpenAI } = require('openai');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const { images, inputs } = JSON.parse(event.body);

  if (!images || images.length === 0) {
    return { statusCode: 400, body: 'Bad Request: No images provided.' };
  }

  try {
    // 1. 각 차트 이미지에 대한 개별 분석을 병렬로 요청합니다.
    const chartAnalysisPromises = images.map(image => {
      const prompt = `
        You are an expert trading analyst specializing in technical analysis.
        Analyze the provided chart image for the ${image.timeframe} timeframe in detail.

        Your analysis should include:
        1.  **Candlestick Patterns:** Identify any significant candlestick patterns (e.g., Doji, Hammer, Engulfing patterns).
        2.  **Chart Patterns:** Identify any classic chart patterns (e.g., Head and Shoulders, Triangles, Flags).
        3.  **Key Indicators:** Analyze the state of key indicators visible on the chart (e.g., Moving Averages, RSI, MACD). Describe what they suggest about momentum, trend, and potential reversals.
        4.  **Support and Resistance:** Identify key support and resistance levels.
        5.  **Conclusion:** Provide a brief conclusion about what this specific chart implies for the asset's price action.

        Your analysis must be specific to this ${image.timeframe} chart.
        Return only the raw text of your analysis, not JSON.
      `;
      return openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: image.src },
              },
            ],
          },
        ],
        max_tokens: 400,
      });
    });

    // 모든 개별 분석 요청이 완료될 때까지 기다립니다.
    const chartAnalysisResponses = await Promise.all(chartAnalysisPromises);
    const chart_specific_analysis = chartAnalysisResponses.map((response, index) => ({
      timeframe: images[index].timeframe, // 원래의 timeframe을 사용합니다.
      analysis: response.choices[0].message.content,
    }));

    // 2. 전체적인 결론 및 타임프레임 요약 분석을 요청합니다.
    const overallPrompt = `
      You are a master trading analyst and strategist. A user has provided screenshots of their trading charts across multiple timeframes, along with their trade entry details.
      Your task is to synthesize all this information into a cohesive and actionable trading analysis.

      **User's Trade Info:**
      - Entry Price: ${inputs.entry}
      - Position Size: ${inputs.size}
      - Average Price: ${inputs.avgPrice}

      **Provided Chart Timeframes:** ${images.map(i => i.timeframe).join(', ')}

      **Your Analysis (should be in JSON format):**

      1.  **Overall Conclusion & Trade Viability:**
          *   Based on a holistic view of all the charts, provide a comprehensive conclusion about the user's trade.
          *   Critique the entry point. Was it optimal? Why or why not?
          *   What is the likely future direction of the price, considering the multi-timeframe analysis?
          *   Provide a clear "trading recommendation" (e.g., "Hold the position with a stop-loss at X", "Consider taking profit at Y", "The entry was risky, consider exiting").

      2.  **Timeframe Stack Analysis:**
          *   For each timeframe, provide a one-sentence summary of the key takeaway.
          *   Assign a clear sentiment: "Bullish", "Bearish", or "Neutral".

      **JSON Response Format:**
      Please format your entire response as a single, valid JSON object. Do not include any explanatory text outside of the JSON structure itself.
      
      {
        "overall_conclusion": "<Your detailed conclusion and trade viability analysis here>",
        "timeframe_analysis": [
          ${images.map(i => `{ "timeframe": "${i.timeframe}", "sentiment": "<Bullish/Bearish/Neutral>", "summary": "<Your one-sentence summary for this timeframe>" }`).join(',
    ')}
        ]
      }
    `;

    const overallResponse = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: overallPrompt },
            ...images.map(image => ({
              type: 'image_url',
              image_url: { url: image.src },
            })),
          ],
        },
      ],
      max_tokens: 1500,
      response_format: { type: "json_object" }, // 응답을 JSON 형식으로 강제합니다.
    });

    const overallAnalysis = JSON.parse(overallResponse.choices[0].message.content);

    // 3. 두 종류의 분석 결과를 합쳐서 최종 응답을 구성합니다.
    const finalResponse = {
      ...overallAnalysis,
      chart_specific_analysis, // 여기에 개별 분석 결과가 포함됩니다.
    };

    return {
      statusCode: 200,
      body: JSON.stringify(finalResponse),
    };

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to analyze charts. Check your OPENAI_API_KEY.' }) };
  }
};
