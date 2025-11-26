// src/services/ota/ota.service.ts
import { AppDataSource } from "../../database/connection";
import { OtaJob, OtaJobStatus } from "../../database/entities/OtaJob";
import { User } from "../../database/entities/User";
import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";
import { env } from "../../config/env";

const s3 = new AWS.S3({ region: env.aws.region });
const iot = new AWS.Iot({ region: env.aws.region });

export class OtaService {
  private repo = AppDataSource.getRepository(OtaJob);

  private async uploadToS3(bucket: string, key: string, body: Buffer, contentType: string) {
    const result = await s3
      .upload({ Bucket: bucket, Key: key, Body: body, ContentType: contentType })
      .promise();
    return result.Location;
  }

  private async createIotJob(s3Uri: string, targets: string[]) {
    return await iot
      .createJob({
        jobId: `job-${uuidv4().replace(/-/g, "")}`,
        targets,
        documentSource: s3Uri,
      })
      .promise();
  }

  async createOtaJob(
    file: Express.Multer.File,
    user: User,
    payload: {
      version: string;
      bucketName: string;
      thingGroupName?: string;
      thingNames?: string;
      downloadPath: string;
    }
  ) {
    const { version, bucketName, thingGroupName, thingNames, downloadPath } = payload;
    if (!downloadPath?.trim()) throw new Error("downloadPath required");

    const targets: string[] = [];
    const region = env.aws.region;
    const accountId = env.aws.accountId || "*";

    if (thingGroupName) {
      targets.push(`arn:aws:iot:${region}:${accountId}:thinggroup/${thingGroupName}`);
    }

    if (thingNames) {
      thingNames
        .split(",")
        .map(n => n.trim())
        .filter(n => n)
        .forEach(name => {
          targets.push(`arn:aws:iot:${region}:${accountId}:thing/${name}`);
        });
    }

    if (targets.length === 0) throw new Error("No valid targets");

    const fileBuffer = fs.readFileSync(file.path);
    const ext = path.extname(file.originalname);
    const updateKey = `updates/${uuidv4()}${ext}`;
    const jobKey = `job-documents/${uuidv4()}-job.json`;

    const updateUrl = await this.uploadToS3(bucketName, updateKey, fileBuffer, file.mimetype);

    const jobDoc = {
      operation: "download-file",
      url: updateUrl,
      path: downloadPath.trim(),
    };

    const jobS3Location = await this.uploadToS3(
      bucketName,
      jobKey,
      Buffer.from(JSON.stringify(jobDoc, null, 2)),
      "application/json"
    );

    const jobResult = await this.createIotJob(`s3://${bucketName}/${jobKey}`, targets);

    const otaJob = this.repo.create({
      version,
      fileName: file.originalname,
      s3KeyUpdate: updateKey,
      s3UrlUpdate: updateUrl,
      s3KeyJobDoc: jobKey,
      s3UrlJobDoc: jobS3Location,
      downloadPath: downloadPath.trim(),
      targets,
      jobId: jobResult.jobId,
      jobArn: jobResult.jobArn,
      status: OtaJobStatus.PENDING,
      userId: user.id,
    });

    await this.repo.save(otaJob);
    fs.unlinkSync(file.path);
    return otaJob;
  }

  async getJobsByUser(userId: string, page = 1, limit = 10) {
    const [jobs, total] = await this.repo.findAndCount({
      where: { userId },
      order: { createdAt: "DESC" },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
