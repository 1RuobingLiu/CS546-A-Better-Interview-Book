import { Router } from "express";
const router = Router();
import { groupData, groupActivityData } from "../data/index.js";
import { ObjectId } from "mongodb";
import multer from "multer";
const upload = multer();
import fs from "fs";
import * as groupActivityFn from "../data/groupActivity.js";
import * as groupEventData from "../data/groupEvents.js";
import userData from "../data/user.js";
import { users } from "../config/mongoCollections.js";

router.route("/").get(async (req, res) => {
  try {
    let groupList = await groupData.getAll();
    let displayArray = [];
    for (let i = 0; i < groupList.length; i++) {
      let { name } = groupList[i];
      let { _id } = groupList[i];
      let groupObject = { _id: _id, name: name };
      displayArray.push(groupObject);
      console.log(displayArray);
    }
    res.render("./groups/groups", {
      groups: displayArray,
      title: "Groups Master Page",
    });
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

// router.post("/:id/updateimage", upload.single("image"), async (req, res) => {
//   const id = req.params.id;

//   if (!req.file) {
//     res.status(400).send("No file uploaded.");
//     return;
//   }

//   try {
//     // Convert the image to base64
//     const imgBuffer = req.file.buffer;
//     // const imgBuffer = fs.readFileSync(req.file.path);

//     const imgBase64 = imgBuffer.toString("base64");

//     // Update the group data with the new image
//     await groupData.updateImage(id, imgBase64);

//     // // Remove the temporary file
//     // fs.unlinkSync(req.file.path);

//     // Redirect to the group page
//     res.redirect(`/groups/${id}`);
//   } catch (e) {
//     console.error(e); // Log the error to console
//     res.status(500).send("Error uploading image.");
//   }
// });

// router.post("/:id/updatename", async (req, res) => {
//   const id = req.params.id;
//   const newName = req.body.name;

//   try {
//     let updatedGroup = await groupData.get(id);
//     await groupData.updateName(id, newName);

//     res.redirect(`/groups/${id}`);
//   } catch (e) {
//     console.error(e); // Log the error to console
//     res.status(500).send("Not able to update name");
//   }
// });

router.route("/:id").get(async (req, res) => {
  // Need to do my error checking here!

  const id = req.params.id;
  let userId = req.session.user.userId;
  userId = userId.toString();
  console.log("heres the userId");
  console.log(userId);

  const group = await groupData.get(id);
  let users = group.users;
  console.log(users);
  let isMember = false;
  for (let i = 0; i < users.length; i++) {
    const member = users[i];
    if (member === userId) {
      isMember = true;
      break;
    }
  }
  try {
    let groupInfo = await groupData.get(id);
    let events = await groupEventData.getAll(id);
    let image = groupInfo.base64Image;
    // Pass our data over to the template to be rendered
    // let eventsArray = [];
    // for (let i = 0; i < groupInfo.groups.length; i++) {
    //   eventsArray.push(roupInfo.groups[i]);
    // }
    // console.log(eventsArray);

    res.render("./groups/groupById", {
      title: "Group Specific Page",
      _id: id,
      name: groupInfo.name,
      description: groupInfo.description,
      activity: groupInfo.activity,
      events: events,
      image: image,
      isMember: isMember,
    });
  } catch (e) {
    res.status(404).render("./error", {
      class: "error",
      title: "Error Page",
      errorMessage: `We're sorry, a venue with that id does not exist .`,
    });
  }
});

router.get("/:id/edit", async (req, res) => {
  const id = req.params.id;

  try {
    let groupInfo = await groupData.get(id);
    res.render("./groups/groupsEdit", {
      _id: id,
      name: groupInfo.name,
      description: groupInfo.description,
      image: groupInfo.base64Image,
    });
  } catch (e) {
    res.status(404).render("./error", {
      class: "error",
      title: "Error Page",
      errorMessage: `We're sorry, a venue with that id does not exist .`,
    });
  }
});

router.post("/:id", upload.single("image"), async (req, res) => {
  const groupId = req.params.id;
  const { name, description } = req.body;
  const userId = req.session.user.userId;
  const group = await groupData.get(groupId);
  try {
    // Check if an image was uploaded
    if (req.file) {
      // Convert the image to base64
      const imgBuffer = req.file.buffer;
      const imgBase64 = imgBuffer.toString("base64");

      let updatedGroup = {
        name: name,
        description: description,
        image: imgBase64,
      };

      // Update the group data with the new image
      await groupData.updateGroup(groupId, updatedGroup);
    } else {
      let updatedGroup = {
        name: name,
        description: description,
      };
      // Update the group data without changing the image
      await groupData.updateGroup(groupId, updatedGroup);
    }

    // Redirect to the group's details page
    res.redirect(`/groups/${groupId}`);
  } catch (e) {
    console.error(e);
    res.status(500).send("Error updating group.");
  }
});

router.get("/:id/join", async (req, res) => {
  const id = req.params.id;
  console.log(id);
  console.log(req.session.user.userId);
  try {
    let joinedGroup = await groupData.addUser(id, req.session.user.userId);
    if (joinedGroup) {
      res.render("./groups/groupsJoin", {
        message: "You have successfully joined the group!",
        userId: req.session.user.userId,
      });
    } else {
      res.render("./groups/groupsJoin", {
        message: "You have successfully joined the group!",
        userId: req.session.user.userId,
      });
    }
  } catch (e) {
    console.error(e);
    res.status(400).render("./groups/groupsJoin", {
      error: e.message,
    });
  }
});

router.get("/:id/eventEdit", async (req, res) => {
  const id = req.params.id;
  // array of all events for this group
  const groupEvents = await groupEventData.getAll(id);
  console.log("these will be all the events");

  console.log(groupEvents);
  try {
    res.render("./groups/eventEdit", {
      _id: id,
      events: groupEvents,
    });
  } catch (e) {
    res.status(404).render("./error", {
      class: "error",
      title: "Error Page",
      errorMessage: `We're sorry, a venue with that id does not exist .`,
    });
  }
});

router.post("/:groupId/eventEdit/:eventId", async (req, res) => {
  const { groupId, eventId } = req.params;
  const { title, eventDate, description } = req.body;

  const updatedEvent = {
    title,
    eventDate,
    description,
  };
  console.log({ updatedEvent });
  try {
    await groupEventData.update(groupId, eventId, updatedEvent);
    res.redirect(`/groups/${groupId}`);
  } catch (e) {
    console.error(e);
    res.status(500).send("Error updating event.");
  }
});

router.get("/:id/eventAdd", async (req, res) => {
  const id = req.params.id;

  try {
    res.render("./groups/eventAdd", {
      _id: id,
    });
  } catch (e) {
    res.status(404).render("./error", {
      class: "error",
      title: "Error Page",
      errorMessage: `We're sorry, a venue with that id does not exist .`,
    });
  }
});

router.post("/:id/eventAdd", async (req, res) => {
  const groupId = req.params.id;
  const { title, description, eventDate } = req.body;
  try {
    console.log("lets print some stuff");
    console.log({ title, description, eventDate });
    let newEvent = await groupEventData.create(
      groupId,
      title,
      description,
      eventDate
    );
    console.log(newEvent);
    res.redirect(`/groups/${groupId}`);
  } catch (e) {
    res.status(400).render("./error", {
      class: "error",
      title: "Error Page",
      errorMessage: `Error adding the event: ${e.message}`,
    });
  }
});

router.get("/:id/activityAdd", async (req, res) => {
  const id = req.params.id;

  try {
    res.render("./groups/activityAdd", {
      _id: id,
    });
  } catch (e) {
    res.status(404).render("./error", {
      class: "error",
      title: "Error Page",
      errorMessage: `We're sorry, a group with that id does not exist.`,
    });
  }
});

router.post("/:id/activityAdd", async (req, res) => {
  const groupId = req.params.id;
  const { title } = req.body;
  const userId = req.session.user.userId;
  try {
    let newActivity = await groupActivityData.create(groupId, title, userId);
    res.redirect(`/groups/${groupId}`);
  } catch (e) {
    res.status(400).render("./error", {
      class: "error",
      title: "Error Page",
      errorMessage: `Error adding the event: ${e.message}`,
    });
  }
});

export default router;
