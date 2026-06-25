import { HfInference } from '@huggingface/inference';
import dotenv from 'dotenv';
dotenv.config();

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
async function testModel(model) {
  try {
    const response = await hf.chatCompletion({
      model: model,
      messages: [
        { role: "user", content: "hello" }
      ]
    });
    console.log(`Success ${model}:`, response.choices[0].message.content);
  } catch (e) {
    console.error(`Error ${model}:`, e.message);
  }
}

await testModel("HuggingFaceH4/zephyr-7b-beta");
await testModel("mistralai/Mistral-7B-Instruct-v0.2");
await testModel("mistralai/Mistral-7B-Instruct-v0.3");
