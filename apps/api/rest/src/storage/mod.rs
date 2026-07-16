use aws_config::meta::region::RegionProviderChain;
use aws_sdk_s3::config::{BehaviorVersion, Credentials, Region};
use aws_sdk_s3::Client;
use std::env;

#[derive(Clone)]
pub struct Storage {
    client: Client,
    bucket: String,
}

impl Storage {
    pub async fn from_env() -> Self {
        let endpoint = env::var("MINIO_ENDPOINT").unwrap_or_else(|_| "http://localhost:9000".into());
        let access_key = env::var("MINIO_ACCESS_KEY").unwrap_or_else(|_| "minioadmin".into());
        let secret_key = env::var("MINIO_SECRET_KEY").unwrap_or_else(|_| "minioadmin".into());
        let region = env::var("MINIO_REGION").unwrap_or_else(|_| "us-east-1".into());
        let bucket = env::var("MINIO_BUCKET").unwrap_or_else(|_| "school-lms".into());

        let region_provider = RegionProviderChain::first_try(Region::new(region));
        let region = region_provider.region().await.unwrap_or_else(|| Region::new("us-east-1"));

        let creds = Credentials::new(access_key, secret_key, None, None, "minio");

        let s3_conf = aws_sdk_s3::config::Builder::new()
            .endpoint_url(endpoint.clone())
            .region(region)
            .credentials_provider(creds)
            .force_path_style(true)
            .behavior_version(BehaviorVersion::latest())
            .build();

        let client = Client::from_conf(s3_conf);

        Storage { client, bucket }
    }

    pub fn bucket(&self) -> &str {
        &self.bucket
    }

    pub fn client(&self) -> &Client {
        &self.client
    }

    pub async fn ensure_bucket(&self) -> Result<(), aws_sdk_s3::Error> {
        let exists = self
            .client
            .head_bucket()
            .bucket(&self.bucket)
            .send()
            .await
            .is_ok();

        if !exists {
            self.client
                .create_bucket()
                .bucket(&self.bucket)
                .send()
                .await?;
        }
        Ok(())
    }

    pub async fn put_object(
        &self,
        key: &str,
        data: Vec<u8>,
        content_type: &str,
    ) -> Result<(), aws_sdk_s3::Error> {
        self.client
            .put_object()
            .bucket(&self.bucket)
            .key(key)
            .body(data.into())
            .content_type(content_type)
            .send()
            .await?;
        Ok(())
    }

    pub fn public_url(&self, key: &str) -> String {
        let endpoint = env::var("MINIO_ENDPOINT").unwrap_or_else(|_| "http://localhost:9000".into());
        format!("{}/{}/{}", endpoint.trim_end_matches('/'), self.bucket, key)
    }
}
