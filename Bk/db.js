var mongoose = require("mongoose");
const dns = require("dns");

// Set DNS servers to Google's to resolve potential ECONNREFUSED with MongoDB SRV records
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
  await mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("Connected");
    })
    .catch((err) => {
      console.log(err);
    });
};
module.exports = connectDB;
