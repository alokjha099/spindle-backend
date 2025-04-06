const express = require("express");
const requestRouter = express.Router();

const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
const sendEmail = require("../utils/sendEmail");

// Helper function to validate status
const validateStatus = (status, allowedStatuses) => {
  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid status type: " + status);
  }
};

// Send connection request
requestRouter.post(
  "/request/send/:status/:toUserId",
  userAuth,
  async (req, res) => {
    try {
      const fromUserId = req.user._id;
      const toUserId = req.params.toUserId;
      const status = req.params.status;

      // Validate status
      validateStatus(status, ["ignored", "interested"]);

      // Check if the recipient user exists
      const toUser = await User.findById(toUserId);
      if (!toUser) {
        return res.status(404).json({ message: "User not found!" });
      }

      // Check if a connection request already exists
      const existingConnectionRequest = await ConnectionRequest.findOne({
        $or: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });
      if (existingConnectionRequest) {
        return res
          .status(400)
          .json({ message: "Connection Request Already Exists!" });
      }

      // Create and save the connection request
      const connectionRequest = new ConnectionRequest({
        fromUserId,
        toUserId,
        status,
      });
      const data = await connectionRequest.save();

      // Send email notification
      const emailSubject = `New Friend Request from ${req.user.firstName}`;
      const emailBody = `${req.user.firstName} is ${status} in ${toUser.firstName}`;
      await sendEmail.run(emailSubject, emailBody, toUser.email);

      res.json({
        message: `${req.user.firstName} is ${status} in ${toUser.firstName}`,
        data,
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Review connection request
requestRouter.post(
  "/request/review/:status/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const loggedInUser = req.user;
      const { status, requestId } = req.params;

      // Validate status
      validateStatus(status, ["accepted", "rejected"]);

      // Find the connection request
      const connectionRequest = await ConnectionRequest.findOne({
        _id: requestId,
        toUserId: loggedInUser._id,
        status: "interested",
      });
      if (!connectionRequest) {
        return res
          .status(404)
          .json({ message: "Connection request not found" });
      }

      // Update the status of the connection request
      connectionRequest.status = status;
      const data = await connectionRequest.save();

      res.json({ message: `Connection request ${status}`, data });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

module.exports = requestRouter;
