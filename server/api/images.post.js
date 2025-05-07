import { S3 } from "aws-sdk";

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event);
  const file = form.find((f) => f.name === "image");

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `images/${Date.now()}_${file.filename}`,
    Body: file.data,
    ContentType: file.type,
  };

  const uploadResult = await s3.upload(params).promise();
  return { url: uploadResult.Location };
});
