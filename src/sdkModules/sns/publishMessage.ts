import { PublishCommand } from "@aws-sdk/client-sns";
import { snsClient } from "./snsClient";

export const publishMessage = async (snsTopicArn, collectionName, webhookUrl) => {
  // database: monitor: contactInfo: {slack: "webhookUrl"}
  if (!snsTopicArn && !webhookUrl) {
    return
  }

  if (snsTopicArn) {
    const params = {
      Message: `An error occurred while running collection "${collectionName}"`,
      TopicArn: snsTopicArn,
    };

    try {
      const data = await snsClient.send(new PublishCommand(params));
      console.log("Success.",  data);
      return data; 
    } catch (err) {
      console.log("Error", err.stack);
    }
  }

  if (webhookUrl) {
    const requestBody = { text: `An error occurred while running collection "${collectionName}"`}

    await fetch(webhookUrl, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })
  }
};
