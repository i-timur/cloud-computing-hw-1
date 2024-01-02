import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs'
import axios from 'axios';

const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_FUNC_ID = process.env.BOT_FUNC_ID;

const WEBHOOK_URL = 'https://functions.yandexcloud.net/' + BOT_FUNC_ID;

async function registerWebhook() {
	const { data: webhookInfo } = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);

	if (!webhookInfo.result.url) {
		await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${WEBHOOK_URL}`);
		console.log('Вебхук был зарегистрирован');	
	}
}

const SECRET_KEY = process.env.SECRET_KEY;
const KEY_ID = process.env.KEY_ID;
const FOLDER_ID = process.env.FOLDER_ID;
const QUEUE = process.env.QUEUE;

const config = {
	region: 'ru-central1',
	credentials: {
		accessKeyId: KEY_ID,
		secretAccessKey: SECRET_KEY,	
	},
};

const client = new S3Client({
	...config,
	endpoint: 'https://storage.yandexcloud.net',
});
const sqsClient = new SQSClient({
	...config,
	apiVersion: '2012-11-05',
	endpoint: 'https://message-queue.api.cloud.yandex.net',
});

export const handler = async function (event, context) {	
	for (const message of event.messages) {
		const bucketId = message.details.bucket_id;
		const objectId = message.details.object_id;
		if (
			message.event_metadata.event_type === 'yandex.cloud.events.storage.ObjectCreate'
			&& (objectId.endsWith('.jpg') || objectId.endsWith('.jpeg'))
		) {
			const command = new GetObjectCommand({
				Bucket: bucketId,
				Key: objectId,
			});

			try {
				const response = await client.send(command);

				const image = Buffer.concat(await response.Body.toArray()).toString('base64');

				const body = {
					folderId: FOLDER_ID,
					analyze_specs: [{
						content: image,
						features: [{
							type: 'FACE_DETECTION',
						}],
					}],
				};

				const { data } = await axios.post('https://vision.api.cloud.yandex.net/vision/v1/batchAnalyze', body, {
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${context.token.access_token}`,
					},
				});

				const faces = data.results[0].results[0].faceDetection.faces;

				for (const element of faces) {
					const message = {
						key: `${bucketId} ${objectId}`,
						vertices: element.boundingBox.vertices,
					};

					const coordinates = new SendMessageCommand({
						QueueUrl: QUEUE,
						MessageBody: JSON.stringify(message),
					  });

					console.log('Sending message: ', JSON.stringify(message));
					await sqsClient.send(coordinates);
					console.log('Message sent');

					await registerWebhook();
				}
			} catch (error) {
				console.error('There was an error: ', error);
			}
		}
	}

    return { 'statusCode': 200 }
};