const axios = require("axios");
const jwt = require("jsonwebtoken");

const createToken = (email, userID) => {
  return jwt.sign({ email, userID }, process.env.SECRET, { expiresIn: "12h" });
};

// login the user
const loginUser = async (req, res) => {
  // retrieve the email
  const { email } = req.body;

  try {
    const response = await axios({
      method: "get",
      url: `${process.env.dbURL}/user`,
      data: { email },
    });

    // create the token
    const token = createToken(email, response.data.user._id);

    res.status(200).json({ token });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.response.data.error,
    });
  }
};

// signup the user
const signupUser = async (req, res) => {
  // retrieve the email and nickname from body
  const { email, nickname } = req.body;

  try {
    const response = await axios({
      method: "post",
      url: `${process.env.dbURL}/user`,
      data: { email, nickname },
    });

    // create the token
    const token = createToken(email, response.data.user._id);

    res.status(200).json({ token });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.response.data.error,
    });
  }
};

// upsertUser - unified login/signup
const upsertUser = async (req, res) => {
  // retrieve the email and nickname from body
  const { email, nickname } = req.body;
  try {
    const response = await axios({
      method: "put",
      url: `${process.env.dbURL}/user/upsert`,
      data: { email, nickname },
    });

    // create the token
    const token = createToken(email, response.data.user._id);

    res.status(200).json({ token });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.response.data.error,
    });
  }
};

const getUser = (req, res) => {
  const data = ({
    email,
    nickname,
    profilePictureURL,
    location,
    enableNotifications,
    incognito,
    updateFrequency,
    radius,
    myGroups,
  } = req.user.data.user);

  res.status(200).json({
    success: true,
    message: data,
  });
};

const updateUser = async (req, res) => {
  try {
    const email = req.user.data.user.email;
    const {
      nickname,
      profilePictureURL,
      location,
      enableNotifications,
      incognito,
      updateFrequency,
      radius,
    } = req.body;

    const response = await axios({
      method: "put",
      url: `${process.env.dbURL}/user`,
      data: {
        email,
        nickname,
        profilePictureURL,
        location,
        enableNotifications,
        incognito,
        updateFrequency,
        radius,
      },
    });

    res.status(200).json({
      success: true,
      message: response.data.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response.data.error,
    });
  }
};

// delete user from DB
// LIMITATION - user must first deregister himself from all groups.
const deleteUser = async (req, res) => {
  try {
    const email = req.user.data.user.email;

    if (req.user.data.user.myGroups.length > 0) {
      return res.status(400).json({
        success: false,
        message: "bad request - need first to deregister from all groups",
      });
    }

    const response = await axios({
      method: "delete",
      url: `${process.env.dbURL}/user/`,
      data: { email },
    });

    res.status(200).json({
      success: true,
      message: response.data.response,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response.data.error,
    });
  }
};

const createGroup = async (req, res) => {
  try {
    const email = req.user.data.user.email;
    const userID = req.user.data.user._id;

    const response = await axios({
      method: "post",
      url: `${process.env.dbURL}/group/`,
      data: { email, userID },
    });

    const groupID = response.data.group._id;
    const groupCode = response.data.group.groupCode;

    await axios({
      method: "post",
      url: `${process.env.dbURL}/user/group/${groupID}`,
      data: { email },
    });

    res.status(200).json({
      success: true,
      message: groupCode,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response.data.error,
    });
  }
};

const getGroupLocations = async (req, res) => {
  try {
    const { groupCode } = req.params;

    const response = await axios({
      method: "get",
      url: `${process.env.dbURL}/group/${groupCode}`,
      data: { groupCode },
    });

    // filter out all users that accepted the invite AND are not in incognito mode
    const groupNotIncognito = response.data.group.members
      .filter(
        (m) =>
          m.userID.email === req.user.data.user.email ||
          (m.accepted && !m.userID.incognito)
      )
      .map((m) => ({
        userID: {
          email: m.userID.email,
          nickname: m.userID.nickname,
          location: m.userID.location,
          profilePictureURL: m.userID.profilePictureURL,
        },
      }));

    res.status(200).json({
      success: true,
      message: {
        public: response.data.group.public,
        group: groupNotIncognito,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response.data.error,
    });
  }
};

const getGroupMembers = async (req, res) => {
  try {
    const { groupCode } = req.params;

    const response = await axios({
      method: "get",
      url: `${process.env.dbURL}/group/${groupCode}`,
      data: { groupCode },
    });

    // filter out all users that accepted the invite
    const groupAccepted = response.data.group.members
      .filter((m) => m.userID.email !== req.user.data.user.email && m.accepted)
      .map((m) => ({
        userID: {
          nickname: m.userID.nickname,
          profilePictureURL: m.userID.profilePictureURL,
          incognito: m.userID.incognito,
        },
      }));

    if (groupAccepted.length === 0) {
      return res.status(400).json({
        success: false,
        message: "no members",
      });
    }

    res.status(200).json({
      success: true,
      message: {
        public: response.data.group.public,
        group: groupAccepted,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response.data.error,
    });
  }
};

// get list of pending invites
const getGroupInvites = async (req, res) => {
  try {
    const { groupCode } = req.params;

    const response = await axios({
      method: "get",
      url: `${process.env.dbURL}/group/${groupCode}`,
      data: { groupCode },
    });

    // filter out all users that have not accepted the invite
    const groupNotAccepted = response.data.group.members
      .filter((m) => !m.accepted)
      .map((m) => ({
        userID: {
          email: m.userID.email,
        },
      }));

    if (groupNotAccepted.length === 0) {
      return res.status(400).json({
        success: false,
        message: "no pending invites",
      });
    }

    res.status(200).json({
      success: true,
      message: {
        public: response.data.group.public,
        group: groupNotAccepted,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response.data.error,
    });
  }
};

// update group - name and public invite (only by admin)
const updateGroup = async (req, res) => {
  try {
    const { groupCode } = req.params;
    const { public, name } = req.body;

    if (!public && !name) {
      return res.status(400).json({
        success: false,
        message: "bad request",
      });
    }

    // STEP-1: if admin and public field exists, then update public invite in group
    // STEP-1.1: check if user is admin.
    const foundGroup = req.user.data.user.myGroups.find(
      (m) => m.groupID.groupCode === groupCode
    );
    const admin = foundGroup.admin;

    if (public && admin) {
      await axios({
        method: "put",
        url: `${process.env.dbURL}/group/${groupCode}`,
        data: { public },
      });
    }

    // STEP-2: if name field exists, then update group name in user
    if (name) {
      const foundGroup = req.user.data.user.myGroups.find(
        (m) => m.groupID.groupCode === groupCode
      );

      const groupID = foundGroup.groupID._id;

      await axios({
        method: "put",
        url: `${process.env.dbURL}/user/group/${groupID}`,
        data: { email: req.user.data.user.email, name },
      });
    }

    return res.status(200).json({
      success: true,
      message: "group updated succesfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response.data.error,
    });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const { groupCode } = req.params;

    // STEP-1: check if user is admin.
    const foundGroup = req.user.data.user.myGroups.find(
      (m) => m.groupID.groupCode === groupCode
    );

    const admin = foundGroup.admin;
    const groupID = foundGroup.groupID._id;

    // STEP-1.1: bad request - user is not admin.
    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "bad request - user is not admin",
      });
    }

    // STEP-2: delete group in group DB
    await axios({
      method: "delete",
      url: `${process.env.dbURL}/group/${groupCode}`,
    });

    // STEP-3: loop through the users and remove the group from myGroups array.
    for (let i = 0; i < foundGroup.groupID.members.length; i++) {
      if (foundGroup.groupID.members[i].accepted) {
        await axios({
          method: "delete",
          url: `${process.env.dbURL}/user/group/${groupID}`,
          data: { email: foundGroup.groupID.members[i].email },
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "group deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response.data.error,
    });
  }
};

const inviteUserToGroup = async (req, res) => {
  try {
    const { groupCode } = req.params;
    const { email } = req.body;

    await axios({
      method: "post",
      url: `${process.env.dbURL}/group/user/${groupCode}`,
      data: { groupCode, email },
    });

    res.status(200).json({
      success: true,
      message: "invite created sucessfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response.data.error,
    });
  }
};

const acceptUserInGroup = async (req, res) => {
  try {
    const { groupCode } = req.params;
    const email = req.user.data.user.email;
    const userID = req.user.data.user._id;

    // STEP-1: user to accept the invite; accepts fails if invite does not exist.
    const response = await axios({
      method: "put",
      url: `${process.env.dbURL}/group/user/${groupCode}`,
      data: { email, userID },
    });

    const groupID = response.data.group._id;

    // STEP-2: add group to user.
    await axios({
      method: "post",
      url: `${process.env.dbURL}/user/group/${groupID}`,
      data: { email, admin: false }, // only admin sends invite, only non-admin can accept invite
    });

    return res.status(200).json({
      success: true,
      message: "invite accepted - user has been added to group",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response.data.error,
    });
  }
};

const deleteUserInGroup = async (req, res) => {
  try {
    const { groupCode } = req.params;
    const { email } = req.body;

    // STEP-1: check if user is admin.
    const foundGroup = req.user.data.user.myGroups.find(
      (m) => m.groupID.groupCode === groupCode
    );
    const admin = foundGroup.admin;

    // STEP-2: bad requests
    if (
      (!admin && req.user.data.user.email !== email) ||
      (admin && req.user.data.user.email === email)
    ) {
      return res.status(400).json({
        success: false,
        message: "bad request",
      });
    }

    // STEP-3: deleting the user from group DB.
    await axios({
      method: "delete",
      url: `${process.env.dbURL}/group/user/${groupCode}`,
      data: { email },
    });

    const foundMember = foundGroup.groupID.members.find(
      (m) => m.email === email
    );

    if (foundMember.accepted) {
      await axios({
        method: "delete",
        url: `${process.env.dbURL}/user/group/${response.data.group._id}`,
        data: { email },
      });
    }
    return res.status(200).json({
      success: true,
      message: "user deleted sucessfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response.data.error,
    });
  }
};

module.exports = {
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
};
