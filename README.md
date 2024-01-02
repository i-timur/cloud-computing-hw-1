### Prerequisites
- Создать файл `terraform.tfvars` в корневом каталоге
- Скопировать содержимое блока снизу
```
folder_id = "<FOLDER_ID>" 
cloud_id = "<CLOUD_ID>"
service_account_key_file = "<SERVICE_ACCOUNT_KEY_FILE>"
bot_token = "<BOT_TOKEN>"
```
, где FOLDER_ID - ID каталога, в котором необходимо развернуть инфраструктуру, CLOUD_ID - ID облака, в котором необходимо развернуть инфраструктуру, service_account_key_file - путь до файла с ключом сервисного аккаунта с ролью "admin", bot_token - токен телеграм бота.

### Important

- Для того, чтобы использовать телеграмм бот, необходимо загрузить не менее 1 фотографии в бакет.
- Фото лиц могут не отправляться при отправке боту команды `/getface` из-за этой [проблемы](https://github.com/yagop/node-telegram-bot-api/issues/425) на стороне телеграма