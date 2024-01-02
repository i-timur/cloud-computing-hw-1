resource "yandex_api_gateway" "vvot17-apigw" {
  name = var.api_gateway_name
  spec = <<-EOT
    openapi: "3.0.0"
    info:
      version: 1.0.0
      title: vvot17-apigw
    paths:
      /:
        get:
          summary: Say hello
          parameters:
            - name: face
              in: query
              description: Face key inside the storage
              required: true
              schema:
                type: string
          x-yc-apigateway-integration:
            type: object_storage
            bucket: ${yandex_storage_bucket.faces-bucket.bucket}
            object: '{face}'
            service_account_id: ${yandex_iam_service_account.tf-photo-sa.id}
            http_headers:
              'Content-Type': 'image/jpeg'
          operationId: static
  EOT
}