const fs = require("fs");
const path = require("path");

const path1 = path.join(__dirname, "..", "uploads/photo/1ceb9c68-0321-4d06-a427-e7afb5930f19.jpg");
const path2 = path.join(__dirname, "../..", "uploads/photo/1ceb9c68-0321-4d06-a427-e7afb5930f19.jpg");
const path3 = path.join(__dirname, "uploads/photo/1ceb9c68-0321-4d06-a427-e7afb5930f19.jpg");

console.log("Path 1:", path1, fs.existsSync(path1));
console.log("Path 2:", path2, fs.existsSync(path2));
console.log("Path 3:", path3, fs.existsSync(path3));
