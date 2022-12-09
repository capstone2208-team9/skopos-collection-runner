import { PublishCommand } from "@aws-sdk/client-sns";
import { snsClient } from "./snsClient";

export const publishMessage = async (
  snsTopicArn,
  collectionName,
  webhookUrl,
  errorMessage
) => {
  console.log("publish message function", webhookUrl)
  if (!snsTopicArn && !webhookUrl) {
    return;
  }

  if (snsTopicArn) {
    const params = {
      Message: `An error occurred while running collection "${collectionName}" with error message: ${errorMessage}`,
      TopicArn: snsTopicArn,
    };

    try {
      const data = await snsClient.send(new PublishCommand(params));
      console.log("Success.", data);
    } catch (err) {
      console.log("Error", err.stack);
    }
  }

  if (webhookUrl) {
    console.log("in webhook if block")

    const requestBody = {
      text: `An error occurred while running collection "${collectionName}" with error message: ${errorMessage}`,
    };

    try {
      await fetch(webhookUrl, {
        method: "POST",
        body: JSON.stringify(requestBody),
      });
      console.log("success with webhook")
    } catch (err) {
      console.log(`error with webhook: ${err}`)
    }
  }
};
