resource "yandex_iam_service_account" "tf-photo-sa" {
  folder_id = var.folder_id
  name      = "bucket-sa"
}

resource "yandex_resourcemanager_folder_iam_member" "sa-editor" {
  folder_id = var.folder_id
  role      = "admin"
  member    = "serviceAccount:${yandex_iam_service_account.tf-photo-sa.id}"
}

resource "yandex_iam_service_account_static_access_key" "sa-static-key" {
  service_account_id = yandex_iam_service_account.tf-photo-sa.id
  description        = "static access key for object storage"
}

resource "yandex_storage_bucket" "vvot17-photo" {
  access_key = yandex_iam_service_account_static_access_key.sa-static-key.access_key
  secret_key = yandex_iam_service_account_static_access_key.sa-static-key.secret_key
  bucket     = var.bucket_name
  folder_id  = var.folder_id
  anonymous_access_flags {
    read = false
    list = false
  }
}

resource "yandex_function_trigger" "trigger" {
  name      = var.trigger_name
  folder_id = var.folder_id

  object_storage {
    bucket_id    = yandex_storage_bucket.vvot17-photo.id
    prefix       = "photos/"
    batch_cutoff = 10
    create       = true
    update       = true
  }
  function {
    id                 = yandex_function.handler.id
    service_account_id = yandex_iam_service_account.tf-photo-sa.id
  }
}

resource "yandex_lockbox_secret" "secret" {
  name      = "secret"
  folder_id = var.folder_id
}

resource "yandex_lockbox_secret_version" "secret_version" {
  secret_id = yandex_lockbox_secret.secret.id
  entries {
    key        = var.sa_secret_key
    text_value = yandex_iam_service_account_static_access_key.sa-static-key.secret_key
  }
  entries {
    key        = var.sa_access_key_id
    text_value = yandex_iam_service_account_static_access_key.sa-static-key.access_key
  }
  entries {
    key        = var.folder_id_key
    text_value = var.folder_id
  }
  entries {
    key        = var.message_queue_url_key
    text_value = yandex_message_queue.vvot17-task.id
  }
}