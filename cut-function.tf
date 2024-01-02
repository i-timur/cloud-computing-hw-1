resource "yandex_function" "cut-handler" {
  name               = var.cut_func_name
  user_hash          = "v-23"
  runtime            = "nodejs18"
  entrypoint         = "index.handler"
  memory             = "1024"
  execution_timeout  = "30"
  service_account_id = yandex_iam_service_account.tf-photo-sa.id
  tags               = ["my_tag"]
  content {
    zip_filename = "cut-function/index.js.zip"
  }
  environment = {
    "BUCKET_ID"    = yandex_storage_bucket.faces-bucket.id
    "DOCUMENT_API" = yandex_ydb_database_serverless.face_original_photo.document_api_endpoint
    # "TABLE_NAME" = yandex_ydb_table.face_original_photo_table.path
    "ORIGINAL_BUCKET" = yandex_storage_bucket.vvot17-photo.id
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