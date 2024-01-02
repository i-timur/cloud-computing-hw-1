resource "yandex_function" "handler" {
  name               = var.function_name
  user_hash          = "v-66"
  runtime            = "nodejs18"
  entrypoint         = "index.handler"
  memory             = "128"
  execution_timeout  = "10"
  service_account_id = yandex_iam_service_account.tf-photo-sa.id
  tags               = ["my_tag"]
  content {
    zip_filename = "function/index.js.zip"
  }
  environment = {
    "BOT_TOKEN"   = var.bot_token
    "BOT_FUNC_ID" = yandex_function.bot-handler.id
  }
  secrets {
    id                   = yandex_lockbox_secret.secret.id
    version_id           = yandex_lockbox_secret_version.secret_version.id
    environment_variable = "SECRET_KEY"
    key                  = var.sa_secret_key
  }
  secrets {
    id                   = yandex_lockbox_secret.secret.id
    version_id           = yandex_lockbox_secret_version.secret_version.id
    environment_variable = "KEY_ID"
    key                  = var.sa_access_key_id
  }
  secrets {
    id                   = yandex_lockbox_secret.secret.id
    version_id           = yandex_lockbox_secret_version.secret_version.id
    environment_variable = "FOLDER_ID"
    key                  = var.folder_id_key
  }
  secrets {
    id                   = yandex_lockbox_secret.secret.id
    version_id           = yandex_lockbox_secret_version.secret_version.id
    environment_variable = "QUEUE"
    key                  = var.message_queue_url_key
  }
}