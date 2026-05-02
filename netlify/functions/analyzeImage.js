exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'OPENAI_API_KEY 환경변수가 설정되지 않았습니다.' }),
      };
    }

    const { image } = JSON.parse(event.body);

    if (!image) {
      return { statusCode: 400, body: 'Bad Request: No image provided.' };
    }

    const prompt = `
      차트 이미지를 참고용으로만 분석해 주세요.
      투자 조언처럼 단정하지 말고, 이미지에서 보이는 흐름만 간단히 분류하세요.
      저항선과 지지선은 차트의 가격 축, 캔들 위치, 수평 매물대 또는 반복 반응 구간을 기준으로 숫자로 추정해 주세요.
      예: "132 부근", "128.5 부근", "64,200 부근"
      가격 축이나 숫자를 이미지에서 읽기 어려우면 임의로 만들지 말고 "확인 어려움"이라고 적어 주세요.

      반드시 JSON만 반환하세요.
      {
        "상태": "상승 | 횡보 | 하강 중 하나",
        "저항선": "숫자 부근 또는 확인 어려움",
        "지지선": "숫자 부근 또는 확인 어려움",
        "포지션": "지지선 근처 | 저항선 근처 | 중간 구간 중 하나"
      }
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: image, detail: 'low' },
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 180,
      }),
    });

    const responseBody = await response.json();

    if (!response.ok) {
      console.error('OpenAI API error:', responseBody);
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: responseBody.error?.message || 'OpenAI API 요청에 실패했습니다.',
        }),
      };
    }

    const analysis = responseBody.choices?.[0]?.message?.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ analysis }),
    };

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return { statusCode: 502, body: JSON.stringify({ error: 'OpenAI 분석 요청 처리 중 오류가 발생했습니다.' }) };
  }
};
