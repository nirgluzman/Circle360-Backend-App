const express = require("express");

const requireAuth = require("../middleware/requireAuth");
const {
  loginUser,
  signupUser,
  upsertUser,
  getUser,
  updateUser,
  deleteUser,
  createGroup,
  getGroupLocations,
  getGroupMembers,
  getGroupInvites,
  updateGroup,
  deleteGroup,
  inviteUserToGroup,
  acceptUserInGroup,
  deleteUserInGroup,
} = require("../controllers/apiControllers");

const app = express.Router();

app.route("/user/login").post(loginUser);
app.route("/user/signup").post(signupUser);
app.route("/user/token").put(upsertUser);

app.use(requireAuth);

app.route("/user").get(getUser).put(updateUser).delete(deleteUser);

app.route("/group").post(createGroup);

app.route("/group/:groupCode/locations").get(getGroupLocations);
app.route("/group/:groupCode/members").get(getGroupMembers);
app.route("/group/:groupCode/invites").get(getGroupInvites);

app.route("/group/:groupCode").put(updateGroup).delete(deleteGroup);

app
  .route("/group/user/:groupCode")
  .post(inviteUserToGroup)
  .put(acceptUserInGroup)
  .delete(deleteUserInGroup);

module.exports = app;
