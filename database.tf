resource "yandex_ydb_database_serverless" "face_original_photo" {
  name      = var.database_name
  folder_id = var.folder_id

  deletion_protection = true
}