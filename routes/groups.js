import { Router } from "express";
const router = Router();
import { groupData } from "../data/index.js";
import { ObjectId } from "mongodb";
import multer from "multer";
const upload = multer({ dest: "uploads/" });
import fs from "fs";

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
    res.render("./groups", { groups: displayArray });
  } catch (e) {
    res.sendStatus(500);
  }
});

router.post("/:id/updateimage", upload.single("image"), async (req, res) => {
  const id = req.params.id;

  if (!req.file) {
    res.status(400).send("No file uploaded.");
    return;
  }

  try {
    // Convert the image to base64
    const imgBuffer = fs.readFileSync(req.file.path);
    const imgBase64 = imgBuffer.toString("base64");

    // Update the group data with the new image
    await groupData.updateImage(id, imgBase64);

    // Remove the temporary file
    fs.unlinkSync(req.file.path);

    // Redirect to the group page
    res.redirect(`/groups/${id}`);
  } catch (e) {
    console.error(e); // Log the error to console
    res.status(500).send("Error uploading image.");
  }
});

router.route("/:id").get(async (req, res) => {
  // Need to do my error checking here!

  const id = req.params.id;

  try {
    let groupInfo = await groupData.get(id);
    let image = groupInfo.base64Image;
    // Pass our data over to the template to be rendered
    // let eventsArray = [];
    // for (let i = 0; i < groupInfo.groups.length; i++) {
    //   eventsArray.push(roupInfo.groups[i]);
    // }
    // console.log(eventsArray);

    res.render("./groupById", {
      _id: groupInfo._id,
      name: groupInfo.name,
      description: groupInfo.description,
      events: "the big event",
      image: image,
    });
  } catch (e) {
    res.status(404).render("./error", {
      class: "error",
      title: "Error Page",
      errorMessage: `We're sorry, a venue with that id does not exist .`,
    });
  }
});

export default router;
