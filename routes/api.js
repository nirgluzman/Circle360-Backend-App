const express = require("express");

const requireAuth = require("../middleware/requireAuth");
const {
  siginUser,
  signupUser,
  getUser,
  updateUser,
  deleteUser,
  createGroup,
  getGroup,
  updateGroup,
  deleteGroup,
  inviteUserToGroup,
  acceptUserInGroup,
  deleteUserInGroup,
} = require("../controllers/apiControllers");

const app = express.Router();

app.route("/user/signin").get(siginUser);
app.route("/user/signup").post(signupUser);

app.use(requireAuth);

app.route("/user").get(getUser).put(updateUser).delete(deleteUser);
app.route("/group").post(createGroup);
app
  .route("/group/:groupCode")
  .get(getGroup)
  .delete(deleteGroup)
  .put(updateGroup);

app
  .route("/group/user/:groupCode")
  .post(inviteUserToGroup)
  .put(acceptUserInGroup)
  .delete(deleteUserInGroup);

module.exports = app;
