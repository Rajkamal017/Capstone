import app from "./src/app.js"
import {connectDB} from "./src/config/db.js"

connectDB()

app.listen(3000, () => {
  console.log("AuthServer is running on port 3000");
});