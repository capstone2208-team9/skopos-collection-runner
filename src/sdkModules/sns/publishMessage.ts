import { PublishCommand } from "@aws-sdk/client-sns";
import { snsClient } from "./snsClient";

export const publishMessage = async (snsTopicArn, collectionId, webhookUrl) => {
  // database: monitor: contactInfo: {slack: "webhookUrl"}
  if (!snsTopicArn && !webhookUrl) {
    return
  }

  if (snsTopicArn) {
    const params = {
      Message: `Error while running collection with id: ${collectionId}`, 
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
    const requestBody = { text: `Error while running collection with id: ${collectionId}`}

    await fetch(webhookUrl, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })
  }
};
