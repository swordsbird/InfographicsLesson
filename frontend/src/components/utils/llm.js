
import { OPENAI_API_KEY, OPENAI_API_URL } from "./OPENAI_API";

// 使用OpenAI API分析图片
async function queryOpenAI(dataUrl, customPromptValue) {
    try {
    // 使用已生成的dataUrl
        const imageData = dataUrl.split(',')[1];

        // 准备API请求
        const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-4o-mini", 
            messages: [
            {
                role: "user",
                content: [
                {
                    type: "image_url",
                    image_url: {
                    url: `data:image/png;base64,${imageData}`
                    }
                },
                {
                    type: "text",
                    text: customPromptValue
                }
                ]
            }
            ],
            max_tokens: 1000
        })
        });

        if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error) {
        console.error('OpenAI API error:', error);
        throw error;
    }
}

async function analyzeWithOpenAI(dataUrl, customPromptValue) {
    const result = await queryOpenAI(dataUrl, customPromptValue);
    // 移除开头的```json和结尾的```
    const cleanResult = result.replace(/^```json\n/, '').replace(/\n```$/, '');
    const parsedResult = JSON.parse(cleanResult);
    return parsedResult;
}

const defaultQueryPrompt = `请解释下面的信息图内容：
1. 请先提供整体的解释，简要描述这张信息图的主题、目的和主要信息。
2. 接下来，请逐个解释每个红色框中的元素。每个红色框中都包含一个数字标号。请按照标号顺序，逐一说明每个红色框中的内容，提供该元素的详细解释。
请详细解释每个红色框中的元素，并简明扼要地描述它们在信息图中的作用与含义。 （注意：红色框中的圆形标号只是序号，不要将序号解释为元素的一部分）
你的输出需要以json格式给出。按照以下格式:
[{
  "title": "信息图主题",
  "description": "信息图的简要描述",
  "elements": [
    { "index": 0, "content": "...视觉元素的解释" },
    { "index": 1, "content": "...视觉元素的解释" },
  ]
}]`;

export { queryOpenAI, analyzeWithOpenAI, defaultQueryPrompt }
