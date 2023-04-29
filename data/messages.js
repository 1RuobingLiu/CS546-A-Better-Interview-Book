import { MongoUnexpectedServerResponseError, ObjectId, Binary } from "mongodb";
import { messages, users } from "../config/mongoCollections.js";

export const create = async (originUserId, targetUserId, subject, message) => {
  if ((!originUserId || !targetUserId, !message)) {
    throw new Error("Please ensure amounts have been populated");
  }
  if (!subject) {
    subject = "(no subject)";
  }
  if (!ObjectId.isValid(originUserId)) {
    throw new Error("Sender is not a valid object ID");
  }
  if (!ObjectId.isValid(targetUserId)) {
    throw new Error("Recipient is not a valid object ID");
  }
  if (typeof message !== "string") {
    throw new Error("Message must be of type string");
  }

  const userCollection = await users();
  const originUser = await userCollection.findOne({
    _id: new ObjectId(originUserId),
  });
  if (originUser === null) {
    throw new Error("Origin user id does not exist");
  }

  const targetUser = await userCollection.findOne({
    _id: new ObjectId(targetUserId),
  });
  if (targetUser === null) {
    throw new Error("Target user id does not exist");
  }

  let newMessage = {
    originUserId: originUserId,
    targetUserId: targetUserId,
    subject: subject,
    message: message,
  };

  const messageCollection = await messages();
  const insertedMessage = await messageCollection.insertOne(newMessage);
  if (!insertedMessage.acknowledged || !insertedMessage.insertedId) {
    throw new Error("This band was not successfully added");
  }

  const newId = insertedMessage.insertedId.toString();
  const foundMessage = await get(newId);
  return foundMessage;
};

export const get = async (id) => {
  // Error Testing Section
  // if no id is provided, the method should throw
  if (!id) {
    throw new Error("the id parameter does not exist");
  }
  // if the id provided is not a string, or is an empty string, the method should throw
  if (typeof id !== "string" || id.trim().length === 0) {
    throw new Error("id input is not of type string or is an empty string");
  }
  // if the id provided is not a valid ObjectId, the method should throw
  id = id.trim();
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid object id");
  }
  const messageCollection = await messages();
  const message = await messageCollection.findOne({ _id: new ObjectId(id) });
  if (message === null) {
    throw new Error("There is message with that id");
  }
  message._id = message._id.toString();
  return message;
};
