package com.smartfms.backend.service;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

/**
 * S3 저장 구현. 버킷은 완전 비공개이며, 조회는 만료되는 presigned URL로만 가능하다.
 * 자격증명은 코드에 두지 않고 표준 경로(환경변수 / ~/.aws/credentials / EC2 IAM Role)에서 자동으로 읽는다.
 */
@Component
@ConditionalOnProperty(name = "app.s3.enabled", havingValue = "true")
public class S3ImageStorage implements ImageStorage {

    private final S3Client s3Client;
    private final S3Presigner presigner;
    private final String bucket;
    private final Duration urlTtl;

    public S3ImageStorage(S3Client s3Client,
                          S3Presigner presigner,
                          @Value("${app.s3.bucket}") String bucket,
                          @Value("${app.s3.url-ttl-minutes}") long urlTtlMinutes) {
        this.s3Client = s3Client;
        this.presigner = presigner;
        this.bucket = bucket;
        this.urlTtl = Duration.ofMinutes(urlTtlMinutes);
    }

    @Override
    public String store(byte[] image, String plate) {
        String key = LocalImageStorage.buildKey(plate);
        s3Client.putObject(
                PutObjectRequest.builder().bucket(bucket).key(key).contentType("image/jpeg").build(),
                RequestBody.fromBytes(image));
        return key;
    }

    @Override
    public String presignedUrl(String key) {
        if (key == null) {
            return null;
        }
        return presigner.presignGetObject(GetObjectPresignRequest.builder()
                        .signatureDuration(urlTtl)
                        .getObjectRequest(GetObjectRequest.builder().bucket(bucket).key(key).build())
                        .build())
                .url()
                .toString();
    }
}
