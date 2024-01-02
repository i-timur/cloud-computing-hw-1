resource "yandex_storage_bucket" "faces-bucket" {
  access_key = yandex_iam_service_account_static_access_key.sa-static-key.access_key
  secret_key = yandex_iam_service_account_static_access_key.sa-static-key.secret_key
  bucket     = var.faces_bucket_name
  folder_id  = var.folder_id
  anonymous_access_flags {
    read = false
    list = false
  }
}