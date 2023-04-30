import { ObjectId } from "mongodb";
import { groups, users } from "../config/mongoCollections.js";
import * as groupData from "./groups.js";
import { parse, isValid } from "date-fns";

// Functinon to create the new group sub-document.
export const create = async (groupId, title) => {
  groupId = groupId.trim();
  title = title.trim();

  if (!groupId || !title) {
    throw new Error("Parameters must be present");
  }
  if (typeof groupId !== "string" || typeof title !== "string") {
    throw new Error("Paramterst must be of type string");
  }

  if (groupId.length === 0 || title.length === 0) {
    throw new Error("Input must not be empty strings");
  }

  let date = new Date();
  let message = "";
  let author;
  let likes = [];
  let comments = [];
  let image;

  let newObjectId = new ObjectId();

  const newActivity = {
    _id: newObjectId,
    title: title,
    date: date,
    author: author,
    likes: likes,
    message: message,
    comments: comments,
    image: image,
  };
  console.log(newActivity);

  const groupCollection = await groups();

  let providedActivity = newActivity.title;
  const foundGroup = await groupCollection.findOne({
    _id: new ObjectId(groupId),
    activity: {
      $elemMatch: { title: providedActivity },
    },
  });
  if (foundGroup) {
    throw new Error("This event already exists, and cannot be added");
  }
  const dataResult = await groupCollection.findOneAndUpdate(
    { _id: new ObjectId(groupId) },
    { $push: { activity: newActivity } },
    { returnDocument: "after" }
  );

  return newActivity;
};

export const getAll = async (groupId) => {
  groupId = groupId.trim();
  if (!groupId) {
    throw new Error("You must provide a group id");
  }
  if (typeof groupId !== "string") {
    throw new Error("You must provide group id of type string");
  }
  if (groupId.length === 0) {
    throw new Error("Group Id must not be an empty string");
  }
  if (!ObjectId.isValid(groupId)) {
    throw new Error("Group Id must be a valid Object Id");
  }
  let group = await groupData.get(groupId);
  if (group === null) {
    throw new Error("Grouop does not exist");
  }
  let { activity } = group;

  return activity;
};

export const updateTitle = async (groupId, activityId, title) => {
  console.log(groupId, activityId, title);
  groupId = groupId.trim();
  activityId = activityId.trim();
  title = title.trim();
  if (!groupId || !activityId || !title) {
    throw new Error("Parameters must be present");
  }
  if (
    typeof groupId != "string" ||
    typeof activityId != "string" ||
    typeof title !== "string"
  ) {
    throw new Error("Parameters must be of type string");
  }
  if (groupId.length === 0 || activityId.length === 0 || title.length === 0) {
    throw new Error("Cannot be an empty string");
  }

  const updatedTitle = {
    "events.$.title": title,
  };
  const groupCollection = await groups();
  const foundGroup = await groupCollection.findOne({
    _id: new ObjectId(groupId),
  });
  if (foundGroup === null) {
    throw new Error("Group has not been found");
  }
  const updatedInfo = await groupCollection.findOneAndUpdate(
    {
      _id: new ObjectId(groupId),
      events: {
        $elemMatch: {
          _id: new ObjectId(activityId),
        },
      },
    },
    { $set: updatedTitle },
    { returnDocument: "after" }
  );

  if (updatedInfo.lastErrorObject.n === 0) {
    throw new Error("Could not update the event title successfully");
  }
  return updatedInfo;
};

export const updateEventDate = async (groupId, activityId, activityDate) => {
  groupId = groupId.trim();
  activityId = activityId.trim();

  activityDate = activityDate.trim();
  if (!groupId || !activityDate || !activityId) {
    throw new Error("Parameters must be provided");
  }
  if (
    (typeof groupId != "string" || typeof activityDate !== "string",
    typeof activityId !== "string")
  ) {
    throw new Error("Parameters must be of type string");
  }
  if (
    groupId.length === 0 ||
    activityDate.length === 0 ||
    activityId.length === 0
  ) {
    throw new Error("Cannot be an empty string");
  }

  const dateObject = parse(activityDate, "MM/dd/yyyy", new Date());
  if (!isValid(dateObject)) {
    throw new Error("Date is not of proper format");
  }

  let dateArray = [];
  dateArray = activityDate.split("/");
  if (dateArray.length < 3) {
    throw new Error("This is not valid");
  }
  if (dateArray.length !== 3) {
    throw new Error("This is not valid");
  }
  if (
    dateArray[0].length !== 2 ||
    dateArray[1].length !== 2 ||
    dateArray[2].length !== 4
  ) {
    throw new Error("This is not valid format");
  }
  let yearString;
  let yearValue;
  yearString = dateArray[2];
  yearValue = Number(yearString);
  if (yearValue < 2023 || yearValue > 2025) {
    throw new Error("The date is out of the appropriate range");
  }

  const updatedActivityDate = {
    "events.$.eventDate": activityDate,
  };
  const groupCollection = await groups();
  const foundGroup = await groupCollection.findOne({
    _id: new ObjectId(groupId),
  });
  if (foundGroup === null) {
    throw new Error("Group has not been found");
  }
  const updatedInfo = await groupCollection.findOneAndUpdate(
    {
      _id: new ObjectId(groupId),
      events: {
        $elemMatch: {
          _id: new ObjectId(activityId),
        },
      },
    },
    { $set: updatedActivityDate },
    { returnDocument: "after" }
  );

  if (updatedInfo.lastErrorObject.n === 0) {
    throw new Error("Could not update the activity title successfully");
  }
  return updatedInfo;
};

export const addUser = async (groupId, activityId, user) => {
  groupId = groupId.trim();
  activityId = activityId.trim();
  user = user.trim();

  if (!groupId || !activityId || !user) {
    throw new Error("Parameters must be provided");
  }
  if (
    (typeof groupId != "string" || typeof activityId !== "string",
    typeof user !== "string")
  ) {
    throw new Error("Parameters must be of type string");
  }
  if (groupId.length === 0 || user.length === 0 || activityId.length === 0) {
    throw new Error("Cannot be an empty string");
  }

  const addedUser = {
    "activities.$.users": user,
  };
  const groupCollection = await groups();
  const foundGroup = await groupCollection.findOne({
    _id: new ObjectId(groupId),
  });
  if (foundGroup === null) {
    throw new Error("Group has not been found");
  }
  const updatedInfo = await groupCollection.findOneAndUpdate(
    {
      _id: new ObjectId(groupId),
      activities: {
        $elemMatch: {
          _id: new ObjectId(activityId),
        },
      },
    },
    { $set: addedUser },
    { returnDocument: "after" }
  );

  // Check if user exists in the database
  const usersCollection = await users();
  const foundUser = await usersCollection.findOne({ username: user });
  if (foundUser === null) {
    throw new Error("User does not exist in the database");
  }

  if (updatedInfo.lastErrorObject.n === 0) {
    throw new Error("Could not update the activity title successfully");
  }
  return updatedInfo;
};

export const remove = async (activityId) => {
  activityId = activityId.trim();
  if (!activityId) {
    throw new Error("ID parameter must be provided");
  }
  if (typeof activityId !== "string") {
    throw new Error("Must be of type string");
  }
  if (activityId.length === 0) {
    throw new Error("Cannot be an empty string");
  }
  const groupCollection = await groups();

  const theActivity = await groupCollection.findOne({
    activities: { $elemMatch: { _id: new ObjectId(activityId) } },
  });

  if (theActivity === null) {
    throw new Error("There is no activity with that id");
  }

  const activity = theActivity.activities.find(
    (activity) => activity._id.toString() === activityId
  );
  if (!activity) {
    throw new Error("There is no activity with that id");
  }

  // Now we will remove the activity from the array of the band document
  const updatedGroup = await groupCollection.findOneAndUpdate(
    { _id: theActivity._id },
    { $pull: { activities: { _id: new ObjectId(activityId) } } },
    { returnOriginal: false }
  );

  if (!updatedGroup.value) {
    throw new Error("activity was not able to be deleted");
  }

  return updatedGroup;
};

export const removeUser = async (groupId, activityId, user) => {
  groupId = groupId.trim();
  activityId = activityId.trim();
  user = user.trim();

  if (!groupId || !activityId || !user) {
    throw new Error("Parameters must be provided");
  }
  if (
    (typeof groupId != "string" || typeof activityId !== "string",
    typeof user !== "string")
  ) {
    throw new Error("Parameters must be of type string");
  }
  if (groupId.length === 0 || user.length === 0 || activityId.length === 0) {
    throw new Error("Cannot be an empty string");
  }

  const addedUser = {
    "activities.$.users": user,
  };
  const groupCollection = await groups();
  const foundGroup = await groupCollection.findOne({
    _id: new ObjectId(groupId),
  });
  if (foundGroup === null) {
    throw new Error("Group has not been found");
  }
  const updatedInfo = await groupCollection.findOneAndUpdate(
    {
      _id: new ObjectId(groupId),
      activities: {
        $elemMatch: {
          _id: new ObjectId(activityId),
        },
      },
    },
    { $set: addedUser },
    { returnDocument: "after" }
  );
  // Check if user exists in the database
  const usersCollection = await users();
  const foundUser = await usersCollection.findOne({ username: user });
  if (foundUser === null) {
    throw new Error("User does not exist in the database");
  }

  if (updatedInfo.lastErrorObject.n === 0) {
    throw new Error("Could not update the activity title successfully");
  }
  return updatedInfo;
};

export const updateActivity = async (
  groupId,
  activityId,
  title,
  date,
  author,
  message,
  image
) => {
  groupId = groupId.trim();
  activityId = activityId.trim();

  if (!groupId || !activityId) {
    throw new Error("Parameters must be provided");
  }

  if (typeof groupId !== "string" || typeof activityId !== "string") {
    throw new Error("Parameters must be of type string");
  }

  if (groupId.length === 0 || activityId.length === 0) {
    throw new Error("Cannot be an empty string");
  }

  const groupCollection = await groups();
  const foundGroup = await groupCollection.findOne({
    _id: new ObjectId(groupId),
  });

  if (foundGroup === null) {
    throw new Error("Group has not been found");
  }

  const foundActivity = foundGroup.activity.find(
    (activity) => activity._id.toString() === activityId
  );

  if (!foundActivity) {
    throw new Error("Activity has not been found");
  }

  const updatedActivity = {};

  if (title) {
    if (typeof title !== "string" || title.length === 0) {
      throw new Error("Title must be a non-empty string");
    }

    updatedActivity.title = title.trim();
  }

  if (date) {
    const parsedDate = parse(date, "MM/dd/yyyy", new Date());

    if (!isValid(parsedDate) || parsedDate < new Date()) {
      throw new Error("Date must be a valid date in the future");
    }

    updatedActivity.date = parsedDate;
  }

  if (author) {
    if (typeof author !== "string" || author.length === 0) {
      throw new Error("Author must be a non-empty string");
    }

    updatedActivity.author = author.trim();
  }

  if (message) {
    if (typeof message !== "string" || message.length === 0) {
      throw new Error("Message must be a non-empty string");
    }

    updatedActivity.message = message.trim();
  }

  if (image) {
    if (typeof image !== "string" || image.length === 0) {
      throw new Error("Image must be a non-empty string");
    }

    updatedActivity.image = image.trim();
  }

  const updatedInfo = await groupCollection.findOneAndUpdate(
    {
      _id: new ObjectId(groupId),
      activity: {
        $elemMatch: {
          _id: new ObjectId(activityId),
        },
      },
    },
    { $set: updatedActivity },
    { returnDocument: "after" }
  );

  if (updatedInfo.lastErrorObject.n === 0) {
    throw new Error("Could not update the activity successfully");
  }

  return updatedInfo.value.activity.find(
    (activity) => activity._id.toString() === activityId
  );
};
