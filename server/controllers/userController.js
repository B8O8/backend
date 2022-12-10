const User = require("../models/userModel");
const validator = require("validator");
const sendMail = require("../utils/email").sendMail;
const crypto = require("crypto");

exports.signUp = async (req,res) => {
    try {
        let email = req.body.email;
        if(!validator.isEmail(email)){
            return res.status(400).json({message: "invalid email."});
        }

        const checkEmail = await User.findOne({email: req.body.email});
        if(checkEmail) {
            return res.status(409).json({message: "email is already exist"});
        }

        let pass = req.body.password;
        let passConfirm = req.body.passwordConfirm;

        if(pass !== passConfirm) {
            return res.status(400).json({message: "Password and Password Confirm are not the same"});
        }

     
        const newUser = await User.create({
            fullName: req.body.fullName,
            email: req.body.email,
            password: req.body.password,
        });
        
        return res.status(201).json({message: "user created succefully.", data: {newUser}});

    } catch (err) {
        res.status(400).json({message: err.message});
    }
};

exports.login = async (req,res) => {
    try {
        const user = await User.findOne({email: req.body.email});

        if (!user){
            return res.status(404).json({message: "The user does not exist"});
        }

       if(!(await user.checkPassword(req.body.password, user.password))){
        return res.status(401).json({message: "incorrect email or password"});
       }

       return res.status(200).json({message: "you are logged in succefully !!"});
    } catch (error) {
        console.log(error);
    }
}

exports.forgotPassword = async (req,res) => {
    try {
        const user = await User.findOne({email:req.body.email});
        if(!user){
            return res.status(404).json({message: "The user with the provider email does not exist."});
        }

        const resetToken = user.generatePasswordResetToken();
        await user.save({validateBeforeSave:false});

        const url = `${req.protocol}://${req.get("host")}/api/auth/resetPassword/${resetToken}`;

        const msg = `Forgot your password? Reset it by visiting the following link: ${url}`;

        try {
            await sendMail ({
                email: user.email,
                subject: "Your password reset token: (Valid for 10 min)",
                message: msg
            });

            res.status(200).json({status:"success", message: "The reset link was delivered to your email successfully"});
        } catch (error) {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({validateBeforeSave:false});
            res.status(500).json({message: "An error occured while sending the email, please try again in a moment"});
            console.log(error);
        }

    } catch (error) {
        console.log(error);
    }
};

exports.resetPassword = async (req, res) => {
    try {
      const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
  
      const user = await User.findOne({passwordResetToken: hashedToken,passwordResetExpires: { $gt: Date.now() },});
  
      if (!user) {
        return res.status(400).json({message: "The token is invalid, or expired. Please request a new one",});
      }
  
      if (req.body.password.length < 8) {
        return res.status(400).json({ message: "Password length is too short" });
      }
  
      if (req.body.password !== req.body.passwordConfirm) {
        return res
          .status(400)
          .json({ message: "Password & Password Confirm are not the same" });
      }
  
      user.password = req.body.password;
      user.passwordConfirm = req.body.passwordConfirm;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.passwordChangeAt = Date.now();
  
      await user.save();
      return res.status(200).json({ message: "Password changed successfully" });
    } catch (err) {
      console.log(err);
    }
  };