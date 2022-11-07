import { PublishCommand } from "@aws-sdk/client-sns";
import { snsClient } from "./snsClient.js";

export const publishMessage = async (snsTopicArn, collectionId) => {
  var params = {
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
};