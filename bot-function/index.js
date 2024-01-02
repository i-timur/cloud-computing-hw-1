import { ScanCommand, DynamoDBClient, PutItemCommand, GetItemCommand, ListTablesCommand, CreateTableCommand } from '@aws-sdk/client-dynamodb';
import axios from 'axios';

const SECRET_KEY = process.env.SECRET_KEY;
const KEY_ID = process.env.KEY_ID;
const FOLDER_ID = process.env.FOLDER_ID;
const BUCKET_ID = process.env.BUCKET_ID;
const DOCUMENT_API = process.env.DOCUMENT_API;
const TABLE_NAME = 'faces_photos_table'
const USERS_TABLE_NAME = 'users_messages_table';
const ORIGINAL_BUCKET = process.env.ORIGINAL_BUCKET;
const BOT_TOKEN = process.env.BOT_TOKEN;
const GATEWAY = process.env.GATEWAY;
const GATEWAY_URL = `https://${GATEWAY}.apigw.yandexcloud.net/`;

const config = {
	region: 'ru-central1',
	credentials: {
		accessKeyId: KEY_ID,
		secretAccessKey: SECRET_KEY,	
	},
};

const dbClient = new DynamoDBClient({
	...config,
	endpoint: DOCUMENT_API,
});

export const handler = async function (event, context) {
	try {
		const tables = await dbClient.send(new ListTablesCommand({}));

		if (!tables.TableNames.includes(USERS_TABLE_NAME)) {
			await dbClient.send(new CreateTableCommand({
				TableName: USERS_TABLE_NAME,
				TableSizeBytes: 5_368_709_120,
				AttributeDefinitions: [
					{ AttributeName: 'chatId', AttributeType: 'S' },
					{ AttributeName: 'lastCmd', AttributeType: 'S' },
					{ AttributeName: 'faceKey', AttributeType: 'S' },
					{ AttributeName: 'faceBucket', AttributeType: 'S' },
					{ AttributeName: 'originalKey', AttributeType: 'S' },
					{ AttributeName: 'originalBucket', AttributeType: 'S' },
				],
				KeySchema: [
					{ AttributeName: 'chatId', KeyType: 'HASH' },
				],
			}));
		}

		const update = JSON.parse(event.body);
		const message = update.message;
		let chatId = message.chat.id;
		chatId = typeof chatId === 'number' ? chatId.toString() : chatId;
		const text = message.text;

		if (text === '/start') {
			await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
				params: {
					chat_id: chatId,
					text: 'Привет! Я помогу тебе найти фотографии с твоими друзьями. Просто отправь мне имя, а я найду все фотографии с этим человеком',
				}
			})

			return { statusCode: 200 };
		}
		
		// Получаем предыдущее сообщение пользователя
		const getItem = new GetItemCommand({
			TableName: USERS_TABLE_NAME,
			Key: {
				chatId: { S: chatId },
			},

		});

		const { Item: item } = await dbClient.send(getItem);

		if (text === '/getface') {
			// Получаем первое фото, у которого в поле hasName значение false
			const query = {
				TableName: TABLE_NAME,
				FilterExpression: 'hasName = :hasName',
				ExpressionAttributeValues: {
					':hasName': { BOOL: false },
				},
			};	

			const { Items: [item] } = await dbClient.send(new ScanCommand(query));

			if (item) {
				console.log('photo: ', `${GATEWAY_URL}?face=${item.faceKey.S}`);
				await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
					params: {
						chat_id: chatId,
						photo: `${GATEWAY_URL}?face=${item.faceKey.S}`,
					}
				})
				
				// Сохраняем в базу данных информацию о том, что пользователь запросил фото
				const putItem = new PutItemCommand({
					TableName: USERS_TABLE_NAME,
					Item: {
						chatId: { S: chatId },
						lastCmd: { S: text },
						originalBucket: { S: item.originalBucket.S },
						originalKey: { S: item.originalKey.S },
						faceKey: { S: item.faceKey.S },
						faceBucket: { S: item.faceBucket.S },
					},
				});

				await dbClient.send(putItem);
			} else {
				// Если таких фото нет, то отправляем сообщение пользователю
				await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
					params: {
						chat_id: chatId,
						text: 'Все фотографии были обработаны',
					}
				})
			}
		} else if (item && item.lastCmd.S === '/getface') {
			// Если пользователь запросил фото, то сохраняем введенное им имя в базу данных
			const putFaceItem = new PutItemCommand({
				TableName: TABLE_NAME,
				Item: {
					originalBucket: { S: item.originalBucket.S },
					originalKey: { S: item.originalKey.S },
					faceBucket: { S: item.faceBucket.S },
					faceKey: { S: item.faceKey.S },
					hasName: { BOOL: true },
					name: { S: text },
				},
			});

			await dbClient.send(putFaceItem);
			
			// Сохраняем в базу данных информацию о том, что пользователь ввел имя
			const putChatItem = new PutItemCommand({
				TableName: USERS_TABLE_NAME,
				Item: {
					chatId: { S: chatId },
					lastCmd: { S: '' },
				},
			});

			await dbClient.send(putChatItem);

			await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
				params: {
					chat_id: chatId,
					text: 'Спасибо! Я запомнил это имя',
				}
			});
		} else if (text.startsWith('/find')) {
			const name = text.split(' ')[1];

			// Получаем все фото, у которого в поле name значение, введенное пользователем
			const query = {
				TableName: TABLE_NAME,
				FilterExpression: 'name = :name',
				ExpressionAttributeValues: {
					':name': { S: name },
				},
			};

			const { Items: items } = await dbClient.send(new ScanCommand(query));

			if (items.length > 0) {
				let photosStr = 'Фотография(и) с этим человеком:\n';
				for (const face of items) {
					photosStr += `${GATEWAY_URL}?face=${face.faceKey.S}\n`;
				}

				await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
					params: {
						chat_id: chatId,
						text: photosStr,
					}
				})
			} else {
				// Если таких фото нет, то отправляем сообщение пользователю
				await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
					params: {
						chat_id: chatId,
						text: `Фотографии с ${name} не найдены`
					}
				})
			}
		} else {
			await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
				params: {
					chat_id: chatId,
					text: 'Ошибка',
				}
			});
		}
	} catch (error) {
		console.error('There was an error', error);
	}

	return { statusCode: 200 };		
}