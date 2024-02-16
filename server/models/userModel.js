const mongoose = require('mongoose')
const bcrypt=require('bcryptjs')

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true ,unique:true},
  password: { type: String, required: true },
  pic: {
    type: String,
    default:
      "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
  },
}, {
    timestamps:true
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword,this.password)
}

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next(); // Skip if the password is not modified
  }

  try {
    const salt = await bcrypt.genSalt(10); // Generate salt
    const hashedPassword = await bcrypt.hash(this.password, salt); // Hash the password using the salt
    this.password = hashedPassword; // Set the hashed password to the user's password field
    next(); // Proceed to save the user
  } catch (error) {
    next(error); // Pass any error to the next middleware or function
  }
});


const User = mongoose.model("User", userSchema);
module.exports = User
