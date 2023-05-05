import { ObjectId } from "mongodb";
import { users, referral, company } from "../config/mongoCollections.js";
import validation from "../helpers.js";
import userData from "./user.js";

const exportedMethods = {
  async getAllPosts() {
    const postCollection = await referral();
    return await postCollection.find({}).sort({ duedate: -1 }).toArray();
  },

  async getPostById(id) {
    id = validation.checkId(id);
    const postCollection = await referral();
    const post = await postCollection.findOne({ _id: new ObjectId(id) });

    if (!post) throw "Error: Post not found";

    return post;
  },
  async getLikedPostByUserId(userId) {
    let usersCollection = await users();

    let user = await userData.getUserById(userId);
    let arr = user.likedReferPost;
    let res = [];
    if (!Array.isArray(arr)) {
      arr = [];
    } else {
      if (arr.length > 0) {
        arr = validation.checkArrofId(arr, "Array of post Id");

        for (let id of arr) {
          const postCollection = await referral();
          const post = await postCollection.findOne({ _id: new ObjectId(id) });
          if (!post) {
            let newPost = await usersCollection.findOneAndUpdate(
              { _id: new ObjectId(userId) },
              { $pull: { likedReferPost: id } },
              { returnDocument: "after" }
            );
            if (newPost.lastErrorObject.n === 0)
              throw [404, `Could not delete the post with id ${id}`];
            continue;
          }
          res.push(post);
        }
      }
    }

    return res;
  },

  async getPostedPostByUserId(userId) {
    let usersCollection = await users();
    let user = await userData.getUserById(userId);
    let arr = user.referralPostsclearcdsdsdc;
    let res = [];
    if (!arr) {
      return [];
    } else {
      if (!Array.isArray(arr)) {
        arr = [];
      } else {
        if (arr.length > 0) {
          arr = validation.checkArrofId(arr, "Array of post Id");

          for (let id of arr) {
            const postCollection = await referral();
            const post = await postCollection.findOne({
              _id: new ObjectId(id),
            });
            if (!post) {
              let newPost = await usersCollection.findOneAndUpdate(
                { _id: new ObjectId(userId) },
                { $pull: { referralPostsclearcdsdsdc: id } },
                { returnDocument: "after" }
              );
              if (newPost.lastErrorObject.n === 0)
                throw [404, `Could not delete the post with id ${id}`];
              continue;
            }
            res.push(post);
          }
        }
      }
      return res;
    }
  },

  async getPostsByAllTag(fields, companyName) {
    if (!Array.isArray(fields)) {
      fields = [];
    } else {
      fields = validation.checkFieldsTags(fields);
    }
    if (!Array.isArray(companyName)) {
      companyName = [];
    } else {
      companyName = validation.checkCompanyTags(company);
    }

    const postCollection = await referral();
    return await postCollection
      .find({
        fields: { $in: fields },
        company: { $in: companyName },
      })
      .sort({ duedate: -1 })
      .toArray();
  },

  async getPostsByCompanyTag(companyName) {
    if (!Array.isArray(company)) {
      companyName = [];
    } else {
      companyName = validation.checkCompanyTags(company);
    }
    const postCollection = await referral();
    return await postCollection
      .find({ company: { $in: companyName } })
      .sort({ duedate: -1 })
      .toArray();
  },

  async getPostsByFieldsTag(fields) {
    if (!Array.isArray(fields)) {
      fields = [];
    } else {
      fields = validation.checkFieldsTags(fields);
    }
    const postCollection = await referral();
    return await postCollection
      .find({ fields: { $in: fields } })
      .sort({ duedate: -1 })
      .toArray();
  },

  async addPost(
    title,
    body,
    posterId,
    duedate,
    fields,
    companyName,
    companyEmail,
    jobTitle,
    salary,
    level,
    jobType,
    skills,
    location,
    description
  ) {
    title = validation.checkString(title, "Title");
    body = validation.checkString(body, "Body");
    posterId = validation.checkId(posterId, "Poster ID");
    duedate = validation.checkDate(duedate);
    if (
      !companyName ||
      !companyEmail ||
      !jobTitle ||
      !salary ||
      !level ||
      !jobType ||
      !location ||
      !description
    )
      throw "Error : All parameters are required";

    if (
      !validation.isProperString([
        companyName,
        companyEmail,
        jobTitle,
        description,
        level,
      ])
    )
      throw "Error : Parameters can only be string not just string with empty spaces";

    if (typeof jobType === "string") {
      if (!validation.isProperString([jobType]))
        throw "Error : job type can only be a valid string or array with valid strings";
    } else {
      validation.isArrayWithTheNonEmptyStringForJobType([jobType]);
      jobType = jobType.map((x) => x.trim().toLowerCase());
    }

    if (typeof skills === "string") {
      if (!validation.isProperString([jobType]))
        throw "Error : skills can only be a valid string or array with valid strings";
    } else {
      validation.isArrayWithTheNonEmptyStringForSkills([skills]);
      skills = skills.map((x) => x.trim().toLowerCase());
    }

    companyEmail = validation.checkEmail(companyEmail, "companyEmail");
    validation.isSalary(salary);
    salary = Number(salary);
    jobType = validation.checkJobtypeTags(jobType);
    location = validation.checkLocationTags(location);
    skills = validation.checkSkillsTags(skills);
    level = validation.checkLevelTags([level]);
    let jobData = {
      _id: new ObjectId(),
      jobTitle: jobTitle.trim().toLowerCase(),
      skills: skills,
      salary,
      location,
      description: description.trim().toLowerCase(),
    };
    if (!Array.isArray(fields)) {
      fields = [];
    } else {
      fields = validation.checkFieldsTags(fields);
    }
    [companyName] = await validation.checkCompanyTags([companyName]);
    const userThatPosted = await userData.getUserById(posterId);
    let postdate = new Date().toUTCString();
    let newPostId = new ObjectId();
    const newPost = {
      _id: newPostId,
      title: title,
      body: body,
      poster: {
        id: new ObjectId(posterId),
        name: `${userThatPosted.fname} ${userThatPosted.lname}`,
      },
      duedate: duedate,
      fields: fields,
      company: [companyName],
      jobs: jobData,
      likes: [],
      comments: [],
      postdate: postdate,
      link: `/referral/post/${posterId}/postId/${newPostId}`,
    };
    const postCollection = await referral();
    const newInsertInformation = await postCollection.insertOne(newPost);

    //job in company database
    let companyCollection = await company();
    let newJobInser = await companyCollection.findOneAndUpdate(
      { companyName: companyName },
      { $addToSet: { jobs: newPost.jobs } },
      { returnDocument: "after" }
    );
    if (newJobInser.lastErrorObject.n === 0)
      throw [404, `Could not update the post with id ${id}`];

    //user post in user database
    let usersCollection = await users();
    let newuserPost;

    newuserPost = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(posterId) },
      { $addtoSet: { referralPosts: newPostId.toString() } },
      { returnDocument: "after" }
    );

    if (newuserPost.lastErrorObject.n === 0)
      throw [404, `Could not update the post with id ${id}`];

    return await this.getPostById(newPostId.toString());
  },

  async updatePost(id, updatedPost) {
    const updatedPostData = {};
    if (updatedPost.posterId) {
      updatedPostData["poster.id"] = validation.checkId(
        updatedPost.poster.id,
        "Poster ID"
      );

      const userThatPosted = await userData.getUserById(updatedPost.posterId);
      updatedPostData["poster.name"] =
        userThatPosted.fname + " " + userThatPosted.lname;
    }
    if (updatedPost.fields) {
      updatedPostData.fields = validation.checkFieldsTags(updatedPost.fields);
    }
    if (updatedPost.category) {
      updatedPostData.category = validation.checkCategoryTags(
        updatedPost.category
      );
    }
    if (updatedPost.company) {
      updatedPostData.company = await validation.checkCompanyTags(
        updatedPost.company
      );
    }

    if (updatedPost.title) {
      updatedPostData.title = validation.checkString(
        updatedPost.title,
        "title"
      );
    }
    if (updatedPost.duedate) {
      updatedPostData.eventdate = validation.checkDate(updatedPost.eventdate);
    }
    if (updatedPost.body) {
      updatedPostData.body = validation.checkString(updatedPost.body, "Body");
    }
    updatedPostData.modifieddate = new Date().toUTCString();
    const postCollection = await socialPost();
    let newPost = await postCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updatedPostData },
      { returnDocument: "after" }
    );
    if (newPost.lastErrorObject.n === 0)
      throw [404, `Could not update the post with id ${id}`];

    return newPost.value;
  },

  async removePost(id, userId) {
    id = validation.checkId(id);
    let oldinfo = await this.getPostById(id);
    const postCollection = await referral();
    const deletionInfo = await postCollection.findOneAndDelete({
      _id: new ObjectId(id),
    });
    if (deletionInfo.lastErrorObject.n === 0)
      throw [404, `Could not delete post with id of ${id}`];

    //user liked posts stored in user history
    let usersCollection = await users();
    let newPost = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $pull: { referralPostsclearcdsdsdc: id } },
      { returnDocument: "after" }
    );
    if (newPost.lastErrorObject.n === 0)
      throw [404, `Could not delete the post with id ${id}`];

    //job in company database
    const companyCollection = await company();
    let companyName = oldinfo.company;
    let job = oldinfo.jobs;

    let newJobInser = await companyCollection.findOneAndUpdate(
      { companyName: companyName },
      { $pull: { jobs: job } },
      { returnDocument: "after" }
    );
    if (newJobInser.lastErrorObject.n === 0)
      throw [404, `Could not delete the post with id ${id}`];

    return { ...deletionInfo.value, deleted: true };
  },

  //  Comments
  async getCommentsByUserId(userId) {
    userId = validation.checkId(userId);
    const referralCollection = await referral();
    const userComment = await referralCollection
      .aggregate([
        { $unwind: "$comments" },
        { $match: { "comments.userId": new ObjectId(userId) } },
        {
          $project: {
            _id: "$comments._id",
            userId: "$comments.userId",
            comments: "$comments.comments",
          },
        },
      ])
      .toArray();

    if (!userComment) throw "Error: Post not found";
    for (let ele of userComment) {
      ele._id = ele._id.toString();
    }
    return userComment;
  },

  async getCommentsByCommentId(commentId) {
    commentId = validation.checkId(commentId);
    const referralCollection = await referral();
    const userComment = await referralCollection
      .aggregate([
        { $unwind: "$comments" },
        { $match: { "comments._id": new ObjectId(commentId) } },
        {
          $project: {
            _id: "$comments._id",
            fname: "$comments.fname",
            lname: "$comments.lname",
            comments: "$comments.comments",
          },
        },
      ])
      .toArray();
    if (!userComment) throw "Error: Post not found";
    for (let ele of userComment) {
      ele._id = ele._id.toString();
    }
    return userComment;
  },

  async addComments(postId, userId, comments) {
    postId = validation.checkId(postId);
    userId = validation.checkId(userId);
    comments = validation.checkString(comments, "Comments");
    const userName = await userData.getUserById(userId);

    const newComments = {
      _id: new ObjectId(),
      userId: userId,
      fname: userName.fname,
      lname: userName.lname,
      comments,
    };

    const referralCollection = await referral();
    let newreferrals = await referralCollection.findOneAndUpdate(
      { _id: new ObjectId(postId) },
      { $addToSet: { comments: newComments } },
      { returnDocument: "after" }
    );
    const returnValue = newreferrals.value;
    returnValue._id = returnValue._id.toString();
    for (let ele of returnValue.comments) {
      ele._id = ele._id.toString();
    }
    return returnValue;
  },

  //  Likes
  async getLikes(postId) {
    postId = validation.checkId(postId);
    const post = await this.getPostById(postId);
    const likesList = post.likes;
    return likesList;
  },
  async checkLikes(postId, userId) {
    postId = validation.checkId(postId);
    userId = validation.checkId(userId);
    const checkDuplicated = await this.getLikes(postId);
    if (!checkDuplicated.includes(userId)) return true;
    else return false;
  },
  async addLikes(postId, userId) {
    postId = validation.checkId(postId);
    userId = validation.checkId(userId);

    //check is there is a duplicates user press like button
    const referralCollection = await referral();
    let duplicateUser = await referralCollection.findOne(
      { _id: new ObjectId(postId), likes: { $in: [new ObjectId(userId)] } },
      { projection: { _id: 0 } }
    );
    if (duplicateUser !== null) {
      const userName = (await userData.getUserById(userId)).fname;
      throw `Error: ${userName} can not press likes more than twice!!`;
    }

    let newreferrals = await referralCollection.findOneAndUpdate(
      { _id: new ObjectId(postId) },
      { $addToSet: { likes: userId } },
      { returnDocument: "after" }
    );
    const returnValue = newreferrals.value;
    returnValue._id = returnValue._id.toString();
    if (returnValue.comments.length > 0) {
      for (let ele of returnValue.comments) {
        ele._id = ele._id.toString();
      }
    }

    //user liked posts stored in user history
    let usersCollection = await users();

    let newPost = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $addToSet: { likedReferPost: postId } },
      { returnDocument: "after" }
    );
    if (newPost.lastErrorObject.n === 0)
      throw [404, `Could not update the post with id ${postId}`];
    return returnValue;
  },

  async removeLikes(postId, userId) {
    postId = validation.checkId(postId);
    userId = validation.checkId(userId);
    const posts = this.getPostById(postId);
    const referralCollection = await referral();
    const deletionInfo = await referralCollection.findOneAndUpdate(
      { _id: new ObjectId(postId) },
      { $pull: { likes: userId } },
      { returnDocument: "after" }
    );
    if (deletionInfo.lastErrorObject.n === 0)
      throw `Error: Could not delete post with id of ${commentId}`;
    deletionInfo.value._id = deletionInfo.value._id.toString();
    //user liked posts stored in user history
    let usersCollection = await users();
    let newPost = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $pull: { likedReferPost: postId } },
      { returnDocument: "after" }
    );
    if (newPost.lastErrorObject.n === 0)
      throw [404, `Could not delete the post with id ${postId}`];

    deletionInfo.value._id = deletionInfo.value._id.toString();
    return deletionInfo.value;
  },
};
export default exportedMethods;
