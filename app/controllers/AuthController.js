const { success, error, validation } = require("../helpers/responseApi");
const { randomString } = require("../helpers/common");
const { validationResult } = require("express-validator");
const config = require("config");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Verification = require("../models/Verification");

const otpGenerator = require('otp-generator');
var sns = require('aws-node-sns');

/**
 * @desc    Register a new user
 * @method  POST api/auth/register
 * @access  public
 */
exports.register = async (req, res) => {
  // Validation
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json(validation(errors.array()));

  const { name, email, password, accountType, deviceType, phoneNumber } = req.body;

  try {
    let user = await User.find({ email: email.toLowerCase(), accountType: accountType });
    
    // Check the user account already registered or not (same email can have all three accounts (email, facebook, google))
    //Combination of email address and accountType determine the uniqueness of the account
    if (user.length > 0)
      return res
        .status(422)
        .json(validation({ msg: "This account is already registered", isAccountExist: true }));

    let accountExpression = (accountType === 'google' || accountType === 'facebook' || accountType === 'email');

    let newUser = new User({
      name: name,
      email: email.toLowerCase().replace(/\s+/, ""),
      password: password,
      accountType: accountType,
      verified: accountExpression ? true : false,// If accountType is gmail or facebook, account is already activated
      verifiedAt: accountExpression ? Date.now() : null
    });

    // Hash the password
    const hash = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(password, hash);

    // Save the user
    await newUser.save();

    let verification = null;
    //Create verification record if the accountType is email
    if (!accountExpression) {
      // Save token for user to start verificating the account
      verification = new Verification({
        token: randomString(50),
        userId: newUser._id,
        type: "Register New Account",
        accountType: newUser.accountType,
      });
      // Save the verification data
      await verification.save();
    }

    //send otp verification through sms or email depending on device type
    // if (deviceType === "mobile") {
    //   sendOTPMobile(phoneNumber, email, deviceType)
    // } else {//web
    //   sendOTPWeb()
    // }
    

    let successMessage = (accountExpression) ? "Register success, account activated" : "Register success, please activate your account.";
    // Send the response
    res.status(201).json(
      success(
        successMessage,
        {
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            accountType: newUser.accountType,
            verified: newUser.verified,
            verifiedAt: newUser.verifiedAt,
            createdAt: newUser.createdAt,
          },
          verification,
        },
        res.statusCode
      )
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json(error("Server error", res.statusCode));
  }
};

// To add minutes to the current time
function AddMinutesToDate(date, minutes) {
  return new Date(date.getTime() + minutes*60000);
}
function sendOTPMobile(phoneNumber, email, deviceType) {
  try {
    //Generate OTP 
  const otp = otpGenerator.generate(6, { alphabets: false, upperCase: false, specialChars: false });
  const expiration_time = AddMinutesToDate(new Date(),10);
  const message = require("../helpers/templates").phone_message(otp)
  console.log(message)
  console.log(phoneNumber)
  // Settings Params for SMS
  var params = {
    Message: message,
    PhoneNumber:  phoneNumber
  };

  sns.createClient({       
    accessKeyId: "AKIAVSULBXTYZUCGDUN2",
    secretAccessKey: "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",
    region: "ap-south-1"  
  });

  sns.sendSMS(message , phoneNumber , "malithkuru" , "Transactional", function(error, data){
    if (error){
        console.log(error)
    }else{
        console.log('MessageID' , data)
    }
  });

  } catch(error) {
    console.log("error in otp send message")
  }
}
function sendOTPWeb() {

}

/**
 * @desc    Verify a new user
 * @method  GET api/auth/verify/:token
 * @access  public
 */
exports.verify = async (req, res) => {
  const { token } = req.params;

  try {
    let verification = await Verification.findOne({
      token,
      type: "Register New Account",
    });

    // Check the verification data
    if (!verification)
      return res
        .status(404)
        .json(error("No verification data found", res.statusCode));

    // If verification data exists
    // Get the user data
    // And activate the account
    let user = await User.findOne({ _id: verification.userId }).select(
      "-password"
    );
    user = await User.findByIdAndUpdate(user._id, {
      $set: {
        verified: true,
        verifiedAt: new Date(),
      },
    });

    // After user successfully verified
    // Remove the verification data from database
    verification = await Verification.findByIdAndRemove(verification._id);

    // Send the response
    res
      .status(200)
      .json(
        success(
          "Your successfully verificating your account",
          null,
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(500).json(error("Server error", res.statusCode));
  }
};

/**
 * @desc    Login a user
 * @method  POST api/auth/login
 * @access  public
 */
exports.login = async (req, res) => {
  // Validation
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json(validation(errors.array()));

    //if accountType is gmail, facebook - password represent the access token
  const { email, password, accountType } = req.body;

  try {
    const user = await User.find({ email: email.toLowerCase(), accountType: accountType });

    // Check the email
    // If there's not exists
    // Throw the error
    if (user.length === 0) return res.status(422).json(validation("Invalid credentials"));

    // Check the password
    let checkPassword = await bcrypt.compare(password, user[0].password);
    if (!checkPassword)
      return res.status(422).json(validation("Invalid credentials"));

    // Check user if not activated yet
    // If not activated, send error response
    if (user.length > 0 && !user[0].verified)
      return res
        .status(400)
        .json(error("SignIn error",{ msg: "Your account is not actived yet.", isActivated: false}, res.statusCode));

    // If the requirement above pass
    // Lets send the response with JWT token in it
    const payload = {
      user: {
        id: user[0]._id,
        name: user[0].name,
        email: user[0].email,
      },
    };

    jwt.sign(
      payload,
      config.get("jwtSecret"),
      { expiresIn: "120s" },
      (err, token) => {
        if (err) throw err;

        res
          .status(200)
          .json(success("Login success", { token }, res.statusCode));
      }
    );
  } catch (err) {
    console.log(err.message);
    res.status(500).json(error("Server error", res.statusCode));
  }
};

/**
 * @desc    Resend new verification token to user
 * @method  POST api/auth/verify/resend
 * @access  public
 */
exports.resendVerification = async (req, res) => {
  const { email } = req.body;

  // Simple checking for email
  if (!email)
    return res.status(422).json(validation([{ msg: "Email is required" }]));

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    // Check the user first
    if (!user)
      return res.status(404).json(error("Email not found", res.statusCode));

    // If user exists
    // We gonna get data from verification by user ID
    let verification = await Verification.findOne({
      userId: user._id,
      type: "Register New Account",
    });

    // If there's verification data
    // Remove previous verification data and create a new one
    if (verification) {
      verification = await Verification.findByIdAndRemove(verification._id);
    }

    // Create a new verification data
    let newVerification = new Verification({
      token: randomString(50),
      userId: user._id,
      type: "Register New Account",
    });

    // Save the verification data
    await newVerification.save();

    // Send the response
    res
      .status(201)
      .json(
        success(
          "Verification has been sent",
          { verification: newVerification },
          res.statusCode
        )
      );
  } catch (err) {
    console.error(err.message);
    res.status(500).json(error("Server error", res.statusCode));
  }
};

/**
 * @desc    Get authenticated user
 * @method  GET api/auth
 * @access  private
 */
exports.getAuthenticatedUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    // Check the user just in case
    if (!user)
      return res.status(404).json(error("User not found", res.statusCode));

    // Send the response
    res
      .status(200)
      .json(success(`Hello ${user.name}`, { user }, res.statusCode));
  } catch (err) {
    console.error(err.message);
    res.status(500).json(error("Server error", res.statusCode));
  }
};
