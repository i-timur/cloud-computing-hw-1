variable "folder_id" {
  type    = string
  default = "b1ghb511ff4k5ba0ksv1"
}

variable "cloud_id" {
  type    = string
  default = "b1g71e95h51okii30p25"
}

variable "service_account_key_file" {
  type    = string
  default = "/Users/i-timur/Keys/authorized_key.json"
}

variable "bucket_name" {
  type    = string
  default = "vvot17-photo"
}

variable "trigger_name" {
  type    = string
  default = "vvot17-photo"
}

variable "function_name" {
  type    = string
  default = "vvot17-face-detection"
}

variable "api_gateway_name" {
  type    = string
  default = "vvot17-apigw"
}

variable "sa_secret_key" {
  type    = string
  default = "sa_secret"
}

variable "sa_access_key_id" {
  type    = string
  default = "sa_access"
}

variable "folder_id_key" {
  type    = string
  default = "folder_id"
}

variable "message_queue_name" {
  type    = string
  default = "vvot17-task"
}

variable "message_queue_url_key" {
  type    = string
  default = "message_queue_url"
}

variable "task_trigger_name" {
  type    = string
  default = "vvot17-task"
}

variable "cut_func_name" {
  type    = string
  default = "vvot17-face-cut"
}

variable "faces_bucket_name" {
  type    = string
  default = "vvot17-faces"
}

variable "database_name" {
  type    = string
  default = "vvot17-db-photo-face"
}

variable "bot_token" {
  type    = string
  default = "6351335806:AAE9MHQ7fxm0I_ryAh1_-JuNjyJ1q6mwWdQ"
}

variable "bot_func_name" {
  type    = string
  default = "vvot17-bot"
}