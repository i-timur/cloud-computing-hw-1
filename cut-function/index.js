const Jimp = require('jimp');
const { GetObjectCommand, PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { DynamoDBClient, PutItemCommand, ListTablesCommand, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const SECRET_KEY = process.env.SECRET_KEY;
const KEY_ID = process.env.KEY_ID;
const FOLDER_ID = process.env.FOLDER_ID;
const BUCKET_ID = process.env.BUCKET_ID;
const DOCUMENT_API = process.env.DOCUMENT_API;
const TABLE_NAME = 'faces_photos_table'
const ORIGINAL_BUCKET = process.env.ORIGINAL_BUCKET;

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
const dbClient = new DynamoDBClient({
	...config,
	endpoint: DOCUMENT_API,
});

exports.handler = async function (event, context) {
	for (const message of event.messages) {
		const task = JSON.parse(message.details.message.body);

		const [bucketId, objectId] = task.key.split(' ');

		const getObject = new GetObjectCommand({
			Bucket: bucketId,
			Key: objectId,
		});
		
		try {
			const response = await client.send(getObject);
			const image = Buffer.concat(await response.Body.toArray());

			const minX = task.vertices.reduce((min, { x }) => Math.min(min, x), Infinity);
			const minY = task.vertices.reduce((min, { y }) => Math.min(min, y), Infinity);
			const maxX = task.vertices.reduce((max, { x }) => Math.max(max, x), -Infinity);
			const maxY = task.vertices.reduce((max, { y }) => Math.max(max, y), -Infinity);

			const width = maxX - minX;
			const height = maxY - minY;

			const face = await Jimp.read(image);
			face.crop(minX, minY, width, height);
			const outputBuffer = await face.getBufferAsync(Jimp.MIME_JPEG);
			console.log('Изображение успешно обрезано');

			const suffix = '.' + objectId.split('.').pop();

			const name = Date.now() + suffix;

			const putObject = new PutObjectCommand({
				Bucket: BUCKET_ID,
				Key: name,
				Body: outputBuffer,
			});			

			await client.send(putObject);
			console.log(`Изображение ${name} успешно сохранено`);

			const tables = await dbClient.send(new ListTablesCommand({}));

			if (!tables.TableNames.includes(TABLE_NAME)) {
				await dbClient.send(new CreateTableCommand({
					TableName: TABLE_NAME,
					TableSizeBytes: 5_368_709_120,
					AttributeDefinitions: [
						{ AttributeName: 'originalBucket', AttributeType: 'S' },
						{ AttributeName: 'originalKey', AttributeType: 'S' },
						{ AttributeName: 'faceBucket', AttributeType: 'S' },
						{ AttributeName: 'faceKey', AttributeType: 'S' },
						{ AttributeName: 'name', AttributeType: 'S' },
					],
					KeySchema: [
						{ AttributeName: 'faceKey', KeyType: 'HASH' },
					],
				}));
			}

			await dbClient.send(new PutItemCommand({
				TableName: TABLE_NAME,
				Item: {
					originalBucket: { S: bucketId },
					originalKey: { S: objectId },
					faceBucket: { S: BUCKET_ID },
					faceKey: { S: name },
					hasName: { BOOL: false },
				},
			}));
			console.log('Запись в таблицу успешно добавлена');
		} catch (err) {
			console.error('There was an error: ', err);
		}
	}

	return { statusCode: 200 };		
}