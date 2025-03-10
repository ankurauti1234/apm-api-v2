// testPassword.js
import bcrypt from "bcrypt";

const storedHash = "$2b$10$9qa2/VrOsMtuaJlfS1UzquS2rO3eluA5Y8UjQtxMIve2TB7N63z/C";
const password = "Ankur@123";

bcrypt.compare(password, storedHash, (err, result) => {
  if (err) console.error(err);
  console.log("Password match:", result);
});