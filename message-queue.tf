resource "yandex_message_queue" "vvot17-task" {
  name                       = var.message_queue_name
  visibility_timeout_seconds = 600
  receive_wait_time_seconds  = 20
  message_retention_seconds  = 1209600
  access_key                 = yandex_iam_service_account_static_access_key.sa-static-key.access_key
  secret_key                 = yandex_iam_service_account_static_access_key.sa-static-key.secret_key
}

resource "yandex_function_trigger" "vvot17-task" {
  name      = var.task_trigger_name
  folder_id = var.folder_id

  message_queue {
    queue_id           = yandex_message_queue.vvot17-task.arn
    service_account_id = yandex_iam_service_account.tf-photo-sa.id
    batch_cutoff       = 20
    batch_size         = 10
    visibility_timeout = 600
  }
  function {
    id                 = yandex_function.cut-handler.id
    service_account_id = yandex_iam_service_account.tf-photo-sa.id
  }
}