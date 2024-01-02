resource "yandex_function" "bot-handler" {
  name               = var.bot_func_name
  user_hash          = "v-28"
  runtime            = "nodejs18"
  entrypoint         = "index.handler"
  memory             = "128"
  execution_timeout  = "10"
  service_account_id = yandex_iam_service_account.tf-photo-sa.id
  tags               = ["my_tag"]
  content {
    zip_filename = "bot-function/index.js.zip"
  }
  environment = {
    "BUCKET_ID"       = yandex_storage_bucket.faces-bucket.id
    "DOCUMENT_API"    = yandex_ydb_database_serverless.face_original_photo.document_api_endpoint
    "ORIGINAL_BUCKET" = yandex_storage_bucket.vvot17-photo.id
    "BOT_TOKEN"       = var.bot_token
    "GATEWAY"         = yandex_api_gateway.vvot17-apigw.id
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
}

resource "yandex_function_iam_binding" "function-iam" {
  function_id = yandex_function.bot-handler.id
  role        = "functions.functionInvoker"
  members = [
    "system:allUsers",
  ]
}