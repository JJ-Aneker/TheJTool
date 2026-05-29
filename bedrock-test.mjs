import dotenv from 'dotenv';
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';

dotenv.config();

const client = new BedrockRuntimeClient({
  region: 'eu-south-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function testBedrock() {
  try {
    console.log('🔄 Conectando a Amazon Bedrock...');
    console.log('📌 Inference Profile: EU Anthropic Claude Haiku 4.5');
    console.log('📌 Model ID: eu.anthropic.claude-haiku-4-5-20251001-v1:0');
    console.log('🌍 Región: eu-south-2');
    console.log('🔌 API: bedrock:Converse\n');

    const command = new ConverseCommand({
      modelId: 'eu.anthropic.claude-haiku-4-5-20251001-v1:0',
      messages: [
        {
          role: 'user',
          content: [
            {
              text: 'Di hola en español en una frase',
            },
          ],
        },
      ],
      inferenceConfig: {
        maxTokens: 100,
      },
    });

    const response = await client.send(command);

    console.log('✅ ¡¡¡CONEXIÓN EXITOSA CON BEDROCK!!!\n');
    console.log('📝 Respuesta del modelo:');
    console.log(response.output.message.content[0].text);
    console.log('\n🎉 ¡El script está funcionando correctamente!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testBedrock();
